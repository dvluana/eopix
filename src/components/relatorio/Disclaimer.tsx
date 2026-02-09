"use client"

export default function Disclaimer() {
  return (
    <p
      className="report-section--disclaimer"
      style={{
        fontFamily: 'var(--font-family-body)',
        fontSize: '11px',
        color: 'var(--color-text-tertiary)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}
    >
      Ícones representam volume de registros públicos, não avaliação de
      risco de crédito. A interpretação é exclusivamente sua.
    </p>
  );
}
