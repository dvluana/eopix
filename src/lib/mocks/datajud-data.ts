// Processos complementares ao Escavador (pode ter sobreposicao, job faz dedup)
export const MOCK_DATAJUD_CHUVA = {
  processes: [
    {
      tribunal: 'TJRS',
      number: '5001234-56.2024.8.21.0001',
      date: '2024-05-20',
      classe: 'Execucao Fiscal',
      polo: 'Reu',
    },
    {
      tribunal: 'TJRS',
      number: '5009876-12.2025.8.21.0010',
      date: '2025-03-10',
      classe: 'Busca e Apreensao',
      polo: 'Reu',
    },
  ],
}

export const MOCK_DATAJUD_SOL = { processes: [] }
