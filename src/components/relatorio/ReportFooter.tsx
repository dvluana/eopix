"use client"

interface ReportFooterProps {
  dataConsulta: string;
  dataExpiracao: string;
  onVoltarConsultas: () => void;
}

export default function ReportFooter({ dataConsulta, dataExpiracao, onVoltarConsultas }: ReportFooterProps) {
  return (
    <div
      style={{
        marginTop: '40px',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-family-body)',
          fontSize: '11px',
          color: '#888888',
          margin: '0 0 16px 0',
        }}
      >
        Relatório gerado em {dataConsulta.split(' às ')[0]}. Dados expiram
        em {dataExpiracao}.
      </p>

      <button
        type="button"
        onClick={onVoltarConsultas}
        style={{
          background: 'transparent',
          border: '2px solid #1A1A1A',
          color: '#1A1A1A',
          fontFamily: 'var(--font-family-body)',
          fontSize: '13px',
          fontWeight: 600,
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        Voltar para Minhas Consultas
      </button>
    </div>
  );
}
