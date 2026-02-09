import { Inngest } from 'inngest'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { consultCpf, consultCpfCadastral, consultCnpj as consultCnpjApiFull, consultCnpjFinancial, ApiFullCpfCadastralResponse, ApiFullCnpjFinancialResponse } from './apifull'
import { consultCnpj as consultCnpjBrasilApi } from './brasilapi'
import { searchDatajud } from './datajud'
import { searchWeb } from './google-search'
import { generateSummary } from './openai'
import { sendReportReady } from './resend'
import { refundPayment } from './asaas'

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
    const { purchaseId, term, type, email } = event.data

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

    // Fetch data from APIs
    let apiFullData: Awaited<ReturnType<typeof consultCpf>> | Awaited<ReturnType<typeof consultCnpjApiFull>> | null = null
    let cadastralCpfData: ApiFullCpfCadastralResponse | null = null
    let cnpjFinancialData: ApiFullCnpjFinancialResponse | null = null
    let brasilApiData: Awaited<ReturnType<typeof consultCnpjBrasilApi>> | null = null
    let datajudData: Awaited<ReturnType<typeof searchDatajud>> | null = null
    let googleData: Awaited<ReturnType<typeof searchWeb>> | null = null
    let name = ''
    let region = ''

    try {
      // Step 1: Get primary data from APIFull
      if (type === 'CPF') {
        // Buscar dados cadastrais (step 1)
        cadastralCpfData = await step.run('fetch-apifull-cpf-cadastral', async () => {
          return consultCpfCadastral(term)
        })
        name = cadastralCpfData.nome || ''

        // Atualiza para step 2 - Dados financeiros
        await step.run('update-step-2', async () => updateStep(2))

        // Buscar dados financeiros (step 2)
        apiFullData = await step.run('fetch-apifull-cpf-financial', async () => {
          return consultCpf(term)
        })

        if (!name) name = apiFullData.name
        region = cadastralCpfData.enderecos?.[0]?.uf || apiFullData.region
      } else {
        // CNPJ: Start with BrasilAPI (free) for cadastral data
        brasilApiData = await step.run('fetch-brasilapi', async () => {
          try {
            return await consultCnpjBrasilApi(term)
          } catch (err) {
            console.error('BrasilAPI error (will use APIFull):', err)
            return null
          }
        })
        if (brasilApiData) {
          name = brasilApiData.razaoSocial
        }

        // Atualiza para step 2 - Dados financeiros
        await step.run('update-step-2', async () => updateStep(2))

        // CNPJ: Buscar dados cadastrais (api/cnpj) e financeiros (e-boavista) em paralelo
        const [cadastralData, financialData] = await Promise.all([
          step.run('fetch-apifull-cnpj-cadastral', async () => {
            return consultCnpjApiFull(term)
          }),
          step.run('fetch-apifull-cnpj-financial', async () => {
            try {
              return await consultCnpjFinancial(term)
            } catch (err) {
              console.error('CNPJ Financial (e-boavista) error:', err)
              return null
            }
          }),
        ])

        apiFullData = cadastralData
        cnpjFinancialData = financialData

        // Use APIFull data as fallback for name if BrasilAPI failed
        if (!name && apiFullData) {
          name = (apiFullData as Awaited<ReturnType<typeof consultCnpjApiFull>>).razaoSocial
        }
        region = (apiFullData as Awaited<ReturnType<typeof consultCnpjApiFull>>).region
      }

      // Atualiza para step 3 - Processos judiciais
      await step.run('update-step-3', async () => updateStep(3))

      // Step 3: Fetch processos judiciais (Datajud multi-tribunal)
      datajudData = await step.run('fetch-datajud', async () => {
        try {
          return await searchDatajud(name, term)
        } catch (err) {
          console.error('Datajud error:', err)
          return { processes: [] }
        }
      })

      // Atualiza para step 4 - Menções na web
      await step.run('update-step-4', async () => updateStep(4))

      // Step 4: Fetch Google/Serper
      googleData = await step.run('fetch-google', async () => {
        try {
          return await searchWeb(name, term, type)
        } catch (err) {
          console.error('Google error:', err)
          return { general: [], focused: [], reclameAqui: [] }
        }
      })

      // Processos já vêm deduplicados do Datajud (multi-tribunal)
      const uniqueProcesses = (datajudData?.processes || []).map((p) => ({
        ...p,
        source: 'datajud' as const,
      }))

      // Atualiza para step 5 - Gerando resumo
      await step.run('update-step-5', async () => updateStep(5))

      // Step 5: Generate summary with GPT
      const combinedData = {
        apiFull: apiFullData,
        cadastral: cadastralCpfData,
        brasilApi: brasilApiData,
        processes: uniqueProcesses,
        google: googleData,
      }

      const summaryResult = await step.run('generate-summary', async () => {
        return generateSummary(combinedData, type, region, term)
      })

      // Apply classifications to Google results
      if (googleData && summaryResult.mentionClassifications) {
        for (const classification of summaryResult.mentionClassifications) {
          const matchGeneral = googleData.general.find((r) => r.url === classification.url)
          if (matchGeneral) matchGeneral.classification = classification.classification

          const matchFocused = googleData.focused.find((r) => r.url === classification.url)
          if (matchFocused) matchFocused.classification = classification.classification
        }
      }

      // Atualiza para step 6 - Finalizando
      await step.run('update-step-6', async () => updateStep(6))

      // Step 6: Save SearchResult
      const searchResult = await step.run('save-result', async () => {
        // Convert to plain JSON to satisfy Prisma's Json type
        const jsonData = JSON.parse(JSON.stringify({
          apiFull: apiFullData,
          cadastral: cadastralCpfData,
          cnpjFinancial: cnpjFinancialData,
          brasilApi: brasilApiData,
          processes: uniqueProcesses,
          google: googleData,
          reclameAqui: summaryResult.reclameAqui || null,
        })) as Prisma.InputJsonValue

        return prisma.searchResult.create({
          data: {
            term,
            type,
            name,
            data: jsonData,
            summary: summaryResult.summary,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        })
      })

      // Step 7: Update purchase to COMPLETED
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

      // Step 7: Send email notification
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eopix.com.br'
      const maskedTerm = type === 'CPF'
        ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**')

      await step.run('send-email', async () => {
        await sendReportReady(
          email,
          maskedTerm,
          `${appUrl}/relatorio/${searchResult.id}`
        )
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

// Cleanup pending purchases (every 15 minutes)
export const cleanupPendingPurchases = inngest.createFunction(
  {
    id: 'cleanup-pending-purchases',
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const result = await step.run('expire-old-pending', async () => {
      return prisma.purchase.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: twentyFourHoursAgo },
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
export const autoRefundFailedPurchases = inngest.createFunction(
  {
    id: 'auto-refund-failed-purchases',
  },
  { cron: '*/30 * * * *' },
  async ({ step }) => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

    // Find purchases stuck in PROCESSING for more than 2 hours
    const stuckPurchases = await step.run('find-stuck-purchases', async () => {
      return prisma.purchase.findMany({
        where: {
          status: 'PROCESSING',
          updatedAt: { lt: twoHoursAgo },
          asaasPaymentId: { not: null },
        },
        select: {
          id: true,
          asaasPaymentId: true,
          code: true,
        },
      })
    })

    if (stuckPurchases.length === 0) {
      console.log('No stuck purchases to refund')
      return { refunded: 0 }
    }

    let refundedCount = 0

    for (const purchase of stuckPurchases) {
      if (!purchase.asaasPaymentId) continue

      const refundResult = await step.run(`refund-${purchase.id}`, async () => {
        try {
          const result = await refundPayment(purchase.asaasPaymentId!)
          if (result.success) {
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'REFUNDED' },
            })
            console.log(`Refunded purchase ${purchase.code}`)
            return true
          }
          return false
        } catch (error) {
          console.error(`Failed to refund purchase ${purchase.code}:`, error)
          return false
        }
      })

      if (refundResult) refundedCount++
    }

    console.log(`Auto-refunded ${refundedCount} stuck purchases`)
    return { refunded: refundedCount }
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
