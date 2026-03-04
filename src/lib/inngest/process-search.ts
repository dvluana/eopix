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
import { searchWeb } from '../google-search'
import { analyzeProcessos, analyzeMentionsAndSummary } from '../openai'
import { calculateCpfFinancialSummary, calculateCnpjFinancialSummary } from '../financial-summary'
import { getReportExpiresAt } from '../report-ttl'
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

// Process search job — 2 steps: check-cache, process-all
// Previous version had 14-16 Inngest steps, each causing a full HTTP replay.
// Collapsing to 3 eliminates ~2-3 min of orchestration overhead.
// Progress bar still works via direct prisma.purchase.update() inside process-all.
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 3,
  },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { purchaseId, term, type } = event.data

    // ========== Step 1: check-cache ==========
    // Verifica cache 24h. Se existir, completa direto e retorna.
    const cacheResult = await step.run('check-cache', async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const existing = await prisma.searchResult.findFirst({
        where: {
          term,
          type,
          createdAt: { gt: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existing) {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: existing.id,
            processingStep: 0,
          },
        })
        return { cached: true, searchResultId: existing.id }
      }

      return { cached: false, searchResultId: null }
    })

    if (cacheResult.cached) {
      return { success: true, cached: true, searchResultId: cacheResult.searchResultId }
    }

    // Helper para atualizar step (DB direto, sem step.run)
    const updateStep = async (stepNum: number) => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { processingStep: stepNum },
      })
    }

    // ========== Step 2: process-all ==========
    // TODO o trabalho: fetch APIs, AI analysis, save result, complete purchase.
    // Atualiza processingStep internamente para barra de progresso.
    const searchResult = await step.run('process-all', async () => {
      // Set PROCESSING
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'PROCESSING', processingStep: 1 },
      })

      let cadastralData: CpfCadastralResponse | null = null
      let processosData: ProcessosCpfResponse | null = null
      let cpfFinancialData: SrsPremiumCpfResponse | null = null
      let dossieData: DossieResponse | null = null
      let cnpjFinancialData: SrsPremiumCnpjResponse | null = null
      let googleData: GoogleSearchResponse | null = null
      let processAnalysis: ProcessAnalysis[] = []
      let financialSummary: FinancialSummary
      let name = ''
      let region = ''

      try {
        // ========== CPF: 3 chamadas APIFull + Serper ==========
        if (type === 'CPF') {
          // Dados cadastrais (r-cpf-completo)
          cadastralData = await consultCpfCadastral(term)
          name = cadastralData.nome
          region = cadastralData.enderecos?.[0]?.uf || ''
          await updateStep(2)

          // Dados financeiros + processos em paralelo
          const [cpfFinancialResult, processosResult] = await Promise.all([
            consultCpfFinancial(term).catch((err) => {
              console.error('CPF Financial (srs-premium) error:', err)
              return null
            }),
            consultCpfProcessos(term).catch((err) => {
              console.error('CPF Processos error:', err)
              return { processos: [], totalProcessos: 0 } as ProcessosCpfResponse
            }),
          ])

          cpfFinancialData = cpfFinancialResult
          processosData = processosResult
          await updateStep(3)

          // Calcular resumo financeiro (sem IA)
          financialSummary = calculateCpfFinancialSummary(cpfFinancialData)
        }
        // ========== CNPJ: 2 chamadas APIFull + Serper ==========
        else {
          // Dados cadastrais + processos (ic-dossie-juridico)
          dossieData = await consultCnpjDossie(term)
          name = dossieData.razaoSocial
          region = dossieData.endereco?.uf || ''
          await updateStep(2)

          // Dados financeiros (srs-premium) - NAO bloqueia se falhar
          cnpjFinancialData = await consultCnpjFinancial(term).catch((err) => {
            console.error('CNPJ Financial (srs-premium) error:', err)
            return null
          })
          await updateStep(3)

          // Calcular resumo financeiro (sem IA)
          financialSummary = calculateCnpjFinancialSummary(cnpjFinancialData)
        }

        // Menções na web (Serper)
        await updateStep(4)
        googleData = await searchWeb(name, term, type).catch((err) => {
          console.error('Google/Serper error:', err)
          return { byDocument: [], byName: [], reclameAqui: [] } as GoogleSearchResponse
        })

        // IA: Gerando resumo
        await updateStep(5)

        // IA 1: Analisar processos (se houver)
        if (type === 'CPF' && processosData && processosData.processos.length > 0) {
          const processosResult = await analyzeProcessos(processosData.processos, term)
          processAnalysis = processosResult.processAnalysis
        }

        // IA 2: Analisar menções e gerar resumo
        const mentions = [
          ...(googleData?.byDocument || []),
          ...(googleData?.byName || []),
          ...(googleData?.reclameAqui || []),
        ]

        const summaryResult = await analyzeMentionsAndSummary({
          mentions,
          financialSummary,
          processAnalysis,
          type,
          region,
        }, term)

        // Aplicar classificacoes nos resultados do Google
        if (googleData && summaryResult.mentionClassifications) {
          for (const classification of summaryResult.mentionClassifications) {
            const matchByDoc = googleData.byDocument.find((r) => r.url === classification.url)
            if (matchByDoc) matchByDoc.classification = classification.classification

            const matchByName = googleData.byName.find((r) => r.url === classification.url)
            if (matchByName) matchByName.classification = classification.classification

            const matchRA = googleData.reclameAqui.find((r) => r.url === classification.url)
            if (matchRA) matchRA.classification = classification.classification
          }
        }

        // Finalizando
        await updateStep(6)

        // Salvar SearchResult
        const dataToSave = type === 'CPF'
          ? {
              cadastral: cadastralData,
              processos: processosData,
              financial: cpfFinancialData,
              financialSummary,
              processAnalysis,
              google: googleData,
              reclameAqui: summaryResult.reclameAqui || null,
            }
          : {
              dossie: dossieData,
              financial: cnpjFinancialData,
              financialSummary,
              google: googleData,
              reclameAqui: summaryResult.reclameAqui || null,
            }

        const jsonData = JSON.parse(JSON.stringify(dataToSave)) as Prisma.InputJsonValue

        const result = await prisma.searchResult.create({
          data: {
            term,
            type,
            name,
            data: jsonData,
            summary: summaryResult.summary,
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
      } catch (error) {
        console.error('Process search error:', error)

        // Get current purchase state to capture processingStep
        const failedPurchase = await prisma.purchase.findUnique({
          where: { id: purchaseId },
          select: { processingStep: true },
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

        throw error // Re-throw to trigger Inngest retry
      }
    })

    return { success: true, searchResultId: searchResult.id }
  }
)
