import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail, cleanDocument, isValidCPF, isValidCNPJ } from '@/lib/validators'

const TIPOS_VALIDOS = [
  'ACESSO',
  'CORRECAO',
  'EXCLUSAO',
  'PORTABILIDADE',
  'OPOSICAO',
  'REVOGACAO',
] as const

type TipoLgpd = typeof TIPOS_VALIDOS[number]

interface LgpdRequestBody {
  nome: string
  cpfCnpj: string
  email: string
  tipo: TipoLgpd
  descricao: string
}

function generateProtocol(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `LGPD-${year}-${random}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LgpdRequestBody
    const { nome, cpfCnpj, email, tipo, descricao } = body

    // Validar campos obrigatórios
    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome deve ter pelo menos 3 caracteres' },
        { status: 400 }
      )
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar CPF ou CNPJ
    const cleanedDoc = cleanDocument(cpfCnpj || '')
    if (!isValidCPF(cleanedDoc) && !isValidCNPJ(cleanedDoc)) {
      return NextResponse.json(
        { error: 'CPF ou CNPJ inválido' },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de solicitação inválido' },
        { status: 400 }
      )
    }

    if (!descricao || descricao.trim().length < 10) {
      return NextResponse.json(
        { error: 'Descrição deve ter pelo menos 10 caracteres' },
        { status: 400 }
      )
    }

    // Gerar protocolo único
    let protocol = generateProtocol()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const existing = await prisma.lgpdRequest.findUnique({
        where: { protocol },
      })
      if (!existing) break
      protocol = generateProtocol()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Erro ao gerar protocolo. Tente novamente.' },
        { status: 500 }
      )
    }

    // Criar solicitação
    const lgpdRequest = await prisma.lgpdRequest.create({
      data: {
        protocol,
        nome: nome.trim(),
        cpfCnpj: cleanedDoc,
        email: email.toLowerCase().trim(),
        tipo,
        descricao: descricao.trim(),
      },
    })

    return NextResponse.json({
      success: true,
      protocol: lgpdRequest.protocol,
      message: 'Solicitação registrada com sucesso. Guarde seu número de protocolo.',
    })
  } catch (error) {
    console.error('LGPD request error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}
