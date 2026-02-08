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
  // APIFull Cred Completa Plus (e-boavista) response structure
  const data = raw.dados || raw

  // Calcular total de consultas recentes (últimos 3 meses)
  // historicoConsultasResumo.totaisHistoricoConsultas é um array com totais por mês
  const historicoResumo = data.historicoConsultasResumo?.totaisHistoricoConsultas || []
  const recentInquiries = historicoResumo.slice(0, 3).reduce((sum: number, val: number) => sum + val, 0)

  // Extract UF/region from address if available
  const endereco = data.endereco || data.enderecos?.[0] || {}
  const region = endereco.uf || endereco.estado || data.uf || data.estado || ''

  // Mapear protestos - pode vir em diferentes formatos
  const protestosRaw = data.protestos || data.cenprot?.protestos || []
  const protests = protestosRaw.map((p: { data?: string; dataProtesto?: string; dataOcorrencia?: string; valor?: number; valorProtesto?: number; cartorio?: string; nomeCartorio?: string }) => ({
    date: p.data || p.dataProtesto || p.dataOcorrencia || '',
    amount: p.valor || p.valorProtesto || 0,
    registry: p.cartorio || p.nomeCartorio || '',
  }))

  // Mapear dívidas/pendências financeiras
  const dividasRaw = data.pendenciasFinanceiras || data.dividas || data.pefin || []
  const debts = dividasRaw.map((d: { tipo?: string; descricao?: string; natureza?: string; valor?: number; origem?: string; credor?: string; informante?: string }) => ({
    type: d.tipo || d.descricao || d.natureza || '',
    amount: d.valor || 0,
    origin: d.origem || d.credor || d.informante || '',
  }))

  // Calcular totais de protestos
  const totalProtests = data.totalProtestos || data.cenprot?.quantidadeProtestos || protests.length
  const totalProtestsAmount = data.valorTotalProtestos || data.cenprot?.valorTotalProtestos || 0

  return {
    name: data.nome || data.name || '',
    cleanNameYears: null, // API e-boavista não retorna este campo
    recentInquiries: recentInquiries,
    protests: protests,
    debts: debts,
    bouncedChecks: data.chequesDevolvidos || data.chequesSemFundo || data.ccf?.quantidade || 0,
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
  const data = raw.dados || raw

  // Mapear endereços
  const enderecosRaw = data.enderecos || data.endereco ? [data.endereco] : []
  const enderecos = (Array.isArray(enderecosRaw) ? enderecosRaw : [enderecosRaw])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { logradouro?: string; endereco?: string; rua?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; municipio?: string; uf?: string; estado?: string; cep?: string }) => ({
      logradouro: e.logradouro || e.endereco || e.rua || '',
      numero: e.numero || '',
      complemento: e.complemento || '',
      bairro: e.bairro || '',
      cidade: e.cidade || e.municipio || '',
      uf: e.uf || e.estado || '',
      cep: e.cep || '',
    }))

  // Mapear telefones
  const telefonesRaw = data.telefones || data.telefone ? [data.telefone] : []
  const telefones = (Array.isArray(telefonesRaw) ? telefonesRaw : [telefonesRaw])
    .filter((t: unknown) => t !== null && t !== undefined)
    .map((t: { ddd?: string; numero?: string; telefone?: string; tipo?: string; tipoTelefone?: string }) => ({
      ddd: t.ddd || '',
      numero: t.numero || t.telefone || '',
      tipo: t.tipo || t.tipoTelefone || 'Fixo',
    }))

  // Mapear emails
  const emailsRaw = data.emails || data.email ? [data.email] : []
  const emails: string[] = (Array.isArray(emailsRaw) ? emailsRaw : [emailsRaw])
    .filter((e: unknown) => e !== null && e !== undefined && e !== '')
    .map((e: string | { email?: string }) => typeof e === 'string' ? e : e.email || '')
    .filter((e: string) => e !== '')

  // Mapear empresas vinculadas (sociedades)
  const empresasRaw = data.empresas || data.sociedades || data.participacoes || []
  const empresasVinculadas = (Array.isArray(empresasRaw) ? empresasRaw : [])
    .map((emp: { cnpj?: string; razaoSocial?: string; razao_social?: string; nome?: string; participacao?: string; qualificacao?: string; cargo?: string }) => ({
      cnpj: emp.cnpj || '',
      razaoSocial: emp.razaoSocial || emp.razao_social || emp.nome || '',
      participacao: emp.participacao || emp.qualificacao || emp.cargo || 'Sócio',
    }))

  // Calcular idade a partir da data de nascimento
  let idade: number | null = null
  const dataNascimento = data.dataNascimento || data.nascimento || data.data_nascimento || null
  if (dataNascimento) {
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

  return {
    nome: data.nome || data.name || '',
    cpf: cpf,
    dataNascimento: dataNascimento,
    idade: idade,
    nomeMae: data.nomeMae || data.mae || data.nome_mae || null,
    sexo: data.sexo || data.genero || null,
    signo: data.signo || null,
    situacaoRF: data.situacaoRF || data.situacaoReceitaFederal || data.situacao_rf || null,
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
