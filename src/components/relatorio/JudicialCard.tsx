"use client"

interface ProcessoItem {
  tribunal: string
  data: string
  classe: string
  polo: 'autor' | 'reu' | 'testemunha'
}

interface JudicialCardProps {
  processos: ProcessoItem[]
}

export default function JudicialCard({ processos }: JudicialCardProps) {
  return (
    <table className="rel__table">
      <thead>
        <tr>
          <th>Tribunal</th>
          <th>Data</th>
          <th>Classe</th>
          <th>Polo</th>
        </tr>
      </thead>
      <tbody>
        {processos.map((processo, index) => (
          <tr key={index}>
            <td>{processo.tribunal}</td>
            <td className="rel__td--secondary">{processo.data}</td>
            <td className="rel__td--secondary">{processo.classe}</td>
            <td className={processo.polo === 'reu' ? 'rel__td--polo-reu' : 'rel__td--polo'}>
              {processo.polo === 'reu' ? 'Reu' : processo.polo === 'autor' ? 'Autor' : 'Testemunha'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
