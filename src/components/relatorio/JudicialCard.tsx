"use client"

import CollapsibleCard from './CollapsibleCard'
import { generateProcessSummary } from '@/lib/report-utils'

interface ProcessoItem {
  tribunal: string
  data: string
  classe: string
  polo: 'autor' | 'reu' | 'testemunha'
}

interface JudicialCardProps {
  processos: ProcessoItem[]
}

export default function JudicialCard({ processos }: JudicialCardProps) {
  if (processos.length === 0) return null

  const summary = generateProcessSummary(
    processos.map((p) => ({
      tribunal: p.tribunal,
      date: p.data,
      classe: p.classe,
      polo: p.polo,
    }))
  )

  // Expand by default if 3 or fewer items
  const defaultExpanded = processos.length <= 3

  return (
    <CollapsibleCard
      icon="⚖️"
      title="Processos Judiciais"
      count={processos.length}
      summary={summary}
      variant="danger"
      defaultExpanded={defaultExpanded}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr
            style={{
              background: 'var(--color-bg-secondary)',
            }}
          >
            <th
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                textAlign: 'left',
                padding: '10px 20px',
              }}
            >
              Tribunal
            </th>
            <th
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                textAlign: 'left',
                padding: '10px 20px',
              }}
            >
              Data
            </th>
            <th
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                textAlign: 'left',
                padding: '10px 20px',
              }}
            >
              Classe
            </th>
            <th
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                textAlign: 'left',
                padding: '10px 20px',
              }}
            >
              Polo
            </th>
          </tr>
        </thead>
        <tbody>
          {processos.map((processo, index) => (
            <tr
              key={index}
              style={{
                borderTop: '1px solid var(--color-border-subtle)',
              }}
            >
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                  padding: '12px 20px',
                }}
              >
                {processo.tribunal}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  padding: '12px 20px',
                }}
              >
                {processo.data}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  padding: '12px 20px',
                }}
              >
                {processo.classe}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color:
                    processo.polo === 'reu'
                      ? 'var(--color-status-error)'
                      : 'var(--color-text-secondary)',
                  fontWeight: processo.polo === 'reu' ? 600 : 400,
                  padding: '12px 20px',
                  textTransform: 'capitalize',
                }}
              >
                {processo.polo === 'reu' ? 'Réu' : processo.polo === 'autor' ? 'Autor' : 'Testemunha'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </CollapsibleCard>
  )
}
