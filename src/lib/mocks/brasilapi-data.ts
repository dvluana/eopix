export const MOCK_BRASILAPI_CNPJ = {
  razaoSocial: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
  situacao: 'ATIVA',
  abertura: '2018-03-15',
  cnaePrincipal: {
    codigo: '6201-5/01',
    descricao: 'Desenvolvimento de programas de computador sob encomenda',
  },
  cnaeSecundarios: [
    {
      codigo: '6202-3/00',
      descricao: 'Consultoria em tecnologia da informacao',
    },
    { codigo: '6311-9/00', descricao: 'Tratamento de dados' },
  ],
  socios: [
    { nome: 'CARLOS EDUARDO PEREIRA', qualificacao: 'Socio-Administrador' },
  ],
  capitalSocial: 100000,
  endereco: { municipio: 'Florianopolis', uf: 'SC' },
}

export const MOCK_BRASILAPI_CNPJ_BAIXADA = {
  razaoSocial: 'EMPRESA ENCERRADA LTDA ME',
  situacao: 'BAIXADA',
  abertura: '2010-01-10',
  cnaePrincipal: {
    codigo: '4712-1/00',
    descricao: 'Comercio varejista de mercadorias em geral',
  },
  cnaeSecundarios: [],
  socios: [],
  capitalSocial: 10000,
  endereco: { municipio: 'Sao Paulo', uf: 'SP' },
}
