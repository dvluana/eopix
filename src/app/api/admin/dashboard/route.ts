import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDocument } from '@/lib/validators'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    const now = new Date()
    // Use Brazil timezone (UTC-3) for "today" boundaries
    const brNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const today = new Date(Date.UTC(brNow.getFullYear(), brNow.getMonth(), brNow.getDate(), 3, 0, 0))
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Parallel queries for dashboard metrics
    const [
      totalPurchases,
      purchasesToday,
      purchasesLast7Days,
      purchasesLast30Days,
      completedPurchases,
      pendingPurchases,
      failedPurchases,
      refundedPurchases,
      totalRevenue,
      revenueToday,
      revenueLast7Days,
      revenueLast30Days,
      totalUsers,
      usersToday,
      totalBlocklist,
      totalLeads,
      leadsToday,
    ] = await Promise.all([
      // Purchase counts — only COMPLETED (approved and processed)
      prisma.purchase.count({ where: { status: 'COMPLETED' } }),
      prisma.purchase.count({ where: { status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.purchase.count({ where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } } }),
      prisma.purchase.count({ where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } } }),

      // Status counts
      prisma.purchase.count({ where: { status: 'COMPLETED' } }),
      prisma.purchase.count({ where: { status: 'PENDING' } }),
      prisma.purchase.count({ where: { status: 'FAILED' } }),
      prisma.purchase.count({ where: { status: 'REFUNDED' } }),

      // Revenue (sum of completed purchases)
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          paidAt: { gte: today },
        },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          paidAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          paidAt: { gte: thirtyDaysAgo },
        },
      }),

      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),

      // Other counts
      prisma.blocklist.count(),
      prisma.leadCapture.count(),
      prisma.leadCapture.count({ where: { createdAt: { gte: today } } }),
    ])

    // Recent purchases
    const recentPurchases = await prisma.purchase.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        term: true,
        status: true,
        amount: true,
        createdAt: true,
        user: {
          select: { email: true },
        },
      },
    })

    const formattedRecentPurchases = recentPurchases.map((p) => ({
      id: p.id,
      code: p.code,
      term: formatDocument(p.term),
      status: p.status,
      amount: p.amount,
      createdAt: p.createdAt,
      email: p.user.email,
    }))

    return NextResponse.json({
      purchases: {
        total: totalPurchases,
        today: purchasesToday,
        last7Days: purchasesLast7Days,
        last30Days: purchasesLast30Days,
        byStatus: {
          completed: completedPurchases,
          pending: pendingPurchases,
          failed: failedPurchases,
          refunded: refundedPurchases,
        },
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
        today: revenueToday._sum.amount || 0,
        last7Days: revenueLast7Days._sum.amount || 0,
        last30Days: revenueLast30Days._sum.amount || 0,
      },
      users: {
        total: totalUsers,
        today: usersToday,
      },
      blocklist: {
        total: totalBlocklist,
      },
      leads: {
        total: totalLeads,
        today: leadsToday,
      },
      recentPurchases: formattedRecentPurchases,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    )
  }
}
