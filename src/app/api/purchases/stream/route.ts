import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// Server-Sent Events (SSE) endpoint for real-time purchase updates
export async function GET(request: NextRequest) {
  const session = await getSession(request)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userEmail = session.email

  // Create SSE stream
  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(': heartbeat\n\n'))

      // Poll for updates every 1 second
      intervalId = setInterval(async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: {
              purchases: {
                where: {
                  status: { in: ['PROCESSING', 'PAID', 'COMPLETED', 'FAILED'] },
                },
                select: {
                  id: true,
                  code: true,
                  processingStep: true,
                  status: true,
                  searchResultId: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 20, // Limit to recent purchases
              },
            },
          })

          if (user && user.purchases.length > 0) {
            const purchasesWithReport = user.purchases.map(p => ({
              ...p,
              hasReport: !!p.searchResultId,
              reportId: p.searchResultId,
            }))
            const data = `data: ${JSON.stringify(purchasesWithReport)}\n\n`
            controller.enqueue(encoder.encode(data))
          } else {
            // Send heartbeat to keep connection alive
            controller.enqueue(encoder.encode(': heartbeat\n\n'))
          }
        } catch (error) {
          console.error('[SSE] Error fetching purchases:', error)
          // Send heartbeat on error to keep connection alive
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        }
      }, 1000)

      // Handle client disconnect
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
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
