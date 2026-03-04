import { inngest } from './client'
import { prisma } from '../prisma'
import { refundPayment } from '../stripe'

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
          failureReason: 'PAYMENT_EXPIRED',
          failureDetails: JSON.stringify({
            reason: 'Payment not confirmed within 30 minutes',
            timestamp: new Date().toISOString(),
          }),
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
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

    // Find purchases stuck in PROCESSING for more than 4 hours OR previously failed refunds
    const stuckPurchases = await step.run('find-stuck-purchases', async () => {
      return prisma.purchase.findMany({
        where: {
          OR: [
            // Stuck in PROCESSING for 4+ hours (increased from 2h to avoid premature refunds)
            {
              status: 'PROCESSING',
              updatedAt: { lt: fourHoursAgo },
              stripePaymentIntentId: { not: null },
              processingStep: { gt: 0 }, // Only refund if processing actually started
            },
            // FAILED status that needs refund (already paid but processing failed)
            {
              status: 'FAILED',
              paidAt: { not: null },
              stripePaymentIntentId: { not: null },
              refundAttempts: { lt: 3 },
            },
          ],
        },
        select: {
          id: true,
          stripePaymentIntentId: true,
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
      if (!purchase.stripePaymentIntentId) continue

      // Log before refunding
      console.warn(`[AUTO-REFUND] Purchase ${purchase.code} stuck in ${purchase.status} for >4h - initiating refund (attempt ${purchase.refundAttempts + 1}/3)`)

      // Check if already exceeded max retries
      if (purchase.refundAttempts >= 3) {
        await step.run(`mark-refund-failed-${purchase.id}`, async () => {
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: {
              status: 'REFUND_FAILED',
              failureDetails: JSON.stringify({
                reason: 'Exceeded maximum refund attempts',
                attempts: purchase.refundAttempts,
                timestamp: new Date().toISOString(),
              }),
            },
          })
          // TODO: Send Sentry alert for REFUND_FAILED
          console.error(`[ALERT] Purchase ${purchase.code} marked as REFUND_FAILED after 3 attempts`)
        })
        failedCount++
        continue
      }

      const refundResult = await step.run(`refund-${purchase.id}`, async () => {
        try {
          const result = await refundPayment(purchase.stripePaymentIntentId!)
          if (result.success) {
            const refundReason = purchase.status === 'PROCESSING' ? 'AUTO_TIMEOUT' : 'AUTO_FAILED_PAYMENT'
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: {
                status: 'REFUNDED',
                refundAttempts: purchase.refundAttempts + 1,
                refundReason,
                refundDetails: JSON.stringify({
                  originalStatus: purchase.status,
                  attemptNumber: purchase.refundAttempts + 1,
                  timestamp: new Date().toISOString(),
                }),
              },
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
              data: {
                status: 'REFUND_FAILED',
                failureDetails: JSON.stringify({
                  error: error instanceof Error ? error.message : String(error),
                  attempts: purchase.refundAttempts + 1,
                  timestamp: new Date().toISOString(),
                }),
              },
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

// Export all functions
export const functions = [
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
  autoRefundFailedPurchases,
  anonymizePurchases,
]
