'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Download } from 'lucide-react'

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
  API_DOWN: 'API Indisponivel',
  MAINTENANCE: 'Manutencao',
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export default function LeadsPage() {
  const [data, setData] = React.useState<LeadsData | null>(null)
  const [loading, setLoading] = React.useState(true)
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
    } catch (err) {
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

    const csv = [
      ['Email', 'Documento', 'Motivo', 'Data'].join(','),
      ...data.leads.map((lead) =>
        [
          lead.email,
          lead.term || '',
          reasonLabels[lead.reason] || lead.reason,
          formatDate(lead.createdAt),
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Leads
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
            }}
          >
            Leads capturados durante indisponibilidades
          </p>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={!data?.leads.length}>
          <Download size={16} style={{ marginRight: '8px' }} />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <CardContent style={{ paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(1); }}>
              <SelectTrigger style={{ width: '200px' }}>
                <SelectValue placeholder="Filtrar por motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os motivos</SelectItem>
                <SelectItem value="API_DOWN">API Indisponivel</SelectItem>
                <SelectItem value="MAINTENANCE">Manutencao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {data ? `${data.pagination.total} leads` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : data?.leads.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '40px' }}>
              Nenhum lead encontrado
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Documento</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Motivo</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.leads.map((lead) => (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{lead.email}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontFamily: 'monospace' }}>{lead.term || '-'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <Badge variant={lead.reason === 'API_DOWN' ? 'destructive' : 'secondary'}>
                          {reasonLabels[lead.reason] || lead.reason}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'right' }}>{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                Pagina {page} de {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Proxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
