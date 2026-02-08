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
        background: '#66CC66',
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
        background: '#FFD600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>!</span>
    </div>
  );
}

export default function ChecklistCard({ items, variant }: ChecklistCardProps) {
  if (variant === 'chuva') {
    return (
      <div
        style={{
          marginTop: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              background: 'var(--primitive-white)',
              border: '1px solid #E8E7E3',
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
                  color: '#1A1A1A',
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
                    color: '#666666',
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
      style={{
        marginTop: '32px',
        background: 'var(--primitive-white)',
        border: '1px solid #E8E7E3',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
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
            borderBottom: index < items.length - 1 ? '1px dashed #E8E7E3' : 'none',
          }}
        >
          {item.status === 'ok' ? <CheckmarkIcon /> : <WarningIcon />}
          <div>
            <div
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                color: '#1A1A1A',
              }}
            >
              <strong>{item.label}:</strong> {item.detail}
            </div>
            {item.note && (
              <div
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  color: '#888888',
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
