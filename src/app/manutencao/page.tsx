import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Em Manutencao | EOPIX',
}

export default function ManutencaoPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fafafa',
        fontFamily: 'var(--font-ibm-plex-mono), monospace',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          border: '3px solid #000',
          boxShadow: '6px 6px 0 #000',
          background: '#fff',
          padding: '2.5rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            background: '#facc15',
            color: '#000',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0.25rem 0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          Manutencao
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-zilla-slab), serif',
            fontSize: '1.75rem',
            fontWeight: 700,
            margin: '0 0 1rem',
            lineHeight: 1.2,
          }}
        >
          Estamos em manutencao
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#555',
            lineHeight: 1.6,
            margin: '0 0 1.5rem',
          }}
        >
          O sistema esta passando por uma atualizacao e voltara em breve.
          <br />
          Se voce ja fez uma compra, seu relatorio nao sera afetado.
        </p>

        <div
          style={{
            fontSize: '0.8rem',
            color: '#999',
            borderTop: '1px solid #eee',
            paddingTop: '1rem',
          }}
        >
          EOPIX — Consulta de Risco CPF e CNPJ
        </div>
      </div>
    </div>
  )
}
