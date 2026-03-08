"use client";

interface WeatherVerdictProps {
  weatherStatus: "sol" | "chuva";
  totalOccurrences: number;
  closingMessage: string;
}

export default function WeatherVerdict({
  weatherStatus,
  totalOccurrences,
  closingMessage,
}: WeatherVerdictProps) {
  if (weatherStatus === "sol") {
    return (
      <div className="rel__verdict rel__verdict--sol">
        <div className="rel__verdict-icon" aria-hidden="true">
          &#9728;&#65039;
        </div>
        <div className="rel__verdict-label">VEREDICTO</div>
        <p className="rel__verdict-text">
          Céu limpo. Nenhuma ocorrência encontrada.
        </p>
        <div className="rel__verdict-stamp">CÉU LIMPO</div>
        {closingMessage && (
          <p className="rel__verdict-subtext">{closingMessage}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rel__verdict rel__verdict--chuva">
      <div className="rel__verdict-icon" aria-hidden="true">
        &#9928;&#65039;
      </div>
      <div className="rel__verdict-label">VEREDICTO</div>
      <p className="rel__verdict-text">
        Encontramos pontos de atenção que merecem sua avaliação.
      </p>
      <div className="rel__verdict-stamp">ATENÇÃO</div>
      <div className="rel__verdict-count">
        {totalOccurrences} OCORRÊNCIA{totalOccurrences !== 1 ? "S" : ""}
      </div>
      {closingMessage && (
        <p className="rel__verdict-subtext">{closingMessage}</p>
      )}
    </div>
  );
}
