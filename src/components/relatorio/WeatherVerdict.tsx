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
          Ceu limpo. Nenhuma ocorrencia encontrada.
        </p>
        <div className="rel__verdict-stamp">CEU LIMPO</div>
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
        Encontramos pontos de atencao que merecem sua avaliacao.
      </p>
      <div className="rel__verdict-stamp">ATENCAO</div>
      <div className="rel__verdict-count">
        {totalOccurrences} OCORRENCIA{totalOccurrences !== 1 ? "S" : ""}
      </div>
      {closingMessage && (
        <p className="rel__verdict-subtext">{closingMessage}</p>
      )}
    </div>
  );
}
