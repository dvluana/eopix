'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Clock, FileText, Loader2, RotateCcw, XCircle } from 'lucide-react'
import EopixLoader from '@/components/EopixLoader'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate } from './admin-utils'

interface Purchase {
  id: string
  code: string
  term: string
  type: string
  status: string
  processingStep?: number
  amount: number
  email: string
  buyerName?: string | null
  hasReport?: boolean
  reportId?: string | null
  failureReason: string | null
  failureDetails: string | null
  refundReason: string | null
  refundDetails: string | null
  createdAt: string
  paidAt: string | null
  updatedAt?: string
}

interface ProcessingLog {
  step: number
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface PurchaseDetails {
  purchase: Purchase
  processingLogs: ProcessingLog[]
}

const STUCK_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

function getFailureMessage(reason: string | null): string {
  const messages: Record<string, string> = {
    PAYMENT_RISK: 'Reprovado por analise de risco',
    PROCESSING_ERROR: 'Erro durante processamento',
    PROCESSING_TIMEOUT: 'Processamento excedeu 4 horas',
    PAYMENT_EXPIRED: 'Pagamento nao confirmado em 30min',
  }
  return reason ? (messages[reason] || reason) : 'Motivo nao registrado'
}

function getRefundMessage(reason: string | null): string {
  const messages: Record<string, string> = {
    MANUAL_ADMIN: 'Reembolso manual (admin)',
  }
  return reason ? (messages[reason] || reason) : 'Motivo nao registrado'
}

function ElapsedTimer({ since }: { since: string }) {
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.floor((Date.now() - new Date(since).getTime()) / 1000)
  if (seconds < 0) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const h = Math.floor(m / 60)

  let text: string
  if (h > 0) text = `${h}h ${m % 60}m ${s}s`
  else if (m > 0) text = `${m}m ${s}s`
  else text = `${s}s`

  return (
    <span className="adm-elapsed">
      <Clock size={12} />
      {text}
    </span>
  )
}

interface TimelineEvent {
  key: string
  label: string
  timestamp: string | null
  status: 'done' | 'active' | 'pending' | 'error'
  detail?: string
  detailExpanded?: string
}

function buildTimeline(purchase: Purchase, processingLogs: ProcessingLog[]): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // 1. Compra criada (always)
  events.push({
    key: 'pending',
    label: 'Compra criada',
    timestamp: purchase.createdAt,
    status: 'done',
  })

  // 2. Pagamento confirmado
  if (purchase.paidAt) {
    events.push({
      key: 'paid',
      label: 'Pagamento confirmado',
      timestamp: purchase.paidAt,
      status: 'done',
    })
  }

  // 3. Pipeline steps (if relevant status)
  const pipelineStatuses = ['PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
  if (pipelineStatuses.includes(purchase.status) && processingLogs.length > 0) {
    for (const log of processingLogs) {
      let stepStatus: TimelineEvent['status']

      if (purchase.status === 'COMPLETED') {
        stepStatus = 'done'
      } else if (purchase.status === 'FAILED' && log.step === purchase.processingStep && log.status !== 'completed') {
        stepStatus = 'error'
      } else if (log.status === 'completed') {
        stepStatus = 'done'
      } else if (log.status === 'in_progress') {
        stepStatus = 'active'
      } else {
        stepStatus = 'pending'
      }

      events.push({
        key: `step-${log.step}`,
        label: log.label,
        timestamp: null,
        status: stepStatus,
      })
    }
  }

  // 4. Terminal events
  if (purchase.status === 'COMPLETED') {
    events.push({
      key: 'completed',
      label: 'Relatorio gerado',
      timestamp: purchase.updatedAt ?? null,
      status: 'done',
    })
  } else if (purchase.status === 'FAILED') {
    events.push({
      key: 'failed',
      label: getFailureMessage(purchase.failureReason),
      timestamp: purchase.updatedAt ?? null,
      status: 'error',
      detail: purchase.failureReason !== purchase.failureDetails ? (purchase.failureDetails ?? undefined) : undefined,
      detailExpanded: purchase.failureDetails ?? undefined,
    })
  } else if (purchase.status === 'REFUNDED') {
    events.push({
      key: 'refunded',
      label: 'Reembolso processado',
      timestamp: purchase.updatedAt ?? null,
      status: 'done',
      detail: getRefundMessage(purchase.refundReason),
    })
  }

  return events
}

// Timeline circle styles
const circleBase: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const circleStyles: Record<TimelineEvent['status'], React.CSSProperties> = {
  done: { ...circleBase, background: 'var(--primitive-green-500, #22c55e)', color: 'white' },
  active: { ...circleBase, background: 'var(--primitive-yellow-400, #facc15)', color: 'black' },
  pending: { ...circleBase, background: 'var(--primitive-gray-200, #e5e7eb)', color: '#6b7280' },
  error: { ...circleBase, background: 'var(--primitive-red-500, #ef4444)', color: 'white' },
}

function TimelineCircle({ status }: { status: TimelineEvent['status'] }) {
  const style = circleStyles[status]
  if (status === 'done') return <div style={style} className="adm-tl__circle adm-tl__circle--done"><CheckCircle size={14} /></div>
  if (status === 'active') return <div style={style} className="adm-tl__circle adm-tl__circle--active"><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /></div>
  if (status === 'error') return <div style={style} className="adm-tl__circle adm-tl__circle--error"><XCircle size={14} /></div>
  return <div style={style} className="adm-tl__circle adm-tl__circle--pending"><span style={{ fontSize: 10, fontWeight: 600 }}>•</span></div>
}

interface PurchaseDetailsDialogProps {
  purchase: Purchase | null
  onClose: () => void
  onListRefresh: () => void
}

export function PurchaseDetailsDialog({ purchase, onClose, onListRefresh }: PurchaseDetailsDialogProps) {
  const [data, setData] = React.useState<PurchaseDetails | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [retrying, setRetrying] = React.useState(false)
  const [retryMessage, setRetryMessage] = React.useState<string | null>(null)

  // Fetch details when purchase changes
  React.useEffect(() => {
    if (!purchase) { setData(null); return }
    setLoading(true)
    setRetryMessage(null)
    fetch(`/api/admin/purchases/${purchase.id}/details`)
      .then((res) => res.ok ? res.json() : null)
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [purchase?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling for PROCESSING/PAID status
  React.useEffect(() => {
    if (!purchase || !['PROCESSING', 'PAID'].includes(purchase.status)) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/purchases/${purchase.id}/details`)
        if (res.ok) {
          const d = await res.json()
          setData(d)
          if (d.purchase.status === 'COMPLETED' || d.purchase.status === 'FAILED') {
            onListRefresh()
          }
        }
      } catch {
        // ignore fetch errors during polling
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [purchase?.id, purchase?.status, onListRefresh]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stuck detection
  const isStuck = React.useMemo(() => {
    if (!data) return false
    if (data.purchase.status !== 'PROCESSING') return false
    const ref = data.purchase.updatedAt || data.purchase.paidAt
    if (!ref) return false
    return Date.now() - new Date(ref).getTime() > STUCK_THRESHOLD_MS
  }, [data])

  const handleRetry = async () => {
    if (!purchase) return
    setRetrying(true)
    setRetryMessage(null)
    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}/process`, { method: 'POST' })
      if (res.ok) {
        setRetryMessage('Reprocessamento iniciado')
        onListRefresh()
      } else {
        const err = await res.json()
        setRetryMessage(err.error || 'Erro ao reprocessar')
      }
    } catch {
      setRetryMessage('Erro de conexao')
    } finally {
      setRetrying(false)
    }
  }

  const timeline = data ? buildTimeline(data.purchase, data.processingLogs) : []
  const isProcessingOrFailed = data && ['PROCESSING', 'FAILED'].includes(data.purchase.status)

  return (
    <Dialog open={!!purchase} onOpenChange={() => onClose()}>
      <DialogContent style={{ maxWidth: '560px' }}>
        <DialogHeader>
          <DialogTitle>Detalhes da Compra {purchase?.code}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="adm-loading"><EopixLoader size="md" /></div>
        ) : data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Info Header */}
            <div className="adm-detail-grid">
              <div>
                <p className="adm-detail-label">Documento</p>
                <p className="adm-detail-value">{data.purchase.term} ({data.purchase.type})</p>
              </div>
              <div>
                <p className="adm-detail-label">Status</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusBadge status={data.purchase.status} />
                  {data.purchase.status === 'PROCESSING' && data.purchase.paidAt && (
                    <ElapsedTimer since={data.purchase.paidAt} />
                  )}
                </div>
              </div>
              {data.purchase.buyerName && (
                <div>
                  <p className="adm-detail-label">Comprador</p>
                  <p className="adm-detail-value">{data.purchase.buyerName}</p>
                </div>
              )}
              <div>
                <p className="adm-detail-label">Email</p>
                <p className="adm-detail-value">{data.purchase.email}</p>
              </div>
              <div>
                <p className="adm-detail-label">Valor</p>
                <p className="adm-detail-value">{formatCurrency(data.purchase.amount)}</p>
              </div>
              {data.purchase.hasReport && data.purchase.reportId && (
                <div>
                  <p className="adm-detail-label">Relatorio</p>
                  <a
                    href={`/relatorio/${data.purchase.reportId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--primitive-blue-600, #2563eb)', textDecoration: 'underline' }}
                  >
                    <FileText size={13} />
                    Ver relatorio
                  </a>
                </div>
              )}
            </div>

            {/* Stuck Warning */}
            {isStuck && (
              <div className="adm-stuck-banner">
                <AlertTriangle size={18} />
                <div className="adm-stuck-banner__content">
                  <p className="adm-stuck-banner__title">Possivelmente travado</p>
                  <p className="adm-stuck-banner__desc">
                    Processamento parado ha mais de 5 minutos no step {data.purchase.processingStep || '?'}.
                    O Inngest pode ter falhado silenciosamente.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="adm-stuck-banner__btn"
                >
                  <RotateCcw size={14} />
                  {retrying ? 'Reenviando...' : 'Reprocessar'}
                </Button>
              </div>
            )}

            {/* Unified Timeline */}
            <div className="adm-tl" style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
              {timeline.map((event, idx) => (
                <div key={event.key} className="adm-tl__event" style={{ display: 'flex', gap: '12px', paddingTop: '8px', paddingBottom: '8px', position: 'relative' }}>
                  {/* Vertical connector line */}
                  {idx < timeline.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: 11,
                      top: 32,
                      bottom: 0,
                      width: 2,
                      background: 'var(--primitive-gray-200, #e5e7eb)',
                    }} />
                  )}
                  <TimelineCircle status={event.status} />
                  <div className="adm-tl__content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span className="adm-tl__label" style={{ fontWeight: 500, fontSize: '14px' }}>
                      {event.label}
                      {event.key === 'paid' && data.purchase.status === 'PROCESSING' && data.purchase.paidAt && (
                        <span style={{ marginLeft: '8px' }}><ElapsedTimer since={data.purchase.paidAt} /></span>
                      )}
                    </span>
                    {event.timestamp && (
                      <span className="adm-tl__time" style={{ fontSize: '12px', color: '#6b7280' }}>
                        {formatDate(event.timestamp)}
                      </span>
                    )}
                    {event.detail && (
                      <span className="adm-tl__detail" style={{ fontSize: '13px', marginTop: '4px', color: event.status === 'error' ? 'var(--primitive-red-600, #dc2626)' : '#374151' }}>
                        {event.detail}
                      </span>
                    )}
                    {event.detailExpanded && (
                      <details style={{ marginTop: '4px' }}>
                        <summary style={{ fontSize: '12px', cursor: 'pointer', color: '#6b7280' }}>Ver detalhes tecnicos</summary>
                        <pre style={{ fontSize: '11px', background: '#1f2937', color: '#f9fafb', padding: '8px', borderRadius: '4px', overflow: 'auto', marginTop: '4px' }}>
                          {(() => { try { return JSON.stringify(JSON.parse(event.detailExpanded), null, 2) } catch { return event.detailExpanded } })()}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Retry button for FAILED or stuck PROCESSING (not in stuck banner) */}
            {isProcessingOrFailed && !isStuck && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  size="sm"
                  variant={data.purchase.status === 'FAILED' ? 'outline' : 'ghost'}
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  <RotateCcw size={14} style={{ marginRight: '4px' }} />
                  {retrying ? 'Reenviando...' : data.purchase.status === 'FAILED' ? 'Tentar reprocessar' : 'Forcar reprocessamento'}
                </Button>
                {retryMessage && <span className="adm-retry-message">{retryMessage}</span>}
              </div>
            )}

            {retryMessage && (isStuck || !isProcessingOrFailed) && (
              <p className="adm-retry-message">{retryMessage}</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
