"use client"

interface ProtestoItem {
  data: string;
  valor: string;
  cartorio: string;
}

interface FinancialCardProps {
  protestos: ProtestoItem[];
}

export default function FinancialCard({ protestos }: FinancialCardProps) {
  if (protestos.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '24px',
        background: 'var(--primitive-white)',
        border: '1px solid #E8E7E3',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: '#FFF0F0',
          padding: '12px 20px',
          borderBottom: '1px solid #E8E7E3',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-family-heading)',
            fontSize: '14px',
            fontWeight: 700,
            color: '#CC3333',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>💰</span>
          Situação Financeira — {protestos.length} protesto{protestos.length > 1 ? 's' : ''} encontrado{protestos.length > 1 ? 's' : ''}
        </h3>
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
              background: '#F8F8F6',
            }}
          >
            <th
              style={{
                fontFamily: 'var(--font-family-body)',
                fontSize: '10px',
                fontWeight: 700,
                color: '#888888',
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
                color: '#888888',
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
                color: '#888888',
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
                borderTop: '1px solid #E8E7E3',
              }}
            >
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: '#1A1A1A',
                  padding: '12px 20px',
                }}
              >
                {protesto.data}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: '#CC3333',
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
                  color: '#666666',
                  padding: '12px 20px',
                }}
              >
                {protesto.cartorio}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
