"use client"

import { useState, useId, useEffect } from 'react'

interface CollapsibleCardProps {
  icon: string
  title: string
  count?: number
  summary?: string
  variant?: 'default' | 'warning' | 'danger'
  defaultExpanded?: boolean
  children: React.ReactNode
}

export default function CollapsibleCard({
  icon,
  title,
  count,
  summary,
  variant = 'default',
  defaultExpanded = false,
  children,
}: CollapsibleCardProps) {
  // On mobile (< 768px), always start collapsed regardless of defaultExpanded
  const [isExpanded, setIsExpanded] = useState(false)
  const contentId = useId()

  // Set initial expanded state based on screen size (only on client)
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    setIsExpanded(isMobile ? false : defaultExpanded)
  }, [defaultExpanded])

  const variantStyles = {
    default: {
      headerBg: 'var(--color-bg-secondary)',
      headerColor: 'var(--color-text-primary)',
      borderColor: 'var(--color-border-subtle)',
    },
    warning: {
      headerBg: 'var(--color-status-warning-bg)',
      headerColor: 'var(--color-status-warning)',
      borderColor: 'var(--color-status-warning)',
    },
    danger: {
      headerBg: 'var(--color-status-error-bg)',
      headerColor: 'var(--color-status-error)',
      borderColor: 'var(--color-status-error)',
    },
  }

  const styles = variantStyles[variant]

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-primary)',
        border: `1px solid ${styles.borderColor}`,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Header - Clickable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: styles.headerBg,
          padding: '12px 20px',
          border: 'none',
          borderBottom: isExpanded ? '1px solid var(--color-border-subtle)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: '14px',
              fontWeight: 700,
              color: styles.headerColor,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{icon}</span>
            {title}
            {count !== undefined && (
              <span style={{ fontWeight: 400 }}>
                — {count} encontrado{count !== 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: styles.headerColor,
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </div>
        {summary && (
          <p
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              margin: '4px 0 0 0',
              paddingLeft: '24px',
            }}
          >
            ↳ {summary}
          </p>
        )}
      </button>

      {/* Content - Collapsible */}
      <div
        id={contentId}
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        {children}
      </div>
    </div>
  )
}
