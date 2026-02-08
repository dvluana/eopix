"use client"

interface ProcessoItem {
  tribunal: string;
  data: string;
  classe: string;
  polo: 'autor' | 'reu';
}

interface JudicialCardProps {
  processos: ProcessoItem[];
}

export default function JudicialCard({ processos }: JudicialCardProps) {
  if (processos.length === 0) return null;

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
          <span>⚖️</span>
          Processos Judiciais — {processos.length} processo{processos.length > 1 ? 's' : ''} encontrado{processos.length > 1 ? 's' : ''}
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
              Tribunal
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
              Classe
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
              Polo
            </th>
          </tr>
        </thead>
        <tbody>
          {processos.map((processo, index) => (
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
                {processo.tribunal}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: '#666666',
                  padding: '12px 20px',
                }}
              >
                {processo.data}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: '#666666',
                  padding: '12px 20px',
                }}
              >
                {processo.classe}
              </td>
              <td
                style={{
                  fontFamily: 'var(--font-family-body)',
                  fontSize: '13px',
                  color: processo.polo === 'reu' ? '#CC3333' : '#666666',
                  fontWeight: processo.polo === 'reu' ? 600 : 400,
                  padding: '12px 20px',
                  textTransform: 'capitalize',
                }}
              >
                {processo.polo === 'reu' ? 'Réu' : 'Autor'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
