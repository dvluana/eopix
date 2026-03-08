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
    <div className="rel__positive-block">
      <div className="rel__positive-header">
        <h3 className="rel__positive-title">
          <span>&#10024;</span>
          Mencoes Positivas &mdash; {mentions.length} menc{mentions.length > 1 ? 'oes' : 'ao'} encontrada{mentions.length > 1 ? 's' : ''}
        </h3>
      </div>

      <div className="rel__positive-content">
        {mentions.map((mention, index) => (
          <div key={index} className="rel__mention">
            <div className="rel__mention-header">
              <span className="rel__mention-source">
                {mention.fonte}
              </span>
            </div>
            <p className="rel__mention-text">{mention.resumo}</p>
            {mention.url && (
              <a
                href={mention.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rel__mention-link rel__mention-link--positive"
              >
                Ver fonte &rarr;
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
