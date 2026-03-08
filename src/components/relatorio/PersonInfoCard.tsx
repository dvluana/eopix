"use client"

import { useState } from 'react'
import { formatCNPJ } from '@/lib/validators'

interface EnderecoItem {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
}

interface TelefoneItem {
  ddd: string
  numero: string
  tipo: string
}

interface EmpresaVinculadaItem {
  cnpj: string
  razaoSocial: string
  participacao: string
}

interface PersonInfoCardProps {
  cadastral: {
    nome: string
    idade: number | null
    situacaoRF: string | null
    enderecos: EnderecoItem[]
    telefones: TelefoneItem[]
    emails: string[]
    empresasVinculadas: EmpresaVinculadaItem[]
  }
}

function maskPhone(ddd: string, numero: string): string {
  const cleanNum = numero.replace(/\D/g, '')
  if (cleanNum.length < 4) return `${ddd} ${cleanNum}`

  const first = cleanNum.slice(0, 2)
  const last = cleanNum.slice(-2)
  return `${ddd} ${first}****${last}`
}

function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  children
}: {
  title: string
  count: number
  defaultExpanded?: boolean
  children: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div className="rel__subsection">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="rel__subsection-trigger"
      >
        <span className="rel__subsection-label">
          {title} ({count})
        </span>
        <span
          className="rel__subsection-chevron"
          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          &#9660;
        </span>
      </button>
      {isExpanded && (
        <div className="rel__subsection-content">
          {children}
        </div>
      )}
    </div>
  )
}

export default function PersonInfoCard({ cadastral }: PersonInfoCardProps) {
  const situacaoClass = cadastral.situacaoRF === 'REGULAR'
    ? 'rel__value--sm rel__value--success'
    : 'rel__value--sm rel__value--error'

  return (
    <div className="rel__person-content">
      {/* Nome e Idade */}
      <div className="rel__person-field">
        <span className="rel__label">Nome</span>
        <span className="rel__value">
          {cadastral.nome}
          {cadastral.idade && (
            <span className="rel__value--secondary">
              ({cadastral.idade} anos)
            </span>
          )}
        </span>
      </div>

      {/* Situacao RF */}
      {cadastral.situacaoRF && (
        <div className="rel__person-field">
          <span className="rel__label">Situacao na Receita Federal</span>
          <span className={situacaoClass}>
            {cadastral.situacaoRF}
          </span>
        </div>
      )}

      {/* Secoes colapsaveis */}
      <div className="rel__person-sections">
        {cadastral.enderecos.length > 0 && (
          <CollapsibleSection
            title="Enderecos"
            count={cadastral.enderecos.length}
            defaultExpanded={cadastral.enderecos.length <= 2}
          >
            <div className="rel__person-list">
              {cadastral.enderecos.map((end, index) => (
                <div key={index} className="rel__info-item">
                  <span className="rel__info-item-primary">
                    {end.cidade}/{end.uf}
                  </span>
                  <br />
                  {end.bairro && (
                    <span>Bairro {end.bairro}</span>
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {cadastral.telefones.length > 0 && (
          <CollapsibleSection
            title="Telefones"
            count={cadastral.telefones.length}
            defaultExpanded={cadastral.telefones.length <= 2}
          >
            <div className="rel__person-list--tight">
              {cadastral.telefones.map((tel, index) => (
                <div key={index} className="rel__info-phone">
                  <span className="rel__info-item-primary">
                    {maskPhone(tel.ddd, tel.numero)}
                  </span>
                  <span className="rel__info-phone-type">
                    {tel.tipo}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {cadastral.emails.length > 0 && (
          <CollapsibleSection
            title="Emails"
            count={cadastral.emails.length}
            defaultExpanded={cadastral.emails.length <= 2}
          >
            <div className="rel__person-list--tight">
              {cadastral.emails.map((email, index) => (
                <span key={index} className="rel__info-email">
                  {email}
                </span>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {cadastral.empresasVinculadas.length > 0 && (
          <CollapsibleSection
            title="Empresas Vinculadas"
            count={cadastral.empresasVinculadas.length}
            defaultExpanded={cadastral.empresasVinculadas.length <= 2}
          >
            <div className="rel__person-list">
              {cadastral.empresasVinculadas.map((emp, index) => (
                <div key={index} className="rel__empresa-card">
                  <span className="rel__empresa-name">
                    {emp.razaoSocial}
                  </span>
                  <div className="rel__empresa-meta">
                    <span>CNPJ: {formatCNPJ(emp.cnpj)}</span>
                    <span className="rel__empresa-sep">|</span>
                    <span>{emp.participacao}</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  )
}
