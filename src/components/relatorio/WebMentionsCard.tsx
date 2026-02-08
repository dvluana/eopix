"use client"

interface MentionItem {
  fonte: string;
  data: string;
  resumo: string;
  url?: string;
}

interface WebMentionsCardProps {
  mentions: MentionItem[];
}

export default function WebMentionsCard({ mentions }: WebMentionsCardProps) {
  if (mentions.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'var(--color-status-warning-bg)',
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-status-warning)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>📰</span>
          Menções na Web — {mentions.length} menç{mentions.length > 1 ? 'ões' : 'ão'} encontrada{mentions.length > 1 ? 's' : ''}
        </h3>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {mentions.map((mention, index) => (
          <div
            key={index}
            style={{
              paddingTop: index > 0 ? '16px' : 0,
              paddingBottom: '16px',
              borderBottom: index < mentions.length - 1 ? '1px dashed var(--color-border-subtle)' : 'none',
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
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '11px',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {mention.data}
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
                  color: 'var(--color-text-primary)',
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
