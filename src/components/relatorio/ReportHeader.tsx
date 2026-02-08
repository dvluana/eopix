"use client"

interface ReportHeaderProps {
  cpf: string;
  dataConsulta: string;
  status: 'concluido' | 'processando' | 'erro';
}

export default function ReportHeader({ cpf, dataConsulta, status }: ReportHeaderProps) {
  const statusConfig = {
    concluido: {
      label: 'CONCLUÍDO',
      bg: 'rgba(102, 204, 102, 0.15)',
      color: '#339933',
    },
    processando: {
      label: 'PROCESSANDO',
      bg: 'rgba(255, 214, 0, 0.15)',
      color: '#B89600',
    },
    erro: {
      label: 'ERRO',
      bg: 'rgba(204, 51, 51, 0.15)',
      color: '#CC3333',
    },
  };

  const config = statusConfig[status];

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-family-heading)',
          fontSize: '28px',
          fontWeight: 700,
          color: '#1A1A1A',
          margin: '0 0 8px 0',
        }}
      >
        Consulta: CPF {cpf}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            color: '#888888',
          }}
        >
          Consultado em {dataConsulta}
        </span>

        <div
          style={{
            background: config.bg,
            color: config.color,
            fontFamily: 'var(--font-family-body)',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '3px',
          }}
        >
          {config.label}
        </div>
      </div>
    </div>
  );
}
