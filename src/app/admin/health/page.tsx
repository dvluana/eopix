'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
} from 'lucide-react'

interface HealthService {
  service: string
  status: 'up' | 'down' | 'degraded'
  latency?: number
  message?: string
}

interface HealthData {
  status: 'healthy' | 'unhealthy' | 'degraded'
  mode: 'mock' | 'live'
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    investigating: { variant: 'destructive', label: 'Investigando' },
    identified: { variant: 'secondary', label: 'Identificado' },
    monitoring: { variant: 'secondary', label: 'Monitorando' },
    resolved: { variant: 'default', label: 'Resolvido' },
  }

  const { variant, label } = config[status] || { variant: 'outline' as const, label: status }
  return <Badge variant={variant}>{label}</Badge>
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

export default function HealthPage() {
  const [health, setHealth] = React.useState<HealthData | null>(null)
  const [incidents, setIncidents] = React.useState<IncidentsData | null>(null)
  const [loading, setLoading] = React.useState(true)

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
    } catch (err) {
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    )
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
            Health Status
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: '4px',
            }}
          >
            Monitoramento dos servicos
          </p>
        </div>

        <Button variant="outline" onClick={fetchData}>
          <RefreshCw size={16} style={{ marginRight: '8px' }} />
          Atualizar
        </Button>
      </div>

      {/* Overall Status */}
      <Card style={{ marginBottom: '24px' }}>
        <CardContent style={{ paddingTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <StatusIcon status={health?.status || 'unknown'} />
            <div>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  textTransform: 'capitalize',
                }}
              >
                Sistema {health?.status === 'healthy' ? 'Operacional' : health?.status === 'degraded' ? 'Degradado' : 'Indisponivel'}
              </p>
              <p style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                Modo: {health?.mode || 'unknown'} | Ultima verificacao: {health?.timestamp ? formatDate(health.timestamp) : '-'}
              </p>
            </div>

            {incidents?.summary && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{incidents.summary.uptime}%</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: 0 }}>Uptime ({incidents.summary.period})</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Servicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {health?.services.map((service) => (
                <div
                  key={service.service}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <StatusIcon status={service.status} />
                    <span style={{ fontSize: '14px', fontWeight: 500, textTransform: 'capitalize' }}>
                      {service.service}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      {service.status === 'up' ? 'Operacional' : service.status === 'degraded' ? 'Degradado' : 'Indisponivel'}
                    </p>
                    {service.latency && (
                      <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                        {service.latency}ms
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Incidentes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {incidents?.incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '16px' }} />
                <p style={{ color: 'var(--color-text-secondary)' }}>Nenhum incidente recente</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {incidents?.incidents.map((incident) => (
                  <div
                    key={incident.id}
                    style={{
                      padding: '12px',
                      background: 'var(--color-bg-secondary)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                        {incident.service}
                      </span>
                      <StatusBadge status={incident.status} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px 0' }}>
                      {incident.message}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', margin: 0 }}>
                      Inicio: {formatDate(incident.startedAt)}
                      {incident.resolvedAt && ` | Fim: ${formatDate(incident.resolvedAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
