import { isMockMode } from './mock-mode'
import {
  MOCK_APIFULL_CPF_CHUVA,
  MOCK_APIFULL_CPF_SOL,
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

  // === CHAMADA REAL (Parte B) ===
  const res = await fetch(`https://api.apifull.com.br/v1/cpf/${cpf}`, {
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`APIFull CPF error: ${res.status}`)
  }

  return res.json()
}

export async function consultCnpj(cnpj: string): Promise<ApiFullCnpjResponse> {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCnpj: ${cnpj}`)
    await new Promise((r) => setTimeout(r, 500))
    return isChuvaScenario(cnpj) ? MOCK_APIFULL_CNPJ_CHUVA : MOCK_APIFULL_CNPJ_SOL
  }

  // === CHAMADA REAL (Parte B) ===
  const res = await fetch(`https://api.apifull.com.br/v1/cnpj/${cnpj}`, {
    headers: {
      Authorization: `Bearer ${process.env.APIFULL_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`APIFull CNPJ error: ${res.status}`)
  }

  return res.json()
}
