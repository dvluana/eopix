"use client";

interface DossierHeaderProps {
  term: string;
  type: "CPF" | "CNPJ";
  name: string;
  createdAt: string;
}

export default function DossierHeader({
  term,
  type,
  name,
  createdAt,
}: DossierHeaderProps) {
  return (
    <div className="rel__header">
      <span className="rel__header-badge">{type}</span>
      <h1 className="rel__header-subject">{name}</h1>
      <p className="rel__header-doc">{term}</p>
      <p className="rel__header-date">Gerado em {createdAt}</p>
      <span className="rel__header-stamp">CONCLUIDO</span>
    </div>
  );
}
