import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDocument } from '@/lib/validators'

interface MonitorPurchase {
  id: string
  code: string
  term: string
  termFormatted: string
  type: 'CPF' | 'CNPJ'
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

interface MonitorData {
  active: MonitorPurchase[]
  queued: MonitorPurchase[]
  failed: MonitorPurchase[]
  completed: MonitorPurchase[]
  timestamp: string
}

const SELECT_FIELDS = {
  id: true,
  code: true,
  term: true,
  status: true,
  processingStep: true,
  buyerName: true,
  failureReason: true,
  failureDetails: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
} as const

function mapPurchase(p: {
  id: string
  code: string
  term: string
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
}): MonitorPurchase {
  const cleaned = p.term.replace(/\D/g, '')
  return {
    id: p.id,
    code: p.code,
    term: p.term,
    termFormatted: formatDocument(p.term),
    type: cleaned.length <= 11 ? 'CPF' : 'CNPJ',
    status: p.status,
    processingStep: p.processingStep,
    buyerName: p.buyerName,
    failureReason: p.failureReason,
    failureDetails: p.failureDetails,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(': heartbeat\n\n'))

      const fetchAndSend = async () => {
        try {
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

          const [active, queued, failed, completed] = await Promise.all([
            prisma.purchase.findMany({
              where: { status: 'PROCESSING' },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 50,
            }),
            prisma.purchase.findMany({
              where: { status: 'PAID' },
              select: SELECT_FIELDS,
              orderBy: { paidAt: 'desc' },
              take: 20,
            }),
            prisma.purchase.findMany({
              where: {
                status: 'FAILED',
                updatedAt: { gte: oneDayAgo },
              },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 20,
            }),
            prisma.purchase.findMany({
              where: {
                status: 'COMPLETED',
                updatedAt: { gte: oneHourAgo },
              },
              select: SELECT_FIELDS,
              orderBy: { updatedAt: 'desc' },
              take: 10,
            }),
          ])

          const data: MonitorData = {
            active: active.map(mapPurchase),
            queued: queued.map(mapPurchase),
            failed: failed.map(mapPurchase),
            completed: completed.map(mapPurchase),
            timestamp: now.toISOString(),
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (error) {
          console.error('[Monitor SSE] Error:', error)
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        }
      }

      await fetchAndSend()
      intervalId = setInterval(fetchAndSend, 3000)

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    },
    cancel() {
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
