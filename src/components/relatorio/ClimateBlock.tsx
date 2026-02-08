"use client"

interface ClimateBlockProps {
  weatherStatus: 'sol' | 'chuva';
  message?: string;
}

export default function ClimateBlock({ weatherStatus, message }: ClimateBlockProps) {
  const config = {
    sol: {
      icon: '☀️',
      bg: 'var(--color-bg-accent-light)',
      border: 'var(--color-border-accent)',
      defaultMessage: 'Céu limpo. Nenhuma ocorrência encontrada.',
    },
    chuva: {
      icon: '🌧️',
      bg: 'var(--color-bg-secondary)',
      border: 'var(--color-border-subtle)',
      defaultMessage: 'Encontramos alguns pontos de atenção.',
    },
  };

  const cfg = config[weatherStatus];

  return (
    <div
      style={{
        marginTop: '32px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: '6px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
      }}
    >
      <div style={{ fontSize: '48px', lineHeight: 1 }}>{cfg.icon}</div>
      <div
        style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
        }}
      >
        {message || cfg.defaultMessage}
      </div>
    </div>
  );
}
