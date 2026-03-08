"use client"

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

  const filteredMentions = isSol
    ? mentions.filter(m => m.classification !== 'negative')
    : mentions.filter(m => m.classification === 'negative' || m.classification === undefined)

  if (filteredMentions.length === 0) return null

  return (
    <div className="rel__mention-content">
      {filteredMentions.map((mention, index) => (
        <div key={index} className="rel__mention">
          <div className="rel__mention-header">
            <span className="rel__mention-source">
              {mention.fonte}
              {mention.classification === 'negative' && (
                <span className="rel__mention-tag rel__mention-tag--negative">Negativa</span>
              )}
              {mention.classification === 'positive' && (
                <span className="rel__mention-tag rel__mention-tag--positive">Positiva</span>
              )}
              {mention.classification === 'neutral' && (
                <span className="rel__mention-tag rel__mention-tag--neutral">Neutra</span>
              )}
            </span>
            <span className="rel__mention-date">{mention.data}</span>
          </div>
          <p className="rel__mention-text">{mention.resumo}</p>
          {mention.url && (
            <a
              href={mention.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rel__mention-link ${isSol ? 'rel__mention-link--positive' : 'rel__mention-link--negative'}`}
            >
              Ver fonte &rarr;
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
