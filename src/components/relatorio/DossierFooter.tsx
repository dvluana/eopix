"use client";

interface DossierFooterProps {
  createdAt: string;
  expiresAt: string;
  onBack: () => void;
  onReportError: () => void;
}

export default function DossierFooter({
  createdAt,
  expiresAt,
  onBack,
  onReportError,
}: DossierFooterProps) {
  return (
    <div className="rel__footer">
      <p className="rel__footer-dates">
        Relatorio gerado em {createdAt}. Dados expiram em {expiresAt}.
      </p>
      <div className="rel__footer-actions">
        <button
          className="rel__footer-error"
          onClick={onReportError}
          type="button"
        >
          Relatar erro
        </button>
        <button className="rel__footer-btn" onClick={onBack} type="button">
          Voltar para Minhas Consultas
        </button>
      </div>
    </div>
  );
}
