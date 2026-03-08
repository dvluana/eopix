"use client";

interface AiSummaryProps {
  summary: string;
}

export default function AiSummary({ summary }: AiSummaryProps) {
  return (
    <div className="rel__summary">
      <span className="rel__summary-badge">RESUMO IA</span>
      <p className="rel__summary-text">{summary}</p>
    </div>
  );
}
