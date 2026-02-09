import { isMockMode } from './mock-mode'
import {
  MOCK_GOOGLE_SOL,
  MOCK_GOOGLE_CHUVA,
  MOCK_GOOGLE_CPF_SOL,
  MOCK_GOOGLE_CPF_CHUVA,
} from './mocks/google-data'
import type { GoogleSearchResult, GoogleSearchResponse } from '@/types/report'

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

/**
 * Busca na web usando Serper API
 *
 * 3 queries para CPF e CNPJ:
 * 1. byDocument: busca pelo CPF/CNPJ formatado
 * 2. byName: busca pelo nome + termos negativos (golpe, fraude, processo, reclamacao)
 * 3. reclameAqui: busca no Reclame Aqui (CPF e CNPJ - pessoa pode ter empresa)
 */
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

  // Formatar documento para busca
  const formattedDoc = type === 'CPF'
    ? document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  // Executar 3 buscas em paralelo
  const [byDocument, byName, reclameAqui] = await Promise.all([
    // Busca 1: Por documento formatado
    executeSearch(`"${formattedDoc}"`),

    // Busca 2: Por nome + termos negativos
    executeSearch(`"${name}" golpe OR fraude OR processo OR reclamacao`),

    // Busca 3: Reclame Aqui (CPF e CNPJ - pessoa pode ter empresa)
    executeSearch(`"${name}" site:reclameaqui.com.br`),
  ])

  console.log(`🔍 Serper: byDocument=${byDocument.length}, byName=${byName.length}, reclameAqui=${reclameAqui.length}`)

  return { byDocument, byName, reclameAqui }
}
