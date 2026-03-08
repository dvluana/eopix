'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Clock, RotateCcw } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, formatDate } from './admin-utils'

interface Purchase {
  id: string
  code: string
  term: string
  type: string
  status: string
  amount: number
  email: string
  failureReason: string | null
  failureDetails: string | null
  refundReason: string | null
  refundDetails: string | null
  createdAt: string
  paidAt: string | null
}

interface ProcessingLog {
  step: number
  label: string
  status: 'pending' | 'in_progress' | 'completed'
}

interface PurchaseDetails {
  purchase: Purchase & { processingStep?: number; updatedAt?: string }
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

  return (
    <Dialog open={!!purchase} onOpenChange={() => onClose()}>
      <DialogContent style={{ maxWidth: '560px' }}>
        <DialogHeader>
          <DialogTitle>Detalhes da Compra {purchase?.code}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="adm-loading"><RefreshCw className="animate-spin" size={24} /></div>
        ) : data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

            {retryMessage && (
              <p className="adm-retry-message">{retryMessage}</p>
            )}

            {/* Info Grid */}
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
              <div>
                <p className="adm-detail-label">Email</p>
                <p className="adm-detail-value">{data.purchase.email}</p>
              </div>
              <div>
                <p className="adm-detail-label">Valor</p>
                <p className="adm-detail-value">{formatCurrency(data.purchase.amount)}</p>
              </div>
            </div>

            {/* Processing Progress */}
            {['PROCESSING', 'PAID'].includes(data.purchase.status) && (
              <div>
                <div className="adm-progress__header">
                  <p className="adm-progress__title">Progresso do Processamento</p>
                  {data.purchase.status === 'PROCESSING' && data.purchase.paidAt && (
                    <ElapsedTimer since={data.purchase.paidAt} />
                  )}
                </div>
                <div className="adm-progress">
                  {data.processingLogs.map((log) => (
                    <div key={log.step} className="adm-progress-step">
                      <div className={`adm-progress-circle adm-progress-circle--${log.status}`}>
                        {log.status === 'completed' ? '\u2713' : log.status === 'in_progress' ? '...' : log.step}
                      </div>
                      <span className={`adm-progress-step__label${log.status === 'pending' ? ' adm-progress-step__label--pending' : ''}`}>
                        {log.label}
                      </span>
                      {log.status === 'in_progress' && (
                        <RefreshCw className="animate-spin" size={12} style={{ marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Retry button when PROCESSING (not in stuck banner) */}
                {data.purchase.status === 'PROCESSING' && !isStuck && (
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRetry}
                      disabled={retrying}
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px' }} />
                      {retrying ? 'Reenviando...' : 'Forcar reprocessamento'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Failure/Refund Reason */}
            {['FAILED', 'REFUNDED', 'REFUND_FAILED'].includes(data.purchase.status) && (
              <div className="adm-alert-box">
                <p className="adm-alert-box__title">
                  {data.purchase.status === 'FAILED' && 'Motivo da Falha'}
                  {data.purchase.status === 'REFUNDED' && 'Motivo do Reembolso'}
                  {data.purchase.status === 'REFUND_FAILED' && 'Falha no Reembolso'}
                </p>

                {data.purchase.failureReason && (
                  <p className="adm-alert-box__text">{getFailureMessage(data.purchase.failureReason)}</p>
                )}

                {data.purchase.refundReason && (
                  <p className="adm-alert-box__text">{getRefundMessage(data.purchase.refundReason)}</p>
                )}

                {data.purchase.failureDetails && (
                  <details className="adm-alert-box__details">
                    <summary>Ver detalhes tecnicos</summary>
                    <pre>
                      {(() => { try { return JSON.stringify(JSON.parse(data.purchase.failureDetails), null, 2) } catch { return data.purchase.failureDetails } })()}
                    </pre>
                  </details>
                )}

                {data.purchase.refundDetails && (
                  <details className="adm-alert-box__details">
                    <summary>Ver detalhes do reembolso</summary>
                    <pre>
                      {(() => { try { return JSON.stringify(JSON.parse(data.purchase.refundDetails), null, 2) } catch { return data.purchase.refundDetails } })()}
                    </pre>
                  </details>
                )}

                {/* Retry button for FAILED purchases */}
                {data.purchase.status === 'FAILED' && (
                  <div style={{ marginTop: '12px' }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetry}
                      disabled={retrying}
                    >
                      <RotateCcw size={14} style={{ marginRight: '4px' }} />
                      {retrying ? 'Reenviando...' : 'Tentar reprocessar'}
                    </Button>
                    {retryMessage && <span className="adm-retry-message" style={{ marginLeft: '8px' }}>{retryMessage}</span>}
                  </div>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="adm-timeline">
              <p className="adm-timeline__title">Timeline</p>
              <div className="adm-timeline__items">
                <p>Criado: {formatDate(data.purchase.createdAt)}</p>
                {data.purchase.paidAt && <p>Pago: {formatDate(data.purchase.paidAt)}</p>}
                {data.purchase.status === 'COMPLETED' && <p>Concluido: Relatorio gerado</p>}
                {data.purchase.status === 'FAILED' && <p style={{ color: 'var(--primitive-red-500)' }}>Falhou</p>}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
