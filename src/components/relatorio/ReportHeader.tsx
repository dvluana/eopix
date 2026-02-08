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
      bg: 'var(--color-status-success-bg)',
      color: 'var(--color-status-success)',
    },
    processando: {
      label: 'PROCESSANDO',
      bg: 'var(--color-status-warning-bg)',
      color: 'var(--color-status-warning)',
    },
    erro: {
      label: 'ERRO',
      bg: 'var(--color-status-error-bg)',
      color: 'var(--color-status-error)',
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
          color: 'var(--color-text-primary)',
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
            color: 'var(--color-text-tertiary)',
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
