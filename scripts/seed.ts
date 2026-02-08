/**
 * Script para popular o banco de dados com dados de teste
 *
 * Uso: npx tsx scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  })

  const prisma = new PrismaClient({ adapter })

  console.log('Conectando ao banco...')

  try {
    // Limpar dados existentes (cuidado em producao!)
    console.log('Limpando dados existentes...')
    await prisma.magicCode.deleteMany()
    await prisma.leadCapture.deleteMany()
    await prisma.rateLimit.deleteMany()
    await prisma.purchase.deleteMany()
    await prisma.searchResult.deleteMany()
    await prisma.blocklist.deleteMany()
    await prisma.user.deleteMany()

    // Criar usuarios de teste
    console.log('Criando usuarios...')
    const user1 = await prisma.user.create({
      data: { email: 'teste@eopix.com.br' },
    })

    const user2 = await prisma.user.create({
      data: { email: 'admin@test.com' },
    })

    const user3 = await prisma.user.create({
      data: { email: 'cliente@exemplo.com' },
    })

    // Criar search results de teste
    console.log('Criando search results...')
    const searchResult1 = await prisma.searchResult.create({
      data: {
        term: '12345678901',
        type: 'CPF',
        name: 'Joao Silva Santos',
        data: {
          mock: true,
          scenario: 'sol',
          apiFull: {
            name: 'Joao Silva Santos',
            cleanNameYears: 8,
            recentInquiries: 2,
            protests: [],
            debts: [],
            bouncedChecks: 0,
            totalProtests: 0,
            totalProtestsAmount: 0,
            region: 'SP',
          },
          processes: [],
          google: {
            general: [],
            focused: [],
            reclameAqui: [],
          },
        },
        summary: 'Nome limpo ha 8 anos. Sem protestos, dividas ou processos encontrados. Baixo risco.',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    const searchResult2 = await prisma.searchResult.create({
      data: {
        term: '12345678000190',
        type: 'CNPJ',
        name: 'Empresa Exemplo LTDA',
        data: {
          mock: true,
          scenario: 'sol',
          brasilApi: {
            razaoSocial: 'Empresa Exemplo LTDA',
            situacao: 'Ativa',
            abertura: '2015-03-15',
            cnaePrincipal: { codigo: '6201500', descricao: 'Desenvolvimento de software' },
            cnaeSecundarios: [],
            socios: [{ nome: 'Joao Silva', qualificacao: 'Socio-Administrador' }],
            capitalSocial: 100000,
            endereco: { municipio: 'Sao Paulo', uf: 'SP' },
          },
          processes: [],
          google: {
            general: [],
            focused: [],
            reclameAqui: [],
          },
        },
        summary: 'Empresa ativa desde 2015. Sem protestos ou processos. Nota 9.5 no Reclame Aqui.',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Criar compras de teste
    console.log('Criando compras...')
    await prisma.purchase.createMany({
      data: [
        {
          userId: user1.id,
          code: 'ABC123',
          term: '12345678901',
          amount: 2990,
          status: 'COMPLETED',
          termsAcceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          searchResultId: searchResult1.id,
          asaasPaymentId: 'pay_mock_1',
          buyerName: 'Cliente Teste',
        },
        {
          userId: user1.id,
          code: 'DEF456',
          term: '12345678000190',
          amount: 2990,
          status: 'COMPLETED',
          termsAcceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          searchResultId: searchResult2.id,
          asaasPaymentId: 'pay_mock_2',
        },
        {
          userId: user2.id,
          code: 'GHI789',
          term: '98765432101',
          amount: 2990,
          status: 'PROCESSING',
          termsAcceptedAt: new Date(),
          paidAt: new Date(),
          asaasPaymentId: 'pay_mock_3',
        },
        {
          userId: user3.id,
          code: 'JKL012',
          term: '11122233344',
          amount: 2990,
          status: 'PENDING',
          termsAcceptedAt: new Date(),
          asaasPaymentId: 'pay_mock_4',
        },
        {
          userId: user3.id,
          code: 'MNO345',
          term: '55544433322',
          amount: 2990,
          status: 'FAILED',
          termsAcceptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          asaasPaymentId: 'pay_mock_5',
        },
      ],
    })

    // Criar blocklist de teste
    console.log('Criando blocklist...')
    await prisma.blocklist.createMany({
      data: [
        {
          term: '00000000000',
          reason: 'SOLICITACAO_TITULAR',
          associatedName: 'Pessoa Protegida',
        },
        {
          term: '11111111111',
          reason: 'JUDICIAL',
          associatedName: null,
        },
      ],
    })

    // Criar leads de teste
    console.log('Criando leads...')
    await prisma.leadCapture.createMany({
      data: [
        {
          email: 'lead1@exemplo.com',
          term: '33344455566',
          reason: 'API_DOWN',
        },
        {
          email: 'lead2@exemplo.com',
          term: null,
          reason: 'MAINTENANCE',
        },
        {
          email: 'lead3@exemplo.com',
          term: '77788899900',
          reason: 'API_DOWN',
        },
      ],
    })

    // Criar magic code de teste
    console.log('Criando magic code...')
    await prisma.magicCode.create({
      data: {
        email: 'teste@eopix.com.br',
        code: '123456',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        used: false,
      },
    })

    console.log('\nDados de teste criados com sucesso!')
    console.log('\nUsuarios:')
    console.log('  - teste@eopix.com.br (magic code: 123456)')
    console.log('  - admin@test.com (admin)')
    console.log('  - cliente@exemplo.com')
    console.log('\nCompras:')
    console.log('  - ABC123 (COMPLETED)')
    console.log('  - DEF456 (COMPLETED)')
    console.log('  - GHI789 (PROCESSING)')
    console.log('  - JKL012 (PENDING)')
    console.log('  - MNO345 (FAILED)')
    console.log('\nBlocklist:')
    console.log('  - 00000000000 (SOLICITACAO_TITULAR)')
    console.log('  - 11111111111 (JUDICIAL)')
  } catch (error) {
    console.error('Erro ao popular banco:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
