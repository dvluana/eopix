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
import { RefreshCw, Search, Undo2, CheckCircle2, Play, MoreVertical, Eye, FileText, Ban } from 'lucide-react'

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

interface ProcessingLog {
  step: number
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface PurchaseDetails {
  purchase: Purchase & { processingStep?: number }
  processingLogs: ProcessingLog[]
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

  // Details dialog
  const [detailsPurchase, setDetailsPurchase] = React.useState<Purchase | null>(null)
  const [detailsData, setDetailsData] = React.useState<PurchaseDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = React.useState(false)

  // Block dialog
  const [blockPurchase, setBlockPurchase] = React.useState<Purchase | null>(null)
  const [blockReason, setBlockReason] = React.useState<string>('')
  const [blockLoading, setBlockLoading] = React.useState(false)

  // Simple action menu state
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu on click outside
  React.useEffect(() => {
    if (!openMenuId) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId])

  const handleMenuOpen = (purchaseId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPosition({ top: rect.bottom + 4, left: rect.right - 200 })
    setOpenMenuId(openMenuId === purchaseId ? null : purchaseId)
  }

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

  // Handler para abrir detalhes
  const handleOpenDetails = async (purchase: Purchase) => {
    setDetailsPurchase(purchase)
    setDetailsLoading(true)
    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}/details`)
      if (res.ok) {
        const data = await res.json()
        setDetailsData(data)
      }
    } finally {
      setDetailsLoading(false)
    }
  }

  // Polling para atualizar em tempo real
  React.useEffect(() => {
    if (!detailsPurchase || detailsPurchase.status !== 'PROCESSING') return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/admin/purchases/${detailsPurchase.id}/details`)
      if (res.ok) {
        const data = await res.json()
        setDetailsData(data)
        // Se completou, parar polling
        if (data.purchase.status === 'COMPLETED' || data.purchase.status === 'FAILED') {
          setDetailsPurchase(prev => prev ? { ...prev, status: data.purchase.status } : null)
          fetchData() // Atualizar lista
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [detailsPurchase?.id, detailsPurchase?.status, fetchData])

  const handleBlock = async () => {
    if (!blockPurchase || !blockReason) return

    try {
      setBlockLoading(true)
      const res = await fetch('/api/admin/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term: blockPurchase.term.replace(/\D/g, ''), // Remove máscara se houver
          reason: blockReason,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Erro ao bloquear documento')
        return
      }

      setBlockPurchase(null)
      setBlockReason('')
      alert('Documento bloqueado com sucesso')
    } catch (err) {
      console.error('Error blocking document:', err)
      alert('Erro ao bloquear documento')
    } finally {
      setBlockLoading(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 'var(--primitive-space-8)' }}>
        <h1
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: 'var(--primitive-size-display-sm)',
            fontWeight: 'var(--primitive-weight-bold)',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Compras
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: 'var(--primitive-size-sm)',
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--primitive-space-1)',
          }}
        >
          Gerenciamento de compras
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 'var(--primitive-space-4)' }}>
        <CardContent style={{ paddingTop: 'var(--primitive-space-4)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--primitive-space-2)', alignItems: 'center' }}>
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--primitive-space-10)' }}>
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : data?.purchases.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: 'var(--primitive-space-10)' }}>
              Nenhuma compra encontrada
            </p>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Codigo</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Documento</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'right', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Valor</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Criado</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'left', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Pago</th>
                    <th style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'right', fontSize: 'var(--primitive-size-caption)', fontWeight: 600 }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.purchases.map((purchase) => (
                    <tr key={purchase.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-label)', fontFamily: 'var(--font-family-body)' }}>{purchase.code}</td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-label)' }}>
                        <span style={{ fontFamily: 'var(--font-family-body)' }}>{purchase.term}</span>
                        <Badge variant="outline" style={{ marginLeft: 'var(--primitive-space-2)' }}>{purchase.type}</Badge>
                      </td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-label)' }}>{purchase.email}</td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)' }}><StatusBadge status={purchase.status} /></td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-label)', textAlign: 'right' }}>{formatCurrency(purchase.amount)}</td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-caption)' }}>{formatDate(purchase.createdAt)}</td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', fontSize: 'var(--primitive-size-caption)' }}>{formatDate(purchase.paidAt)}</td>
                      <td style={{ padding: 'var(--primitive-space-3) var(--primitive-space-2)', textAlign: 'right' }}>
                        <Button variant="ghost" size="sm" onClick={(e) => handleMenuOpen(purchase.id, e)}>
                          <MoreVertical size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Action Menu - Fixed position */}
          {openMenuId && (() => {
            const purchase = data?.purchases.find(p => p.id === openMenuId)
            if (!purchase) return null
            return (
              <div
                ref={menuRef}
                style={{
                  position: 'fixed',
                  top: menuPosition.top,
                  left: menuPosition.left,
                  zIndex: 50,
                  minWidth: '200px',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: 'var(--primitive-radius-md)',
                  boxShadow: 'var(--shadow-medium)',
                  padding: 'var(--primitive-space-1) 0',
                }}
              >
                <button
                  onClick={() => { handleOpenDetails(purchase); setOpenMenuId(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                    width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                    textAlign: 'left', color: 'var(--color-text-primary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Eye size={14} /> Ver detalhes
                </button>

                {purchase.status === 'PENDING' && (
                  <button
                    onClick={() => { setMarkPaidPurchase(purchase); setOpenMenuId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                      width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                      textAlign: 'left', color: 'var(--color-text-primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <CheckCircle2 size={14} /> Marcar como pago
                  </button>
                )}

                {purchase.status === 'PAID' && !purchase.hasReport && (
                  <button
                    onClick={() => { setProcessPurchase(purchase); setOpenMenuId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                      width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                      textAlign: 'left', color: 'var(--color-text-primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Play size={14} /> Processar
                  </button>
                )}

                {purchase.hasReport && (
                  <button
                    onClick={() => { window.open(`/relatorio/${purchase.reportId}`, '_blank'); setOpenMenuId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                      width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                      textAlign: 'left', color: 'var(--color-text-primary)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileText size={14} /> Ver relatório
                  </button>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--color-border-subtle)', margin: 'var(--primitive-space-1) 0' }} />

                <button
                  onClick={() => { setBlockPurchase(purchase); setBlockReason(''); setOpenMenuId(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                    width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                    textAlign: 'left', color: 'var(--color-text-primary)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Ban size={14} /> Bloquear documento
                </button>

                {['PAID', 'PROCESSING', 'COMPLETED'].includes(purchase.status) && (
                  <button
                    onClick={() => { setRefundPurchase(purchase); setOpenMenuId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)',
                      width: '100%', padding: 'var(--primitive-space-2) var(--primitive-space-3)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--primitive-size-sm)',
                      textAlign: 'left', color: 'var(--color-status-error)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Undo2 size={14} /> Reembolsar
                  </button>
                )}
              </div>
            )
          })()}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--primitive-space-2)', marginTop: 'var(--primitive-space-4)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--primitive-size-label)' }}>
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

      {/* Details Dialog */}
      <Dialog open={!!detailsPurchase} onOpenChange={() => { setDetailsPurchase(null); setDetailsData(null); }}>
        <DialogContent style={{ maxWidth: 'var(--layout-max-width-narrow)' }}>
          <DialogHeader>
            <DialogTitle>Detalhes da Compra {detailsPurchase?.code}</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--primitive-space-10)' }}>
              <RefreshCw className="animate-spin" size={24} />
            </div>
          ) : detailsData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primitive-space-4)' }}>
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--primitive-space-3)' }}>
                <div>
                  <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)' }}>Documento</p>
                  <p style={{ fontSize: 'var(--primitive-size-sm)' }}>{detailsData.purchase.term} ({detailsData.purchase.type})</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)' }}>Status</p>
                  <StatusBadge status={detailsData.purchase.status} />
                </div>
                <div>
                  <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)' }}>Email</p>
                  <p style={{ fontSize: 'var(--primitive-size-sm)' }}>{detailsData.purchase.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)' }}>Valor</p>
                  <p style={{ fontSize: 'var(--primitive-size-sm)' }}>{formatCurrency(detailsData.purchase.amount)}</p>
                </div>
              </div>

              {/* Processing Progress */}
              {['PROCESSING', 'PAID'].includes(detailsData.purchase.status) && (
                <div style={{ marginTop: 'var(--primitive-space-2)' }}>
                  <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--primitive-space-2)' }}>
                    Progresso do Processamento
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--primitive-space-2)' }}>
                    {detailsData.processingLogs.map((log) => (
                      <div key={log.step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--primitive-space-2)' }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: 'var(--primitive-radius-full)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: log.status === 'completed' ? 'var(--color-status-success)'
                                         : log.status === 'in_progress' ? 'var(--color-status-warning)'
                                         : 'var(--color-border-subtle)',
                          color: log.status !== 'pending' ? 'white' : 'var(--color-text-tertiary)',
                          fontSize: 'var(--primitive-size-micro)',
                        }}>
                          {log.status === 'completed' ? '✓' : log.status === 'in_progress' ? '...' : log.step}
                        </div>
                        <span style={{
                          fontSize: 'var(--primitive-size-label)',
                          color: log.status === 'pending' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                        }}>
                          {log.label}
                        </span>
                        {log.status === 'in_progress' && (
                          <RefreshCw className="animate-spin" size={12} style={{ marginLeft: 'auto' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ marginTop: 'var(--primitive-space-2)', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 'var(--primitive-space-3)' }}>
                <p style={{ fontSize: 'var(--primitive-size-caption)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--primitive-space-2)' }}>Timeline</p>
                <div style={{ fontSize: 'var(--primitive-size-caption)', display: 'flex', flexDirection: 'column', gap: 'var(--primitive-space-1)' }}>
                  <p>Criado: {formatDate(detailsData.purchase.createdAt)}</p>
                  {detailsData.purchase.paidAt && <p>Pago: {formatDate(detailsData.purchase.paidAt)}</p>}
                  {detailsData.purchase.status === 'COMPLETED' && <p>Concluído: Relatório gerado</p>}
                  {detailsData.purchase.status === 'FAILED' && <p style={{ color: 'var(--color-status-error)' }}>Falhou</p>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={!!blockPurchase} onOpenChange={() => { setBlockPurchase(null); setBlockReason(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Documento</DialogTitle>
            <DialogDescription>
              Bloquear {blockPurchase?.type} {blockPurchase?.term}?
              <br />
              Este documento não poderá mais ser consultado na plataforma.
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: 'var(--primitive-space-4)' }}>
            <label style={{ fontSize: 'var(--primitive-size-sm)', fontWeight: 500, display: 'block', marginBottom: 'var(--primitive-space-2)' }}>
              Motivo do bloqueio
            </label>
            <Select value={blockReason} onValueChange={setBlockReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITACAO_TITULAR">Solicitação do titular</SelectItem>
                <SelectItem value="JUDICIAL">Ordem judicial</SelectItem>
                <SelectItem value="HOMONIMO">Homônimo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter style={{ marginTop: 'var(--primitive-space-4)' }}>
            <Button variant="outline" onClick={() => { setBlockPurchase(null); setBlockReason(''); }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blockLoading || !blockReason}>
              {blockLoading ? 'Bloqueando...' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
