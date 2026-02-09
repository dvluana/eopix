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
      bg: 'rgba(102, 204, 102, 0.12)', // Verde suave - positivo
      border: 'rgba(102, 204, 102, 0.4)', // Verde com mais opacidade
      textColor: '#2D7A2D', // Verde escuro para contraste
      defaultMessage: 'Céu limpo. Nenhuma ocorrência encontrada.',
    },
    chuva: {
      icon: '🌧️',
      bg: 'rgba(204, 51, 51, 0.08)', // Vermelho suave - alerta
      border: 'rgba(204, 51, 51, 0.25)', // Vermelho com mais opacidade
      textColor: '#993333', // Vermelho escuro para contraste
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
          color: cfg.textColor,
        }}
      >
        {displayMessage}
      </div>
    </div>
  );
}
