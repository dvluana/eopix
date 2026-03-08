'use client'

import React from 'react'
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
import { AdminPageHeader } from '../_components/AdminPageHeader'
import { AdminDataTable, Column } from '../_components/AdminDataTable'
import { StatusBadge } from '../_components/StatusBadge'
import { formatCurrency, formatDate } from '../_components/admin-utils'
import { AdminError } from '../_components/AdminError'

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

type RecentPurchase = DashboardData['recentPurchases'][number]

const recentColumns: Column[] = [
  { key: 'code', label: 'Código' },
  { key: 'term', label: 'Documento' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Valor', align: 'right' },
  { key: 'createdAt', label: 'Data', align: 'right' },
]

const stats = [
  { key: 'revenue', label: 'Receita Total', icon: DollarSign, format: 'currency' as const },
  { key: 'purchases', label: 'Compras', icon: ShoppingCart, format: 'number' as const },
  { key: 'users', label: 'Usuários', icon: Users, format: 'number' as const },
  { key: 'leads', label: 'Leads', icon: TrendingUp, format: 'number' as const },
]

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
    return <div className="adm-loading" style={{ height: '400px' }}><RefreshCw className="animate-spin" size={32} /></div>
  }

  if (error) {
    return <AdminError message={error} onRetry={fetchData} />
  }

  if (!data) return null

  const getStatValue = (key: string) => {
    switch (key) {
      case 'revenue': return { total: formatCurrency(data.revenue.total), today: `+${formatCurrency(data.revenue.today)} hoje` }
      case 'purchases': return { total: String(data.purchases.total), today: `+${data.purchases.today} hoje` }
      case 'users': return { total: String(data.users.total), today: `+${data.users.today} hoje` }
      case 'leads': return { total: String(data.leads.total), today: `+${data.leads.today} hoje` }
      default: return { total: '0', today: '' }
    }
  }

  const renderRecentCell = (row: RecentPurchase, col: Column) => {
    switch (col.key) {
      case 'status': return <StatusBadge status={row.status} />
      case 'amount': return formatCurrency(row.amount)
      case 'createdAt': return formatDate(row.createdAt)
      default: return row[col.key as keyof RecentPurchase] as string
    }
  }

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="Visão geral do sistema" />

      {/* Stats Grid */}
      <div className="adm-stats-grid">
        {stats.map((stat) => {
          const { total, today } = getStatValue(stat.key)
          const Icon = stat.icon
          return (
            <div key={stat.key} className="adm-stat-card">
              <div className="adm-stat-card__header">
                <span className="adm-stat-card__label">{stat.label}</span>
                <Icon size={16} className="adm-stat-card__icon" />
              </div>
              <div className="adm-stat-card__value">{total}</div>
              <p className="adm-stat-card__detail">{today}</p>
            </div>
          )
        })}
      </div>

      {/* Status Overview */}
      <div className="adm-status-grid">
        <div className="adm-card">
          <div className="adm-card__header"><p className="adm-card__title">Status das Compras</p></div>
          <div className="adm-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="adm-status-item">
                <CheckCircle size={16} style={{ color: '#22c55e' }} />
                <span>Concluídas: {data.purchases.byStatus.completed}</span>
              </div>
              <div className="adm-status-item">
                <Clock size={16} style={{ color: '#f59e0b' }} />
                <span>Pendentes: {data.purchases.byStatus.pending}</span>
              </div>
              <div className="adm-status-item">
                <XCircle size={16} style={{ color: '#ef4444' }} />
                <span>Falhas: {data.purchases.byStatus.failed}</span>
              </div>
              <div className="adm-status-item">
                <RefreshCw size={16} style={{ color: '#8b5cf6' }} />
                <span>Reembolsos: {data.purchases.byStatus.refunded}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="adm-card">
          <div className="adm-card__header"><p className="adm-card__title">Receita por Período</p></div>
          <div className="adm-card__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Hoje', value: data.revenue.today },
                { label: '7 dias', value: data.revenue.last7Days },
                { label: '30 dias', value: data.revenue.last30Days },
                { label: 'Total', value: data.revenue.total },
              ].map((item) => (
                <div key={item.label}>
                  <p className="adm-revenue-item__label">{item.label}</p>
                  <p className="adm-revenue-item__value">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="adm-card">
        <div className="adm-card__header"><p className="adm-card__title">Compras Recentes</p></div>
        <div className="adm-card__body">
          <AdminDataTable<RecentPurchase>
            columns={recentColumns}
            data={data.recentPurchases}
            renderCell={renderRecentCell}
            loading={false}
            emptyMessage="Nenhuma compra recente"
            mono
          />
        </div>
      </div>
    </div>
  )
}
