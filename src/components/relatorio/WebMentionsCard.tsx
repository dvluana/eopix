"use client"

import CollapsibleCard from './CollapsibleCard'
import { generateMentionsSummary } from '@/lib/report-utils'

interface MentionItem {
  fonte: string
  data: string
  resumo: string
  url?: string
  classification?: 'positive' | 'negative' | 'neutral'
}

interface WebMentionsCardProps {
  mentions: MentionItem[]
  variant?: 'sol' | 'chuva'
}

export default function WebMentionsCard({ mentions, variant = 'chuva' }: WebMentionsCardProps) {
  if (mentions.length === 0) return null

  const isSol = variant === 'sol'

  // For 'sol' variant, show positive/neutral mentions
  // For 'chuva' variant, show negative mentions (default behavior)
  const filteredMentions = isSol
    ? mentions.filter(m => m.classification !== 'negative')
    : mentions.filter(m => m.classification === 'negative' || m.classification === undefined)

  if (filteredMentions.length === 0) return null

  // Generate summary
  const summary = generateMentionsSummary(filteredMentions)

  // Expand by default if 3 or fewer items
  const defaultExpanded = filteredMentions.length <= 3

  const icon = isSol ? '✨' : '📰'
  const title = isSol ? 'Menções Positivas' : 'Notícias e Web'
  const cardVariant = isSol ? 'default' : 'danger'

  return (
    <CollapsibleCard
      icon={icon}
      title={title}
      count={filteredMentions.length}
      summary={summary}
      variant={cardVariant}
      defaultExpanded={defaultExpanded}
    >
      <div style={{ padding: '16px 20px' }}>
        {filteredMentions.map((mention, index) => (
          <div
            key={index}
            style={{
              paddingTop: index > 0 ? '16px' : 0,
              paddingBottom: '16px',
              borderBottom: index < filteredMentions.length - 1 ? '1px dashed var(--color-border-subtle)' : 'none',
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {mention.fonte}
                {mention.classification === 'negative' && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--color-status-error-bg)',
                      color: 'var(--color-status-error)',
                      fontWeight: 600,
                    }}
                  >
                    Negativa
                  </span>
                )}
                {mention.classification === 'positive' && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--color-status-success-bg)',
                      color: 'var(--color-status-success)',
                      fontWeight: 600,
                    }}
                  >
                    Positiva
                  </span>
                )}
                {mention.classification === 'neutral' && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-tertiary)',
                      fontWeight: 600,
                    }}
                  >
                    Neutra
                  </span>
                )}
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
                  color: isSol ? 'var(--color-status-success)' : 'var(--color-text-primary)',
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
    </CollapsibleCard>
  )
}
