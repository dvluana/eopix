import type { GoogleSearchResponse } from '../google-search'

export const MOCK_GOOGLE_SOL: GoogleSearchResponse = {
  general: [
    {
      title: 'Premio Top Empresas SC 2025',
      url: 'https://example.com/premio-sc-2025',
      snippet: 'Tech Solutions recebe premio de inovacao...',
      classification: 'positive',
    },
    {
      title: 'Evento de networking em Florianopolis',
      url: 'https://example.com/evento-networking',
      snippet: 'Empresarios locais participam de encontro...',
      classification: 'neutral',
    },
  ],
  focused: [], // nenhuma mencao negativa
  reclameAqui: [
    {
      title: 'Tech Solutions - Reclame Aqui',
      url: 'https://www.reclameaqui.com.br/tech-solutions',
      snippet: 'Nota 8.5 - Respondeu 95% das reclamacoes',
      classification: 'positive',
    },
  ],
}

export const MOCK_GOOGLE_CHUVA: GoogleSearchResponse = {
  general: [
    {
      title: 'Reportagem sobre fraudes em SC',
      url: 'https://example.com/fraudes-sc',
      snippet: 'Investigacao aponta empresas envolvidas...',
      classification: 'negative',
    },
  ],
  focused: [
    {
      title: 'Processo por inadimplencia',
      url: 'https://example.com/processo-inadimplencia',
      snippet: 'Empresa citada em acao de cobranca...',
      classification: 'negative',
    },
  ],
  reclameAqui: [],
}

export const MOCK_GOOGLE_CPF_SOL: GoogleSearchResponse = {
  general: [],
  focused: [],
  reclameAqui: [],
}

export const MOCK_GOOGLE_CPF_CHUVA: GoogleSearchResponse = {
  general: [
    {
      title: 'Noticia sobre golpe',
      url: 'https://example.com/golpe-rs',
      snippet: 'Pessoa envolvida em esquema de fraude...',
      classification: 'negative',
    },
  ],
  focused: [
    {
      title: 'Processo criminal',
      url: 'https://example.com/processo-criminal',
      snippet: 'Reu em acao por estelionato...',
      classification: 'negative',
    },
  ],
  reclameAqui: [],
}
