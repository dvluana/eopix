import * as Sentry from '@sentry/nextjs'
import { Prisma } from '@prisma/client'
import { inngest } from './client'
import { prisma } from '../prisma'
import {
  consultCpfCadastral,
  consultCpfProcessos,
  consultCpfFinancial,
  consultCnpjDossie,
  consultCnpjFinancial,
} from '../apifull'
import { checkApifullBalance } from '../apifull-balance'
import { searchWeb } from '../google-search'
import { analyzeProcessos, analyzeMentionsAndSummary } from '../openai'
import { calculateCpfFinancialSummary, calculateCnpjFinancialSummary } from '../financial-summary'
import { getReportExpiresAt } from '../report-ttl'
import { isMockMode } from '../mock-mode'
import { sendPurchaseApprovedEmail, sendPurchaseDeniedEmail } from '../email'

// Small delay in mock mode so frontend can poll and display progress
const mockDelay = () => isMockMode ? new Promise(r => setTimeout(r, 1500)) : Promise.resolve()
import type {
  CpfCadastralResponse,
  ProcessosCpfResponse,
  SrsPremiumCpfResponse,
  DossieResponse,
  SrsPremiumCnpjResponse,
  GoogleSearchResponse,
  ProcessAnalysis,
  FinancialSummary,
} from '@/types/report'

// Etapas de processamento (para barra de progresso)
// 1 = Dados cadastrais
// 2 = Dados financeiros
// 3 = Processos judiciais
// 4 = Menções na web
// 5 = Gerando resumo
// 6 = Finalizando

// Process search job — 5 steps: check-cache, fetch-data, fetch-web, analyze-ai, save-result
// Each step completes within Vercel Hobby's 10s function timeout.
// Inngest memoizes step results between replays — no wasted API credits on retry.
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 10,
    concurrency: { limit: 5 },
  },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { purchaseId, purchaseCode, term, type } = event.data

    // ========== Step 1: check-cache ==========
    // Verifica se existe relatório válido (não expirado) para o mesmo documento.
    const cacheResult = await step.run('check-cache', async () => {
      const existing = await prisma.searchResult.findFirst({
        where: {
          term,
          type,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existing) {
        return { cached: true, searchResultId: existing.id }
      }

      return { cached: false, searchResultId: null }
    })

    // Cache hit: simulate progress steps for UX (user sees loader),
    // then complete with the cached result. No API calls made.
    if (cacheResult.cached) {
      await step.run('cache-progress', async () => {
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { status: 'PROCESSING', processingStep: 1 },
        })
        await delay(10000)

        for (const stepNum of [2, 3, 4, 5, 6]) {
          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { processingStep: stepNum },
          })
          await delay(10000)
        }

        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: cacheResult.searchResultId,
            processingStep: 0,
          },
        })
      })

      // Enviar email "relatório pronto" (cache hit) — fire-and-forget
      prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { id: true, code: true, user: { select: { email: true, name: true } } },
      }).then(p => {
        if (p?.user && !p.user.email.includes('@guest.eopix.app')) {
          return sendPurchaseApprovedEmail(p.user.email, p.user.name || '', p.code, '', p.id)
        }
      }).catch(err => console.error('[Pipeline] Approved email (cache) failed:', err))

      return { success: true, cached: true, searchResultId: cacheResult.searchResultId }
    }

    // Wrapped in step so it doesn't re-execute on replay.
    // Without this, replays overwrite COMPLETED back to PROCESSING.
    await step.run('set-processing', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'PROCESSING' },
      })
    })

    try {
      // ========== Step 1.5: check-balance ==========
      // Circuit breaker: verify APIFull has enough balance before burning credits.
      // Fail-open: if check fails, proceed anyway. If insufficient, throw to trigger retry.
      await step.run('check-balance', async () => {
        const { balance, sufficient } = await checkApifullBalance()
        if (!sufficient) {
          console.warn(`APIFull balance too low: R$${balance}. Will retry in 5min.`)
          throw new Error(`INSUFFICIENT_API_BALANCE: R$${balance}`)
        }
      })
      // ========== Step 2: fetch-data ==========
      // APIFull calls: cadastral + financial/processos. Estimated: 3-8s.
      const apiData = await step.run('fetch-data', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 1 },
        })
        await mockDelay()

        if (type === 'CPF') {
          const cadastralData = await consultCpfCadastral(term).catch((err) => {
            console.error('CPF Cadastral error (non-fatal, continuing):', err)
            return null
          })

          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { processingStep: 2 },
          })
          await mockDelay()

          const [cpfFinancialResult, processosResult] = await Promise.all([
            consultCpfFinancial(term).catch((err) => {
              console.error('CPF Financial error:', err)
              return null
            }),
            consultCpfProcessos(term).catch((err) => {
              console.error('CPF Processos error:', err)
              return { processos: [], totalProcessos: 0 } as ProcessosCpfResponse
            }),
          ])

          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { processingStep: 3 },
          })
          await mockDelay()

          return {
            type: 'CPF' as const,
            name: cadastralData?.nome || `CPF ${term}`,
            region: cadastralData?.enderecos?.[0]?.uf || '',
            cadastralData: cadastralData as CpfCadastralResponse | null,
            cpfFinancialData: cpfFinancialResult as SrsPremiumCpfResponse | null,
            processosData: processosResult as ProcessosCpfResponse,
            dossieData: null as DossieResponse | null,
            cnpjFinancialData: null as SrsPremiumCnpjResponse | null,
          }
        } else {
          const dossieData = await consultCnpjDossie(term).catch((err) => {
            console.error('CNPJ Dossie error:', err)
            return null
          })

          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { processingStep: 2 },
          })

          const cnpjFinancialResult = await consultCnpjFinancial(term).catch((err) => {
            console.error('CNPJ Financial error:', err)
            return null
          })

          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { processingStep: 3 },
          })
          await mockDelay()

          return {
            type: 'CNPJ' as const,
            name: dossieData?.razaoSocial || `CNPJ ${term}`,
            region: dossieData?.endereco?.uf || '',
            cadastralData: null as CpfCadastralResponse | null,
            cpfFinancialData: null as SrsPremiumCpfResponse | null,
            processosData: null as ProcessosCpfResponse | null,
            dossieData: dossieData as DossieResponse | null,
            cnpjFinancialData: cnpjFinancialResult as SrsPremiumCnpjResponse | null,
          }
        }
      })

      // ========== Step 3: fetch-web ==========
      // Serper web search. Estimated: 2-5s.
      const webData = await step.run('fetch-web', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 4 },
        })
        await mockDelay()

        const googleData = await searchWeb(apiData.name, term, type).catch((err) => {
          console.error('Google/Serper error:', err)
          return { byDocument: [], byName: [], reclameAqui: [], news: [] } as GoogleSearchResponse
        })

        return googleData
      })

      // ========== Step 4a: analyze-processos ==========
      // OpenAI: analyze processos (if any). Split from summary so each is memoized independently.
      const processosAiResult = await step.run('analyze-processos', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 5 },
        })
        await mockDelay()

        // Financial summary (pure calculation, no API)
        const financialSummary: FinancialSummary = apiData.type === 'CPF'
          ? calculateCpfFinancialSummary(apiData.cpfFinancialData)
          : calculateCnpjFinancialSummary(apiData.cnpjFinancialData)

        // AI 1: Analyze processos (if any)
        let processAnalysis: ProcessAnalysis[] = []
        if (apiData.type === 'CPF' && apiData.processosData && apiData.processosData.processos.length > 0) {
          const processosResult = await analyzeProcessos(apiData.processosData.processos, term)
          processAnalysis = processosResult.processAnalysis
        }

        return { financialSummary, processAnalysis }
      })

      // ========== Step 4b: analyze-summary ==========
      // OpenAI: classify mentions + generate final summary. Memoized separately from processos.
      const aiResult = await step.run('analyze-summary', async () => {
        const mentions = [
          ...(webData?.byDocument || []),
          ...(webData?.byName || []),
          ...(webData?.reclameAqui || []),
          ...(webData?.news || []),
        ]

        const summaryResult = await analyzeMentionsAndSummary({
          mentions,
          financialSummary: processosAiResult.financialSummary,
          processAnalysis: processosAiResult.processAnalysis,
          type: apiData.type,
          region: apiData.region,
        }, term)

        return { ...processosAiResult, summaryResult }
      })

      // ========== Step 5: save-result ==========
      // Save SearchResult + complete purchase. Estimated: 1-2s.
      const searchResult = await step.run('save-result', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 6 },
        })
        await mockDelay()

        // Apply mention classifications to web data
        let googleDataFinal = webData
        if (googleDataFinal && aiResult.summaryResult.mentionClassifications) {
          // Deep copy to avoid mutating memoized step data
          googleDataFinal = JSON.parse(JSON.stringify(webData)) as GoogleSearchResponse

          for (const classification of aiResult.summaryResult.mentionClassifications) {
            const matchByDoc = googleDataFinal.byDocument.find((r) => r.url === classification.url)
            if (matchByDoc) matchByDoc.classification = classification.classification

            const matchByName = googleDataFinal.byName.find((r) => r.url === classification.url)
            if (matchByName) matchByName.classification = classification.classification

            const matchRA = googleDataFinal.reclameAqui.find((r) => r.url === classification.url)
            if (matchRA) matchRA.classification = classification.classification

            const matchNews = googleDataFinal.news.find((r) => r.url === classification.url)
            if (matchNews) matchNews.classification = classification.classification
          }
        }

        // Build data payload
        const dataToSave = apiData.type === 'CPF'
          ? {
              cadastral: apiData.cadastralData,
              processos: apiData.processosData,
              financial: apiData.cpfFinancialData,
              financialSummary: aiResult.financialSummary,
              processAnalysis: aiResult.processAnalysis,
              google: googleDataFinal,
              reclameAqui: aiResult.summaryResult.reclameAqui || null,
            }
          : {
              dossie: apiData.dossieData,
              financial: apiData.cnpjFinancialData,
              financialSummary: aiResult.financialSummary,
              google: googleDataFinal,
              reclameAqui: aiResult.summaryResult.reclameAqui || null,
            }

        const jsonData = JSON.parse(JSON.stringify(dataToSave)) as Prisma.InputJsonValue

        const result = await prisma.searchResult.create({
          data: {
            term,
            type,
            name: apiData.name,
            data: jsonData,
            summary: aiResult.summaryResult.summary,
            expiresAt: getReportExpiresAt(),
          },
        })

        // Complete purchase
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: result.id,
            processingStep: 0,
          },
        })

        return { id: result.id }
      })

      // Enviar email "relatório pronto" — fire-and-forget
      prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { id: true, code: true, user: { select: { email: true, name: true } } },
      }).then(p => {
        if (p?.user && !p.user.email.includes('@guest.eopix.app')) {
          return sendPurchaseApprovedEmail(p.user.email, p.user.name || '', p.code, '', p.id)
        }
      }).catch(err => console.error('[Pipeline] Approved email failed:', err))

      return { success: true, searchResultId: searchResult.id }
    } catch (error) {
      console.error('Process search error:', error)

      // Get current purchase state to capture processingStep, code, and userId for Sentry
      const failedPurchase = await prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { processingStep: true, code: true, userId: true },
      })

      // Update purchase to FAILED with error details
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'FAILED',
          failureReason: 'PROCESSING_ERROR',
          failureDetails: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            currentStep: failedPurchase?.processingStep || 0,
            timestamp: new Date().toISOString(),
          }),
        },
      })

      // Enviar email "problema no pedido" — fire-and-forget
      // Não envia para PAYMENT_EXPIRED (tratado pelo funil de abandono)
      prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { id: true, code: true, failureReason: true, user: { select: { email: true, name: true } } },
      }).then(p => {
        if (p?.user && !p.user.email.includes('@guest.eopix.app') && p.failureReason !== 'PAYMENT_EXPIRED') {
          return sendPurchaseDeniedEmail(p.user.email, p.user.name || '', p.code, p.id)
        }
      }).catch(err => console.error('[Pipeline] Denied email failed:', err))

      // Capture to Sentry with structured context (LGPD: never pass term/CPF/CNPJ)
      if (error instanceof Error && error.message?.includes('INSUFFICIENT_API_BALANCE')) {
        // Systemic infra error — low APIFull balance
        Sentry.withScope((scope) => {
          scope.setTag('error_category', 'infra')
          scope.setTag('infra_type', 'apifull_balance')
          scope.setExtra('detail', error instanceof Error ? error.message : String(error))
          Sentry.captureException(error)
        })
      } else {
        // Per-purchase pipeline error
        Sentry.withScope((scope) => {
          scope.setUser({ id: failedPurchase?.userId ?? 'unknown' })
          scope.setTag('error_category', 'pipeline')
          scope.setTag('purchase_code', failedPurchase?.code ?? purchaseCode ?? 'unknown')
          scope.setTag('pipeline_step', String(failedPurchase?.processingStep ?? 'unknown'))
          scope.setTag('document_type', type)
          scope.setExtra('purchase_id', purchaseId)
          scope.setExtra('processing_step_number', failedPurchase?.processingStep ?? null)
          Sentry.captureException(error)
        })
      }

      throw error // Re-throw to trigger Inngest retry
    }
  }
)
