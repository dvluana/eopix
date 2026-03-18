import { inngest } from './client'
import { prisma } from '@/lib/prisma'
import {
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
} from '@/lib/email'

// Determina se a purchase ainda está em estado de abandono
// (nunca foi paga ou expirou por falta de pagamento)
function isAbandoned(status: string, failureReason: string | null): boolean {
  return (
    status === 'PENDING' ||
    (status === 'FAILED' && failureReason === 'PAYMENT_EXPIRED')
  )
}

export const abandonmentEmailSequence = inngest.createFunction(
  {
    id: 'abandonment-email-sequence',
    retries: 2,
    // Previne múltiplas execuções para o mesmo purchase
    idempotency: 'event.data.purchaseId',
  },
  { event: 'purchase/created' },
  async ({ event, step }) => {
    const { purchaseId, email, name, term } = event.data

    // ── R1: espera 30 minutos ──────────────────────────────────────────────
    await step.sleep('wait-r1', '30 minutes')

    const p1 = await step.run('check-for-r1', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p1 || !isAbandoned(p1.status, p1.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r1' }
    }

    await step.run('send-r1', async () => {
      await sendAbandonmentEmail1(email, name, term)
    })

    // ── R2: espera mais ~23.5h (total ~24h desde criação) ─────────────────
    await step.sleep('wait-r2', '23 hours 30 minutes')

    const p2 = await step.run('check-for-r2', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p2 || !isAbandoned(p2.status, p2.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r2' }
    }

    await step.run('send-r2', async () => {
      await sendAbandonmentEmail2(email, name, term)
    })

    // ── R3: espera mais 48h (total ~72h desde criação) ────────────────────
    await step.sleep('wait-r3', '48 hours')

    const p3 = await step.run('check-for-r3', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p3 || !isAbandoned(p3.status, p3.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r3' }
    }

    await step.run('send-r3', async () => {
      await sendAbandonmentEmail3(email, name, term)
    })

    return { completed: true, emailsSent: 3 }
  }
)
