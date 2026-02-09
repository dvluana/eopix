"use client"

interface ChecklistItem {
  label: string;
  detail?: string;
  status: 'ok' | 'warning';
  note?: string;
}

interface ChecklistCardProps {
  items: ChecklistItem[];
  variant: 'sol' | 'chuva';
}

function CheckmarkIcon() {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'var(--color-checklist-success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width="14"
        height="11"
        viewBox="0 0 14 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1 5.5L5 9.5L13 1.5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function WarningIcon() {
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        background: 'var(--primitive-yellow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primitive-black)' }}>!</span>
    </div>
  );
}

export default function ChecklistCard({ items, variant }: ChecklistCardProps) {
  if (variant === 'chuva') {
    return (
      <div
        className="checklist-grid report-section"
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              background: 'var(--primitive-white)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '6px',
              padding: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {item.status === 'ok' ? <CheckmarkIcon /> : <WarningIcon />}
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '14px',
                  color: 'var(--color-text-primary)',
                  fontWeight: 600,
                }}
              >
                {item.label}
              </div>
              {item.detail && (
                <div
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    marginTop: '4px',
                  }}
                >
                  {item.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="report-section"
      style={{
        background: 'var(--primitive-white)',
        border: '1px solid var(--color-border-default)',
        borderRadius: '6px',
        boxShadow: 'var(--shadow-card)',
        padding: '32px',
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            paddingTop: '16px',
            paddingBottom: '16px',
            borderBottom: index < items.length - 1 ? '1px dashed var(--color-border-default)' : 'none',
          }}
        >
          {item.status === 'ok' ? <CheckmarkIcon /> : <WarningIcon />}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: 'var(--color-text-primary)',
              }}
            >
              <strong>{item.label}:</strong> {item.detail}
            </div>
            {item.note && (
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  color: 'var(--color-text-tertiary)',
                  marginTop: '4px',
                }}
              >
                {item.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
