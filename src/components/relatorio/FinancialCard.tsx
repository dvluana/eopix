"use client"

import CollapsibleCard from './CollapsibleCard'
import { generateFinancialSummary } from '@/lib/report-utils'

interface ProtestoItem {
  data: string
  valor: string
  cartorio: string
}

interface DividaItem {
  tipo: string
  valor: string
  origem: string
}

interface FinancialCardProps {
  protestos?: ProtestoItem[]
  dividas?: DividaItem[]
  chequesDevolvidos?: number
  nomeSujo?: boolean
  totalProtestos?: number
  totalProtestosValor?: string
  totalDividas?: number
  totalDividasValor?: string
}

export default function FinancialCard({
  protestos = [],
  dividas = [],
  chequesDevolvidos = 0,
  nomeSujo,
  totalProtestos,
  totalProtestosValor,
  totalDividas,
  totalDividasValor,
}: FinancialCardProps) {
  const hasProtestos = protestos.length > 0
  const hasDividas = dividas.length > 0
  const hasCheques = chequesDevolvidos > 0
  const hasNomeSujo = nomeSujo !== undefined

  if (!hasProtestos && !hasDividas && !hasCheques && !hasNomeSujo) return null

  // Calculate totals from items if not provided
  const displayTotalProtestos = totalProtestos ?? protestos.length
  const displayTotalDividas = totalDividas ?? dividas.length

  // Count total issues
  const totalIssues = displayTotalProtestos + displayTotalDividas + (hasCheques ? chequesDevolvidos : 0)

  // Generate summary
  const summary = generateFinancialSummary(displayTotalProtestos, displayTotalDividas, chequesDevolvidos)

  // Expand by default if few items
  const totalItems = protestos.length + dividas.length
  const defaultExpanded = totalItems <= 3

  return (
    <CollapsibleCard
      icon="💰"
      title="Situação Financeira"
      count={totalIssues}
      summary={summary}
      variant="danger"
      defaultExpanded={defaultExpanded}
    >
      {/* Nome Sujo Status */}
      {hasNomeSujo && (
        <div
          style={{
            padding: '16px 20px',
            background: nomeSujo ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Nome sujo
          </span>
          <span
            style={{
              fontFamily: 'var(--font-family-body)',
              fontSize: '14px',
              fontWeight: 700,
              color: nomeSujo ? 'var(--color-status-error)' : 'var(--color-status-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {nomeSujo ? '❌ Sim' : '✅ Não'}
          </span>
        </div>
      )}

      {/* Summary Stats */}
      {(displayTotalProtestos > 0 || displayTotalDividas > 0 || hasCheques) && (
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--color-bg-secondary)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          {displayTotalProtestos > 0 && (
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
                Protestos
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-status-error)',
                }}
              >
                {displayTotalProtestos}
              </span>
              {totalProtestosValor && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    display: 'block',
                    marginTop: '2px',
                  }}
                >
                  Total: {totalProtestosValor}
                </span>
              )}
            </div>
          )}

          {displayTotalDividas > 0 && (
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
                Dívidas Ativas
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-status-error)',
                }}
              >
                {displayTotalDividas}
              </span>
              {totalDividasValor && (
                <span
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-secondary)',
                    display: 'block',
                    marginTop: '2px',
                  }}
                >
                  Total: {totalDividasValor}
                </span>
              )}
            </div>
          )}

          {hasCheques && (
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
                Cheques Devolvidos
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-status-error)',
                }}
              >
                {chequesDevolvidos}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Protestos Table */}
      {hasProtestos && (
        <>
          <div
            style={{
              padding: '12px 20px',
              background: 'var(--color-bg-primary)',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
              }}
            >
              Detalhes dos Protestos
            </span>
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Data
                </th>
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Valor
                </th>
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Cartório
                </th>
              </tr>
            </thead>
            <tbody>
              {protestos.map((protesto, index) => (
                <tr
                  key={index}
                  style={{
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      padding: '12px 20px',
                    }}
                  >
                    {protesto.data}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-status-error)',
                      fontWeight: 600,
                      padding: '12px 20px',
                    }}
                  >
                    {protesto.valor}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      padding: '12px 20px',
                    }}
                  >
                    {protesto.cartorio}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Dividas Table */}
      {hasDividas && (
        <>
          <div
            style={{
              padding: '12px 20px',
              background: 'var(--color-bg-primary)',
              borderBottom: '1px solid var(--color-border-subtle)',
              borderTop: hasProtestos ? '1px solid var(--color-border-subtle)' : 'none',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--color-text-secondary)',
              }}
            >
              Detalhes das Dívidas
            </span>
          </div>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--color-bg-secondary)',
                }}
              >
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Tipo
                </th>
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Valor
                </th>
                <th
                  style={{
                    fontFamily: 'var(--font-family-body)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--color-text-tertiary)',
                    textTransform: 'uppercase',
                    textAlign: 'left',
                    padding: '10px 20px',
                  }}
                >
                  Origem
                </th>
              </tr>
            </thead>
            <tbody>
              {dividas.map((divida, index) => (
                <tr
                  key={index}
                  style={{
                    borderTop: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-primary)',
                      padding: '12px 20px',
                    }}
                  >
                    {divida.tipo}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-status-error)',
                      fontWeight: 600,
                      padding: '12px 20px',
                    }}
                  >
                    {divida.valor}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-family-body)',
                      fontSize: '13px',
                      color: 'var(--color-text-secondary)',
                      padding: '12px 20px',
                    }}
                  >
                    {divida.origem}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </CollapsibleCard>
  )
}
