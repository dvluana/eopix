// ========== PROCESSOS ==========

export interface ProcessoRaw {
  numeroProcessoUnico: string
  tribunal: string
  dataAutuacao: string
  classeProcessual: { nome: string }
  statusPj: {
    ramoDireito: string
    statusProcesso: string
  }
  partes: Array<{
    nome: string
    polo: 'ATIVO' | 'PASSIVO' | 'TERCEIRO INTERESSADO'
  }>
  valorCausa?: { valor: number }
  urlProcesso?: string
}

export interface ProcessAnalysis {
  numeroProcesso: string
  categoriaSimplificada:
    | 'fraude'
    | 'divida_fiscal'
    | 'trabalhista_empregador'
    | 'trabalhista_empregado'
    | 'criminal'
    | 'comercial'
    | 'acidente'
    | 'familia'
    | 'outro'
  relevanciaNegocios: 'alta' | 'media' | 'baixa' | 'nenhuma'
  tituloSimplificado: string
  descricaoBreve: string
  tribunal: string
  data: string
  status: 'em_andamento' | 'arquivado'
}

// ========== FINANCEIRO (sem IA) ==========

export interface FinancialSummary {
  totalProtestos: number
  valorTotalProtestos: number
  totalDividas: number
  valorTotalDividas: number
  chequesSemFundo: number
  // NOTA: Score eh buscado internamente mas NAO exibido ao usuario
  // Mantido apenas para uso interno/futuro
  _scoreInterno: number | null
}

// ========== MENCOES WEB ==========

export interface MentionClassification {
  url: string
  relevant: boolean
  classification: 'positive' | 'neutral' | 'negative'
  reason: string
}

// ========== RECLAME AQUI ==========

export interface ReclameAquiData {
  nota: number | null
  indiceResolucao: number | null
  totalReclamacoes: number | null
  respondidas: number | null
  seloRA1000: boolean
  url: string | null
}

// ========== RESPOSTA CONSOLIDADA ==========

export interface AIAnalysisResponse {
  summary: string
  processAnalysis: ProcessAnalysis[]
  mentionClassifications: MentionClassification[]
  reclameAqui: ReclameAquiData | null
}

export type WeatherStatus = 'sol' | 'chuva'

// ========== DOSSIE CNPJ (ic-dossie-juridico) ==========

export interface DossieOcorrencia {
  numeroProcesso?: string
  tribunal?: string
  vara?: string
  cidade?: string
  uf?: string
  dataDistribuicao?: string
  natureza?: string
  autor?: string
  reu?: string
  valor?: number
  status?: string
  descricao?: string
}

export interface DossieResponse {
  // Dados cadastrais
  razaoSocial: string
  cnpj: string
  situacao: string | null
  dataAbertura: string | null
  naturezaJuridica: string | null
  capitalSocial: number | null
  endereco: {
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  } | null
  socios: Array<{
    nome: string
    qualificacao: string
    documento: string | null
  }>
  cnaePrincipal: {
    codigo: string
    descricao: string
  } | null
  // Processos judiciais
  acoesAtivas: {
    quantidade: number
    valorTotal: number
    ocorrencias: DossieOcorrencia[]
  }
  acoesArquivadas: {
    quantidade: number
    ocorrencias: DossieOcorrencia[]
  }
  // Alertas e restricoes
  alertas: {
    quantidade: number
    ocorrencias: DossieOcorrencia[]
  }
}

// ========== PROCESSOS CPF (r-acoes-e-processos-judiciais) ==========

export interface ProcessosCpfResponse {
  processos: ProcessoRaw[]
  totalProcessos: number
}

// ========== FINANCEIRO SRS-PREMIUM ==========

export interface SrsPremiumCpfResponse {
  nome: string
  protestos: Array<{
    data: string
    valor: number
    cartorio: string
    cidade?: string
    uf?: string
  }>
  pendenciasFinanceiras: Array<{
    tipo: string
    valor: number
    origem: string
    dataOcorrencia?: string
  }>
  chequesSemFundo: number
  totalProtestos: number
  valorTotalProtestos: number
  totalPendencias: number
  valorTotalPendencias: number
  // Score buscado mas NAO exibido
  _scoreInterno: number | null
}

export interface SrsPremiumCnpjResponse {
  razaoSocial: string
  cnpj: string
  protestos: Array<{
    data: string
    valor: number
    cartorio: string
    cidade?: string
    uf?: string
  }>
  pendenciasFinanceiras: Array<{
    tipo: string
    valor: number
    origem: string
    dataOcorrencia?: string
  }>
  chequesSemFundo: number
  totalProtestos: number
  valorTotalProtestos: number
  totalPendencias: number
  valorTotalPendencias: number
  // Score buscado mas NAO exibido
  _scoreInterno: number | null
}

// ========== SERPER / GOOGLE SEARCH ==========

export interface GoogleSearchResult {
  title: string
  url: string
  snippet: string
  classification?: 'positive' | 'neutral' | 'negative'
}

export interface GoogleSearchResponse {
  byDocument: GoogleSearchResult[]  // Busca por CPF/CNPJ formatado
  byName: GoogleSearchResult[]      // Busca por nome + termos negativos
  reclameAqui: GoogleSearchResult[] // Busca Reclame Aqui (CPF e CNPJ)
}

// ========== CADASTRAL CPF (r-cpf-completo) ==========

export interface CpfCadastralResponse {
  nome: string
  cpf: string
  dataNascimento: string | null
  idade: number | null
  nomeMae: string | null
  sexo: string | null
  signo: string | null
  situacaoRF: string | null
  enderecos: Array<{
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    uf: string
    cep: string
  }>
  telefones: Array<{
    ddd: string
    numero: string
    tipo: string
  }>
  emails: string[]
  empresasVinculadas: Array<{
    cnpj: string
    razaoSocial: string
    participacao: string
  }>
}
