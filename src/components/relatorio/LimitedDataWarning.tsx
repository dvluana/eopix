"use client"

interface LimitedDataWarningProps {
  message?: string;
}

export default function LimitedDataWarning({ message }: LimitedDataWarningProps) {
  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-status-warning-bg)',
        border: '1px solid var(--color-status-warning)',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '20px', lineHeight: 1 }}>⚠️</span>
      <div>
        <span
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-status-warning)',
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Dados Limitados
        </span>
        <span
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
          }}
        >
          {message || 'Algumas informações podem estar incompletas ou indisponíveis para esta consulta.'}
        </span>
      </div>
    </div>
  );
}
