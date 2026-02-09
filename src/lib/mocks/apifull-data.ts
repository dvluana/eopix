import type {
  CpfCadastralResponse,
  ProcessosCpfResponse,
  DossieResponse,
  SrsPremiumCpfResponse,
  SrsPremiumCnpjResponse,
} from '@/types/report'

// ========== CPF CADASTRAL (r-cpf-completo) ==========

// CPF cadastral com problemas (Chuva)
export const MOCK_APIFULL_CPF_CADASTRAL_CHUVA: CpfCadastralResponse = {
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
      participacao: 'Socio-Administrador',
    },
  ],
}

// CPF cadastral limpo (Sol)
export const MOCK_APIFULL_CPF_CADASTRAL_SOL: CpfCadastralResponse = {
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

// ========== CPF PROCESSOS (r-acoes-e-processos-judiciais) ==========

// CPF com processos (Chuva)
export const MOCK_APIFULL_CPF_PROCESSOS_CHUVA: ProcessosCpfResponse = {
  processos: [
    {
      numeroProcessoUnico: '5001234-56.2024.8.21.0001',
      tribunal: 'TJRS',
      dataAutuacao: '2024-03-12',
      classeProcessual: { nome: 'Execucao de Titulo Extrajudicial' },
      statusPj: {
        ramoDireito: 'Civel',
        statusProcesso: 'Em andamento',
      },
      partes: [
        { nome: 'Joao Carlos da Silva', polo: 'PASSIVO' },
        { nome: 'Banco XYZ S.A.', polo: 'ATIVO' },
      ],
      valorCausa: { valor: 45000 },
      urlProcesso: 'https://www.tjrs.jus.br/processo/5001234-56.2024.8.21.0001',
    },
    {
      numeroProcessoUnico: '0001234-12.2024.5.04.0001',
      tribunal: 'TRT-4',
      dataAutuacao: '2024-05-20',
      classeProcessual: { nome: 'Reclamacao Trabalhista' },
      statusPj: {
        ramoDireito: 'Trabalhista',
        statusProcesso: 'Em andamento',
      },
      partes: [
        { nome: 'Ex-funcionario Fulano', polo: 'ATIVO' },
        { nome: 'JC Silva Comercio Ltda', polo: 'PASSIVO' },
      ],
      valorCausa: { valor: 30000 },
    },
    {
      numeroProcessoUnico: '5009876-78.2023.8.21.0001',
      tribunal: 'TJRS',
      dataAutuacao: '2023-11-05',
      classeProcessual: { nome: 'Acao de Cobranca' },
      statusPj: {
        ramoDireito: 'Civel',
        statusProcesso: 'Arquivado',
      },
      partes: [
        { nome: 'Condominio Edificio Central', polo: 'ATIVO' },
        { nome: 'Joao Carlos da Silva', polo: 'PASSIVO' },
      ],
      valorCausa: { valor: 8500 },
    },
  ],
  totalProcessos: 3,
}

// CPF sem processos (Sol)
export const MOCK_APIFULL_CPF_PROCESSOS_SOL: ProcessosCpfResponse = {
  processos: [],
  totalProcessos: 0,
}

// ========== CPF FINANCEIRO (srs-premium) ==========

// CPF com problemas financeiros (Chuva)
export const MOCK_APIFULL_CPF_FINANCIAL_CHUVA: SrsPremiumCpfResponse = {
  nome: 'Joao Carlos da Silva',
  protestos: [
    {
      data: '2025-08-15',
      valor: 4200,
      cartorio: '2o Cartorio de Protestos',
      cidade: 'Porto Alegre',
      uf: 'RS',
    },
    {
      data: '2025-11-03',
      valor: 5750,
      cartorio: '1o Cartorio de Protestos',
      cidade: 'Porto Alegre',
      uf: 'RS',
    },
    {
      data: '2026-01-22',
      valor: 2500,
      cartorio: '3o Cartorio de Protestos',
      cidade: 'Canoas',
      uf: 'RS',
    },
  ],
  pendenciasFinanceiras: [
    {
      tipo: 'ATRASO_CARTAO',
      valor: 3200,
      origem: 'Banco ABC',
      dataOcorrencia: '2025-09-10',
    },
  ],
  chequesSemFundo: 0,
  totalProtestos: 3,
  valorTotalProtestos: 12450,
  totalPendencias: 1,
  valorTotalPendencias: 3200,
  _scoreInterno: 320, // Score buscado mas NAO exibido
}

// CPF limpo financeiramente (Sol)
export const MOCK_APIFULL_CPF_FINANCIAL_SOL: SrsPremiumCpfResponse = {
  nome: 'Maria Aparecida Santos',
  protestos: [],
  pendenciasFinanceiras: [],
  chequesSemFundo: 0,
  totalProtestos: 0,
  valorTotalProtestos: 0,
  totalPendencias: 0,
  valorTotalPendencias: 0,
  _scoreInterno: 850, // Score buscado mas NAO exibido
}

// ========== CNPJ DOSSIE (ic-dossie-juridico) ==========

// CNPJ com problemas (Chuva)
export const MOCK_APIFULL_CNPJ_DOSSIE_CHUVA: DossieResponse = {
  razaoSocial: 'EMPRESA PROBLEMATICA LTDA',
  cnpj: '12345678000190',
  situacao: 'EM RECUPERACAO JUDICIAL',
  dataAbertura: '2015-06-20',
  naturezaJuridica: 'Sociedade Empresaria Limitada',
  capitalSocial: 100000,
  endereco: {
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Sala 501',
    bairro: 'Bela Vista',
    cidade: 'Sao Paulo',
    uf: 'SP',
    cep: '01310-100',
  },
  socios: [
    {
      nome: 'CARLOS ROBERTO PROBLEMATICO',
      qualificacao: 'Socio-Administrador',
      documento: '123.456.789-00',
    },
    {
      nome: 'MARIA JOSE PROBLEMATICA',
      qualificacao: 'Socia',
      documento: '987.654.321-00',
    },
  ],
  cnaePrincipal: {
    codigo: '4712-1/00',
    descricao: 'Comercio varejista de mercadorias em geral',
  },
  acoesAtivas: {
    quantidade: 5,
    valorTotal: 450000,
    ocorrencias: [
      {
        numeroProcesso: '1001234-56.2024.8.26.0100',
        tribunal: 'TJSP',
        dataDistribuicao: '2024-02-15',
        natureza: 'Execucao Fiscal',
        autor: 'Fazenda Publica do Estado de SP',
        reu: 'Empresa Problematica Ltda',
        valor: 150000,
        status: 'Em andamento',
      },
      {
        numeroProcesso: '0002345-12.2024.5.02.0001',
        tribunal: 'TRT-2',
        dataDistribuicao: '2024-05-10',
        natureza: 'Reclamacao Trabalhista',
        autor: 'Ex-funcionario Silva',
        reu: 'Empresa Problematica Ltda',
        valor: 80000,
        status: 'Em andamento',
      },
      {
        numeroProcesso: '1003456-78.2024.8.26.0100',
        tribunal: 'TJSP',
        dataDistribuicao: '2024-06-20',
        natureza: 'Acao de Cobranca',
        autor: 'Fornecedor ABC Ltda',
        reu: 'Empresa Problematica Ltda',
        valor: 45000,
        status: 'Em andamento',
      },
    ],
  },
  acoesArquivadas: {
    quantidade: 2,
    ocorrencias: [
      {
        numeroProcesso: '1009876-54.2022.8.26.0100',
        tribunal: 'TJSP',
        dataDistribuicao: '2022-03-10',
        natureza: 'Acao de Cobranca',
        status: 'Arquivado',
      },
    ],
  },
  alertas: {
    quantidade: 3,
    ocorrencias: [
      {
        descricao: 'Empresa em Recuperacao Judicial',
        dataDistribuicao: '2024-01-15',
      },
      {
        descricao: 'Protestos em cartorio',
        dataDistribuicao: '2025-06-10',
      },
    ],
  },
}

// CNPJ limpo (Sol)
export const MOCK_APIFULL_CNPJ_DOSSIE_SOL: DossieResponse = {
  razaoSocial: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  cnpj: '98765432000155',
  situacao: 'ATIVA',
  dataAbertura: '2018-03-15',
  naturezaJuridica: 'Sociedade Empresaria Limitada',
  capitalSocial: 500000,
  endereco: {
    logradouro: 'Rua das Tecnologias',
    numero: '500',
    complemento: 'Andar 10',
    bairro: 'Centro',
    cidade: 'Florianopolis',
    uf: 'SC',
    cep: '88000-000',
  },
  socios: [
    {
      nome: 'CARLOS EDUARDO PEREIRA',
      qualificacao: 'Socio-Administrador',
      documento: '111.222.333-44',
    },
  ],
  cnaePrincipal: {
    codigo: '6201-5/01',
    descricao: 'Desenvolvimento de programas de computador sob encomenda',
  },
  acoesAtivas: {
    quantidade: 0,
    valorTotal: 0,
    ocorrencias: [],
  },
  acoesArquivadas: {
    quantidade: 0,
    ocorrencias: [],
  },
  alertas: {
    quantidade: 0,
    ocorrencias: [],
  },
}

// ========== CNPJ FINANCEIRO (srs-premium) ==========

// CNPJ com problemas financeiros (Chuva)
export const MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA: SrsPremiumCnpjResponse = {
  razaoSocial: 'EMPRESA PROBLEMATICA LTDA',
  cnpj: '12345678000190',
  protestos: [
    {
      data: '2025-06-10',
      valor: 15000,
      cartorio: '1o Cartorio de Protestos',
      cidade: 'Sao Paulo',
      uf: 'SP',
    },
    {
      data: '2025-08-22',
      valor: 28500,
      cartorio: '2o Cartorio de Protestos',
      cidade: 'Sao Paulo',
      uf: 'SP',
    },
    {
      data: '2025-11-15',
      valor: 12300,
      cartorio: '3o Cartorio de Protestos',
      cidade: 'Campinas',
      uf: 'SP',
    },
  ],
  pendenciasFinanceiras: [
    {
      tipo: 'DIVIDA_ATIVA',
      valor: 45000,
      origem: 'Receita Federal',
      dataOcorrencia: '2024-12-01',
    },
    {
      tipo: 'PENDENCIA_FINANCEIRA',
      valor: 23000,
      origem: 'Banco do Brasil',
      dataOcorrencia: '2025-03-15',
    },
  ],
  chequesSemFundo: 5,
  totalProtestos: 3,
  valorTotalProtestos: 55800,
  totalPendencias: 2,
  valorTotalPendencias: 68000,
  _scoreInterno: 280, // Score buscado mas NAO exibido
}

// CNPJ limpo financeiramente (Sol)
export const MOCK_APIFULL_CNPJ_FINANCIAL_SOL: SrsPremiumCnpjResponse = {
  razaoSocial: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  cnpj: '98765432000155',
  protestos: [],
  pendenciasFinanceiras: [],
  chequesSemFundo: 0,
  totalProtestos: 0,
  valorTotalProtestos: 0,
  totalPendencias: 0,
  valorTotalPendencias: 0,
  _scoreInterno: 900, // Score buscado mas NAO exibido
}
