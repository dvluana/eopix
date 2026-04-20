import { isMockMode } from './mock-mode'
import {
  MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
  MOCK_APIFULL_CPF_CADASTRAL_SOL,
  MOCK_APIFULL_CPF_PROCESSOS_CHUVA,
  MOCK_APIFULL_CPF_PROCESSOS_SOL,
  MOCK_APIFULL_CPF_FINANCIAL_CHUVA,
  MOCK_APIFULL_CPF_FINANCIAL_SOL,
  MOCK_APIFULL_CNPJ_DOSSIE_CHUVA,
  MOCK_APIFULL_CNPJ_DOSSIE_SOL,
  MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA,
  MOCK_APIFULL_CNPJ_FINANCIAL_SOL,
} from './mocks/apifull-data'
import type {
  CpfCadastralResponse,
  ProcessosCpfResponse,
  DossieResponse,
  SrsPremiumCpfResponse,
  SrsPremiumCnpjResponse,
} from '@/types/report'

// Fetch with timeout — prevents hanging when external APIs are slow
// 30s default (Inngest steps have their own timeout, not limited to Vercel 10s)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

// CPFs terminados em 0-4 = Chuva, 5-9 = Sol
function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

// ========== CPF CADASTRAL (ic-cpf-completo) ==========
// IMPORTANTE: O endpoint correto é ic-cpf-completo, NÃO r-cpf-completo.
// r-cpf-completo usa créditos separados e retorna "Sem saldo disponível!" quando esgotados.
// ic-cpf-completo usa o saldo geral da conta e retorna dados em formato CREDCADASTRAL.
// Resposta: dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA (não dados.data.cadastralPF)

export async function consultCpfCadastral(cpf: string): Promise<CpfCadastralResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfCadastral: ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_CADASTRAL_CHUVA : MOCK_APIFULL_CPF_CADASTRAL_SOL
  }

  // === CHAMADA REAL - ic-cpf-completo ===
  const res = await fetchWithTimeout('https://api.apifull.com.br/api/ic-cpf-completo', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EOPIX/1.0',
    },
    body: JSON.stringify({
      cpf: cpf.replace(/\D/g, ''),
      link: 'ic-cpf-completo',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Cadastral error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Cadastral error: ${res.status} - ${errorText.slice(0, 200)}`)
  }

  const rawData = await res.json()
  return mapCpfCadastralResponse(rawData, cpf)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCpfCadastralResponse(raw: any, cpf: string): CpfCadastralResponse {
  // Endpoint ic-cpf-completo retorna formato CREDCADASTRAL (UPPERCASE keys)
  // Path: dados.CREDCADASTRAL.IDENTIFICACAO_PESSOA_FISICA
  // NÃO confundir com r-cpf-completo que usava dados.data.cadastralPF (lowercase)
  const credCadastral = raw.dados?.CREDCADASTRAL || {}
  const identificacao = credCadastral.IDENTIFICACAO_PESSOA_FISICA || {}

  // Enderecos — path: dados.CREDCADASTRAL.SOMENTE_ENDERECO.DADOS[]
  const enderecosRaw = credCadastral.SOMENTE_ENDERECO?.DADOS || []
  const enderecos = (Array.isArray(enderecosRaw) ? enderecosRaw : [])
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

  // Telefones — path: dados.CREDCADASTRAL.SOMENTE_TELEFONE.DADOS[]
  const telefonesRaw = credCadastral.SOMENTE_TELEFONE?.DADOS || []
  const telefones = (Array.isArray(telefonesRaw) ? telefonesRaw : [])
    .filter((t: unknown) => t !== null && t !== undefined)
    .map((t: { DDD?: string; NUM_TELEFONE?: string; TIPO_TELEFONE?: string }) => ({
      ddd: t.DDD || '',
      numero: t.NUM_TELEFONE || '',
      tipo: t.TIPO_TELEFONE || 'Fixo',
    }))

  // Emails — path: dados.CREDCADASTRAL.EMAILS.INFOEMAILS[].ENDERECO
  const emailsRaw = credCadastral.EMAILS?.INFOEMAILS || []
  const emails: string[] = (Array.isArray(emailsRaw) ? emailsRaw : [])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { ENDERECO?: string }) => e.ENDERECO || '')
    .filter((e: string) => e !== '')

  // Empresas vinculadas — path: dados.CREDCADASTRAL.PARTICIPACAO_EM_EMPRESAS.OCORRENCIAS[]
  const participacaoRaw = credCadastral.PARTICIPACAO_EM_EMPRESAS?.OCORRENCIAS || []
  const empresasVinculadas = (Array.isArray(participacaoRaw) ? participacaoRaw : [])
    .map((emp: { CNPJ?: string; RAZAO_SOCIAL?: string; PARTICIPANTE_CARGO?: string }) => ({
      cnpj: emp.CNPJ || '',
      razaoSocial: emp.RAZAO_SOCIAL || '',
      participacao: emp.PARTICIPANTE_CARGO || 'Socio',
    }))

  // Parse data de nascimento — ic-cpf-completo usa campo NASCIMENTO (DD/MM/YYYY)
  let dataNascimento: string | null = null
  let idade: number | null = null
  const nascimentoRaw = identificacao.NASCIMENTO || null
  if (nascimentoRaw) {
    if (nascimentoRaw.includes('/')) {
      const parts = nascimentoRaw.split('/')
      if (parts.length === 3) {
        dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
      }
    } else {
      dataNascimento = nascimentoRaw
    }
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
  }

  return {
    nome: identificacao.NOME || '',
    cpf: cpf,
    dataNascimento: dataNascimento,
    idade: idade,
    nomeMae: identificacao.MAE || null,
    sexo: identificacao.SEXO || null,
    signo: null,
    situacaoRF: identificacao.CPF_SITUACAO || null,
    enderecos: enderecos,
    telefones: telefones,
    emails: emails,
    empresasVinculadas: empresasVinculadas,
  }
}

// ========== CPF PROCESSOS (r-acoes-e-processos-judiciais) ==========

export async function consultCpfProcessos(cpf: string): Promise<ProcessosCpfResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfProcessos: ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_PROCESSOS_CHUVA : MOCK_APIFULL_CPF_PROCESSOS_SOL
  }

  // === CHAMADA REAL - r-acoes-e-processos-judiciais ===
  const res = await fetchWithTimeout('https://api.apifull.com.br/api/r-acoes-e-processos-judiciais', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EOPIX/1.0',
    },
    body: JSON.stringify({
      cpf: cpf.replace(/\D/g, ''),
      link: 'r-acoes-e-processos-judiciais',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Processos error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Processos error: ${res.status} - ${errorText.slice(0, 200)}`)
  }

  const rawData = await res.json()
  return mapCpfProcessosResponse(rawData)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfProcessosResponse(raw: any): ProcessosCpfResponse {
  // Response path: dados.data.acoesProcessos.acoes.processos[]
  const acoesProcessos = raw.dados?.data?.acoesProcessos?.acoes || {}
  const processosRaw = acoesProcessos.processos || []

  const processos = (Array.isArray(processosRaw) ? processosRaw : []).map((p: {
    numeroProcessoUnico?: string
    tribunal?: string
    dataAutuacao?: string
    classeProcessual?: { nome?: string }
    statusPj?: { ramoDireito?: string; statusProcesso?: string }
    partes?: Array<{ nome?: string; polo?: string }>
    valorCausa?: { valor?: number }
    urlProcesso?: string
  }) => ({
    numeroProcessoUnico: p.numeroProcessoUnico || '',
    tribunal: p.tribunal || '',
    dataAutuacao: p.dataAutuacao || '',
    classeProcessual: { nome: p.classeProcessual?.nome || '' },
    statusPj: {
      ramoDireito: p.statusPj?.ramoDireito || '',
      statusProcesso: p.statusPj?.statusProcesso || '',
    },
    partes: (p.partes || []).map((parte: { nome?: string; polo?: string }) => ({
      nome: parte.nome || '',
      polo: (parte.polo || 'PASSIVO') as 'ATIVO' | 'PASSIVO' | 'TERCEIRO INTERESSADO',
    })),
    valorCausa: p.valorCausa ? { valor: p.valorCausa.valor || 0 } : undefined,
    urlProcesso: p.urlProcesso,
  }))

  return {
    processos: processos,
    totalProcessos: processos.length,
  }
}

// ========== CPF FINANCEIRO (serasa-premium) ==========
// IMPORTANTE: Endpoint correto é serasa-premium, NÃO srs-premium.
// srs-premium foi descontinuado (retorna "Sem saldo disponível!" desde ~17/03/2026).
// serasa-premium retorna formato CREDCADASTRAL (UPPERCASE keys).

export async function consultCpfFinancial(cpf: string): Promise<SrsPremiumCpfResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfFinancial (serasa-premium): ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_FINANCIAL_CHUVA : MOCK_APIFULL_CPF_FINANCIAL_SOL
  }

  // === CHAMADA REAL - serasa-premium ===
  const res = await fetchWithTimeout('https://api.apifull.com.br/api/serasa-premium', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EOPIX/1.0',
    },
    body: JSON.stringify({
      document: cpf.replace(/\D/g, ''),
      link: 'serasa-premium',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Financial error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Financial error: ${res.status} - ${errorText.slice(0, 200)}`)
  }

  const rawData = await res.json()
  return mapCpfFinancialResponse(rawData)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfFinancialResponse(raw: any): SrsPremiumCpfResponse {
  // Response path: dados.CREDCADASTRAL (UPPERCASE format from serasa-premium)
  const credCadastral = raw.dados?.CREDCADASTRAL || {}
  const dadosRF = credCadastral.DADOS_RECEITA_FEDERAL || {}

  // Protestos — path: CREDCADASTRAL.PROTESTOS
  const protestosSection = credCadastral.PROTESTOS || {}
  const protestosRaw = protestosSection.OCORRENCIAS || []
  const protestos = (Array.isArray(protestosRaw) ? protestosRaw : []).map((p: {
    DATA?: string
    VALOR?: string
    CARTORIO?: string
    CIDADE?: string
    UF?: string
  }) => ({
    data: p.DATA || '',
    valor: parseFloat((p.VALOR || '0').replace(',', '.')) || 0,
    cartorio: p.CARTORIO || '',
    cidade: p.CIDADE,
    uf: p.UF,
  }))

  // Pendencias financeiras — path: CREDCADASTRAL.RESTRICOES_FINANCEIRAS.OCORRENCIAS[]
  const restricoesSection = credCadastral.RESTRICOES_FINANCEIRAS || {}
  const pendenciasRaw = restricoesSection.OCORRENCIAS || []
  const pendenciasFinanceiras = (Array.isArray(pendenciasRaw) ? pendenciasRaw : []).map((p: {
    MODALIDADE?: string
    VALOR?: string
    CREDOR?: string
    ORIGEM?: string
    DATA_INCLUSAO?: string
    DATA_VENCIMENTO?: string
  }) => ({
    tipo: p.MODALIDADE || '',
    valor: parseFloat((p.VALOR || '0').replace(',', '.')) || 0,
    origem: p.CREDOR || p.ORIGEM || '',
    dataOcorrencia: p.DATA_INCLUSAO || p.DATA_VENCIMENTO,
  }))

  // Totais — use summary fields with fallback to calculated
  const totalProtestos = parseInt(protestosSection.QUANTIDADE_OCORRENCIA || '0') || protestos.length
  const valorTotalProtestos = parseFloat((protestosSection.VALOR_TOTAL || '0').replace(',', '.')) || protestos.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)
  const totalPendencias = parseInt(restricoesSection.QUANTIDADE_OCORRENCIA || '0') || pendenciasFinanceiras.length
  const valorTotalPendencias = parseFloat((restricoesSection.VALOR_TOTAL || '0').replace(',', '.')) || pendenciasFinanceiras.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)

  // Cheques sem fundo — path: CREDCADASTRAL.CH_SEM_FUNDOS_BACEN
  const chSection = credCadastral.CH_SEM_FUNDOS_BACEN || {}
  const chequesSemFundo = parseInt(chSection.QUANTIDADE_OCORRENCIA || '0') || 0

  // Score — path: CREDCADASTRAL.SCORES.OCORRENCIAS[0].SCORE
  const scoresSection = credCadastral.SCORES || {}
  const scoresOcorrencias = scoresSection.OCORRENCIAS || []
  const score = scoresOcorrencias.length > 0 ? parseInt(scoresOcorrencias[0].SCORE || '0') || null : null

  return {
    nome: dadosRF.NOME || '',
    protestos: protestos,
    pendenciasFinanceiras: pendenciasFinanceiras,
    chequesSemFundo: chequesSemFundo,
    totalProtestos: totalProtestos,
    valorTotalProtestos: valorTotalProtestos,
    totalPendencias: totalPendencias,
    valorTotalPendencias: valorTotalPendencias,
    _scoreInterno: score,
  }
}

// ========== CNPJ DOSSIE (ic-dossie-juridico) ==========
// Este endpoint retorna cadastral + processos em 1 chamada

export async function consultCnpjDossie(cnpj: string): Promise<DossieResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCnpjDossie (ic-dossie-juridico): ${cnpj}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cnpj) ? MOCK_APIFULL_CNPJ_DOSSIE_CHUVA : MOCK_APIFULL_CNPJ_DOSSIE_SOL
  }

  // === CHAMADA REAL - ic-dossie-juridico ===
  const res = await fetchWithTimeout('https://api.apifull.com.br/api/ic-dossie-juridico', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EOPIX/1.0',
    },
    body: JSON.stringify({
      document: cnpj.replace(/\D/g, ''),
      link: 'ic-dossie-juridico',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CNPJ Dossie error: ${res.status}`, errorText)
    throw new Error(`APIFull CNPJ Dossie error: ${res.status} - ${errorText.slice(0, 200)}`)
  }

  const rawData = await res.json()
  return mapCnpjDossieResponse(rawData, cnpj)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCnpjDossieResponse(raw: any, cnpj: string): DossieResponse {
  // Response path: dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL
  const credCadastral = raw.dados?.CREDCADASTRAL || {}
  const relatorioJuridico = credCadastral.RELATORIO_JURIDICO_EMPRESARIAL || {}
  // Doc: INFORMACOES_DA_EMPRESA (fallback DADOS_RECEITA_FEDERAL, antigo IDENTIFICACAO_EMPRESA)
  const identificacao = credCadastral.INFORMACOES_DA_EMPRESA
    || credCadastral.DADOS_RECEITA_FEDERAL
    || credCadastral.IDENTIFICACAO_EMPRESA
    || relatorioJuridico.IDENTIFICACAO
    || {}

  // Doc: QUADRO_SOCIETARIO.OCORRENCIAS[] (fallback antigo SOCIOS)
  const sociosRaw = credCadastral.QUADRO_SOCIETARIO?.OCORRENCIAS
    || credCadastral.SOCIOS?.OCORRENCIAS
    || relatorioJuridico.SOCIOS?.OCORRENCIAS
    || []
  const socios = (Array.isArray(sociosRaw) ? sociosRaw : []).map((s: {
    NOME?: string
    CARGO?: string
    QUALIFICACAO?: string
    CPF_CNPJ?: string
    DOCUMENTO?: string
    PERCENTUAL_PARTICIPACAO?: string
  }) => ({
    nome: s.NOME || '',
    qualificacao: s.CARGO || s.QUALIFICACAO || '',
    documento: s.CPF_CNPJ || s.DOCUMENTO || null,
  }))

  // Doc: SOMENTE_ENDERECO.DADOS[0] (fallback antigo ENDERECO direto)
  const enderecoArr = credCadastral.SOMENTE_ENDERECO?.DADOS || []
  const enderecoRaw = (Array.isArray(enderecoArr) && enderecoArr.length > 0)
    ? enderecoArr[0]
    : (credCadastral.ENDERECO || relatorioJuridico.ENDERECO || {})
  // Doc usa ENDERECO pro logradouro, código antigo usava LOGRADOURO
  const logradouro = enderecoRaw.ENDERECO || enderecoRaw.LOGRADOURO || ''
  const endereco = logradouro ? {
    logradouro,
    numero: enderecoRaw.NUMERO || '',
    complemento: enderecoRaw.COMPLEMENTO || '',
    bairro: enderecoRaw.BAIRRO || '',
    cidade: enderecoRaw.CIDADE || enderecoRaw.MUNICIPIO || '',
    uf: enderecoRaw.UF || '',
    cep: enderecoRaw.CEP || '',
  } : null

  // Doc: INFORMACOES_DA_EMPRESA.CNAE_PRIMARIO (string) ou CNAE_PRINCIPAL.CODIGO/.DESCRICAO
  const cnaePrimario = identificacao.CNAE_PRIMARIO
  const cnaeRaw = credCadastral.CNAE_PRINCIPAL || relatorioJuridico.CNAE_PRINCIPAL || {}
  const cnaePrincipal = cnaePrimario
    ? { codigo: '', descricao: cnaePrimario }
    : cnaeRaw.CODIGO
      ? { codigo: cnaeRaw.CODIGO || '', descricao: cnaeRaw.DESCRICAO || '' }
      : null

  // Acoes ativas
  const acoesRaw = relatorioJuridico.ACOES || {}
  const acoesOcorrencias = acoesRaw.OCORRENCIAS || []
  const acoesAtivas = {
    quantidade: parseInt(acoesRaw.QUANTIDADE_OCORRENCIAS || '0') || acoesOcorrencias.length,
    valorTotal: parseFloat(acoesRaw.VALOR_TOTAL || '0') || 0,
    ocorrencias: (Array.isArray(acoesOcorrencias) ? acoesOcorrencias : []).map(mapDossieOcorrencia),
  }

  // Acoes arquivadas
  const arquivadasRaw = relatorioJuridico.ACOES_ARQUIVADAS || {}
  const arquivadasOcorrencias = arquivadasRaw.OCORRENCIAS || []
  const acoesArquivadas = {
    quantidade: parseInt(arquivadasRaw.QUANTIDADE_OCORRENCIAS || '0') || arquivadasOcorrencias.length,
    ocorrencias: (Array.isArray(arquivadasOcorrencias) ? arquivadasOcorrencias : []).map(mapDossieOcorrencia),
  }

  // Alertas e restricoes
  const alertasRaw = credCadastral.INFORMACOES_ALERTAS_RESTRICOES || {}
  const alertasOcorrencias = alertasRaw.OCORRENCIAS || []
  const alertas = {
    quantidade: parseInt(alertasRaw.QUANTIDADE_OCORRENCIAS || '0') || alertasOcorrencias.length,
    ocorrencias: (Array.isArray(alertasOcorrencias) ? alertasOcorrencias : []).map(mapDossieOcorrencia),
  }

  return {
    razaoSocial: identificacao.RAZAO_SOCIAL || identificacao.NOME || '',
    cnpj: cnpj,
    situacao: credCadastral.DADOS_RECEITA_FEDERAL?.SITUACAO_RECEITA || identificacao.SITUACAO_RECEITA || identificacao.SITUACAO || identificacao.SITUACAO_CADASTRAL || null,
    dataAbertura: identificacao.DATA_FUNDACAO || identificacao.DATA_NASCIMENTO_FUNDACAO || identificacao.DATA_ABERTURA || null,
    naturezaJuridica: identificacao.NATUREZA_JURIDICA || null,
    capitalSocial: identificacao.CAPITAL_SOCIAL ? parseFloat(identificacao.CAPITAL_SOCIAL) : null,
    endereco: endereco,
    socios: socios,
    cnaePrincipal: cnaePrincipal,
    acoesAtivas: acoesAtivas,
    acoesArquivadas: acoesArquivadas,
    alertas: alertas,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDossieOcorrencia(o: any) {
  return {
    numeroProcesso: o.NUMERO_PROCESSO || o.NUMERO || undefined,
    tribunal: o.TRIBUNAL || o.ORGAO || undefined,
    vara: o.VARA || undefined,
    cidade: o.CIDADE || o.MUNICIPIO || undefined,
    uf: o.UF || undefined,
    dataDistribuicao: o.DATA_DISTRIBUICAO || o.DATA || undefined,
    natureza: o.NATUREZA || o.TIPO || undefined,
    autor: o.AUTOR || o.PARTE_ATIVA || undefined,
    reu: o.REU || o.PARTE_PASSIVA || undefined,
    valor: o.VALOR ? parseFloat(o.VALOR) : undefined,
    status: o.STATUS || o.SITUACAO || undefined,
    descricao: o.DESCRICAO || o.OBSERVACAO || undefined,
  }
}

// ========== CNPJ FINANCEIRO (serasa-premium) ==========
// Mesmo endpoint que CPF — serasa-premium aceita CPF e CNPJ via param "document".

export async function consultCnpjFinancial(cnpj: string): Promise<SrsPremiumCnpjResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCnpjFinancial (serasa-premium): ${cnpj}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cnpj) ? MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA : MOCK_APIFULL_CNPJ_FINANCIAL_SOL
  }

  // === CHAMADA REAL - serasa-premium ===
  const res = await fetchWithTimeout('https://api.apifull.com.br/api/serasa-premium', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'EOPIX/1.0',
    },
    body: JSON.stringify({
      document: cnpj.replace(/\D/g, ''),
      link: 'serasa-premium',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CNPJ Financial error: ${res.status}`, errorText)
    throw new Error(`APIFull CNPJ Financial error: ${res.status} - ${errorText.slice(0, 200)}`)
  }

  const rawData = await res.json()
  return mapCnpjFinancialResponse(rawData, cnpj)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCnpjFinancialResponse(raw: any, cnpj: string): SrsPremiumCnpjResponse {
  // Response path: dados.CREDCADASTRAL (UPPERCASE format from serasa-premium)
  const credCadastral = raw.dados?.CREDCADASTRAL || {}
  const dadosRF = credCadastral.DADOS_RECEITA_FEDERAL || {}

  // Protestos — path: CREDCADASTRAL.PROTESTOS
  const protestosSection = credCadastral.PROTESTOS || {}
  const protestosRaw = protestosSection.OCORRENCIAS || []
  const protestos = (Array.isArray(protestosRaw) ? protestosRaw : []).map((p: {
    DATA?: string
    VALOR?: string
    CARTORIO?: string
    CIDADE?: string
    UF?: string
  }) => ({
    data: p.DATA || '',
    valor: parseFloat((p.VALOR || '0').replace(',', '.')) || 0,
    cartorio: p.CARTORIO || '',
    cidade: p.CIDADE,
    uf: p.UF,
  }))

  // Pendencias financeiras — path: CREDCADASTRAL.RESTRICOES_FINANCEIRAS.OCORRENCIAS[]
  const restricoesSection = credCadastral.RESTRICOES_FINANCEIRAS || {}
  const pendenciasRaw = restricoesSection.OCORRENCIAS || []
  const pendenciasFinanceiras = (Array.isArray(pendenciasRaw) ? pendenciasRaw : []).map((p: {
    MODALIDADE?: string
    VALOR?: string
    CREDOR?: string
    ORIGEM?: string
    DATA_INCLUSAO?: string
    DATA_VENCIMENTO?: string
  }) => ({
    tipo: p.MODALIDADE || '',
    valor: parseFloat((p.VALOR || '0').replace(',', '.')) || 0,
    origem: p.CREDOR || p.ORIGEM || '',
    dataOcorrencia: p.DATA_INCLUSAO || p.DATA_VENCIMENTO,
  }))

  // Totais
  const totalProtestos = parseInt(protestosSection.QUANTIDADE_OCORRENCIA || '0') || protestos.length
  const valorTotalProtestos = parseFloat((protestosSection.VALOR_TOTAL || '0').replace(',', '.')) || protestos.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)
  const totalPendencias = parseInt(restricoesSection.QUANTIDADE_OCORRENCIA || '0') || pendenciasFinanceiras.length
  const valorTotalPendencias = parseFloat((restricoesSection.VALOR_TOTAL || '0').replace(',', '.')) || pendenciasFinanceiras.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)

  // Cheques sem fundo
  const chSection = credCadastral.CH_SEM_FUNDOS_BACEN || {}
  const chequesSemFundo = parseInt(chSection.QUANTIDADE_OCORRENCIA || '0') || 0

  // Score
  const scoresSection = credCadastral.SCORES || {}
  const scoresOcorrencias = scoresSection.OCORRENCIAS || []
  const score = scoresOcorrencias.length > 0 ? parseInt(scoresOcorrencias[0].SCORE || '0') || null : null

  return {
    razaoSocial: dadosRF.RAZAO_SOCIAL || dadosRF.NOME || '',
    cnpj: cnpj,
    protestos: protestos,
    pendenciasFinanceiras: pendenciasFinanceiras,
    chequesSemFundo: chequesSemFundo,
    totalProtestos: totalProtestos,
    valorTotalProtestos: valorTotalProtestos,
    totalPendencias: totalPendencias,
    valorTotalPendencias: valorTotalPendencias,
    _scoreInterno: score,
  }
}
