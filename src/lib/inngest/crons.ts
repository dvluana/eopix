import { inngest } from './client'
import { processSearch } from './process-search'
import { abandonmentEmailSequence } from './abandonment-emails'
import { prisma } from '../prisma'
import { sendPurchaseExpiredEmail } from '../email'

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

    // Find purchases to expire (include user data for emails)
    const toExpire = await step.run('find-pending', async () => {
      return prisma.purchase.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: thirtyMinutesAgo },
        },
        select: {
          id: true,
          code: true,
          term: true,
          user: { select: { email: true, name: true } },
        },
      })
    })

    if (toExpire.length === 0) {
      return { expired: 0 }
    }

    // Batch update to FAILED+PAYMENT_EXPIRED
    await step.run('expire-old-pending', async () => {
      return prisma.purchase.updateMany({
        where: { id: { in: toExpire.map(p => p.id) } },
        data: {
          status: 'FAILED',
          failureReason: 'PAYMENT_EXPIRED',
          failureDetails: JSON.stringify({
            reason: 'Payment not confirmed within 30 minutes',
            timestamp: new Date().toISOString(),
          }),
        },
      })
    })

    // Fire-and-forget expired emails (skip guests)
    for (const p of toExpire) {
      if (!p.user.email.includes('@guest.eopix.app')) {
        sendPurchaseExpiredEmail(
          p.user.email,
          p.user.name || '',
          p.code,
          p.term,
          p.id
        ).catch(err => console.error(`[Cron] Expired email failed for ${p.code}:`, err))
      }
    }

    console.log(`Expired ${toExpire.length} pending purchases`)
    return { expired: toExpire.length }
  }
)

// Anonymize purchases older than 2 years (LGPD Art. 16) - Monthly on 1st at midnight
export const anonymizePurchases = inngest.createFunction(
  {
    id: 'anonymize-purchases',
    name: 'Anonymize Purchases (LGPD Compliance)',
  },
  { cron: '0 0 1 * *' }, // Every 1st day of month at midnight
  async ({ step }) => {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    // Step 1: Find eligible purchases
    const eligiblePurchases = await step.run('find-eligible', async () => {
      return prisma.purchase.findMany({
        where: {
          createdAt: { lt: twoYearsAgo },
          buyerName: { not: 'ANONIMIZADO' }, // Skip already anonymized
          status: { in: ['COMPLETED', 'REFUNDED'] }, // Only anonymize finalized purchases
        },
        select: {
          id: true,
          code: true,
          buyerName: true,
          buyerCpfCnpj: true,
          createdAt: true,
        },
      })
    })

    console.log(`[LGPD] Found ${eligiblePurchases.length} purchases to anonymize`)

    if (eligiblePurchases.length === 0) {
      return { anonymized: 0, message: 'No purchases to anonymize' }
    }

    // Step 2: Anonymize in batch
    const result = await step.run('anonymize-data', async () => {
      return prisma.purchase.updateMany({
        where: { id: { in: eligiblePurchases.map((p) => p.id) } },
        data: {
          buyerName: 'ANONIMIZADO',
          buyerCpfCnpj: 'ANONIMIZADO',
        },
      })
    })

    // Step 3: Log audit trail
    await step.run('log-audit', async () => {
      console.log(`[LGPD] Anonymized ${result.count} purchases`)
      console.log(
        `[LGPD] Purchase IDs: ${eligiblePurchases.map((p) => p.code).join(', ')}`
      )
      // TODO: Gravar em tabela AuditLog (futuro)
      return { logged: true }
    })

    return {
      anonymized: result.count,
      purchaseIds: eligiblePurchases.map((p) => p.id),
    }
  }
)

// Export all functions (processSearch + crons)
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
  anonymizePurchases,
  abandonmentEmailSequence,
]
