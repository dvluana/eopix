"use client"

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

  const displayTotalProtestos = totalProtestos ?? protestos.length
  const displayTotalDividas = totalDividas ?? dividas.length

  const nomeSujoBg = nomeSujo ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)'

  return (
    <div>
      {/* Nome Sujo Status */}
      {hasNomeSujo && (
        <div className="rel__fin-status" style={{ background: nomeSujoBg }}>
          <span className="rel__fin-status-label">Nome sujo</span>
          <span className={`rel__fin-status-value ${nomeSujo ? 'rel__value--error' : 'rel__value--success'}`}>
            {nomeSujo ? '\u274C Sim' : '\u2705 Nao'}
          </span>
        </div>
      )}

      {/* Summary Stats */}
      {(displayTotalProtestos > 0 || displayTotalDividas > 0 || hasCheques) && (
        <div className="rel__fin-stats">
          {displayTotalProtestos > 0 && (
            <div>
              <span className="rel__label">Protestos</span>
              <span className="rel__value--lg rel__value--error">{displayTotalProtestos}</span>
              {totalProtestosValor && (
                <span className="rel__fin-stat-count">Total: {totalProtestosValor}</span>
              )}
            </div>
          )}

          {displayTotalDividas > 0 && (
            <div>
              <span className="rel__label">Dividas Ativas</span>
              <span className="rel__value--lg rel__value--error">{displayTotalDividas}</span>
              {totalDividasValor && (
                <span className="rel__fin-stat-count">Total: {totalDividasValor}</span>
              )}
            </div>
          )}

          {hasCheques && (
            <div>
              <span className="rel__label">Cheques Devolvidos</span>
              <span className="rel__value--lg rel__value--error">{chequesDevolvidos}</span>
            </div>
          )}
        </div>
      )}

      {/* Protestos Table */}
      {hasProtestos && (
        <>
          <div className="rel__fin-section-header">
            <span className="rel__fin-section-title">Detalhes dos Protestos</span>
          </div>
          <table className="rel__table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Valor</th>
                <th>Cartorio</th>
              </tr>
            </thead>
            <tbody>
              {protestos.map((protesto, index) => (
                <tr key={index}>
                  <td>{protesto.data}</td>
                  <td className="rel__td--error">{protesto.valor}</td>
                  <td className="rel__td--secondary">{protesto.cartorio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Dividas Table */}
      {hasDividas && (
        <>
          <div className={`rel__fin-section-header${hasProtestos ? ' rel__fin-section-header--separated' : ''}`}>
            <span className="rel__fin-section-title">Detalhes das Dividas</span>
          </div>
          <table className="rel__table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {dividas.map((divida, index) => (
                <tr key={index}>
                  <td>{divida.tipo}</td>
                  <td className="rel__td--error">{divida.valor}</td>
                  <td className="rel__td--secondary">{divida.origem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
