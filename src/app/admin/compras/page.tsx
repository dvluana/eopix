'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { RefreshCw, Search, Undo2, ExternalLink, CheckCircle2, Play } from 'lucide-react'

interface Purchase {
  id: string
  code: string
  term: string
  type: string
  status: string
  amount: number
  email: string
  buyerName: string | null
  hasReport: boolean
  reportId: string | null
  asaasPaymentId: string | null
  createdAt: string
  paidAt: string | null
}

interface PurchasesData {
  purchases: Purchase[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
    REFUND_FAILED: { variant: 'destructive', label: 'Reembolso Falhou' },
  }

  const { variant, label } = config[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={variant}>{label}</Badge>
}

export default function ComprasPage() {
  const [data, setData] = React.useState<PurchasesData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)

  // Refund dialog
  const [refundPurchase, setRefundPurchase] = React.useState<Purchase | null>(null)
  const [refundLoading, setRefundLoading] = React.useState(false)

  // Mark paid dialog
  const [markPaidPurchase, setMarkPaidPurchase] = React.useState<Purchase | null>(null)
  const [markPaidLoading, setMarkPaidLoading] = React.useState(false)

  // Process dialog
  const [processPurchase, setProcessPurchase] = React.useState<Purchase | null>(null)
  const [processLoading, setProcessLoading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/purchases?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Error fetching purchases:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, statusFilter])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleRefund = async () => {
    if (!refundPurchase) return

    try {
      setRefundLoading(true)
      const res = await fetch(`/api/admin/purchases/${refundPurchase.id}/refund`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao processar reembolso')
        return
      }

      setRefundPurchase(null)
      fetchData()
    } catch (err) {
      console.error('Error processing refund:', err)
      alert('Erro ao processar reembolso')
    } finally {
      setRefundLoading(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!markPaidPurchase) return

    try {
      setMarkPaidLoading(true)
      const res = await fetch(`/api/admin/purchases/${markPaidPurchase.id}/mark-paid`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao marcar como pago')
        return
      }

      setMarkPaidPurchase(null)
      fetchData()
    } catch (err) {
      console.error('Error marking as paid:', err)
      alert('Erro ao marcar como pago')
    } finally {
      setMarkPaidLoading(false)
    }
  }

  const handleProcess = async () => {
    if (!processPurchase) return

    try {
      setProcessLoading(true)
      const res = await fetch(`/api/admin/purchases/${processPurchase.id}/process`, {
        method: 'POST',
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao processar')
        return
      }

      setProcessPurchase(null)
      fetchData()
    } catch (err) {
      console.error('Error processing:', err)
      alert('Erro ao processar')
    } finally {
      setProcessLoading(false)
    }
  }

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
          Compras
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            marginTop: '4px',
          }}
        >
          Gerenciamento de compras
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <CardContent style={{ paddingTop: '16px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por codigo, documento ou email..."
              style={{ flex: 1 }}
            />
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger style={{ width: '180px' }}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="PROCESSING">Processando</SelectItem>
                <SelectItem value="COMPLETED">Concluido</SelectItem>
                <SelectItem value="FAILED">Falhou</SelectItem>
                <SelectItem value="REFUNDED">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              <Search size={16} />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {data ? `${data.pagination.total} compras` : 'Carregando...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : data?.purchases.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '40px' }}>
              Nenhuma compra encontrada
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Codigo</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Documento</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Valor</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Criado</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: 600 }}>Pago</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontSize: '12px', fontWeight: 600 }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.purchases.map((purchase) => (
                    <tr key={purchase.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontFamily: 'monospace' }}>{purchase.code}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>
                        <span style={{ fontFamily: 'monospace' }}>{purchase.term}</span>
                        <Badge variant="outline" style={{ marginLeft: '8px' }}>{purchase.type}</Badge>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '13px' }}>{purchase.email}</td>
                      <td style={{ padding: '12px 8px' }}><StatusBadge status={purchase.status} /></td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', textAlign: 'right' }}>{formatCurrency(purchase.amount)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px' }}>{formatDate(purchase.createdAt)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px' }}>{formatDate(purchase.paidAt)}</td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                          {purchase.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkPaidPurchase(purchase)}
                              title="Marcar como pago"
                            >
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          {purchase.status === 'PAID' && !purchase.hasReport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProcessPurchase(purchase)}
                              title="Processar"
                            >
                              <Play size={16} />
                            </Button>
                          )}
                          {purchase.hasReport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/relatorio/${purchase.reportId}`, '_blank')}
                              title="Ver relatorio"
                            >
                              <ExternalLink size={16} />
                            </Button>
                          )}
                          {['PAID', 'PROCESSING', 'COMPLETED'].includes(purchase.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRefundPurchase(purchase)}
                              title="Reembolsar"
                            >
                              <Undo2 size={16} />
                            </Button>
                          )}
                        </div>
                      </td>
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

      {/* Refund Dialog */}
      <Dialog open={!!refundPurchase} onOpenChange={() => setRefundPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reembolso</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reembolsar a compra {refundPurchase?.code}?
              <br />
              Valor: {refundPurchase ? formatCurrency(refundPurchase.amount) : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundPurchase(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={refundLoading}>
              {refundLoading ? 'Processando...' : 'Confirmar Reembolso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Paid Dialog */}
      <Dialog open={!!markPaidPurchase} onOpenChange={() => setMarkPaidPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como Pago</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja marcar a compra {markPaidPurchase?.code} como paga?
              <br />
              Isso vai liberar a geracao do relatorio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidPurchase(null)}>Cancelar</Button>
            <Button onClick={handleMarkPaid} disabled={markPaidLoading}>
              {markPaidLoading ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={!!processPurchase} onOpenChange={() => setProcessPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Compra</DialogTitle>
            <DialogDescription>
              Iniciar processamento da compra {processPurchase?.code}?
              <br />
              Isso vai disparar a geracao do relatorio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessPurchase(null)}>Cancelar</Button>
            <Button onClick={handleProcess} disabled={processLoading}>
              {processLoading ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
