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

// API gratuita do CNJ - complementa o Escavador
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
  // Endpoint: https://api-publica.datajud.cnj.jus.br/
  // Autenticação: APIKey pública do CNJ (pode mudar, verificar Wiki do Datajud)
  // Ref: https://datajud-wiki.cnj.jus.br/api-publica/
  const DATAJUD_API_KEY = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

  const res = await fetch(
    `https://api-publica.datajud.cnj.jus.br/api_publica_trf1/_search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APIKey ${DATAJUD_API_KEY}`,
      },
      body: JSON.stringify({
        query: {
          bool: {
            should: [
              { match: { 'nomeParte': name } },
              { match: { 'numeroDocumentoPrincipal': document } },
            ],
          },
        },
        size: 100,
      }),
    }
  )

  if (!res.ok) {
    // Datajud nao e critica - retorna vazio se falhar
    console.error(`Datajud error: ${res.status}`)
    return { processes: [] }
  }

  const data = await res.json()

  // Parsear resposta do ElasticSearch
  const processes: DatajudProcess[] = (data.hits?.hits || []).map((hit: Record<string, unknown>) => {
    const source = hit._source as Record<string, unknown>
    return {
      tribunal: (source.siglaTribunal as string) || '',
      number: (source.numeroProcesso as string) || '',
      date: (source.dataAjuizamento as string) || '',
      classe: (source.classeProcessual as string) || '',
      polo: 'Parte',
    }
  })

  return { processes }
}
