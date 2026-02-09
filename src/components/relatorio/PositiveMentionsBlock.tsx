"use client"

interface MentionItem {
  fonte: string;
  resumo: string;
  url?: string;
}

interface PositiveMentionsBlockProps {
  mentions: MentionItem[];
}

export default function PositiveMentionsBlock({ mentions }: PositiveMentionsBlockProps) {
  if (mentions.length === 0) return null;

  return (
    <div
      className="report-section--secondary"
      style={{
        background: 'var(--color-status-success-bg)',
        border: '1px solid var(--color-status-success)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-checklist-divider)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-status-success)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✨</span>
          Menções Positivas — {mentions.length} menç{mentions.length > 1 ? 'ões' : 'ão'} encontrada{mentions.length > 1 ? 's' : ''}
        </h3>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px' }}>
        {mentions.map((mention, index) => (
          <div
            key={index}
            style={{
              paddingTop: index > 0 ? '12px' : 0,
              paddingBottom: '12px',
              borderBottom: index < mentions.length - 1 ? '1px dashed var(--color-checklist-divider-dashed)' : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {mention.fonte}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              {mention.resumo}
            </p>
            {mention.url && (
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '11px',
                  color: 'var(--color-status-success)',
                  textDecoration: 'underline',
                  marginTop: '6px',
                  display: 'inline-block',
                }}
              >
                Ver fonte →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
