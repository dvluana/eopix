'use client'

import React from 'react'
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
import { Search, Undo2, CheckCircle2, Play, MoreVertical, Eye, FileText, Ban } from 'lucide-react'
import { useToast } from '../../_components/Toast'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminFilterBar } from '../../_components/AdminFilterBar'
import { AdminDataTable, Column } from '../../_components/AdminDataTable'
import { AdminPagination } from '../../_components/AdminPagination'
import { PurchaseDetailsDialog } from '../../_components/PurchaseDetailsDialog'
import { StatusBadge } from '../../_components/StatusBadge'
import { formatCurrency, formatDate } from '../../_components/admin-utils'

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
  failureReason: string | null
  failureDetails: string | null
  refundReason: string | null
  refundDetails: string | null
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

const columns: Column[] = [
  { key: 'code', label: 'Código' },
  { key: 'term', label: 'Documento' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Valor', align: 'right' },
  { key: 'createdAt', label: 'Criado' },
  { key: 'paidAt', label: 'Pago' },
  { key: 'actions', label: 'Acoes', align: 'right' },
]

export default function ComprasPage() {
  const { toast } = useToast()
  const [data, setData] = React.useState<PurchasesData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)

  // Dialog states
  const [refundPurchase, setRefundPurchase] = React.useState<Purchase | null>(null)
  const [refundLoading, setRefundLoading] = React.useState(false)
  const [markPaidPurchase, setMarkPaidPurchase] = React.useState<Purchase | null>(null)
  const [markPaidLoading, setMarkPaidLoading] = React.useState(false)
  const [processPurchase, setProcessPurchase] = React.useState<Purchase | null>(null)
  const [processLoading, setProcessLoading] = React.useState(false)
  const [processNowPurchase, setProcessNowPurchase] = React.useState<Purchase | null>(null)
  const [processNowLoading, setProcessNowLoading] = React.useState(false)
  const [detailsPurchase, setDetailsPurchase] = React.useState<Purchase | null>(null)
  const [blockPurchase, setBlockPurchase] = React.useState<Purchase | null>(null)
  const [blockReason, setBlockReason] = React.useState<string>('')
  const [blockLoading, setBlockLoading] = React.useState(false)
  const [batchProcessing, setBatchProcessing] = React.useState(false)

  // Action menu
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null)
  const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0 })
  const menuRef = React.useRef<HTMLDivElement>(null)

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
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (searchQuery) params.set('search', searchQuery)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/admin/purchases?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar dados')
      setData(await res.json())
    } catch (err) {
      console.error('Error fetching purchases:', err)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, statusFilter])

  React.useEffect(() => { fetchData() }, [fetchData])

  const doAction = async (url: string, onSuccess: () => void, errorMsg: string) => {
    const res = await fetch(url, { method: 'POST' })
    if (!res.ok) {
      const error = await res.json()
      toast({ type: 'error', message: error.error || errorMsg })
      return
    }
    onSuccess()
    fetchData()
  }

  const handleRefund = async () => {
    if (!refundPurchase) return
    setRefundLoading(true)
    try { await doAction(`/api/admin/purchases/${refundPurchase.id}/refund`, () => setRefundPurchase(null), 'Erro ao processar reembolso') }
    catch { toast({ type: 'error', message: 'Erro ao processar reembolso' }) }
    finally { setRefundLoading(false) }
  }

  const handleMarkPaid = async () => {
    if (!markPaidPurchase) return
    setMarkPaidLoading(true)
    try { await doAction(`/api/admin/purchases/${markPaidPurchase.id}/mark-paid`, () => setMarkPaidPurchase(null), 'Erro ao marcar como pago') }
    catch { toast({ type: 'error', message: 'Erro ao marcar como pago' }) }
    finally { setMarkPaidLoading(false) }
  }

  const handleProcess = async () => {
    if (!processPurchase) return
    setProcessLoading(true)
    try { await doAction(`/api/admin/purchases/${processPurchase.id}/process`, () => setProcessPurchase(null), 'Erro ao processar') }
    catch { toast({ type: 'error', message: 'Erro ao processar' }) }
    finally { setProcessLoading(false) }
  }

  const handleProcessNow = async () => {
    if (!processNowPurchase) return
    setProcessNowLoading(true)
    try { await doAction(`/api/admin/purchases/${processNowPurchase.id}/mark-paid-and-process`, () => setProcessNowPurchase(null), 'Erro ao processar') }
    catch { toast({ type: 'error', message: 'Erro ao processar' }) }
    finally { setProcessNowLoading(false) }
  }

  const handleBlock = async () => {
    if (!blockPurchase || !blockReason) return
    setBlockLoading(true)
    try {
      const res = await fetch('/api/admin/blocklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: blockPurchase.term.replace(/\D/g, ''), reason: blockReason }),
      })
      if (!res.ok) {
        const error = await res.json()
        toast({ type: 'error', message: error.error || 'Erro ao bloquear documento' })
        return
      }
      setBlockPurchase(null)
      setBlockReason('')
      toast({ type: 'success', message: 'Documento bloqueado com sucesso' })
    } catch {
      toast({ type: 'error', message: 'Erro ao bloquear documento' })
    } finally {
      setBlockLoading(false)
    }
  }

  const handleBatchProcess = async () => {
    if (!confirm('Reprocessar todas as compras FAILED?')) return
    setBatchProcessing(true)
    try {
      const res = await fetch('/api/admin/purchases/batch-process', {
        method: 'POST',
        credentials: 'include',
      })
      const result = await res.json()
      if (res.ok) {
        toast({ type: 'success', message: `${result.processed}/${result.total} compras reprocessadas` })
        fetchData()
      } else {
        toast({ type: 'error', message: result.error || 'Erro ao reprocessar' })
      }
    } catch {
      toast({ type: 'error', message: 'Erro ao reprocessar' })
    } finally {
      setBatchProcessing(false)
    }
  }

  const renderCell = (purchase: Purchase, col: Column) => {
    switch (col.key) {
      case 'code': return purchase.code
      case 'term': return (
        <>
          {purchase.term}
          <Badge variant="outline" style={{ marginLeft: '8px' }}>{purchase.type}</Badge>
        </>
      )
      case 'email': return purchase.email
      case 'status': return <StatusBadge status={purchase.status} />
      case 'amount': return formatCurrency(purchase.amount)
      case 'createdAt': return formatDate(purchase.createdAt)
      case 'paidAt': return formatDate(purchase.paidAt)
      case 'actions': return (
        <Button variant="ghost" size="sm" onClick={(e) => handleMenuOpen(purchase.id, e)}>
          <MoreVertical size={16} />
        </Button>
      )
      default: return null
    }
  }

  return (
    <div>
      <AdminPageHeader title="Compras" subtitle="Gerenciamento de compras" />

      <AdminFilterBar onSubmit={() => { setPage(1); fetchData() }}>
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código, documento ou email..."
          style={{ flex: 1 }}
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger style={{ width: '180px' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="COMPLETED">Concluído</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="REFUNDED">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="secondary">
          <Search size={16} />
        </Button>
      </AdminFilterBar>

      <div className="adm-card">
        <div className="adm-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p className="adm-card__title">{data ? `${data.pagination.total} compras` : 'Carregando...'}</p>
          <Button variant="secondary" size="sm" onClick={handleBatchProcess} disabled={batchProcessing}>
            {batchProcessing ? 'Reprocessando...' : 'Reprocessar FAILED'}
          </Button>
        </div>
        <div className="adm-card__body">
          <AdminDataTable<Purchase>
            columns={columns}
            data={data?.purchases || []}
            renderCell={renderCell}
            loading={loading}
            emptyMessage="Nenhuma compra encontrada"
            mono
          />

          {/* Action Menu */}
          {openMenuId && (() => {
            const purchase = data?.purchases.find(p => p.id === openMenuId)
            if (!purchase) return null
            return (
              <div ref={menuRef} className="adm-menu" style={{ top: menuPosition.top, left: menuPosition.left }}>
                <button className="adm-menu__item" onClick={() => { setDetailsPurchase(purchase); setOpenMenuId(null) }}>
                  <Eye size={14} /> Ver detalhes
                </button>

                {purchase.status === 'PENDING' && (
                  <>
                    <button className="adm-menu__item" onClick={() => { setProcessNowPurchase(purchase); setOpenMenuId(null) }}>
                      <Play size={14} /> Processar Agora
                    </button>
                    <button className="adm-menu__item adm-menu__item--muted" onClick={() => { setMarkPaidPurchase(purchase); setOpenMenuId(null) }}>
                      <CheckCircle2 size={14} /> Marcar como pago
                    </button>
                  </>
                )}

                {(purchase.status === 'PAID' || purchase.status === 'FAILED') && !purchase.hasReport && (
                  <button className="adm-menu__item" onClick={() => { setProcessPurchase(purchase); setOpenMenuId(null) }}>
                    <Play size={14} /> {purchase.status === 'FAILED' ? 'Reprocessar' : 'Processar'}
                  </button>
                )}

                {purchase.hasReport && (
                  <button className="adm-menu__item" onClick={() => { window.open(`/relatorio/${purchase.reportId}`, '_blank'); setOpenMenuId(null) }}>
                    <FileText size={14} /> Ver relatório
                  </button>
                )}

                <div className="adm-menu__divider" />

                <button className="adm-menu__item" onClick={() => { setBlockPurchase(purchase); setBlockReason(''); setOpenMenuId(null) }}>
                  <Ban size={14} /> Bloquear documento
                </button>

                {['PAID', 'PROCESSING', 'COMPLETED'].includes(purchase.status) && (
                  <button className="adm-menu__item adm-menu__item--danger" onClick={() => { setRefundPurchase(purchase); setOpenMenuId(null) }}>
                    <Undo2 size={14} /> Reembolsar
                  </button>
                )}
              </div>
            )
          })()}

          {data && <AdminPagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
        </div>
      </div>

      {/* Details Dialog (extracted component) */}
      <PurchaseDetailsDialog
        purchase={detailsPurchase}
        onClose={() => setDetailsPurchase(null)}
        onListRefresh={fetchData}
      />

      {/* Refund Dialog */}
      <Dialog open={!!refundPurchase} onOpenChange={() => setRefundPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reembolso</DialogTitle>
            <DialogDescription>
              Compra {refundPurchase?.code} — {refundPurchase ? formatCurrency(refundPurchase.amount) : ''}
              <br /><br />
              Reembolsos devem ser feitos diretamente pelo dashboard do AbacatePay.
              Apos processar o reembolso la, atualize o status aqui.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundPurchase(null)}>Fechar</Button>
            <Button variant="destructive" onClick={handleRefund} disabled={refundLoading}>
              {refundLoading ? 'Processando...' : 'Marcar como Reembolsado'}
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
              <br />Isso vai liberar a geração do relatório.
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
              <br />Isso vai disparar a geração do relatório.
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

      {/* Process Now Dialog */}
      <Dialog open={!!processNowPurchase} onOpenChange={() => setProcessNowPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Agora</DialogTitle>
            <DialogDescription>
              Marcar compra {processNowPurchase?.code} como paga e iniciar processamento imediatamente?
              <br />Isso vai disparar a geração do relatório automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessNowPurchase(null)}>Cancelar</Button>
            <Button onClick={handleProcessNow} disabled={processNowLoading}>
              {processNowLoading ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={!!blockPurchase} onOpenChange={() => { setBlockPurchase(null); setBlockReason('') }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear Documento</DialogTitle>
            <DialogDescription>
              Bloquear {blockPurchase?.type} {blockPurchase?.term}?
              <br />Este documento não poderá mais ser consultado na plataforma.
            </DialogDescription>
          </DialogHeader>
          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Motivo do bloqueio</label>
            <Select value={blockReason} onValueChange={setBlockReason}>
              <SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SOLICITACAO_TITULAR">Solicitação do titular</SelectItem>
                <SelectItem value="JUDICIAL">Ordem judicial</SelectItem>
                <SelectItem value="HOMONIMO">Homônimo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter style={{ marginTop: '16px' }}>
            <Button variant="outline" onClick={() => { setBlockPurchase(null); setBlockReason('') }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blockLoading || !blockReason}>
              {blockLoading ? 'Bloqueando...' : 'Bloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
