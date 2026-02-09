import { isMockMode } from './mock-mode'
import { MOCK_ESCAVADOR_CHUVA, MOCK_ESCAVADOR_SOL } from './mocks/escavador-data'

export interface EscavadorProcess {
  tribunal: string
  date: string
  classe: string
  polo: string
  number?: string
  // Campos extras da APIFull
  status?: string
  assunto?: string
  uf?: string
}

export interface EscavadorResponse {
  totalCount: number
  processes: EscavadorProcess[]
}

// Interface para resposta raw da APIFull r-acoes-e-processos-judiciais
interface ApiFullProcessosResponse {
  status: string
  dados?: {
    data?: {
      acoesProcessos?: {
        statusRetorno?: number
        acoes?: {
          possuiErro?: boolean
          documentoNaoEncontrado?: boolean
          processos?: Array<{
            tribunal?: string
            uf?: string
            numeroProcessoUnico?: string
            dataDistribuicao?: string
            classeProcessual?: {
              nome?: string
            }
            informacoesPartePessoaConsultada?: Array<{
              tipo?: string
              polo?: string
            }>
            assuntosCNJ?: Array<{
              titulo?: string
              principal?: boolean
            }>
            statusPj?: {
              statusProcesso?: string
            }
          }>
        }
      }
    }
  }
}

function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

/**
 * Mapeia a resposta da APIFull para nosso formato interno
 */
function mapApiFullResponse(raw: ApiFullProcessosResponse): EscavadorResponse {
  const processes: EscavadorProcess[] = []

  const acoes = raw.dados?.data?.acoesProcessos?.acoes

  // Se não encontrou ou erro, retorna vazio
  if (!acoes || acoes.possuiErro || acoes.documentoNaoEncontrado) {
    return { totalCount: 0, processes: [] }
  }

  const processosList = acoes.processos || []

  for (const proc of processosList) {
    // Pegar o polo da pessoa consultada
    const partInfo = proc.informacoesPartePessoaConsultada?.[0]
    const polo = partInfo?.tipo || partInfo?.polo || 'Parte'

    // Pegar assunto principal
    const assuntoPrincipal = proc.assuntosCNJ?.find(a => a.principal)?.titulo
      || proc.assuntosCNJ?.[0]?.titulo
      || ''

    processes.push({
      tribunal: proc.tribunal || '',
      date: proc.dataDistribuicao?.split(' ')[0] || '', // Remove hora
      classe: proc.classeProcessual?.nome || '',
      polo: polo,
      number: proc.numeroProcessoUnico,
      status: proc.statusPj?.statusProcesso,
      assunto: assuntoPrincipal,
      uf: proc.uf,
    })
  }

  return {
    totalCount: processosList.length,
    processes,
  }
}

/**
 * Busca processos judiciais usando a APIFull (substitui Escavador)
 * Endpoint: r-acoes-e-processos-judiciais
 */
export async function searchProcesses(
  name: string,
  document: string
): Promise<EscavadorResponse> {
  if (isMockMode) {
    console.log(`[MOCK] Processos searchProcesses: ${name} (${document})`)
    await new Promise((r) => setTimeout(r, 600))
    return isChuvaScenario(document) ? MOCK_ESCAVADOR_CHUVA : MOCK_ESCAVADOR_SOL
  }

  // === CHAMADA REAL - APIFull r-acoes-e-processos-judiciais ===
  // Substitui o Escavador por consolidar em um único provedor
  const cleanDoc = document.replace(/\D/g, '') // Remove pontuação

  const res = await fetch('https://api.apifull.com.br/api/r-acoes-e-processos-judiciais', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cleanDoc,
      link: 'r-acoes-e-processos-judiciais',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    // Se sem saldo ou outro erro, retorna vazio ao invés de quebrar
    if (res.status === 400 && errorText.includes('saldo')) {
      console.warn('[APIFull Processos] Sem saldo disponível')
      return { totalCount: 0, processes: [] }
    }
    console.error(`APIFull Processos error: ${res.status}`, errorText)
    return { totalCount: 0, processes: [] }
  }

  const rawData: ApiFullProcessosResponse = await res.json()
  console.log('🔍 [DEBUG] APIFull Processos raw response keys:', Object.keys(rawData.dados?.data || {}))

  return mapApiFullResponse(rawData)
}
