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

// CPFs terminados em 0-4 = Chuva, 5-9 = Sol
function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}

// ========== CPF CADASTRAL (r-cpf-completo) ==========

export async function consultCpfCadastral(cpf: string): Promise<CpfCadastralResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfCadastral: ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_CADASTRAL_CHUVA : MOCK_APIFULL_CPF_CADASTRAL_SOL
  }

  // === CHAMADA REAL - r-cpf-completo ===
  const res = await fetch('https://api.apifull.com.br/consulta', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf.replace(/\D/g, ''),
      link: 'r-cpf-completo',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Cadastral error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Cadastral error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull r-cpf-completo raw response:', JSON.stringify(rawData, null, 2))

  return mapCpfCadastralResponse(rawData, cpf)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfCadastralResponse(raw: any, cpf: string): CpfCadastralResponse {
  // Response path: dados.data.cadastralPF
  const cadastralPF = raw.dados?.data?.cadastralPF || {}
  const dadosCadastrais = cadastralPF.dadosCadastrais || {}

  // Enderecos
  const enderecosRaw = cadastralPF.enderecos || []
  const enderecos = (Array.isArray(enderecosRaw) ? enderecosRaw : [])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { logradouro?: string; numero?: string; complemento?: string; bairro?: string; cidade?: string; uf?: string; cep?: string }) => ({
      logradouro: e.logradouro || '',
      numero: e.numero || '',
      complemento: e.complemento || '',
      bairro: e.bairro || '',
      cidade: e.cidade || '',
      uf: e.uf || '',
      cep: e.cep || '',
    }))

  // Telefones
  const telefonesRaw = cadastralPF.telefones || []
  const telefones = (Array.isArray(telefonesRaw) ? telefonesRaw : [])
    .filter((t: unknown) => t !== null && t !== undefined)
    .map((t: { ddd?: string; numero?: string; tipo?: string }) => ({
      ddd: t.ddd || '',
      numero: t.numero || '',
      tipo: t.tipo || 'Fixo',
    }))

  // Emails - conforme doc: dados.data.cadastralPF.emails[].email
  const emailsRaw = cadastralPF.emails || []
  const emails: string[] = (Array.isArray(emailsRaw) ? emailsRaw : [])
    .filter((e: unknown) => e !== null && e !== undefined)
    .map((e: { email?: string }) => e.email || '')
    .filter((e: string) => e !== '')

  // Empresas vinculadas - conforme doc: dados.data.participacaoEmEmpresas.participacaoEmEmpresas[].cnpj/.empresa
  const participacaoRaw = raw.dados?.data?.participacaoEmEmpresas?.participacaoEmEmpresas || []
  const empresasVinculadas = (Array.isArray(participacaoRaw) ? participacaoRaw : [])
    .map((emp: { cnpj?: string; empresa?: string; razaoSocial?: string; participacao?: string; cargo?: string }) => ({
      cnpj: emp.cnpj || '',
      razaoSocial: emp.empresa || emp.razaoSocial || '', // doc usa "empresa", fallback para razaoSocial
      participacao: emp.participacao || emp.cargo || 'Socio',
    }))

  // Parse data de nascimento
  let dataNascimento: string | null = null
  let idade: number | null = null
  const nascimentoRaw = dadosCadastrais.dataNascimento || null
  if (nascimentoRaw) {
    // Format can be DD/MM/YYYY or YYYY-MM-DD
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
    nome: dadosCadastrais.nome || '',
    cpf: cpf,
    dataNascimento: dataNascimento,
    idade: idade,
    nomeMae: dadosCadastrais.nomeMae || null,
    sexo: dadosCadastrais.sexo || null,
    signo: null,
    situacaoRF: dadosCadastrais.situacaoRF || null,
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
  const res = await fetch('https://api.apifull.com.br/consulta', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: cpf.replace(/\D/g, ''),
      link: 'r-acoes-e-processos-judiciais',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Processos error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Processos error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull r-acoes-e-processos-judiciais raw response:', JSON.stringify(rawData, null, 2))

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

// ========== CPF FINANCEIRO (srs-premium) ==========

export async function consultCpfFinancial(cpf: string): Promise<SrsPremiumCpfResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpfFinancial (srs-premium): ${cpf}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cpf) ? MOCK_APIFULL_CPF_FINANCIAL_CHUVA : MOCK_APIFULL_CPF_FINANCIAL_SOL
  }

  // === CHAMADA REAL - srs-premium ===
  const res = await fetch('https://api.apifull.com.br/consulta', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: cpf.replace(/\D/g, ''),
      link: 'srs-premium',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CPF Financial error: ${res.status}`, errorText)
    throw new Error(`APIFull CPF Financial error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull srs-premium CPF raw response:', JSON.stringify(rawData, null, 2))

  return mapCpfFinancialResponse(rawData)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCpfFinancialResponse(raw: any): SrsPremiumCpfResponse {
  // Response path: dados.data.serasaPremium.consultaCredito
  const serasaPremium = raw.dados?.data?.serasaPremium || {}
  const consultaCredito = serasaPremium.consultaCredito || {}
  const dadosCadastrais = consultaCredito.dadosCadastrais || {}

  // Protestos
  const protestosRaw = consultaCredito.protestos || []
  const protestos = (Array.isArray(protestosRaw) ? protestosRaw : []).map((p: {
    data?: string
    valor?: number
    cartorio?: string
    cidade?: string
    uf?: string
  }) => ({
    data: p.data || '',
    valor: p.valor || 0,
    cartorio: p.cartorio || '',
    cidade: p.cidade,
    uf: p.uf,
  }))

  // Pendencias financeiras
  const pendenciasRaw = consultaCredito.pendenciasFinanceiras || []
  const pendenciasFinanceiras = (Array.isArray(pendenciasRaw) ? pendenciasRaw : []).map((p: {
    tipo?: string
    valor?: number
    origem?: string
    dataOcorrencia?: string
  }) => ({
    tipo: p.tipo || '',
    valor: p.valor || 0,
    origem: p.origem || '',
    dataOcorrencia: p.dataOcorrencia,
  }))

  // Totais
  const totalProtestos = protestos.length
  const valorTotalProtestos = protestos.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)
  const totalPendencias = pendenciasFinanceiras.length
  const valorTotalPendencias = pendenciasFinanceiras.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)

  // Score - buscado mas NAO exibido
  const score = consultaCredito.score ?? serasaPremium.score ?? null

  return {
    nome: dadosCadastrais.nome || '',
    protestos: protestos,
    pendenciasFinanceiras: pendenciasFinanceiras,
    chequesSemFundo: consultaCredito.chequesSemFundo || 0,
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
  const res = await fetch('https://api.apifull.com.br/consulta', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: cnpj.replace(/\D/g, ''),
      link: 'ic-dossie-juridico',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CNPJ Dossie error: ${res.status}`, errorText)
    throw new Error(`APIFull CNPJ Dossie error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull ic-dossie-juridico raw response:', JSON.stringify(rawData, null, 2))

  return mapCnpjDossieResponse(rawData, cnpj)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCnpjDossieResponse(raw: any, cnpj: string): DossieResponse {
  // Response path: dados.CREDCADASTRAL.RELATORIO_JURIDICO_EMPRESARIAL
  const credCadastral = raw.dados?.CREDCADASTRAL || {}
  const relatorioJuridico = credCadastral.RELATORIO_JURIDICO_EMPRESARIAL || {}
  const identificacao = credCadastral.IDENTIFICACAO_EMPRESA || relatorioJuridico.IDENTIFICACAO || {}

  // Socios
  const sociosRaw = credCadastral.SOCIOS?.OCORRENCIAS || relatorioJuridico.SOCIOS?.OCORRENCIAS || []
  const socios = (Array.isArray(sociosRaw) ? sociosRaw : []).map((s: {
    NOME?: string
    QUALIFICACAO?: string
    DOCUMENTO?: string
  }) => ({
    nome: s.NOME || '',
    qualificacao: s.QUALIFICACAO || '',
    documento: s.DOCUMENTO || null,
  }))

  // Endereco
  const enderecoRaw = credCadastral.ENDERECO || relatorioJuridico.ENDERECO || {}
  const endereco = enderecoRaw.LOGRADOURO ? {
    logradouro: enderecoRaw.LOGRADOURO || '',
    numero: enderecoRaw.NUMERO || '',
    complemento: enderecoRaw.COMPLEMENTO || '',
    bairro: enderecoRaw.BAIRRO || '',
    cidade: enderecoRaw.CIDADE || enderecoRaw.MUNICIPIO || '',
    uf: enderecoRaw.UF || '',
    cep: enderecoRaw.CEP || '',
  } : null

  // CNAE
  const cnaeRaw = credCadastral.CNAE_PRINCIPAL || relatorioJuridico.CNAE_PRINCIPAL || {}
  const cnaePrincipal = cnaeRaw.CODIGO ? {
    codigo: cnaeRaw.CODIGO || '',
    descricao: cnaeRaw.DESCRICAO || '',
  } : null

  // Acoes ativas
  const acoesRaw = relatorioJuridico.ACOES || {}
  const acoesOcorrencias = acoesRaw.OCORRENCIAS || []
  const acoesAtivas = {
    quantidade: acoesRaw.QUANTIDADE_OCORRENCIAS || acoesOcorrencias.length,
    valorTotal: acoesRaw.VALOR_TOTAL || 0,
    ocorrencias: (Array.isArray(acoesOcorrencias) ? acoesOcorrencias : []).map(mapDossieOcorrencia),
  }

  // Acoes arquivadas
  const arquivadasRaw = relatorioJuridico.ACOES_ARQUIVADAS || {}
  const arquivadasOcorrencias = arquivadasRaw.OCORRENCIAS || []
  const acoesArquivadas = {
    quantidade: arquivadasRaw.QUANTIDADE_OCORRENCIAS || arquivadasOcorrencias.length,
    ocorrencias: (Array.isArray(arquivadasOcorrencias) ? arquivadasOcorrencias : []).map(mapDossieOcorrencia),
  }

  // Alertas e restricoes
  const alertasRaw = credCadastral.INFORMACOES_ALERTAS_RESTRICOES || {}
  const alertasOcorrencias = alertasRaw.OCORRENCIAS || []
  const alertas = {
    quantidade: alertasRaw.QUANTIDADE_OCORRENCIAS || alertasOcorrencias.length,
    ocorrencias: (Array.isArray(alertasOcorrencias) ? alertasOcorrencias : []).map(mapDossieOcorrencia),
  }

  return {
    razaoSocial: identificacao.RAZAO_SOCIAL || identificacao.NOME || '',
    cnpj: cnpj,
    situacao: identificacao.SITUACAO || identificacao.SITUACAO_CADASTRAL || null,
    dataAbertura: identificacao.DATA_ABERTURA || identificacao.DATA_FUNDACAO || null,
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

// ========== CNPJ FINANCEIRO (srs-premium) ==========

export async function consultCnpjFinancial(cnpj: string): Promise<SrsPremiumCnpjResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCnpjFinancial (srs-premium): ${cnpj}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cnpj) ? MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA : MOCK_APIFULL_CNPJ_FINANCIAL_SOL
  }

  // === CHAMADA REAL - srs-premium ===
  const res = await fetch('https://api.apifull.com.br/consulta', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: cnpj.replace(/\D/g, ''),
      link: 'srs-premium',
    }),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    console.error(`APIFull CNPJ Financial error: ${res.status}`, errorText)
    throw new Error(`APIFull CNPJ Financial error: ${res.status}`)
  }

  const rawData = await res.json()
  console.log('🔍 [DEBUG] APIFull srs-premium CNPJ raw response:', JSON.stringify(rawData, null, 2))

  return mapCnpjFinancialResponse(rawData, cnpj)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCnpjFinancialResponse(raw: any, cnpj: string): SrsPremiumCnpjResponse {
  // Response path: dados.data.defineRisco.consultaCredito
  const defineRisco = raw.dados?.data?.defineRisco || {}
  const consultaCredito = defineRisco.consultaCredito || {}
  const dadosCadastrais = consultaCredito.dadosCadastrais || {}
  const resumoConsulta = consultaCredito.resumoConsulta || {}

  // Protestos
  const protestosRaw = consultaCredito.protestos || resumoConsulta.protestos?.detalhes || []
  const protestos = (Array.isArray(protestosRaw) ? protestosRaw : []).map((p: {
    data?: string
    valor?: number
    cartorio?: string
    cidade?: string
    uf?: string
  }) => ({
    data: p.data || '',
    valor: p.valor || 0,
    cartorio: p.cartorio || '',
    cidade: p.cidade,
    uf: p.uf,
  }))

  // Pendencias financeiras
  const pendenciasRaw = consultaCredito.pendenciasFinanceiras || resumoConsulta.pendenciasFinanceiras?.detalhes || []
  const pendenciasFinanceiras = (Array.isArray(pendenciasRaw) ? pendenciasRaw : []).map((p: {
    tipo?: string
    valor?: number
    origem?: string
    dataOcorrencia?: string
  }) => ({
    tipo: p.tipo || '',
    valor: p.valor || 0,
    origem: p.origem || '',
    dataOcorrencia: p.dataOcorrencia,
  }))

  // Totais from resumoConsulta or calculated
  const totalProtestos = resumoConsulta.protestos?.quantidade || protestos.length
  const valorTotalProtestos = resumoConsulta.protestos?.valorTotal || protestos.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)
  const totalPendencias = resumoConsulta.pendenciasFinanceiras?.quantidade || pendenciasFinanceiras.length
  const valorTotalPendencias = resumoConsulta.pendenciasFinanceiras?.valorTotal || pendenciasFinanceiras.reduce((sum: number, p: { valor: number }) => sum + p.valor, 0)
  const chequesSemFundo = resumoConsulta.chequesSemFundo?.quantidade || consultaCredito.chequesSemFundo || 0

  // Score - buscado mas NAO exibido
  const scoreRating = raw.dados?.data?.scoreRating || {}
  const score = scoreRating.score ?? consultaCredito.score ?? null

  return {
    razaoSocial: dadosCadastrais.razaoSocial || dadosCadastrais.nome || '',
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
