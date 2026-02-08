"use client"

interface ActivityIndicatorProps {
  recentInquiries: number;
}

export default function ActivityIndicator({ recentInquiries }: ActivityIndicatorProps) {
  if (recentInquiries <= 0) return null;

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-accent-light)',
        border: '1px solid var(--color-border-accent)',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '24px' }}>📊</span>
      <span
        style={{
          fontFamily: 'var(--font-family-body)',
          fontSize: '14px',
          color: 'var(--color-text-primary)',
        }}
      >
        <strong>{recentInquiries}</strong> empresa{recentInquiries > 1 ? 's' : ''} consulta{recentInquiries > 1 ? 'ram' : 'ou'} este CPF recentemente
      </span>
    </div>
  );
}
