"use client"

interface ReportErrorProps {
  onRelatarErro: () => void;
}

export default function ReportError({ onRelatarErro }: ReportErrorProps) {
  return (
    <div
      style={{
        marginTop: '24px',
        textAlign: 'right',
      }}
    >
      <button
        type="button"
        onClick={onRelatarErro}
        style={{
          background: 'none',
          border: 'none',
          fontFamily: 'var(--font-family-body)',
          fontSize: '11px',
          color: '#888888',
          textDecoration: 'underline',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        Relatar erro
      </button>
    </div>
  );
}
