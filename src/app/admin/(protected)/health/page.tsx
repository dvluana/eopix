'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
} from 'lucide-react'
import EopixLoader from '@/components/EopixLoader'
import { AdminPageHeader } from '../../_components/AdminPageHeader'
import { AdminError } from '../../_components/AdminError'
import { formatDate } from '../../_components/admin-utils'

interface HealthService {
  service: string
  status: 'up' | 'down' | 'degraded'
  latency?: number
  message?: string
  balance?: {
    current: number | string
    unit: string
    low?: boolean
  }
}

interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded'
  mode: 'mock' | 'test' | 'live'
  timestamp: string
  services: HealthService[]
}

interface Incident {
  id: string
  service: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  message: string
  startedAt: string
  resolvedAt?: string
}

interface IncidentsData {
  incidents: Incident[]
  summary: {
    totalIncidents: number
    openIncidents: number
    uptime: string
    period: string
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'up':
    case 'healthy':
      return <CheckCircle size={20} style={{ color: '#22c55e' }} />
    case 'down':
    case 'unhealthy':
      return <XCircle size={20} style={{ color: '#ef4444' }} />
    case 'degraded':
      return <AlertCircle size={20} style={{ color: '#f59e0b' }} />
    default:
      return <Activity size={20} style={{ color: 'var(--color-text-tertiary)' }} />
  }
}

const incidentStatusLabels: Record<string, string> = {
  investigating: 'Investigando',
  identified: 'Identificado',
  monitoring: 'Monitorando',
  resolved: 'Resolvido',
}

const incidentStatusBadge: Record<string, string> = {
  investigating: 'adm-badge adm-badge--failed',
  identified: 'adm-badge adm-badge--pending',
  monitoring: 'adm-badge adm-badge--pending',
  resolved: 'adm-badge adm-badge--completed',
}

export default function HealthPage() {
  const [health, setHealth] = React.useState<HealthData | null>(null)
  const [incidents, setIncidents] = React.useState<IncidentsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)

      const [healthRes, incidentsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/admin/health/incidents'),
      ])

      if (healthRes.ok) {
        setHealth(await healthRes.json())
      }

      if (incidentsRes.ok) {
        setIncidents(await incidentsRes.json())
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados')
      console.error('Error fetching health data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="adm-loading" style={{ height: '400px' }}>
        <EopixLoader size="lg" text="Verificando serviços" />
      </div>
    )
  }

  if (error) {
    return <AdminError message={error} onRetry={fetchData} />
  }

  return (
    <div>
      <AdminPageHeader title="Health Status" subtitle="Monitoramento dos servicos">
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Atualizar
        </Button>
      </AdminPageHeader>

      {/* Banner de Mock Mode */}
      {health?.mode === 'mock' && (
        <div className="adm-banner--mock">
          <AlertCircle size={20} style={{ color: 'var(--color-text-accent)' }} />
          <div>
            <p className="adm-banner--mock__title">Modo de Teste Ativo</p>
            <p className="adm-banner--mock__desc">
              Os dados exibidos sao simulados. Ative MOCK_MODE=false para dados reais.
            </p>
          </div>
        </div>
      )}

      {/* Overall Status */}
      <div className="adm-card" style={{ marginBottom: '24px' }}>
        <div className="adm-card__body" style={{ padding: '24px 20px' }}>
          <div className="adm-overall-status">
            <StatusIcon status={health?.status || 'unknown'} />
            <div>
              <p className="adm-overall-status__label">
                Sistema {health?.status === 'healthy' ? 'Operacional' : health?.status === 'degraded' ? 'Degradado' : 'Indisponível'}
              </p>
              <p className="adm-overall-status__meta">
                Modo: {health?.mode || 'unknown'} | Última verificação: {health?.timestamp ? formatDate(health.timestamp) : '-'}
              </p>
            </div>

            {incidents?.summary && (
              <div className="adm-overall-status__uptime">
                <p className="adm-overall-status__uptime-value">{incidents.summary.uptime}%</p>
                <p className="adm-overall-status__uptime-label">Uptime ({incidents.summary.period})</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="adm-health-grid">
        {/* Services */}
        <div className="adm-card">
          <div className="adm-card__header"><p className="adm-card__title">Servicos</p></div>
          <div className="adm-card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {health?.services.map((service) => (
                <div key={service.service} className="adm-service-row">
                  <div className="adm-service-status">
                    <StatusIcon status={service.status} />
                    <span className="adm-service-status__name">{service.service}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="adm-service-status__label">
                      {service.status === 'up' ? 'Operacional' : service.status === 'degraded' ? 'Degradado' : 'Indisponível'}
                    </p>
                    {service.latency && (
                      <p className="adm-service-status__latency">{service.latency}ms</p>
                    )}
                    {service.balance && (
                      <div className="adm-service-status__balance">
                        {service.balance.low && <AlertCircle size={12} style={{ color: '#ef4444' }} />}
                        <span className={service.balance.low ? 'adm-balance--low' : 'adm-balance--ok'}>
                          {typeof service.balance.current === 'number'
                            ? `${service.balance.unit === 'BRL' ? 'R$ ' : ''}${service.balance.current.toLocaleString('pt-BR')}${service.balance.unit !== 'BRL' ? ` ${service.balance.unit}` : ''}`
                            : `${service.balance.current} ${service.balance.unit}`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div className="adm-card">
          <div className="adm-card__header"><p className="adm-card__title">Incidentes Recentes</p></div>
          <div className="adm-card__body">
            {incidents?.incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '16px' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum incidente recente</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incidents?.incidents.map((incident) => (
                  <div key={incident.id} className="adm-incident">
                    <div className="adm-incident__header">
                      <span className="adm-incident__service">{incident.service}</span>
                      <span className={incidentStatusBadge[incident.status] || 'adm-badge adm-badge--pending'}>
                        {incidentStatusLabels[incident.status] || incident.status}
                      </span>
                    </div>
                    <p className="adm-incident__message">{incident.message}</p>
                    <p className="adm-incident__time">
                      Inicio: {formatDate(incident.startedAt)}
                      {incident.resolvedAt && ` | Fim: ${formatDate(incident.resolvedAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
