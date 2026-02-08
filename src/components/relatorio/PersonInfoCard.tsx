"use client"

import { useState, useEffect } from 'react'

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

/**
 * Mask phone number: show DDD + first 2 digits + mask + last 2 digits
 * Example: 51 99****66
 */
function maskPhone(ddd: string, numero: string): string {
  const cleanNum = numero.replace(/\D/g, '')
  if (cleanNum.length < 4) return `${ddd} ${cleanNum}`

  const first = cleanNum.slice(0, 2)
  const last = cleanNum.slice(-2)
  return `${ddd} ${first}****${last}`
}

/**
 * Mask CNPJ: show first 2 digits, mask middle, show last 4 of base
 * Example: 12.345.xxx/xxxx-xx
 */
function maskCnpj(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return cnpj

  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.***/${clean.slice(8, 12)}-**`
}

/**
 * Collapsible section inside the card
 */
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
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-family-body)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          {title} ({count})
        </span>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>
      {isExpanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function PersonInfoCard({ cadastral }: PersonInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Set initial expanded state based on screen size (only on client)
  useEffect(() => {
    const isMobile = window.innerWidth < 768
    setIsExpanded(!isMobile)
  }, [])

  const situacaoColor = cadastral.situacaoRF === 'REGULAR'
    ? 'var(--color-status-success)'
    : 'var(--color-status-warning)'

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--color-bg-primary)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      {/* Header - Clickable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg-secondary)',
          padding: '12px 20px',
          border: 'none',
          borderBottom: isExpanded ? '1px solid var(--color-border-subtle)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>👤</span>
          Dados Cadastrais
        </h3>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Content - Collapsible */}
      <div
        style={{
          maxHeight: isExpanded ? '2000px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease-in-out',
        }}
      >
        <div style={{ padding: '20px' }}>
          {/* Nome e Idade */}
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
              Nome
            </span>
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              {cadastral.nome}
              {cadastral.idade && (
                <span
                  style={{
                    fontWeight: 400,
                    color: 'var(--color-text-secondary)',
                    marginLeft: '8px',
                  }}
                >
                  ({cadastral.idade} anos)
                </span>
              )}
            </span>
          </div>

          {/* Situação RF */}
          {cadastral.situacaoRF && (
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
                Situação na Receita Federal
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: situacaoColor,
                }}
              >
                {cadastral.situacaoRF}
              </span>
            </div>
          )}

          {/* Seções colapsáveis */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {/* Endereços */}
            {cadastral.enderecos.length > 0 && (
              <CollapsibleSection
                title="Endereços"
                count={cadastral.enderecos.length}
                defaultExpanded={cadastral.enderecos.length <= 2}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cadastral.enderecos.map((end, index) => (
                    <div
                      key={index}
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
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

            {/* Telefones */}
            {cadastral.telefones.length > 0 && (
              <CollapsibleSection
                title="Telefones"
                count={cadastral.telefones.length}
                defaultExpanded={cadastral.telefones.length <= 2}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {cadastral.telefones.map((tel, index) => (
                    <div
                      key={index}
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                        {maskPhone(tel.ddd, tel.numero)}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--color-text-tertiary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {tel.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Emails */}
            {cadastral.emails.length > 0 && (
              <CollapsibleSection
                title="Emails"
                count={cadastral.emails.length}
                defaultExpanded={cadastral.emails.length <= 2}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {cadastral.emails.map((email, index) => (
                    <span
                      key={index}
                      style={{
                        fontFamily: 'var(--font-family-body)',
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Empresas Vinculadas */}
            {cadastral.empresasVinculadas.length > 0 && (
              <CollapsibleSection
                title="Empresas Vinculadas"
                count={cadastral.empresasVinculadas.length}
                defaultExpanded={cadastral.empresasVinculadas.length <= 2}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cadastral.empresasVinculadas.map((emp, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--color-bg-primary)',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-family-body)',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                          display: 'block',
                        }}
                      >
                        {emp.razaoSocial}
                      </span>
                      <div
                        style={{
                          fontFamily: 'var(--font-family-body)',
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>CNPJ: {maskCnpj(emp.cnpj)}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>|</span>
                        <span>{emp.participacao}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
