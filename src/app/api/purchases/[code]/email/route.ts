import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidEmail } from '@/lib/validators'

interface RouteParams {
  params: Promise<{ code: string }>
}

interface UpdateEmailRequest {
  email: string
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params
    const body = await request.json() as UpdateEmailRequest
    const { email } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Codigo obrigatorio' },
        { status: 400 }
      )
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalido' },
        { status: 400 }
      )
    }

    // Find purchase
    const purchase = await prisma.purchase.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        user: true,
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra nao encontrada' },
        { status: 404 }
      )
    }

    // Only allow email update for PENDING or PAID purchases
    if (!['PENDING', 'PAID'].includes(purchase.status)) {
      return NextResponse.json(
        { error: 'Email nao pode ser alterado neste status' },
        { status: 400 }
      )
    }

    // Get or create new user with the new email
    let newUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!newUser) {
      newUser = await prisma.user.create({
        data: { email: email.toLowerCase() },
      })
    }

    // Update purchase to new user
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { userId: newUser.id },
    })

    // Mask email for response
    const emailParts = email.split('@')
    const maskedEmail = emailParts[0].charAt(0) + '***@' +
      emailParts[1].charAt(0) + '***.' +
      emailParts[1].split('.').pop()

    return NextResponse.json({
      success: true,
      email: maskedEmail,
    })
  } catch (error) {
    console.error('Update email error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar email' },
      { status: 500 }
    )
  }
}
