import { NextRequest, NextResponse } from 'next/server'
import { getSessionWithUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionWithUser(request)

    if (!session) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      email: session.email,
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sessao' },
      { status: 500 }
    )
  }
}
