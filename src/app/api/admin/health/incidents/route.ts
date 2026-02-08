import { NextRequest, NextResponse } from 'next/server'
import { isMockMode } from '@/lib/mock-mode'

// In-memory incident store (in production, use a database or external service)
interface Incident {
  id: string
  service: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  message: string
  startedAt: Date
  resolvedAt?: Date
}

const incidents: Incident[] = []

// Mock incidents for demo
if (isMockMode && incidents.length === 0) {
  incidents.push(
    {
      id: 'inc_1',
      service: 'asaas',
      status: 'resolved',
      message: 'Lentidao temporaria na API Asaas',
      startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
    },
    {
      id: 'inc_2',
      service: 'database',
      status: 'resolved',
      message: 'Manutencao programada do banco de dados',
      startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7', 10)
    const status = searchParams.get('status') // 'open' or 'resolved' or 'all'

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let filtered = incidents.filter((i) => i.startedAt >= cutoffDate)

    if (status === 'open') {
      filtered = filtered.filter((i) => i.status !== 'resolved')
    } else if (status === 'resolved') {
      filtered = filtered.filter((i) => i.status === 'resolved')
    }

    // Sort by startedAt descending
    filtered.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

    // Calculate uptime (simplified)
    const totalHours = days * 24
    const downtimeHours = filtered.reduce((acc, inc) => {
      const end = inc.resolvedAt || new Date()
      const duration = (end.getTime() - inc.startedAt.getTime()) / (1000 * 60 * 60)
      return acc + Math.min(duration, totalHours)
    }, 0)

    const uptime = ((totalHours - downtimeHours) / totalHours) * 100

    return NextResponse.json({
      incidents: filtered,
      summary: {
        totalIncidents: filtered.length,
        openIncidents: filtered.filter((i) => i.status !== 'resolved').length,
        uptime: Math.max(0, Math.min(100, uptime)).toFixed(2),
        period: `${days} dias`,
      },
    })
  } catch (error) {
    console.error('Health incidents error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar incidentes' },
      { status: 500 }
    )
  }
}
