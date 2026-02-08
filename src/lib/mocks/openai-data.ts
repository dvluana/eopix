import type { SummaryResponse } from '../openai'

export const MOCK_OPENAI_SUMMARY_SOL_CNPJ: SummaryResponse = {
  summary:
    'Empresa ativa ha 8 anos, sem ocorrencias financeiras ou judiciais. 2 mencoes positivas encontradas na web. Nota 8.5 no Reclame Aqui com 95% de resolucao.',
  mentionClassifications: [
    { url: 'https://example.com/premio-sc-2025', classification: 'positive', reason: 'Premiacao empresarial' },
    { url: 'https://example.com/evento-networking', classification: 'neutral', reason: 'Evento networking' },
  ],
  reclameAqui: {
    nota: 8.5,
    indiceResolucao: 95,
    totalReclamacoes: 12,
    respondidas: 12,
    seloRA1000: true,
    url: 'https://www.reclameaqui.com.br/empresa/exemplo-sol-ltda/',
  },
}

export const MOCK_OPENAI_SUMMARY_SOL_CPF: SummaryResponse = {
  summary:
    'Nenhuma ocorrencia financeira, judicial ou de mencoes negativas encontrada para este CPF nos registros publicos consultados em 05/02/2026. Nome limpo ha pelo menos 5 anos.',
  mentionClassifications: [],
}

export const MOCK_OPENAI_SUMMARY_CHUVA_CPF: SummaryResponse = {
  summary:
    'Atencao: 3 protestos totalizando R$ 12.450 e 51 processos judiciais encontrados. Mencoes de inadimplencia na web.',
  mentionClassifications: [
    {
      url: 'https://example.com/golpe-rs',
      classification: 'negative',
      reason: 'Reportagem sobre fraude',
    },
  ],
}

export const MOCK_OPENAI_SUMMARY_CHUVA_CNPJ: SummaryResponse = {
  summary:
    'Atencao: 1 protesto de R$ 15.000, divida ativa de R$ 45.000 e 2 cheques devolvidos. Empresa com pendencias financeiras significativas. Nota 3.2 no Reclame Aqui.',
  mentionClassifications: [
    {
      url: 'https://example.com/fraudes-sc',
      classification: 'negative',
      reason: 'Investigacao de fraude',
    },
  ],
  reclameAqui: {
    nota: 3.2,
    indiceResolucao: 45,
    totalReclamacoes: 247,
    respondidas: 198,
    seloRA1000: false,
    url: 'https://www.reclameaqui.com.br/empresa/exemplo-chuva-ltda/',
  },
}
