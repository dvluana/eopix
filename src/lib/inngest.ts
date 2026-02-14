import { Inngest } from 'inngest'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import {
  consultCpfCadastral,
  consultCpfProcessos,
  consultCpfFinancial,
  consultCnpjDossie,
  consultCnpjFinancial,
} from './apifull'
import { searchWeb } from './google-search'
import { analyzeProcessos, analyzeMentionsAndSummary } from './openai'
import { calculateCpfFinancialSummary, calculateCnpjFinancialSummary } from './financial-summary'
import { refundPayment } from './asaas'
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

// Create Inngest client
export const inngest = new Inngest({
  id: 'eopix',
  eventKey: process.env.INNGEST_EVENT_KEY,
})

// Type definitions for events
type SearchProcessEvent = {
  name: 'search/process'
  data: {
    purchaseId: string
    purchaseCode: string
    term: string
    type: 'CPF' | 'CNPJ'
    email: string
  }
}

type CleanupEvent = {
  name: 'cleanup/search-results' | 'cleanup/leads' | 'cleanup/magic-codes' | 'cleanup/pending-purchases'
  data: Record<string, never>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AllEvents = SearchProcessEvent | CleanupEvent

// Etapas de processamento (para barra de progresso)
// 1 = Dados cadastrais
// 2 = Dados financeiros
// 3 = Processos judiciais
// 4 = Menções na web
// 5 = Gerando resumo
// 6 = Finalizando

// Process search job
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 3,
  },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { purchaseId, term, type } = event.data

    // ========== CACHE: Verificar se ja existe SearchResult valido (24h) ==========
    const existingResult = await step.run('check-cache', async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return prisma.searchResult.findFirst({
        where: {
          term,
          type,
          createdAt: { gt: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
      })
    })

    // Se encontrou cache valido, reutiliza
    if (existingResult) {
      await step.run('use-cached-result', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: existingResult.id,
            processingStep: 0,
          },
        })
      })

      return { success: true, cached: true, searchResultId: existingResult.id }
    }

    // Helper para atualizar step
    const updateStep = async (stepNum: number) => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { processingStep: stepNum },
      })
    }

    // Update purchase to PROCESSING
    await step.run('set-processing', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'PROCESSING', processingStep: 1 },
      })
    })

    // Variables para armazenar dados
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
        // Step 1: Dados cadastrais (r-cpf-completo)
        cadastralData = await step.run('fetch-cpf-cadastral', async () => {
          return consultCpfCadastral(term)
        })
        name = cadastralData.nome
        region = cadastralData.enderecos?.[0]?.uf || ''

        // Atualiza para step 2 - Dados financeiros
        await step.run('update-step-2', async () => updateStep(2))

        // Step 2: Dados financeiros (srs-premium) - NAO bloqueia se falhar
        cpfFinancialData = await step.run('fetch-cpf-financial', async () => {
          try {
            return await consultCpfFinancial(term)
          } catch (err) {
            console.error('CPF Financial (srs-premium) error:', err)
            return null
          }
        })

        // Atualiza para step 3 - Processos judiciais
        await step.run('update-step-3', async () => updateStep(3))

        // Step 3: Processos judiciais (r-acoes-e-processos-judiciais) - NAO bloqueia se falhar
        processosData = await step.run('fetch-cpf-processos', async () => {
          try {
            return await consultCpfProcessos(term)
          } catch (err) {
            console.error('CPF Processos error:', err)
            return { processos: [], totalProcessos: 0 }
          }
        })

        // Calcular resumo financeiro (sem IA)
        financialSummary = calculateCpfFinancialSummary(cpfFinancialData)
      }
      // ========== CNPJ: 2 chamadas APIFull + Serper ==========
      else {
        // Step 1: Dados cadastrais + processos em 1 chamada (ic-dossie-juridico)
        dossieData = await step.run('fetch-cnpj-dossie', async () => {
          return consultCnpjDossie(term)
        })
        name = dossieData.razaoSocial
        region = dossieData.endereco?.uf || ''

        // Atualiza para step 2 - Dados financeiros
        await step.run('update-step-2', async () => updateStep(2))

        // Step 2: Dados financeiros (srs-premium) - NAO bloqueia se falhar
        cnpjFinancialData = await step.run('fetch-cnpj-financial', async () => {
          try {
            return await consultCnpjFinancial(term)
          } catch (err) {
            console.error('CNPJ Financial (srs-premium) error:', err)
            return null
          }
        })

        // Processos ja vem no dossie - nao precisa de step separado
        await step.run('update-step-3', async () => updateStep(3))

        // Calcular resumo financeiro (sem IA)
        financialSummary = calculateCnpjFinancialSummary(cnpjFinancialData)
      }

      // Atualiza para step 4 - Menções na web
      await step.run('update-step-4', async () => updateStep(4))

      // Step 4: Busca na web (Serper) - 3 queries paralelas
      googleData = await step.run('fetch-google', async () => {
        try {
          return await searchWeb(name, term, type)
        } catch (err) {
          console.error('Google/Serper error:', err)
          return { byDocument: [], byName: [], reclameAqui: [] }
        }
      })

      // Atualiza para step 5 - Gerando resumo
      await step.run('update-step-5', async () => updateStep(5))

      // ========== IA 1: Analisar processos (se houver) ==========
      if (type === 'CPF' && processosData && processosData.processos.length > 0) {
        const processosResult = await step.run('analyze-processos', async () => {
          return analyzeProcessos(processosData!.processos, term)
        })
        processAnalysis = processosResult.processAnalysis
      }
      // Para CNPJ, os processos vem no dossie - converter para formato ProcessoRaw se necessario
      // Por ora, nao analisamos processos do dossie CNPJ com IA (ja vem categorizado)

      // ========== IA 2: Analisar menções e gerar resumo ==========
      const mentions = [
        ...(googleData?.byDocument || []),
        ...(googleData?.byName || []),
        ...(googleData?.reclameAqui || []),
      ]

      const summaryResult = await step.run('analyze-mentions-summary', async () => {
        return analyzeMentionsAndSummary({
          mentions,
          financialSummary,
          processAnalysis,
          type,
          region,
        }, term)
      })

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

      // Atualiza para step 6 - Finalizando
      await step.run('update-step-6', async () => updateStep(6))

      // Step 6: Salvar SearchResult
      const searchResult = await step.run('save-result', async () => {
        // Preparar dados para salvar
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

        // Convert to plain JSON
        const jsonData = JSON.parse(JSON.stringify(dataToSave)) as Prisma.InputJsonValue

        return prisma.searchResult.create({
          data: {
            term,
            type,
            name,
            data: jsonData,
            summary: summaryResult.summary,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        })
      })

      // Step 7: Atualizar purchase para COMPLETED
      await step.run('complete-purchase', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: searchResult.id,
            processingStep: 0, // Reset step on completion
          },
        })
      })

      // Step 8: Enviar email de conclusão
      await step.run('send-completion-email', async () => {
        const { sendCompletionEmail } = await import('./email')
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://somoseopix.com.br'
        const reportUrl = `${baseUrl}/relatorio/${searchResult.id}`

        await sendCompletionEmail(event.data.email, event.data.purchaseCode, reportUrl)
        return { sent: true, to: event.data.email }
      })

      return { success: true, searchResultId: searchResult.id }
    } catch (error) {
      console.error('Process search error:', error)

      // Update purchase to FAILED
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'FAILED' },
      })

      throw error // Re-throw to trigger retry
    }
  }
)

// Cleanup expired search results (daily at 03:00)
export const cleanupSearchResults = inngest.createFunction(
  {
    id: 'cleanup-search-results',
  },
  { cron: '0 3 * * *' },
  async ({ step }) => {
    const result = await step.run('delete-expired', async () => {
      return prisma.searchResult.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      })
    })

    console.log(`Cleaned up ${result.count} expired search results`)
    return { deleted: result.count }
  }
)

// Cleanup old leads (daily at 03:15)
export const cleanupLeads = inngest.createFunction(
  {
    id: 'cleanup-leads',
  },
  { cron: '15 3 * * *' },
  async ({ step }) => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const result = await step.run('delete-old-leads', async () => {
      return prisma.leadCapture.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      })
    })

    console.log(`Cleaned up ${result.count} old leads`)
    return { deleted: result.count }
  }
)

// Cleanup expired magic codes (daily at 03:30)
export const cleanupMagicCodes = inngest.createFunction(
  {
    id: 'cleanup-magic-codes',
  },
  { cron: '30 3 * * *' },
  async ({ step }) => {
    const result = await step.run('delete-expired-codes', async () => {
      return prisma.magicCode.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true },
          ],
        },
      })
    })

    console.log(`Cleaned up ${result.count} expired magic codes`)
    return { deleted: result.count }
  }
)

// Cleanup pending purchases (every 15 minutes) - cancel after 30 min per spec
export const cleanupPendingPurchases = inngest.createFunction(
  {
    id: 'cleanup-pending-purchases',
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

    const result = await step.run('expire-old-pending', async () => {
      return prisma.purchase.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: thirtyMinutesAgo },
        },
        data: {
          status: 'FAILED',
        },
      })
    })

    console.log(`Expired ${result.count} pending purchases`)
    return { expired: result.count }
  }
)

// Auto-refund failed purchases (every 30 minutes)
// Spec: Retry 3x with exponential backoff. After 3 failures, mark as REFUND_FAILED and alert via Sentry
export const autoRefundFailedPurchases = inngest.createFunction(
  {
    id: 'auto-refund-failed-purchases',
  },
  { cron: '*/30 * * * *' },
  async ({ step }) => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    // Find purchases stuck in PROCESSING for more than 2 hours OR previously failed refunds
    const stuckPurchases = await step.run('find-stuck-purchases', async () => {
      return prisma.purchase.findMany({
        where: {
          OR: [
            // Stuck in PROCESSING for 2+ hours
            {
              status: 'PROCESSING',
              updatedAt: { lt: twoHoursAgo },
              asaasPaymentId: { not: null },
            },
            // FAILED status that needs refund (already paid but processing failed)
            {
              status: 'FAILED',
              paidAt: { not: null },
              asaasPaymentId: { not: null },
              refundAttempts: { lt: 3 },
            },
          ],
        },
        select: {
          id: true,
          asaasPaymentId: true,
          code: true,
          refundAttempts: true,
          status: true,
        },
      })
    })

    if (stuckPurchases.length === 0) {
      console.log('No stuck purchases to refund')
      return { refunded: 0, failed: 0 }
    }

    let refundedCount = 0
    let failedCount = 0

    for (const purchase of stuckPurchases) {
      if (!purchase.asaasPaymentId) continue

      // Check if already exceeded max retries
      if (purchase.refundAttempts >= 3) {
        await step.run(`mark-refund-failed-${purchase.id}`, async () => {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { status: 'REFUND_FAILED' },
          })
          // TODO: Send Sentry alert for REFUND_FAILED
          console.error(`[ALERT] Purchase ${purchase.code} marked as REFUND_FAILED after 3 attempts`)
        })
        failedCount++
        continue
      }

      const refundResult = await step.run(`refund-${purchase.id}`, async () => {
        try {
          const result = await refundPayment(purchase.asaasPaymentId!)
          if (result.success) {
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'REFUNDED', refundAttempts: purchase.refundAttempts + 1 },
            })
            console.log(`Refunded purchase ${purchase.code}`)
            return 'success'
          }
          // Increment attempt counter on failure
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { refundAttempts: purchase.refundAttempts + 1 },
          })
          return 'failed'
        } catch (error) {
          console.error(`Failed to refund purchase ${purchase.code} (attempt ${purchase.refundAttempts + 1}/3):`, error)
          // Increment attempt counter on error
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { refundAttempts: purchase.refundAttempts + 1 },
          })

          // Check if this was the 3rd attempt
          if (purchase.refundAttempts + 1 >= 3) {
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'REFUND_FAILED' },
            })
            // TODO: Send Sentry alert for REFUND_FAILED
            console.error(`[ALERT] Purchase ${purchase.code} marked as REFUND_FAILED after 3 attempts`)
          }
          return 'failed'
        }
      })

      if (refundResult === 'success') refundedCount++
      else failedCount++
    }

    console.log(`Auto-refund: ${refundedCount} refunded, ${failedCount} failed`)
    return { refunded: refundedCount, failed: failedCount }
  }
)

// Export all functions
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
  autoRefundFailedPurchases,
]
