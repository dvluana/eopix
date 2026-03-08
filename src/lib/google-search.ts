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

/**
 * Simplifica razao social para buscas mais eficazes.
 * Remove sufixos juridicos (S/A, LTDA, etc.) e status (EM LIQUIDACAO, etc.)
 * Converte para title case.
 */
export function simplifyCompanyName(name: string): string {
  let simplified = name
    // Remove status juridicos (antes dos sufixos para pegar "S/A - EM LIQUIDACAO")
    .replace(/\s*-?\s*EM\s+(LIQUIDACAO\s+EXTRAJUDICIAL|RECUPERACAO\s+JUDICIAL|FALENCIA)\s*/gi, '')
    // Remove sufixos juridicos
    .replace(/\s+(S\/A|S\.A\.|SA|LTDA|ME|MEI|EIRELI|EPP)\.?\s*$/gi, '')
    // Remove tracos e espacos finais
    .replace(/[\s-]+$/, '')
    .trim()

  // Title case
  simplified = simplified
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return simplified
}

// Fetch with timeout — prevents hanging when external APIs are slow
// 8s default to stay within Vercel Hobby's 10s function limit
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function executeSearch(query: string): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.error('Serper API key not configured')
    return []
  }

  const res = await fetchWithTimeout('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10, gl: 'br', hl: 'pt-br' }),
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
 * 4 queries para CPF e CNPJ:
 * 1. byDocument: busca pelo CPF/CNPJ formatado
 * 2. byName: busca pelo nome + termos de risco (escândalo, investigação, denúncia, etc.)
 * 3. reclameAqui: busca no Reclame Aqui (CPF e CNPJ - pessoa pode ter empresa)
 * 4. news: busca aberta por nome (sem filtros — Google retorna os mais relevantes)
 *
 * CNPJ: nome simplificado (remove S/A, LTDA, EM LIQUIDACAO, etc.)
 * CPF: nome completo (sem alteração)
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

  // Simplificar nome para CNPJ (remover S/A, LTDA, EM LIQUIDACAO, etc.)
  const searchName = type === 'CNPJ' ? simplifyCompanyName(name) : name

  // Executar 4 buscas em paralelo
  const [byDocument, byName, reclameAqui, news] = await Promise.all([
    // Busca 1: Por documento formatado
    executeSearch(`"${formattedDoc}"`),

    // Busca 2: Por nome + termos de risco
    executeSearch(`"${searchName}" escândalo OR investigação OR denúncia OR irregularidade OR fraude OR lavagem`),

    // Busca 3: Reclame Aqui
    executeSearch(`"${searchName}" site:reclameaqui.com.br`),

    // Busca 4: Busca aberta por nome (sem filtros — Google retorna os mais relevantes)
    executeSearch(`"${searchName}"`),
  ])

  console.log(`🔍 Serper: byDocument=${byDocument.length}, byName=${byName.length}, reclameAqui=${reclameAqui.length}, news=${news.length}`)

  return { byDocument, byName, reclameAqui, news }
}
