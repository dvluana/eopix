// CPF cadastral com problemas (Chuva)
export const MOCK_APIFULL_CPF_CADASTRAL_CHUVA = {
  nome: 'Joao Carlos da Silva',
  cpf: '12345678901',
  dataNascimento: '1985-03-15',
  idade: 40,
  nomeMae: 'Maria da Silva',
  sexo: 'Masculino',
  signo: 'Peixes',
  situacaoRF: 'REGULAR',
  enderecos: [
    {
      logradouro: 'Rua das Flores',
      numero: '123',
      complemento: 'Apto 45',
      bairro: 'Centro',
      cidade: 'Porto Alegre',
      uf: 'RS',
      cep: '90000-000',
    },
    {
      logradouro: 'Av. Brasil',
      numero: '456',
      complemento: '',
      bairro: 'Jardim America',
      cidade: 'Canoas',
      uf: 'RS',
      cep: '92000-000',
    },
  ],
  telefones: [
    { ddd: '51', numero: '999887766', tipo: 'Celular' },
    { ddd: '51', numero: '33445566', tipo: 'Fixo' },
  ],
  emails: ['joao.silva@email.com'],
  empresasVinculadas: [
    {
      cnpj: '12345678000190',
      razaoSocial: 'JC SILVA COMERCIO LTDA',
      participacao: 'Sócio-Administrador',
    },
  ],
}

// CPF cadastral limpo (Sol)
export const MOCK_APIFULL_CPF_CADASTRAL_SOL = {
  nome: 'Maria Aparecida Santos',
  cpf: '98765432109',
  dataNascimento: '1990-07-22',
  idade: 35,
  nomeMae: 'Ana Paula Santos',
  sexo: 'Feminino',
  signo: 'Cancer',
  situacaoRF: 'REGULAR',
  enderecos: [
    {
      logradouro: 'Rua XV de Novembro',
      numero: '789',
      complemento: 'Casa',
      bairro: 'Centro',
      cidade: 'Florianopolis',
      uf: 'SC',
      cep: '88000-000',
    },
  ],
  telefones: [
    { ddd: '48', numero: '988776655', tipo: 'Celular' },
  ],
  emails: ['maria.santos@email.com', 'mariasantos@gmail.com'],
  empresasVinculadas: [],
}

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

// CNPJ Financial com problemas (Chuva) - dados de e-boavista
export const MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA = {
  razaoSocial: 'EMPRESA PROBLEMATICA LTDA',
  cnpj: '12345678000190',
  situacao: 'EM RECUPERAÇÃO JUDICIAL',
  recentInquiries: 45,
  protests: [
    {
      date: '2025-06-10',
      amount: 15000,
      registry: '1o Cartorio - Sao Paulo',
    },
    {
      date: '2025-08-22',
      amount: 28500,
      registry: '2o Cartorio - Sao Paulo',
    },
    {
      date: '2025-11-15',
      amount: 12300,
      registry: '3o Cartorio - Campinas',
    },
  ],
  debts: [
    {
      type: 'DIVIDA_ATIVA',
      amount: 45000,
      origin: 'Receita Federal',
    },
    {
      type: 'PENDENCIA_FINANCEIRA',
      amount: 23000,
      origin: 'Banco do Brasil',
    },
  ],
  bouncedChecks: 5,
  totalProtests: 3,
  totalProtestsAmount: 55800,
  totalDebts: 2,
  totalDebtsAmount: 68000,
}

// CNPJ Financial limpo (Sol) - dados de e-boavista
export const MOCK_APIFULL_CNPJ_FINANCIAL_SOL = {
  razaoSocial: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  cnpj: '98765432000155',
  situacao: 'ATIVA',
  recentInquiries: 8,
  protests: [],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 0,
  totalProtestsAmount: 0,
  totalDebts: 0,
  totalDebtsAmount: 0,
}
