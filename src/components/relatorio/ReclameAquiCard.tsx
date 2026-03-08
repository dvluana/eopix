"use client"

interface ReclameAquiCardProps {
  nota: number;
  indiceResolucao: number;
  totalReclamacoes?: number;
  respondidas?: number;
  seloRA1000?: boolean;
  url: string;
  variant?: 'positive' | 'negative';
}

export default function ReclameAquiCard({
  nota,
  indiceResolucao,
  totalReclamacoes,
  respondidas,
  seloRA1000,
  url,
  variant,
}: ReclameAquiCardProps) {
  const cardVariant = variant ?? (nota >= 7 ? 'positive' : 'negative');
  const isPositive = cardVariant === 'positive';

  const statusColor = isPositive ? 'var(--color-status-success)' : 'var(--color-status-error)';
  const statusBg = isPositive ? 'var(--color-status-success-bg)' : 'var(--color-status-error-bg)';
  const resolucaoColor = indiceResolucao >= 70 ? 'var(--color-status-success)' : 'var(--color-status-error)';

  const getReputationLabel = (score: number): string => {
    if (score >= 8) return 'Otimo';
    if (score >= 7) return 'Bom';
    if (score >= 5) return 'Regular';
    if (score >= 3) return 'Ruim';
    return 'Nao recomendada';
  };

  return (
    <div className={`rel__ra ${isPositive ? 'rel__ra--positive' : 'rel__ra--negative'}`}>
      {/* Header */}
      <div className="rel__ra-header" style={{ background: statusBg }}>
        <h3 className="rel__ra-title" style={{ color: statusColor }}>
          <span>{isPositive ? '\u2B50' : '\u26A0\uFE0F'}</span>
          Reclame Aqui
        </h3>
        {seloRA1000 && (
          <span className="rel__ra-selo">
            \uD83C\uDFC6 RA1000
          </span>
        )}
      </div>

      {/* Content */}
      <div className="rel__ra-content">
        {/* Main Score */}
        <div className="rel__ra-score">
          <div className="rel__ra-score-circle" style={{ background: statusBg }}>
            <span className="rel__ra-score-number" style={{ color: statusColor }}>
              {nota.toFixed(1)}
            </span>
            <span className="rel__ra-score-max">/10</span>
          </div>
          <div>
            <span className="rel__ra-reputation" style={{ color: statusColor }}>
              {getReputationLabel(nota)}
            </span>
            <span className="rel__ra-reputation-sub">
              Reputacao no Reclame Aqui
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="rel__ra-stats">
          <div>
            <span className="rel__label">Indice de Resolucao</span>
            <span className="rel__value--lg" style={{ color: resolucaoColor }}>
              {indiceResolucao.toFixed(1)}%
            </span>
          </div>

          {totalReclamacoes !== undefined && (
            <div>
              <span className="rel__label">Total de Reclamacoes</span>
              <span className="rel__value--lg">
                {totalReclamacoes.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {respondidas !== undefined && (
            <div>
              <span className="rel__label">Respondidas</span>
              <span className="rel__value--lg">
                {respondidas.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rel__ra-link"
        >
          Ver pagina no Reclame Aqui &rarr;
        </a>
      </div>
    </div>
  );
}
