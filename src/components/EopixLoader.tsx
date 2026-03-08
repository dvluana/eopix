'use client'

type LoaderSize = 'sm' | 'md' | 'lg'

interface EopixLoaderProps {
  size?: LoaderSize
  text?: string
  className?: string
}

const LINES: Record<LoaderSize, string[]> = {
  sm: ['75%', '50%', '65%'],
  md: ['80%', '50%', '70%', '60%'],
  lg: ['85%', '55%', '75%', '45%', '65%'],
}

const DELAYS: Record<LoaderSize, number> = {
  sm: 0.2,
  md: 0.15,
  lg: 0.12,
}

export default function EopixLoader({ size = 'md', text, className = '' }: EopixLoaderProps) {
  const delay = DELAYS[size]

  return (
    <div className={`epl ${className}`} role="status" aria-label={text || 'Carregando'}>
      <div className={`epl__doc epl__doc--${size}`} aria-hidden="true">
        <div className="epl__scan" />
        {LINES[size].map((width, i) => (
          <div
            key={i}
            className="epl__line"
            style={{ width, animationDelay: `${i * delay}s` }}
          />
        ))}
      </div>
      {text && (
        <p className="epl__text">
          {text}<span className="epl__cursor">_</span>
        </p>
      )}
    </div>
  )
}
