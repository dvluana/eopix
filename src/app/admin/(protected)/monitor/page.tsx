'use client'

import React from 'react'
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Zap,
  Radio,
  ArrowRight,
} from 'lucide-react'
import EopixLoader from '@/components/EopixLoader'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminError } from '../../_components/AdminError'
import { formatDate } from '../../_components/admin-utils'
import { PROCESSING_STEPS } from '@/types/domain'

// -- Types --

interface MonitorPurchase {
  id: string
  code: string
  term: string
  termFormatted: string
  type: 'CPF' | 'CNPJ'
  status: string
  processingStep: number
  buyerName: string | null
  failureReason: string | null
  failureDetails: string | null
  createdAt: string
  updatedAt: string
  paidAt: string | null
}

interface MonitorData {
  active: MonitorPurchase[]
  queued: MonitorPurchase[]
  failed: MonitorPurchase[]
  completed: MonitorPurchase[]
  timestamp: string
}

// -- Subcomponents --

function StepProgress({ step }: { step: number }) {
  const totalSteps = PROCESSING_STEPS.length

  return (
    <div className="mon-pipeline">
      <div className="mon-pipeline__track">
        {PROCESSING_STEPS.map((s, i) => {
          const isDone = step > s.step
          const isCurrent = step === s.step

          return (
            <React.Fragment key={s.step}>
              {/* Connector line before (except first) */}
              {i > 0 && (
                <div className={`mon-pipeline__connector ${isDone ? 'mon-pipeline__connector--done' : ''}`} />
              )}
              {/* Step node */}
              <div
                className={`mon-pipeline__node ${isDone ? 'mon-pipeline__node--done' : ''} ${isCurrent ? 'mon-pipeline__node--active' : ''}`}
                title={s.label}
              >
                {isDone ? (
                  <CheckCircle size={12} />
                ) : isCurrent ? (
                  <EopixLoader size="sm" />
                ) : (
                  <span>{s.step}</span>
                )}
              </div>
            </React.Fragment>
          )
        })}
      </div>
      <div className="mon-pipeline__label">
        etapa {Math.min(step, totalSteps)}/{totalSteps}
        {step > 0 && step <= totalSteps && (
          <> — {PROCESSING_STEPS[step - 1]?.label}</>
        )}
      </div>
    </div>
  )
}

function TimeSince({ date }: { date: string }) {
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return <span>{seconds}<small>s</small></span>
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return <span>{minutes}<small>m</small> {seconds % 60}<small>s</small></span>
  const hours = Math.floor(minutes / 60)
  return <span>{hours}<small>h</small> {minutes % 60}<small>m</small></span>
}

function FailureDetails({ purchase }: { purchase: MonitorPurchase }) {
  const [open, setOpen] = React.useState(false)

  let parsedDetails: Record<string, unknown> | null = null
  if (purchase.failureDetails) {
    try {
      parsedDetails = JSON.parse(purchase.failureDetails)
    } catch {
      // raw string fallback
    }
  }

  return (
    <div className="mon-failure">
      <div className="mon-failure__row">
        <div className="mon-failure__left">
          <code className="mon-code">{purchase.code}</code>
          <span className={`mon-doc-badge mon-doc-badge--${purchase.type.toLowerCase()}`}>{purchase.type}</span>
          <span className="mon-term">{purchase.termFormatted}</span>
        </div>
        <div className="mon-failure__right">
          <span className="mon-reason">{purchase.failureReason || 'UNKNOWN'}</span>
          <span className="mon-time">
            <TimeSince date={purchase.updatedAt} />
          </span>
          {purchase.failureDetails && (
            <button
              className="mon-expand"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Recolher' : 'Expandir'}
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {open && purchase.failureDetails && (
        <pre className="mon-failure__details">
          {parsedDetails
            ? JSON.stringify(parsedDetails, null, 2)
            : purchase.failureDetails}
        </pre>
      )}
    </div>
  )
}

// -- Main Component --

export default function MonitorPage() {
  const [data, setData] = React.useState<MonitorData | null>(null)
  const [connected, setConnected] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  const connect = React.useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource('/api/admin/monitor/stream')
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      setError(null)
    }

    es.onmessage = (event) => {
      try {
        const parsed: MonitorData = JSON.parse(event.data)
        setData(parsed)
        setConnected(true)
        setError(null)
      } catch {
        // heartbeat or malformed — ignore
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      setTimeout(connect, 5000)
    }
  }, [])

  React.useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
    }
  }, [connect])

  if (error && !data) {
    return <AdminError message={error} onRetry={connect} />
  }

  return (
    <div className="mon">
      <AdminPageHeader
        title="Pipeline Monitor"
        subtitle="Processamento Inngest em tempo real"
      >
        <div className="mon-status">
          <span className={`mon-status__badge ${connected ? 'mon-status__badge--live' : 'mon-status__badge--off'}`}>
            <span className="mon-status__dot" />
            {connected ? 'LIVE' : 'RECONNECTING'}
          </span>
          {data && (
            <span className="mon-status__ts">{formatDate(data.timestamp)}</span>
          )}
        </div>
      </AdminPageHeader>

      {/* Stat strip */}
      <div className="mon-stats">
        <div className="mon-stats__item mon-stats__item--processing">
          <div className="mon-stats__icon">
            <Zap size={16} />
          </div>
          <div className="mon-stats__data">
            <span className="mon-stats__num">{data?.active.length ?? 0}</span>
            <span className="mon-stats__label">Processando</span>
          </div>
        </div>
        <div className="mon-stats__item mon-stats__item--queued">
          <div className="mon-stats__icon">
            <Clock size={16} />
          </div>
          <div className="mon-stats__data">
            <span className="mon-stats__num">{data?.queued.length ?? 0}</span>
            <span className="mon-stats__label">Na fila</span>
          </div>
        </div>
        <div className="mon-stats__item mon-stats__item--failed">
          <div className="mon-stats__icon">
            <XCircle size={16} />
          </div>
          <div className="mon-stats__data">
            <span className="mon-stats__num">{data?.failed.length ?? 0}</span>
            <span className="mon-stats__label">Falhas 24h</span>
          </div>
        </div>
        <div className="mon-stats__item mon-stats__item--completed">
          <div className="mon-stats__icon">
            <CheckCircle size={16} />
          </div>
          <div className="mon-stats__data">
            <span className="mon-stats__num">{data?.completed.length ?? 0}</span>
            <span className="mon-stats__label">OK 1h</span>
          </div>
        </div>
      </div>

      {/* Active processing */}
      <section className="mon-section">
        <div className="mon-section__header">
          <h2 className="mon-section__title">
            <Radio size={16} className={data?.active.length ? 'mon-pulse-icon' : ''} />
            Processando Agora
          </h2>
          {data && data.active.length > 0 && (
            <span className="mon-section__count">{data.active.length}</span>
          )}
        </div>

        {!data || data.active.length === 0 ? (
          <div className="mon-empty">
            <span className="mon-empty__icon">—</span>
            <p>Nenhum relatorio sendo processado</p>
          </div>
        ) : (
          <div className="mon-active-list">
            {data.active.map((p) => (
              <div key={p.id} className="mon-active">
                <div className="mon-active__header">
                  <div className="mon-active__info">
                    <code className="mon-code">{p.code}</code>
                    <span className={`mon-doc-badge mon-doc-badge--${p.type.toLowerCase()}`}>{p.type}</span>
                    <span className="mon-term">{p.termFormatted}</span>
                    {p.buyerName && <span className="mon-name">{p.buyerName}</span>}
                  </div>
                  <div className="mon-active__timer">
                    <Clock size={12} />
                    <TimeSince date={p.paidAt || p.createdAt} />
                  </div>
                </div>
                <StepProgress step={p.processingStep} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Queue */}
      {data && data.queued.length > 0 && (
        <section className="mon-section">
          <div className="mon-section__header">
            <h2 className="mon-section__title">
              <Clock size={16} />
              Fila
            </h2>
            <span className="mon-section__count">{data.queued.length}</span>
          </div>

          <div className="mon-queue">
            {data.queued.map((p) => (
              <div key={p.id} className="mon-queue__item">
                <code className="mon-code">{p.code}</code>
                <span className={`mon-doc-badge mon-doc-badge--${p.type.toLowerCase()}`}>{p.type}</span>
                <span className="mon-term">{p.termFormatted}</span>
                <ArrowRight size={12} className="mon-queue__arrow" />
                <span className="adm-badge adm-badge--paid">PAID</span>
                <span className="mon-time mon-queue__wait">
                  <TimeSince date={p.paidAt || p.createdAt} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Failures */}
      <section className="mon-section">
        <div className="mon-section__header">
          <h2 className="mon-section__title">
            <AlertCircle size={16} />
            Falhas 24h
          </h2>
          {data && data.failed.length > 0 && (
            <span className="mon-section__count mon-section__count--danger">{data.failed.length}</span>
          )}
        </div>

        {!data || data.failed.length === 0 ? (
          <div className="mon-empty mon-empty--ok">
            <CheckCircle size={20} />
            <p>Nenhuma falha nas ultimas 24 horas</p>
          </div>
        ) : (
          <div className="mon-failure-list">
            {data.failed.map((p) => (
              <FailureDetails key={p.id} purchase={p} />
            ))}
          </div>
        )}
      </section>

      {/* Completions */}
      <section className="mon-section">
        <div className="mon-section__header">
          <h2 className="mon-section__title">
            <CheckCircle size={16} />
            Concluidos 1h
          </h2>
          {data && data.completed.length > 0 && (
            <span className="mon-section__count mon-section__count--success">{data.completed.length}</span>
          )}
        </div>

        {!data || data.completed.length === 0 ? (
          <div className="mon-empty">
            <span className="mon-empty__icon">—</span>
            <p>Nenhuma conclusao na ultima hora</p>
          </div>
        ) : (
          <div className="mon-completed">
            {data.completed.map((p) => (
              <div key={p.id} className="mon-completed__item">
                <code className="mon-code">{p.code}</code>
                <span className={`mon-doc-badge mon-doc-badge--${p.type.toLowerCase()}`}>{p.type}</span>
                <span className="mon-term">{p.termFormatted}</span>
                <CheckCircle size={14} className="mon-completed__check" />
                <span className="mon-time">{formatDate(p.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
