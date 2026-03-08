"use client"

import { calculateYearsSince } from '@/lib/report-utils';

interface CnaeItem {
  codigo: string;
  descricao: string;
}

interface SocioItem {
  nome: string;
  qualificacao: string;
  dataEntrada?: string;
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

function formatPartnerRole(qualificacao: string): string {
  const qual = qualificacao?.toLowerCase() || '';

  if (qual.includes('administrador')) return 'Socio-administrador';
  if (qual.includes('diretor')) return 'Diretor';
  if (qual.includes('presidente')) return 'Presidente';
  if (qual.includes('gerente')) return 'Gerente';
  if (qual.includes('procurador')) return 'Procurador';
  if (qual.includes('socio')) return 'Socio';

  return qualificacao;
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
  const badgeBg = isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';

  return (
    <div>
      {/* Status Banner */}
      <div className="rel__company-banner" style={{ background: statusBg }}>
        <span className="rel__company-banner-title" style={{ color: statusColor }}>
          <span>{isActive ? '\uD83C\uDFE2' : '\u26A0\uFE0F'}</span>
          Cadastro Empresarial
        </span>
        <span
          className="rel__company-status-badge"
          style={{ color: statusColor, background: badgeBg }}
        >
          {situacao}
        </span>
      </div>

      {/* Content */}
      <div className="rel__company-content">
        <div className="rel__person-field">
          <span className="rel__label">Razao Social</span>
          <span className="rel__value">{razaoSocial}</span>
        </div>

        <div className="rel__company-grid">
          {dataAbertura && (
            <div>
              <span className="rel__label">Data de Abertura</span>
              <span className="rel__value--sm">{formatDate(dataAbertura)}</span>
            </div>
          )}

          {!isActive && dataBaixa && (
            <div>
              <span className="rel__label">Data de Baixa</span>
              <span className="rel__value--sm rel__value--error">
                {formatDate(dataBaixa)}
              </span>
            </div>
          )}

          {capitalSocial !== undefined && capitalSocial > 0 && (
            <div>
              <span className="rel__label">Capital Social</span>
              <span className="rel__value--sm">{formatCurrency(capitalSocial)}</span>
            </div>
          )}
        </div>

        <div className="rel__company-sections">
          {cnaePrincipal && (
            <div>
              <span className="rel__label">Atividade Principal (CNAE)</span>
              <span className="rel__value--sm">
                {cnaePrincipal.codigo} - {cnaePrincipal.descricao}
              </span>
            </div>
          )}

          {cnaeSecundarios && cnaeSecundarios.length > 0 && (
            <div>
              <span className="rel__label">
                Atividades Secundarias ({cnaeSecundarios.length})
              </span>
              <div className="rel__cnae-list">
                {cnaeSecundarios.slice(0, 3).map((cnae, index) => (
                  <span key={index} className="rel__cnae-item">
                    {cnae.codigo} - {cnae.descricao}
                  </span>
                ))}
                {cnaeSecundarios.length > 3 && (
                  <span className="rel__more-text">
                    +{cnaeSecundarios.length - 3} atividade{cnaeSecundarios.length - 3 > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}

          {socios && socios.length > 0 && (
            <div>
              <span className="rel__label">
                Quadro Societario ({socios.length})
              </span>
              <div className="rel__company-socios-list">
                {socios.slice(0, 5).map((socio, index) => {
                  const role = formatPartnerRole(socio.qualificacao);
                  const years = socio.dataEntrada ? calculateYearsSince(socio.dataEntrada) : null;
                  const timeDesc = years !== null
                    ? years > 0
                      ? `ha ${years} ano${years > 1 ? 's' : ''}`
                      : 'desde este ano'
                    : null;

                  return (
                    <div key={index} className="rel__company-socio">
                      <span className="rel__company-socio-name">{socio.nome}</span>
                      <span className="rel__company-socio-role">
                        {role}{timeDesc ? ` ${timeDesc}` : ''}
                      </span>
                    </div>
                  );
                })}
                {socios.length > 5 && (
                  <span className="rel__more-text">
                    +{socios.length - 5} socio{socios.length - 5 > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
