'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Search } from 'lucide-react'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminFilterBar } from '../../_components/AdminFilterBar'
import { AdminDataTable, Column } from '../../_components/AdminDataTable'
import { AdminPagination } from '../../_components/AdminPagination'
import { AdminError } from '../../_components/AdminError'
import { formatDate } from '../../_components/admin-utils'

interface Lead {
  id: string
  email: string
  term: string | null
  reason: string
  createdAt: string
}

interface LeadsData {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const reasonLabels: Record<string, string> = {
  API_DOWN: 'API Indisponível',
  MAINTENANCE: 'Manutenção',
}

const columns: Column[] = [
  { key: 'email', label: 'Email' },
  { key: 'term', label: 'Documento' },
  { key: 'reason', label: 'Motivo' },
  { key: 'createdAt', label: 'Data', align: 'right' },
]

export default function LeadsPage() {
  const [data, setData] = React.useState<LeadsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [reasonFilter, setReasonFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (reasonFilter && reasonFilter !== 'all') params.set('reason', reasonFilter)

      const res = await fetch(`/api/admin/leads?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      console.error('Error fetching leads:', err)
    } finally {
      setLoading(false)
    }
  }, [page, reasonFilter])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    if (!data?.leads.length) return

    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csv = [
      ['Email', 'Documento', 'Motivo', 'Data'].join(','),
      ...data.leads.map((lead) =>
        [
          escapeCSV(lead.email),
          escapeCSV(lead.term || ''),
          escapeCSV(reasonLabels[lead.reason] || lead.reason),
          escapeCSV(formatDate(lead.createdAt)),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderCell = (lead: Lead, col: Column) => {
    switch (col.key) {
      case 'email': return lead.email
      case 'term': return lead.term || '-'
      case 'reason': return (
        <span className={`adm-badge ${lead.reason === 'API_DOWN' ? 'adm-badge--failed' : 'adm-badge--pending'}`}>
          {reasonLabels[lead.reason] || lead.reason}
        </span>
      )
      case 'createdAt': return formatDate(lead.createdAt)
      default: return null
    }
  }

  if (error && !data) {
    return (
      <div>
        <AdminPageHeader title="Leads" subtitle="Leads capturados durante indisponibilidades" />
        <AdminError message={error} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader title="Leads" subtitle="Leads capturados durante indisponibilidades">
        <Button variant="outline" onClick={handleExport} disabled={!data?.leads.length}>
          <Download size={16} style={{ marginRight: '8px' }} />
          Exportar CSV
        </Button>
      </AdminPageHeader>

      <AdminFilterBar onSubmit={() => { setPage(1); fetchData() }}>
        <Input
          value={reasonFilter === 'all' ? '' : reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value || 'all')}
          placeholder="Filtrar por motivo (ex: API_DOWN)"
          style={{ width: '280px' }}
        />
        <Button type="submit" variant="secondary" size="sm">
          <Search size={16} />
        </Button>
      </AdminFilterBar>

      <div className="adm-card">
        <div className="adm-card__header">
          <p className="adm-card__title">
            {data ? `${data.pagination.total} leads` : 'Carregando...'}
          </p>
        </div>
        <div className="adm-card__body">
          <AdminDataTable<Lead>
            columns={columns}
            data={data?.leads ?? []}
            renderCell={renderCell}
            loading={loading}
            emptyMessage="Nenhum lead encontrado"
          />
          {data && (
            <AdminPagination
              page={page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      </div>
    </div>
  )
}
