"use client"

import CollapsibleCard from './CollapsibleCard'
import type { ProcessAnalysis } from '@/types/report'

interface ProcessAnalysisCardProps {
  analyses: ProcessAnalysis[]
}

function formatRelevancia(value: ProcessAnalysis['relevanciaNegocios']): string {
  switch (value) {
    case 'alta':
      return 'Alta'
    case 'media':
      return 'Media'
    case 'baixa':
      return 'Baixa'
    default:
      return 'Nenhuma'
  }
}

export default function ProcessAnalysisCard({ analyses }: ProcessAnalysisCardProps) {
  if (analyses.length === 0) return null

  const highRiskCount = analyses.filter((a) => a.relevanciaNegocios === 'alta').length
  const summary = highRiskCount > 0
    ? `${highRiskCount} processo(s) com relevancia alta para negocios`
    : 'Sem processos de alta relevancia para negocios'

  return (
    <CollapsibleCard
      icon="🧠"
      title="Analise de Processos (IA)"
      count={analyses.length}
      summary={summary}
      variant={highRiskCount > 0 ? 'danger' : 'default'}
      defaultExpanded={analyses.length <= 3}
    >
      <div style={{ padding: '16px 20px' }}>
        {analyses.map((analysis) => (
          <div
            key={analysis.numeroProcesso}
            style={{
              padding: '12px 0',
              borderBottom: '1px dashed var(--color-border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '6px',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {analysis.tituloSimplificado}
              </p>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: analysis.relevanciaNegocios === 'alta' ? 'var(--color-status-error)' : 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                }}
              >
                {formatRelevancia(analysis.relevanciaNegocios)}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-text-secondary)',
              }}
            >
              {analysis.descricaoBreve}
            </p>

            <p
              style={{
                margin: '8px 0 0 0',
                fontFamily: 'var(--font-family-body)',
                fontSize: '11px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Proc. {analysis.numeroProcesso} | {analysis.tribunal} | {analysis.status === 'em_andamento' ? 'Em andamento' : 'Arquivado'}
            </p>
          </div>
        ))}
      </div>
    </CollapsibleCard>
  )
}
