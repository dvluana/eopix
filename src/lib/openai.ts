import OpenAI from 'openai'
import { isMockMode } from './mock-mode'
import {
  MOCK_OPENAI_SUMMARY_SOL_CPF,
  MOCK_OPENAI_SUMMARY_SOL_CNPJ,
  MOCK_OPENAI_SUMMARY_CHUVA_CPF,
  MOCK_OPENAI_SUMMARY_CHUVA_CNPJ,
} from './mocks/openai-data'

export interface MentionClassification {
  url: string
  classification: 'positive' | 'neutral' | 'negative'
  reason: string
}

export interface SummaryResponse {
  summary: string
  mentionClassifications: MentionClassification[]
}

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

  // === CHAMADA REAL (Parte B) ===
  const prompt = `Voce e um assistente neutro. Liste fatos. Nao use adjetivos. Nao faca recomendacoes.
Apenas resuma os dados encontrados.

Quando nao houver ocorrencias negativas, destaque dados positivos factuais:
tempo de nome limpo, tempo de empresa ativa, mencoes positivas, nota Reclame Aqui.
Dados positivos sao fatos, nao elogios.

Classifique cada mencao da web como "positive", "neutral" ou "negative".
Retorne as classificacoes no campo mentionClassifications.

O ${type} e da regiao ${region}. Ignore noticias de outros estados para evitar homonimos.

Dados para analisar:
${JSON.stringify(data, null, 2)}

Responda em JSON com o formato:
{
  "summary": "resumo de 2-3 frases",
  "mentionClassifications": [
    { "url": "...", "classification": "positive|neutral|negative", "reason": "..." }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0].message.content
  if (!content) {
    throw new Error('OpenAI returned empty response')
  }

  return JSON.parse(content)
}
