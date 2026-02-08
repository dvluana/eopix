"use client"

interface AiSummaryProps {
  summary: string;
}

export default function AiSummary({ summary }: AiSummaryProps) {
  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '4px',
        padding: '16px',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          background: 'var(--color-bg-accent)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-family-body)',
          fontSize: '9px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          padding: '3px 8px',
          borderRadius: '2px',
        }}
      >
        RESUMO IA
      </div>

      <p
        style={{
          marginTop: '8px',
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.6,
          margin: '8px 0 0 0',
        }}
      >
        {summary}
      </p>
    </div>
  );
}
