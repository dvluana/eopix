import { isMockMode } from './mock-mode'
import { MOCK_BRASILAPI_CNPJ } from './mocks/brasilapi-data'

export interface BrasilApiCnpjResponse {
  razaoSocial: string
  situacao: string
  abertura: string
  cnaePrincipal: {
    codigo: string
    descricao: string
  }
  cnaeSecundarios: Array<{
    codigo: string
    descricao: string
  }>
  socios: Array<{
    nome: string
    qualificacao: string
  }>
  capitalSocial: number
  endereco: {
    municipio: string
    uf: string
  }
}

export async function consultCnpj(cnpj: string): Promise<BrasilApiCnpjResponse> {
  if (isMockMode) {
    console.log(`[MOCK] BrasilAPI consultCnpj: ${cnpj}`)
    await new Promise((r) => setTimeout(r, 300))
    return MOCK_BRASILAPI_CNPJ
  }

  // === CHAMADA REAL (API gratuita) ===
  const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)

  if (!res.ok) {
    throw new Error(`BrasilAPI CNPJ error: ${res.status}`)
  }

  const data = await res.json()

  // Normalizar resposta da BrasilAPI para nosso formato
  return {
    razaoSocial: data.razao_social || '',
    situacao: data.descricao_situacao_cadastral || '',
    abertura: data.data_inicio_atividade || '',
    cnaePrincipal: {
      codigo: String(data.cnae_fiscal || ''),
      descricao: data.cnae_fiscal_descricao || '',
    },
    cnaeSecundarios: (data.cnaes_secundarios || []).map(
      (cnae: { codigo: number; descricao: string }) => ({
        codigo: String(cnae.codigo),
        descricao: cnae.descricao,
      })
    ),
    socios: (data.qsa || []).map(
      (socio: { nome_socio: string; qualificacao_socio: string }) => ({
        nome: socio.nome_socio,
        qualificacao: socio.qualificacao_socio,
      })
    ),
    capitalSocial: data.capital_social || 0,
    endereco: {
      municipio: data.municipio || '',
      uf: data.uf || '',
    },
  }
}
