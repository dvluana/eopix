import { isMockMode } from './mock-mode'
import { MOCK_ESCAVADOR_CHUVA, MOCK_ESCAVADOR_SOL } from './mocks/escavador-data'

export interface EscavadorProcess {
  tribunal: string
  date: string
  classe: string
  polo: string
  number?: string
}

export interface EscavadorResponse {
  totalCount: number
  processes: EscavadorProcess[]
}

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

export async function searchProcesses(
  name: string,
  document: string
): Promise<EscavadorResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Escavador searchProcesses: ${name} (${document})`)
    await new Promise((r) => setTimeout(r, 600))
    return isChuvaScenario(document) ? MOCK_ESCAVADOR_CHUVA : MOCK_ESCAVADOR_SOL
  }

  // === CHAMADA REAL (Parte B) ===
  const res = await fetch('https://api.escavador.com/v1/busca', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.ESCAVADOR_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nome: name,
      documento: document,
    }),
  })

  if (!res.ok) {
    throw new Error(`Escavador error: ${res.status}`)
  }

  return res.json()
}
