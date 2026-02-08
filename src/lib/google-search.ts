import { isMockMode } from './mock-mode'
import {
  MOCK_GOOGLE_SOL,
  MOCK_GOOGLE_CHUVA,
  MOCK_GOOGLE_CPF_SOL,
  MOCK_GOOGLE_CPF_CHUVA,
} from './mocks/google-data'

export interface GoogleSearchResult {
  title: string
  url: string
  snippet: string
  classification?: 'positive' | 'neutral' | 'negative'
}

export interface GoogleSearchResponse {
  general: GoogleSearchResult[]
  focused: GoogleSearchResult[]
  reclameAqui: GoogleSearchResult[]
}

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

async function executeSearch(query: string): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.error('Serper API key not configured')
    return []
  }

  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10 }),
  })

  if (!res.ok) {
    console.error(`Serper error: ${res.status}`)
    return []
  }

  const data = await res.json()

  return (data.organic || []).map((item: { title: string; link: string; snippet: string }) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
  }))
}

export async function searchWeb(
  name: string,
  document: string,
  type: 'CPF' | 'CNPJ'
): Promise<GoogleSearchResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Serper searchWeb: ${name} (${document})`)
    await new Promise((r) => setTimeout(r, 700))

    if (type === 'CPF') {
      return isChuvaScenario(document) ? MOCK_GOOGLE_CPF_CHUVA : MOCK_GOOGLE_CPF_SOL
    }
    return isChuvaScenario(document) ? MOCK_GOOGLE_CHUVA : MOCK_GOOGLE_SOL
  }

  // === CHAMADA REAL (Serper API) ===
  // Busca geral
  const general = await executeSearch(`"${name}"`)

  // Busca focada (termos negativos)
  const focused = await executeSearch(`"${name}" golpe OR fraude OR processo`)

  // Busca Reclame Aqui (apenas CNPJ)
  let reclameAqui: GoogleSearchResult[] = []
  if (type === 'CNPJ') {
    reclameAqui = await executeSearch(`"${name}" site:reclameaqui.com.br`)
  }

  return { general, focused, reclameAqui }
}
