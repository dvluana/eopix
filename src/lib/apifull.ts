import { isMockMode } from './mock-mode'
import {
  MOCK_APIFULL_CPF_CHUVA,
  MOCK_APIFULL_CPF_SOL,
  MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
  MOCK_APIFULL_CPF_CADASTRAL_SOL,
  MOCK_APIFULL_CNPJ_CHUVA,
  MOCK_APIFULL_CNPJ_SOL,
} from './mocks/apifull-data'

export interface ApiFullCpfResponse {
  name: string
  cleanNameYears: number | null
  recentInquiries: number
  protests: Array<{
    date: string
    amount: number
    registry: string
  }>
  debts: Array<{
    type: string
    amount: number
    origin: string
  }>
  bouncedChecks: number
  totalProtests: number
  totalProtestsAmount: number
  region: string
}

export interface ApiFullCpfCadastralResponse {
  nome: string
  cpf: string
  dataNascimento: string | null
  idade: number | null
  nomeMae: string | null
  sexo: string | null
  signo: string | null
  situacaoRF: string | null // REGULAR, PENDENTE, etc.
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

export interface ApiFullCnpjResponse {
  razaoSocial: string
  cleanNameYears: number | null
  recentInquiries: number
  protests: Array<{
    date: string
    amount: number
    registry: string
  }>
  debts: Array<{
    type: string
    amount: number
    origin: string
  }>
  bouncedChecks: number
  totalProtests: number
  totalProtestsAmount: number
  region: string
}

// CPFs terminados em 0-4 = Chuva, 5-9 = Sol
function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

export async function consultCpf(cpf: string): Promise<ApiFullCpfResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpf: ${cpf}`)
    await new Promise((r) => setTimeout(r, 500)) // simula latencia
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_CHUVA : MOCK_APIFULL_CPF_SOL
  }

  // === CHAMADA REAL - Cred Completa Plus (e-boavista) ===
  // API mais completa que retorna histórico de consultas, protestos e pendências
  const res = await fetch('https://api.apifull.com.br/api/e-boavista', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: cpf, // API e-boavista usa "document" em vez de "cpf"
      link: 'e-boavista',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull CPF raw response:', JSON.stringify(rawData, null, 2))

  // Map API response to our interface
  // The API returns Portuguese field names, we need to normalize them
  return mapCpfResponse(rawData)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfResponse(raw: any): ApiFullCpfResponse {
  // APIFull e-boavista response structure: dados.data.saida
  const saida = raw.dados?.data?.saida || raw.dados || raw

  // Dados de identificação
  const identificacao = saida.Identificacao || {}

  // Calcular total de consultas recentes (últimos 3 meses)
  const consultas = saida.Consultas || {}
  const historicoMeses = consultas.historicoMeses || []
  const mesCorrente = consultas.mesCorrente?.quantidade || 0
  const recentInquiries = mesCorrente + historicoMeses.slice(0, 2).reduce((sum: number, m: { quantidade?: number }) => sum + (m.quantidade || 0), 0)

  // Extract UF/region from Localizacao
  const localizacao = saida.Localizacao || {}
  const region = localizacao.uf || localizacao.estado || identificacao.regiaoCpf?.split(',')[0]?.trim() || ''

  // Mapear débitos/protestos from RegistroDeDebitos
  const registroDebitos = saida.RegistroDeDebitos || {}
  const listaDebitos = registroDebitos.listaDebitos || []

  // Separar protestos e dívidas
  const protests = listaDebitos
    .filter((d: { tipo?: string; tipoOcorrencia?: string }) =>
      (d.tipo || d.tipoOcorrencia || '').toLowerCase().includes('protesto')
    )
    .map((p: { data?: string; dataOcorrencia?: string; valor?: number; cartorio?: string; informante?: string }) => ({
      date: p.data || p.dataOcorrencia || '',
      amount: p.valor || 0,
      registry: p.cartorio || p.informante || '',
    }))

  const debts = listaDebitos
    .filter((d: { tipo?: string; tipoOcorrencia?: string }) =>
      !(d.tipo || d.tipoOcorrencia || '').toLowerCase().includes('protesto')
    )
    .map((d: { tipo?: string; tipoOcorrencia?: string; valor?: number; informante?: string; credor?: string }) => ({
      type: d.tipo || d.tipoOcorrencia || '',
      amount: d.valor || 0,
      origin: d.informante || d.credor || '',
    }))

  // Calcular totais
  const totalProtests = protests.length
  const totalProtestsAmount = protests.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0)

  return {
    name: identificacao.nome || '',
    cleanNameYears: null, // API e-boavista não retorna este campo
    recentInquiries: recentInquiries,
    protests: protests,
    debts: debts,
    bouncedChecks: registroDebitos.totalCheques || 0,
    totalProtests: totalProtests,
    totalProtestsAmount: totalProtestsAmount,
    region: region,
  }
}

export async function consultCpfCadastral(cpf: string): Promise<ApiFullCpfCadastralResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfCadastral: ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_CADASTRAL_CHUVA : MOCK_APIFULL_CPF_CADASTRAL_SOL
  }

  // === CHAMADA REAL - ic-cpf-completo ===
  // API cadastral que retorna dados pessoais, endereços, telefones, emails e empresas vinculadas
  const res = await fetch('https://api.apifull.com.br/api/ic-cpf-completo', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf,
      link: 'ic-cpf-completo',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Cadastral error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Cadastral error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull CPF Cadastral raw response:', JSON.stringify(rawData, null, 2))

  return mapCpfCadastralResponse(rawData, cpf)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfCadastralResponse(raw: any, cpf: string): ApiFullCpfCadastralResponse {
  // APIFull ic-cpf-completo response structure: dados.CREDCADASTRAL
  const credCadastral = raw.dados?.CREDCADASTRAL || raw.dados || raw

  // Identificação da pessoa física
  const identificacao = credCadastral.IDENTIFICACAO_PESSOA_FISICA || {}

  // Mapear endereços from SOMENTE_ENDERECO.DADOS[]
  const enderecosData = credCadastral.SOMENTE_ENDERECO?.DADOS || []
  const enderecos = (Array.isArray(enderecosData) ? enderecosData : [])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { ENDERECO?: string; NUMERO?: string; COMPLEMENTO?: string; BAIRRO?: string; CIDADE?: string; UF?: string; CEP?: string }) => ({
      logradouro: e.ENDERECO || '',
      numero: e.NUMERO || '',
      complemento: e.COMPLEMENTO || '',
      bairro: e.BAIRRO || '',
      cidade: e.CIDADE || '',
      uf: e.UF || '',
      cep: e.CEP || '',
    }))

  // Mapear telefones from SOMENTE_TELEFONE.DADOS[]
  const telefonesData = credCadastral.SOMENTE_TELEFONE?.DADOS || []
  const telefones = (Array.isArray(telefonesData) ? telefonesData : [])
    .filter((t: unknown) => t !== null && t !== undefined)
    .map((t: { DDD?: string; NUM_TELEFONE?: string; TIPO_TELEFONE?: string }) => ({
      ddd: t.DDD || '',
      numero: t.NUM_TELEFONE || '',
      tipo: t.TIPO_TELEFONE || 'Fixo',
    }))

  // Mapear emails from EMAILS.INFOEMAILS[]
  const emailsData = credCadastral.EMAILS?.INFOEMAILS || []
  const emails: string[] = (Array.isArray(emailsData) ? emailsData : [])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { ENDERECO?: string }) => e.ENDERECO || '')
    .filter((e: string) => e !== '')

  // Mapear empresas vinculadas from PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[]
  const empresasData = credCadastral.PARTICIPACAO_EM_EMPRESAS?.OCORRENCIAS || []
  const empresasVinculadas = (Array.isArray(empresasData) ? empresasData : [])
    .map((emp: { CNPJ?: string; RAZAO_SOCIAL?: string; PARTICIPANTE_TIPO?: string; PARTICIPANTE_CARGO?: string }) => ({
      cnpj: emp.CNPJ || '',
      razaoSocial: emp.RAZAO_SOCIAL || '',
      participacao: emp.PARTICIPANTE_TIPO || emp.PARTICIPANTE_CARGO || 'Sócio',
    }))

  // Parse data de nascimento (formato DD/MM/YYYY)
  let dataNascimento: string | null = null
  let idade: number | null = null
  const nascimentoRaw = identificacao.NASCIMENTO || null
  if (nascimentoRaw) {
    // Converter de DD/MM/YYYY para YYYY-MM-DD
    const parts = nascimentoRaw.split('/')
    if (parts.length === 3) {
      dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
      const birthDate = new Date(dataNascimento)
      if (!isNaN(birthDate.getTime())) {
        const today = new Date()
        idade = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          idade--
        }
      }
    }
  }

  return {
    nome: identificacao.NOME || '',
    cpf: cpf,
    dataNascimento: dataNascimento,
    idade: idade,
    nomeMae: identificacao.MAE || null,
    sexo: identificacao.SEXO || null,
    signo: null, // API não retorna signo
    situacaoRF: identificacao.CPF_SITUACAO || null,
    enderecos: enderecos,
    telefones: telefones,
    emails: emails,
    empresasVinculadas: empresasVinculadas,
  }
}

export async function consultCnpj(cnpj: string): Promise<ApiFullCnpjResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCnpj: ${cnpj}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cnpj) ? MOCK_APIFULL_CNPJ_CHUVA : MOCK_APIFULL_CNPJ_SOL
  }

  // === CHAMADA REAL (Parte B) ===
  // Endpoint correto: POST com body JSON contendo cnpj e link
  const res = await fetch('https://api.apifull.com.br/api/cnpj', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cnpj: cnpj,
      link: 'cnpj',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CNPJ error: ${res.status}`, errorText)
    throw new Error(`APIFull CNPJ error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull CNPJ raw response:', JSON.stringify(rawData, null, 2))

  return mapCnpjResponse(rawData)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCnpjResponse(raw: any): ApiFullCnpjResponse {
  // APIFull response has data nested in "dados" object
  const data = raw.dados || raw

  // Extract UF/region from address if available
  const endereco = data.endereco || data.enderecos?.[0] || {}
  const region = endereco.uf || endereco.estado || data.uf || data.estado || ''

  return {
    razaoSocial: data.razaoSocial || data.razao_social || data.nome || '',
    cleanNameYears: data.anosNomeLimpo || data.tempoNomeLimpo || null,
    recentInquiries: data.consultasRecentes || data.qtdConsultas || 0,
    protests: (data.protestos || []).map((p: { data?: string; dataProtesto?: string; valor?: number; valorProtesto?: number; cartorio?: string }) => ({
      date: p.data || p.dataProtesto || '',
      amount: p.valor || p.valorProtesto || 0,
      registry: p.cartorio || '',
    })),
    debts: (data.dividas || data.pendenciasFinanceiras || []).map((d: { tipo?: string; descricao?: string; valor?: number; origem?: string; credor?: string }) => ({
      type: d.tipo || d.descricao || '',
      amount: d.valor || 0,
      origin: d.origem || d.credor || '',
    })),
    bouncedChecks: data.chequesDevolvidos || data.chequesSemFundo || 0,
    totalProtests: data.totalProtestos || data.qtdProtestos || (data.protestos?.length || 0),
    totalProtestsAmount: data.valorTotalProtestos || 0,
    region: region,
  }
}
