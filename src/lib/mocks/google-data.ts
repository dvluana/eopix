import type { GoogleSearchResponse } from '@/types/report'

// ========== CNPJ SOL (limpo) ==========
export const MOCK_GOOGLE_SOL: GoogleSearchResponse = {
  byDocument: [], // Nenhum resultado por documento formatado
  byName: [
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
  reclameAqui: [
    {
      title: 'Tech Solutions - Reclame Aqui',
      url: 'https://www.reclameaqui.com.br/tech-solutions',
      snippet: 'Nota 8.5 - Respondeu 95% das reclamacoes',
      classification: 'positive',
    },
  ],
}

// ========== CNPJ CHUVA (problemas) ==========
export const MOCK_GOOGLE_CHUVA: GoogleSearchResponse = {
  byDocument: [
    {
      title: 'CNPJ citado em investigacao',
      url: 'https://example.com/cnpj-investigacao',
      snippet: 'CNPJ 12.345.678/0001-90 aparece em documentos de investigacao...',
      classification: 'negative',
    },
  ],
  byName: [
    {
      title: 'Reportagem sobre fraudes em SC',
      url: 'https://example.com/fraudes-sc',
      snippet: 'Investigacao aponta empresas envolvidas...',
      classification: 'negative',
    },
    {
      title: 'Processo por inadimplencia',
      url: 'https://example.com/processo-inadimplencia',
      snippet: 'Empresa citada em acao de cobranca...',
      classification: 'negative',
    },
  ],
  reclameAqui: [
    {
      title: 'Empresa Problematica - Reclame Aqui',
      url: 'https://www.reclameaqui.com.br/empresa-problematica',
      snippet: 'Nota 2.3 - NAO RECOMENDADA - 45 reclamacoes sem resposta',
      classification: 'negative',
    },
  ],
}

// ========== CPF SOL (limpo) ==========
export const MOCK_GOOGLE_CPF_SOL: GoogleSearchResponse = {
  byDocument: [], // Nenhum resultado por CPF
  byName: [], // Nenhuma mencao negativa
  reclameAqui: [], // CPF pode ter empresa, mas neste caso nao tem
}

// ========== CPF CHUVA (problemas) ==========
export const MOCK_GOOGLE_CPF_CHUVA: GoogleSearchResponse = {
  byDocument: [
    {
      title: 'CPF em lista de devedores',
      url: 'https://example.com/lista-devedores',
      snippet: 'CPF 123.456.789-01 consta em lista de inadimplentes...',
      classification: 'negative',
    },
  ],
  byName: [
    {
      title: 'Noticia sobre golpe',
      url: 'https://example.com/golpe-rs',
      snippet: 'Pessoa envolvida em esquema de fraude...',
      classification: 'negative',
    },
    {
      title: 'Processo criminal',
      url: 'https://example.com/processo-criminal',
      snippet: 'Reu em acao por estelionato...',
      classification: 'negative',
    },
  ],
  reclameAqui: [
    {
      title: 'JC Silva Comercio - Reclame Aqui',
      url: 'https://www.reclameaqui.com.br/jc-silva-comercio',
      snippet: 'Nota 3.1 - Empresa do socio com reclamacoes',
      classification: 'negative',
    },
  ],
}
