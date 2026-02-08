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
  // Auto-determine variant based on nota if not provided
  const cardVariant = variant ?? (nota >= 7 ? 'positive' : 'negative');
  const isPositive = cardVariant === 'positive';

  const statusColor = isPositive ? 'var(--color-status-success)' : 'var(--color-status-error)';
  const statusBg = isPositive ? 'var(--color-status-success-bg)' : 'var(--color-status-error-bg)';

  // Determine reputation label
  const getReputationLabel = (score: number): string => {
    if (score >= 8) return 'Ótimo';
    if (score >= 7) return 'Bom';
    if (score >= 5) return 'Regular';
    if (score >= 3) return 'Ruim';
    return 'Não recomendada';
  };

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-primary)',
        border: `1px solid ${isPositive ? 'var(--color-border-subtle)' : 'var(--color-status-error)'}`,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: statusBg,
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: statusColor,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{isPositive ? '⭐' : '⚠️'}</span>
          Reclame Aqui
        </h3>
        {seloRA1000 && (
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#FFD700',
              background: 'rgba(255, 215, 0, 0.15)',
              padding: '4px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🏆 RA1000
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Main Score */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: statusBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '24px',
                fontWeight: 700,
                color: statusColor,
                lineHeight: 1,
              }}
            >
              {nota.toFixed(1)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              /10
            </span>
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-family-heading)',
                fontSize: '16px',
                fontWeight: 700,
                color: statusColor,
                display: 'block',
              }}
            >
              {getReputationLabel(nota)}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              Reputação no Reclame Aqui
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            padding: '16px',
            background: 'var(--color-bg-secondary)',
            borderRadius: '6px',
          }}
        >
          {/* Índice de Resolução */}
          <div>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Índice de Resolução
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '18px',
                fontWeight: 700,
                color: indiceResolucao >= 70 ? 'var(--color-status-success)' : 'var(--color-status-error)',
              }}
            >
              {indiceResolucao.toFixed(1)}%
            </span>
          </div>

          {/* Total de Reclamações */}
          {totalReclamacoes !== undefined && (
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Total de Reclamações
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {totalReclamacoes.toLocaleString('pt-BR')}
              </span>
            </div>
          )}

          {/* Respondidas */}
          {respondidas !== undefined && (
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Respondidas
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {respondidas.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Link to Reclame Aqui */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: '16px',
            textAlign: 'center',
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            color: 'var(--color-text-primary)',
            textDecoration: 'underline',
          }}
        >
          Ver página no Reclame Aqui →
        </a>
      </div>
    </div>
  );
}
