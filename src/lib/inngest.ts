import { Inngest } from 'inngest'
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { consultCpf, consultCnpj as consultCnpjApiFull } from './apifull'
import { consultCnpj as consultCnpjBrasilApi } from './brasilapi'
import { searchProcesses as searchEscavador } from './escavador'
import { searchDatajud } from './datajud'
import { searchWeb } from './google-search'
import { generateSummary } from './openai'
import { sendReportReady } from './resend'

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

type AllEvents = SearchProcessEvent | CleanupEvent

// Process search job
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 3,
  },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { purchaseId, purchaseCode, term, type, email } = event.data

    // Update purchase to PROCESSING
    await step.run('set-processing', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'PROCESSING' },
      })
    })

    // Fetch data from APIs
    let apiFullData: Awaited<ReturnType<typeof consultCpf>> | Awaited<ReturnType<typeof consultCnpjApiFull>> | null = null
    let brasilApiData: Awaited<ReturnType<typeof consultCnpjBrasilApi>> | null = null
    let escavadorData: Awaited<ReturnType<typeof searchEscavador>> | null = null
    let datajudData: Awaited<ReturnType<typeof searchDatajud>> | null = null
    let googleData: Awaited<ReturnType<typeof searchWeb>> | null = null
    let name = ''
    let region = ''

    try {
      // Step 1: Get primary data from APIFull
      if (type === 'CPF') {
        apiFullData = await step.run('fetch-apifull-cpf', async () => {
          return consultCpf(term)
        })
        name = (apiFullData as Awaited<ReturnType<typeof consultCpf>>).name
        region = (apiFullData as Awaited<ReturnType<typeof consultCpf>>).region
      } else {
        // CNPJ: Start with BrasilAPI (free), then APIFull
        brasilApiData = await step.run('fetch-brasilapi', async () => {
          return consultCnpjBrasilApi(term)
        })
        name = brasilApiData.razaoSocial

        apiFullData = await step.run('fetch-apifull-cnpj', async () => {
          return consultCnpjApiFull(term)
        })
        region = (apiFullData as Awaited<ReturnType<typeof consultCnpjApiFull>>).region
      }

      // Step 2: Parallel fetches - Escavador, Datajud, Google
      const [escavador, datajud, google] = await Promise.all([
        step.run('fetch-escavador', async () => {
          try {
            return await searchEscavador(name, term)
          } catch (err) {
            console.error('Escavador error:', err)
            return { totalCount: 0, processes: [] }
          }
        }),
        step.run('fetch-datajud', async () => {
          try {
            return await searchDatajud(name, term)
          } catch (err) {
            console.error('Datajud error:', err)
            return { processes: [] }
          }
        }),
        step.run('fetch-google', async () => {
          try {
            return await searchWeb(name, term, type)
          } catch (err) {
            console.error('Google error:', err)
            return { general: [], focused: [], reclameAqui: [] }
          }
        }),
      ])

      escavadorData = escavador
      datajudData = datajud
      googleData = google

      // Step 3: Merge and deduplicate processes
      const allProcesses = [
        ...(escavadorData?.processes || []).map((p) => ({
          ...p,
          source: 'escavador' as const,
        })),
        ...(datajudData?.processes || []).map((p) => ({
          ...p,
          source: 'datajud' as const,
        })),
      ]

      // Deduplicate by number (if available) or tribunal+date+classe
      const seenKeys = new Set<string>()
      const uniqueProcesses = allProcesses.filter((p) => {
        const key = p.number || `${p.tribunal}-${p.date}-${p.classe}`
        if (seenKeys.has(key)) return false
        seenKeys.add(key)
        return true
      })

      // Step 4: Generate summary with GPT
      const combinedData = {
        apiFull: apiFullData,
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

      // Step 5: Save SearchResult
      const searchResult = await step.run('save-result', async () => {
        // Convert to plain JSON to satisfy Prisma's Json type
        const jsonData = JSON.parse(JSON.stringify({
          apiFull: apiFullData,
          brasilApi: brasilApiData,
          processes: uniqueProcesses,
          google: googleData,
        })) as Prisma.InputJsonValue

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

      // Step 6: Update purchase to COMPLETED
      await step.run('complete-purchase', async () => {
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: {
            status: 'COMPLETED',
            searchResultId: searchResult.id,
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const result = await step.run('delete-old-leads', async () => {
      return prisma.leadCapture.deleteMany({
        where: {
          createdAt: { lt: thirtyDaysAgo },
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

// Export all functions
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
]
