"use client"

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
  return (
    <div className="rel__analysis">
      <div className="rel__analysis-header">
        <span>&#129504;</span>
        <span className="rel__analysis-title">Analise de Processos (IA)</span>
      </div>
      {analyses.map((analysis) => (
        <div key={analysis.numeroProcesso} className="rel__analysis-item">
          <div className="rel__analysis-item-header">
            <p className="rel__analysis-item-title">
              {analysis.tituloSimplificado}
            </p>
            <span
              className={`rel__analysis-relevance${analysis.relevanciaNegocios === 'alta' ? ' rel__analysis-relevance--alta' : ''}`}
              style={{ color: analysis.relevanciaNegocios !== 'alta' ? 'var(--color-text-secondary)' : undefined }}
            >
              {formatRelevancia(analysis.relevanciaNegocios)}
            </span>
          </div>

          <p className="rel__analysis-desc">
            {analysis.descricaoBreve}
          </p>

          <p className="rel__analysis-meta">
            Proc. {analysis.numeroProcesso} | {analysis.tribunal} | {analysis.status === 'em_andamento' ? 'Em andamento' : 'Arquivado'}
          </p>
        </div>
      ))}
    </div>
  )
}
