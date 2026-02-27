import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { createSession, isAdminEmail } from '@/lib/auth'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

const client = new OAuth2Client(GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    if (!GOOGLE_CLIENT_ID) {
      console.error('[Google Auth] GOOGLE_CLIENT_ID not configured')
      return NextResponse.json(
        { error: 'Google Sign-In não está configurado' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { credential } = body

    if (!credential) {
      return NextResponse.json(
        { error: 'Token do Google não fornecido' },
        { status: 400 }
      )
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload || !payload.email) {
      return NextResponse.json(
        { error: 'Não foi possível obter o email da conta Google' },
        { status: 400 }
      )
    }

    const email = payload.email.toLowerCase().trim()

    await createSession(email)

    const isAdmin = await isAdminEmail(email)

    return NextResponse.json({
      success: true,
      isAdmin,
      redirect: isAdmin ? '/admin' : '/minhas-consultas',
    })
  } catch (error) {
    console.error('[Google Auth] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao autenticar com Google' },
      { status: 500 }
    )
  }
}
