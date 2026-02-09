import { isMockMode } from './mock-mode'
import { MOCK_DATAJUD_CHUVA, MOCK_DATAJUD_SOL } from './mocks/datajud-data'

export interface DatajudProcess {
  tribunal: string
  number: string
  date: string
  classe: string
  polo: string
}

export interface DatajudResponse {
  processes: DatajudProcess[]
}

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

// Lista de tribunais para consultar
// Priorizando os mais relevantes para cobertura nacional
const TRIBUNALS = [
  // Estaduais - maiores volumes
  'api_publica_tjsp',  // São Paulo
  'api_publica_tjmg',  // Minas Gerais
  'api_publica_tjrj',  // Rio de Janeiro
  'api_publica_tjrs',  // Rio Grande do Sul
  'api_publica_tjpr',  // Paraná
  'api_publica_tjsc',  // Santa Catarina
  'api_publica_tjba',  // Bahia
  'api_publica_tjpe',  // Pernambuco
  'api_publica_tjce',  // Ceará
  'api_publica_tjgo',  // Goiás
  'api_publica_tjdf',  // Distrito Federal
  // Federais
  'api_publica_trf1',  // Federal Região 1 (DF, GO, MG, BA, etc.)
  'api_publica_trf2',  // Federal Região 2 (RJ, ES)
  'api_publica_trf3',  // Federal Região 3 (SP, MS)
  'api_publica_trf4',  // Federal Região 4 (RS, PR, SC)
  'api_publica_trf5',  // Federal Região 5 (PE, AL, CE, etc.)
  // Trabalhistas - principais
  'api_publica_trt2',  // Trabalhista SP
  'api_publica_trt3',  // Trabalhista MG
  'api_publica_trt1',  // Trabalhista RJ
  'api_publica_trt4',  // Trabalhista RS
  'api_publica_trt15', // Trabalhista Campinas
]

// API gratuita do CNJ - consulta múltiplos tribunais em paralelo
export async function searchDatajud(
  name: string,
  document: string
): Promise<DatajudResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Datajud searchDatajud: ${name} (${document})`)
    await new Promise((r) => setTimeout(r, 400))
    return isChuvaScenario(document) ? MOCK_DATAJUD_CHUVA : MOCK_DATAJUD_SOL
  }

  // === CHAMADA REAL (API publica do CNJ) ===
  // Consulta múltiplos tribunais em paralelo para melhor cobertura
  const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

  console.log(`🔍 [Datajud] Consultando ${TRIBUNALS.length} tribunais para: ${name} (${document})`)

  // Consultar todos os tribunais em paralelo
  const results = await Promise.allSettled(
    TRIBUNALS.map(tribunal => fetchTribunal(tribunal, name, document, DATAJUD_API_KEY))
  )

  // Agregar resultados de todos os tribunais
  const allProcesses: DatajudProcess[] = []
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const tribunal = TRIBUNALS[i]

    if (result.status === 'fulfilled') {
      successCount++
      allProcesses.push(...result.value)
    } else {
      errorCount++
      console.warn(`[Datajud] Erro em ${tribunal}:`, result.reason?.message || result.reason)
    }
  }

  console.log(`🔍 [Datajud] Consultas: ${successCount} OK, ${errorCount} erros. Total processos: ${allProcesses.length}`)

  // Deduplicar por número do processo
  const seenNumbers = new Set<string>()
  const uniqueProcesses = allProcesses.filter(p => {
    const key = p.number || `${p.tribunal}-${p.date}-${p.classe}`
    if (seenNumbers.has(key)) return false
    seenNumbers.add(key)
    return true
  })

  console.log(`🔍 [Datajud] Processos únicos após deduplicação: ${uniqueProcesses.length}`)

  return { processes: uniqueProcesses }
}

/**
 * Consulta um tribunal específico
 */
async function fetchTribunal(
  tribunal: string,
  name: string,
  document: string,
  apiKey: string
): Promise<DatajudProcess[]> {
  const cleanDoc = document.replace(/\D/g, '') // Remove pontuação

  const res = await fetch(
    `https://api-publica.datajud.cnj.jus.br/${tribunal}/_search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APIKey ${apiKey}`,
      },
      body: JSON.stringify({
        query: {
          bool: {
            should: [
              { match: { 'nomeParte': name } },
              { match: { 'numeroDocumentoPrincipal': cleanDoc } },
            ],
            minimum_should_match: 1,
          },
        },
        size: 100, // Limite por tribunal
        _source: ['siglaTribunal', 'numeroProcesso', 'dataAjuizamento', 'classeProcessual', 'polo'],
      }),
    }
  )

  if (!res.ok) {
    // Alguns tribunais podem não estar disponíveis - não é crítico
    if (res.status === 404 || res.status === 503) {
      return [] // Tribunal indisponível
    }
    throw new Error(`${tribunal}: ${res.status}`)
  }

  const data = await res.json()

  // Parsear resposta do ElasticSearch
  const processes: DatajudProcess[] = (data.hits?.hits || []).map((hit: Record<string, unknown>) => {
    const source = hit._source as Record<string, unknown>
    return {
      tribunal: (source.siglaTribunal as string) || tribunal.replace('api_publica_', '').toUpperCase(),
      number: (source.numeroProcesso as string) || '',
      date: (source.dataAjuizamento as string) || '',
      classe: (source.classeProcessual as string) || '',
      polo: (source.polo as string) || 'Parte',
    }
  })

  return processes
}
