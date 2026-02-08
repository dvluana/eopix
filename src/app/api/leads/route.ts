import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail, cleanDocument } from '@/lib/validators'

interface CaptureLeadRequest {
  email: string
  term?: string
  reason: 'API_DOWN' | 'MAINTENANCE'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CaptureLeadRequest
    const { email, term, reason } = body

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      )
    }

    if (!reason || !['API_DOWN', 'MAINTENANCE'].includes(reason)) {
      return NextResponse.json(
        { error: 'Motivo invalido' },
        { status: 400 }
      )
    }

    // Clean term if provided
    const cleanedTerm = term ? cleanDocument(term) : null

    // Create lead
    await prisma.leadCapture.create({
      data: {
        email: email.toLowerCase(),
        term: cleanedTerm,
        reason,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Obrigado! Avisaremos quando o servico estiver disponivel.',
    })
  } catch (error) {
    console.error('Capture lead error:', error)
    return NextResponse.json(
      { error: 'Erro ao capturar lead' },
      { status: 500 }
    )
  }
}
