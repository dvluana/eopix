"use client";

interface LimitedDataWarningProps {
  message?: string;
}

export default function LimitedDataWarning({
  message,
}: LimitedDataWarningProps) {
  return (
    <div className="rel__limited-warning">
      <span className="rel__limited-warning-icon" aria-hidden="true">
        &#9888;&#65039;
      </span>
      <div>
        <span className="rel__limited-warning-title">Dados Limitados</span>
        <span className="rel__limited-warning-text">
          {message ||
            "Algumas informacoes podem estar incompletas ou indisponiveis para esta consulta."}
        </span>
      </div>
    </div>
  );
}
