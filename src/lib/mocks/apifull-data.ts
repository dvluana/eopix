// CPF com problemas (Chuva)
export const MOCK_APIFULL_CPF_CHUVA = {
  name: 'Joao Carlos da Silva',
  cleanNameYears: null, // nao tem nome limpo
  recentInquiries: 12, // empresas que consultaram recentemente
  protests: [
    {
      date: '2025-08-15',
      amount: 4200,
      registry: '2o Cartorio - Porto Alegre',
    },
    {
      date: '2025-11-03',
      amount: 5750,
      registry: '1o Cartorio - Porto Alegre',
    },
    { date: '2026-01-22', amount: 2500, registry: '3o Cartorio - Canoas' },
  ],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 3,
  totalProtestsAmount: 12450,
  region: 'RS',
}

// CPF limpo (Sol)
export const MOCK_APIFULL_CPF_SOL = {
  name: 'Maria Aparecida Santos',
  cleanNameYears: 5, // "Nome limpo ha 5 anos"
  recentInquiries: 3, // "3 empresas consultaram este CPF recentemente"
  protests: [],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 0,
  totalProtestsAmount: 0,
  region: 'SC',
}

// CNPJ com problemas (Chuva)
export const MOCK_APIFULL_CNPJ_CHUVA = {
  razaoSocial: 'EMPRESA PROBLEMATICA LTDA',
  cleanNameYears: null,
  recentInquiries: 25,
  protests: [
    {
      date: '2025-06-10',
      amount: 15000,
      registry: '1o Cartorio - Sao Paulo',
    },
  ],
  debts: [
    {
      type: 'DIVIDA_ATIVA',
      amount: 45000,
      origin: 'Receita Federal',
    },
  ],
  bouncedChecks: 2,
  totalProtests: 1,
  totalProtestsAmount: 15000,
  region: 'SP',
}

// CNPJ limpo (Sol)
export const MOCK_APIFULL_CNPJ_SOL = {
  razaoSocial: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  cleanNameYears: 8,
  recentInquiries: 5,
  protests: [],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 0,
  totalProtestsAmount: 0,
  region: 'SC',
}
