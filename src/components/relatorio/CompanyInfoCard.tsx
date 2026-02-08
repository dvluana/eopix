"use client"

interface CnaeItem {
  codigo: string;
  descricao: string;
}

interface SocioItem {
  nome: string;
  qualificacao: string;
}

interface CompanyInfoCardProps {
  razaoSocial: string;
  situacao: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | string;
  dataAbertura?: string;
  dataBaixa?: string;
  cnaePrincipal?: CnaeItem;
  cnaeSecundarios?: CnaeItem[];
  socios?: SocioItem[];
  capitalSocial?: number;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export default function CompanyInfoCard({
  razaoSocial,
  situacao,
  dataAbertura,
  dataBaixa,
  cnaePrincipal,
  cnaeSecundarios,
  socios,
  capitalSocial,
}: CompanyInfoCardProps) {
  const isActive = situacao === 'ATIVA';
  const statusColor = isActive ? 'var(--color-status-success)' : 'var(--color-status-error)';
  const statusBg = isActive ? 'var(--color-status-success-bg)' : 'var(--color-status-error-bg)';
  const borderColor = isActive ? 'var(--color-border-subtle)' : 'var(--color-status-error)';

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-primary)',
        border: `1px solid ${borderColor}`,
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: statusBg,
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: statusColor,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{isActive ? '🏢' : '⚠️'}</span>
          Cadastro Empresarial
        </h3>
        <span
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            fontWeight: 600,
            color: statusColor,
            background: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          {situacao}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Razão Social */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            Razão Social
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            {razaoSocial}
          </span>
        </div>

        {/* Grid de informações */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}
        >
          {/* Data de Abertura */}
          {dataAbertura && (
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Data de Abertura
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {formatDate(dataAbertura)}
              </span>
            </div>
          )}

          {/* Data de Baixa (se não ativa) */}
          {!isActive && dataBaixa && (
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Data de Baixa
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-status-error)',
                  fontWeight: 600,
                }}
              >
                {formatDate(dataBaixa)}
              </span>
            </div>
          )}

          {/* Capital Social */}
          {capitalSocial !== undefined && capitalSocial > 0 && (
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Capital Social
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: 'var(--color-text-primary)',
                }}
              >
                {formatCurrency(capitalSocial)}
              </span>
            </div>
          )}
        </div>

        {/* CNAE Principal */}
        {cnaePrincipal && (
          <div style={{ marginTop: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '4px',
              }}
            >
              Atividade Principal (CNAE)
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '13px',
                color: 'var(--color-text-primary)',
              }}
            >
              {cnaePrincipal.codigo} - {cnaePrincipal.descricao}
            </span>
          </div>
        )}

        {/* CNAEs Secundários */}
        {cnaeSecundarios && cnaeSecundarios.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Atividades Secundárias ({cnaeSecundarios.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {cnaeSecundarios.slice(0, 3).map((cnae, index) => (
                <span
                  key={index}
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {cnae.codigo} - {cnae.descricao}
                </span>
              ))}
              {cnaeSecundarios.length > 3 && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '11px',
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}
                >
                  +{cnaeSecundarios.length - 3} atividade{cnaeSecundarios.length - 3 > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Sócios */}
        {socios && socios.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Quadro Societário ({socios.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {socios.slice(0, 5).map((socio, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '4px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {socio.nome}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    {socio.qualificacao}
                  </span>
                </div>
              ))}
              {socios.length > 5 && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '11px',
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                    textAlign: 'center',
                  }}
                >
                  +{socios.length - 5} sócio{socios.length - 5 > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
