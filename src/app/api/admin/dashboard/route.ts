import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
      // Purchase counts
      prisma.purchase.count(),
      prisma.purchase.count({ where: { createdAt: { gte: today } } }),
      prisma.purchase.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.purchase.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Status counts
      prisma.purchase.count({ where: { status: 'COMPLETED' } }),
      prisma.purchase.count({ where: { status: 'PENDING' } }),
      prisma.purchase.count({ where: { status: 'FAILED' } }),
      prisma.purchase.count({ where: { status: 'REFUNDED' } }),

      // Revenue (sum of completed purchases)
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: { status: { in: ['COMPLETED', 'PAID', 'PROCESSING'] } },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['COMPLETED', 'PAID', 'PROCESSING'] },
          paidAt: { gte: today },
        },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['COMPLETED', 'PAID', 'PROCESSING'] },
          paidAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.purchase.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['COMPLETED', 'PAID', 'PROCESSING'] },
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

    // Mask terms and emails in response
    const maskedRecentPurchases = recentPurchases.map((p) => ({
      id: p.id,
      code: p.code,
      term: p.term.length === 11
        ? p.term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.***-**')
        : p.term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/****-**'),
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
      recentPurchases: maskedRecentPurchases,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar dashboard' },
      { status: 500 }
    )
  }
}
