import type { ProcessosAnalysisResponse, SummaryResponse } from '../openai'

// ========== MOCKS DE ANALISE DE PROCESSOS ==========

export const MOCK_OPENAI_PROCESSOS_SOL: ProcessosAnalysisResponse = {
  processAnalysis: [], // Nenhum processo para pessoa com cenario sol
}

export const MOCK_OPENAI_PROCESSOS_CHUVA: ProcessosAnalysisResponse = {
  processAnalysis: [
    {
      numeroProcesso: '5001234-56.2024.8.21.0001',
      tituloSimplificado: 'Divida com banco',
      descricaoBreve: 'Execucao de titulo extrajudicial por inadimplencia com instituicao financeira',
      relevanciaNegocios: 'media',
      categoriaSimplificada: 'comercial',
      tribunal: 'TJRS',
      data: '2024-03-12',
      status: 'em_andamento',
    },
    {
      numeroProcesso: '0001234-12.2024.5.04.0001',
      tituloSimplificado: 'Acao trabalhista contra empresa',
      descricaoBreve: 'Ex-funcionario move acao por verbas rescisorias',
      relevanciaNegocios: 'baixa',
      categoriaSimplificada: 'trabalhista_empregador',
      tribunal: 'TRT-4',
      data: '2024-05-20',
      status: 'em_andamento',
    },
    {
      numeroProcesso: '5009876-78.2023.8.21.0001',
      tituloSimplificado: 'Cobranca de condominio',
      descricaoBreve: 'Acao de cobranca por taxas condominiais atrasadas',
      relevanciaNegocios: 'baixa',
      categoriaSimplificada: 'comercial',
      tribunal: 'TJRS',
      data: '2023-11-05',
      status: 'arquivado',
    },
  ],
}

// ========== MOCKS DE SUMMARY ==========

export const MOCK_OPENAI_SUMMARY_SOL_CNPJ: SummaryResponse = {
  summary:
    'Empresa ativa ha 8 anos, sem ocorrencias financeiras ou judiciais. 2 mencoes positivas encontradas na web. Nota 8.5 no Reclame Aqui com 95% de resolucao.',
  mentionClassifications: [
    { url: 'https://example.com/premio-sc-2025', relevant: true, classification: 'positive', reason: 'Premiacao empresarial' },
    { url: 'https://example.com/evento-networking', relevant: true, classification: 'neutral', reason: 'Evento networking' },
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
    'Atencao: 3 protestos totalizando R$ 12.450 e 3 processos judiciais encontrados, incluindo 1 de relevancia media (execucao bancaria). Mencoes de inadimplencia na web.',
  mentionClassifications: [
    {
      url: 'https://example.com/golpe-rs',
      relevant: true,
      classification: 'negative',
      reason: 'Reportagem sobre fraude',
    },
    {
      url: 'https://example.com/processo-criminal',
      relevant: true,
      classification: 'negative',
      reason: 'Processo criminal',
    },
  ],
  processAnalysis: [
    {
      numeroProcesso: '5001234-56.2024.8.21.0001',
      tituloSimplificado: 'Divida com banco',
      descricaoBreve: 'Execucao de titulo extrajudicial por inadimplencia',
      relevanciaNegocios: 'media',
      categoriaSimplificada: 'comercial',
      tribunal: 'TJRS',
      data: '2024-03-12',
      status: 'em_andamento',
    },
  ],
}

export const MOCK_OPENAI_SUMMARY_CHUVA_CNPJ: SummaryResponse = {
  summary:
    'Atencao: Empresa em recuperacao judicial. 3 protestos totalizando R$ 55.800, divida ativa de R$ 68.000 e 5 cheques devolvidos. 5 acoes ativas totalizando R$ 450.000. Nota 2.3 no Reclame Aqui.',
  mentionClassifications: [
    {
      url: 'https://example.com/cnpj-investigacao',
      relevant: true,
      classification: 'negative',
      reason: 'CNPJ citado em investigacao',
    },
    {
      url: 'https://example.com/fraudes-sc',
      relevant: true,
      classification: 'negative',
      reason: 'Investigacao de fraude',
    },
  ],
  reclameAqui: {
    nota: 2.3,
    indiceResolucao: 45,
    totalReclamacoes: 247,
    respondidas: 198,
    seloRA1000: false,
    url: 'https://www.reclameaqui.com.br/empresa/exemplo-chuva-ltda/',
  },
  processAnalysis: [
    {
      numeroProcesso: '1001234-56.2024.8.26.0100',
      tituloSimplificado: 'Execucao fiscal',
      descricaoBreve: 'Divida tributaria com o Estado de SP',
      relevanciaNegocios: 'media',
      categoriaSimplificada: 'divida_fiscal',
      tribunal: 'TJSP',
      data: '2024-02-15',
      status: 'em_andamento',
    },
    {
      numeroProcesso: '0002345-12.2024.5.02.0001',
      tituloSimplificado: 'Acao trabalhista',
      descricaoBreve: 'Ex-funcionario move acao por verbas rescisorias',
      relevanciaNegocios: 'baixa',
      categoriaSimplificada: 'trabalhista_empregador',
      tribunal: 'TRT-2',
      data: '2024-05-10',
      status: 'em_andamento',
    },
  ],
}
