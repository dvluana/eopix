"use client"

interface ClimateBlockProps {
  weatherStatus: 'sol' | 'chuva';
  message?: string;
  occurrenceCount?: number;
}

export default function ClimateBlock({ weatherStatus, message, occurrenceCount }: ClimateBlockProps) {
  const config = {
    sol: {
      icon: '☀️',
      bgVar: 'var(--color-climate-sol-bg)',
      borderVar: 'var(--color-climate-sol-border)',
      textVar: 'var(--color-climate-sol-text)',
      defaultMessage: 'Céu limpo. Nenhuma ocorrência encontrada.',
    },
    chuva: {
      icon: '🌧️',
      bgVar: 'var(--color-climate-chuva-bg)',
      borderVar: 'var(--color-climate-chuva-border)',
      textVar: 'var(--color-climate-chuva-text)',
      defaultMessage: 'Clima instável.',
    },
  };

  const cfg = config[weatherStatus];

  // Build message with occurrence count for chuva
  let displayMessage = message || cfg.defaultMessage;
  if (weatherStatus === 'chuva' && occurrenceCount !== undefined && occurrenceCount > 0) {
    displayMessage = `Clima instável. ${occurrenceCount} ocorrência${occurrenceCount > 1 ? 's' : ''} encontrada${occurrenceCount > 1 ? 's' : ''}.`;
  }

  return (
    <div
      className="report-section"
      style={{
        background: cfg.bgVar,
        border: `1px solid ${cfg.borderVar}`,
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
          color: cfg.textVar,
        }}
      >
        {displayMessage}
      </div>
    </div>
  );
}
