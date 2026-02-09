import OpenAI from 'openai'
import { isMockMode } from './mock-mode'
import {
  MOCK_OPENAI_PROCESSOS_CHUVA,
  MOCK_OPENAI_PROCESSOS_SOL,
  MOCK_OPENAI_SUMMARY_SOL_CPF,
  MOCK_OPENAI_SUMMARY_SOL_CNPJ,
  MOCK_OPENAI_SUMMARY_CHUVA_CPF,
  MOCK_OPENAI_SUMMARY_CHUVA_CNPJ,
} from './mocks/openai-data'
import type {
  ProcessoRaw,
  ProcessAnalysis,
  MentionClassification,
  ReclameAquiData,
  GoogleSearchResult,
  FinancialSummary,
} from '@/types/report'

// ========== TIPOS DE RESPOSTA ==========

export interface ProcessosAnalysisResponse {
  processAnalysis: ProcessAnalysis[]
}

export interface MentionsSummaryResponse {
  summary: string
  mentionClassifications: MentionClassification[]
  reclameAqui: ReclameAquiData | null
}

// Resposta combinada para compatibilidade com código existente
export interface SummaryResponse {
  summary: string
  mentionClassifications: MentionClassification[]
  reclameAqui?: ReclameAquiData
  processAnalysis?: ProcessAnalysis[]
}

// ========== HELPERS ==========

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// ========== IA 1: ANALISE DE PROCESSOS ==========

/**
 * Analisa processos judiciais e classifica por relevancia para negocios.
 * So deve ser chamada se houver processos para analisar.
 */
export async function analyzeProcessos(
  processos: ProcessoRaw[],
  document: string
): Promise<ProcessosAnalysisResponse> {
  if (isMockMode) {
    console.log(`[MOCK] OpenAI analyzeProcessos: ${processos.length} processos`)
    await new Promise((r) => setTimeout(r, 600))
    return isChuvaScenario(document) ? MOCK_OPENAI_PROCESSOS_CHUVA : MOCK_OPENAI_PROCESSOS_SOL
  }

  if (processos.length === 0) {
    return { processAnalysis: [] }
  }

  const prompt = `Voce e um assistente de analise de risco para decisao de negocios.

Para cada processo judicial, retorne:
1. tituloSimplificado: frase curta em linguagem simples (ex: "Processado por fraude")
2. descricaoBreve: 1 frase explicando (ex: "Acusacao de nao entregar servico")
3. relevanciaNegocios: alta | media | baixa | nenhuma
4. categoriaSimplificada: fraude | divida_fiscal | trabalhista_empregador | trabalhista_empregado | criminal | comercial | acidente | familia | outro

REGRAS DE RELEVANCIA:
- ALTA: fraude, estelionato, crimes financeiros, lavagem de dinheiro
- MEDIA: execucoes fiscais, falencia, recuperacao judicial
- BAIXA: acoes civeis comuns, trabalhista como empregador
- NENHUMA: testemunha, acidente de transito, familia, trabalhista como empregado

Processos para analisar:
${JSON.stringify(processos, null, 2)}

Responda em JSON:
{
  "processAnalysis": [
    {
      "numeroProcesso": "...",
      "tituloSimplificado": "...",
      "descricaoBreve": "...",
      "relevanciaNegocios": "alta|media|baixa|nenhuma",
      "categoriaSimplificada": "fraude|divida_fiscal|trabalhista_empregador|trabalhista_empregado|criminal|comercial|acidente|familia|outro",
      "tribunal": "...",
      "data": "YYYY-MM-DD",
      "status": "em_andamento|arquivado"
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('OpenAI returned empty response for processos analysis')
  }

  return JSON.parse(content)
}

// ========== IA 2: MENCOES + RESUMO FINAL ==========

interface MentionsSummaryInput {
  mentions: GoogleSearchResult[]
  financialSummary: FinancialSummary
  processAnalysis: ProcessAnalysis[]
  type: 'CPF' | 'CNPJ'
  region: string
}

/**
 * Analisa mencoes na web e gera resumo final para decisao de negocios.
 * Sempre deve ser chamada, mesmo sem processos.
 */
export async function analyzeMentionsAndSummary(
  input: MentionsSummaryInput,
  document: string
): Promise<MentionsSummaryResponse> {
  if (isMockMode) {
    console.log(`[MOCK] OpenAI analyzeMentionsAndSummary: ${input.type} (${input.region})`)
    await new Promise((r) => setTimeout(r, 600))

    const mockData = input.type === 'CPF'
      ? (isChuvaScenario(document) ? MOCK_OPENAI_SUMMARY_CHUVA_CPF : MOCK_OPENAI_SUMMARY_SOL_CPF)
      : (isChuvaScenario(document) ? MOCK_OPENAI_SUMMARY_CHUVA_CNPJ : MOCK_OPENAI_SUMMARY_SOL_CNPJ)

    return {
      summary: mockData.summary,
      mentionClassifications: mockData.mentionClassifications.map((m) => ({
        ...m,
        relevant: true,
      })),
      reclameAqui: mockData.reclameAqui || null,
    }
  }

  const { mentions, financialSummary, processAnalysis, type, region } = input

  // Contar processos de alto risco
  const countAltoRisco = processAnalysis.filter((p) => p.relevanciaNegocios === 'alta').length

  const prompt = `Voce e um assistente de analise de risco para decisao de negocios.
O usuario quer saber: "Posso fechar negocio com essa pessoa/empresa?"

TAREFA 1 - CLASSIFICAR MENCOES:
O ${type} e da regiao ${region}. Ignore homonimos de outras regioes.

Para cada mencao na web:
- relevant: true se e sobre a pessoa/empresa consultada, false se for homonimo
- classification: positive | neutral | negative
- reason: breve explicacao (1 frase)

Mencoes para analisar:
${JSON.stringify(mentions, null, 2)}

TAREFA 2 - EXTRAIR DADOS RECLAME AQUI:
Se houver resultados do Reclame Aqui nas mencoes, extraia:
- nota: numero de 0 a 10 (padrao "Nota X.X", "X.X/10")
- indiceResolucao: percentual inteiro (padrao "respondeu X%", "resolucao X%")
- totalReclamacoes: numero total (padrao "X reclamacoes")
- respondidas: numero respondidas
- seloRA1000: true se mencionar "RA1000" ou "selo RA 1000"
- url: primeira URL do Reclame Aqui

TAREFA 3 - GERAR RESUMO:
Com base em TODOS os dados abaixo, gere um resumo de 2-3 frases para decisao de negocio:
- Processos de alto risco: ${countAltoRisco}
- Total de processos analisados: ${processAnalysis.length}
- Protestos: ${financialSummary.totalProtestos} (R$ ${financialSummary.valorTotalProtestos.toLocaleString('pt-BR')})
- Dividas/Pendencias: ${financialSummary.totalDividas} (R$ ${financialSummary.valorTotalDividas.toLocaleString('pt-BR')})
- Cheques sem fundo: ${financialSummary.chequesSemFundo}

Seja objetivo e factual. Foco em decisao de negocio.

Responda em JSON:
{
  "mentionClassifications": [
    { "url": "...", "relevant": true|false, "classification": "positive|neutral|negative", "reason": "..." }
  ],
  "summary": "resumo de 2-3 frases",
  "reclameAqui": {
    "nota": null ou numero,
    "indiceResolucao": null ou numero inteiro,
    "totalReclamacoes": null ou numero,
    "respondidas": null ou numero,
    "seloRA1000": false ou true,
    "url": null ou "https://..."
  }
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('OpenAI returned empty response for mentions/summary analysis')
  }

  return JSON.parse(content)
}

// ========== FUNCAO COMBINADA (compatibilidade) ==========

/**
 * Funcao combinada para compatibilidade com codigo existente.
 * Chama as duas IAs em sequencia e combina os resultados.
 */
export async function generateSummary(
  data: Record<string, unknown>,
  type: 'CPF' | 'CNPJ',
  region: string,
  document: string
): Promise<SummaryResponse> {
  if (isMockMode) {
    console.log(`[MOCK] OpenAI generateSummary: ${type} (${region})`)
    await new Promise((r) => setTimeout(r, 800))

    if (type === 'CPF') {
      return isChuvaScenario(document)
        ? MOCK_OPENAI_SUMMARY_CHUVA_CPF
        : MOCK_OPENAI_SUMMARY_SOL_CPF
    }
    return isChuvaScenario(document)
      ? MOCK_OPENAI_SUMMARY_CHUVA_CNPJ
      : MOCK_OPENAI_SUMMARY_SOL_CNPJ
  }

  // Extrair processos dos dados
  const processos: ProcessoRaw[] = (data.processes as ProcessoRaw[]) || []

  // IA 1: Analisar processos (se houver)
  let processAnalysis: ProcessAnalysis[] = []
  if (processos.length > 0) {
    const processosResult = await analyzeProcessos(processos, document)
    processAnalysis = processosResult.processAnalysis
  }

  // Extrair mencoes do Google
  const google = data.google as { byDocument?: GoogleSearchResult[]; byName?: GoogleSearchResult[]; reclameAqui?: GoogleSearchResult[] } | undefined
  const mentions: GoogleSearchResult[] = [
    ...(google?.byDocument || []),
    ...(google?.byName || []),
    ...(google?.reclameAqui || []),
  ]

  // Construir resumo financeiro a partir dos dados
  const apiFull = data.apiFull as { totalProtests?: number; valorTotalProtests?: number; totalDebts?: number; valorTotalDebts?: number; bounceChecks?: number } | undefined
  const cnpjFinancial = data.cnpjFinancial as { totalProtests?: number; valorTotalProtests?: number; totalDebts?: number; valorTotalDebts?: number; bounceChecks?: number } | undefined
  const cadastral = data.cadastral as { _scoreInterno?: number | null } | undefined

  const financialData = cnpjFinancial || apiFull
  const financialSummary: FinancialSummary = {
    totalProtestos: financialData?.totalProtests || 0,
    valorTotalProtestos: financialData?.valorTotalProtests || 0,
    totalDividas: financialData?.totalDebts || 0,
    valorTotalDividas: financialData?.valorTotalDebts || 0,
    chequesSemFundo: financialData?.bounceChecks || 0,
    _scoreInterno: cadastral?._scoreInterno ?? null,
  }

  // IA 2: Analisar mencoes e gerar resumo
  const mentionsSummary = await analyzeMentionsAndSummary({
    mentions,
    financialSummary,
    processAnalysis,
    type,
    region,
  }, document)

  return {
    summary: mentionsSummary.summary,
    mentionClassifications: mentionsSummary.mentionClassifications,
    reclameAqui: mentionsSummary.reclameAqui || undefined,
    processAnalysis: processAnalysis,
  }
}
