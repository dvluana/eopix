'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react'

interface DashboardData {
  purchases: {
    total: number
    today: number
    last7Days: number
    last30Days: number
    byStatus: {
      completed: number
      pending: number
      failed: number
      refunded: number
    }
  }
  revenue: {
    total: number
    today: number
    last7Days: number
    last30Days: number
  }
  users: {
    total: number
    today: number
  }
  blocklist: {
    total: number
  }
  leads: {
    total: number
    today: number
  }
  recentPurchases: Array<{
    id: string
    code: string
    term: string
    status: string
    amount: number
    email: string
    createdAt: string
  }>
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    COMPLETED: { variant: 'default', label: 'Concluido' },
    PROCESSING: { variant: 'secondary', label: 'Processando' },
    PAID: { variant: 'secondary', label: 'Pago' },
    PENDING: { variant: 'outline', label: 'Pendente' },
    FAILED: { variant: 'destructive', label: 'Falhou' },
    REFUNDED: { variant: 'destructive', label: 'Reembolsado' },
  }

  const { variant, label } = config[status] || { variant: 'outline' as const, label: status }

  return <Badge variant={variant}>{label}</Badge>
}

export default function AdminDashboard() {
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <XCircle size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        <button onClick={fetchData} style={{ marginTop: '16px' }}>Tentar novamente</button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginTop: '4px',
          }}
        >
          Visao geral do sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '32px',
        }}
      >
        {/* Revenue Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.total)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatCurrency(data.revenue.today)} hoje
            </p>
          </CardContent>
        </Card>

        {/* Purchases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.purchases.total}</div>
            <p className="text-xs text-muted-foreground">
              +{data.purchases.today} hoje
            </p>
          </CardContent>
        </Card>

        {/* Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.total}</div>
            <p className="text-xs text-muted-foreground">
              +{data.users.today} hoje
            </p>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leads.total}</div>
            <p className="text-xs text-muted-foreground">
              +{data.leads.today} hoje
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status das Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={16} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: '14px' }}>Concluidas: {data.purchases.byStatus.completed}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '14px' }}>Pendentes: {data.purchases.byStatus.pending}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '14px' }}>Falhas: {data.purchases.byStatus.failed}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={16} style={{ color: '#8b5cf6' }} />
                <span style={{ fontSize: '14px' }}>Reembolsos: {data.purchases.byStatus.refunded}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Period */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita por Periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Hoje</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(data.revenue.today)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>7 dias</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(data.revenue.last7Days)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>30 dias</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(data.revenue.last30Days)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>Total</p>
                <p style={{ fontSize: '16px', fontWeight: 600 }}>{formatCurrency(data.revenue.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Purchases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Compras Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Codigo</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Documento</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Valor</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recentPurchases.map((purchase) => (
                  <tr key={purchase.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '12px 8px', fontSize: '13px', fontFamily: 'monospace' }}>{purchase.code}</td>
                    <td style={{ padding: '12px 8px', fontSize: '13px' }}>{purchase.term}</td>
                    <td style={{ padding: '12px 8px', fontSize: '13px' }}>{purchase.email}</td>
                    <td style={{ padding: '12px 8px' }}><StatusBadge status={purchase.status} /></td>
                    <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>{formatCurrency(purchase.amount)}</td>
                    <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>{formatDate(purchase.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
