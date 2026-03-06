import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminCredentials } from '@/lib/admin-auth'
import { createSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { isBypassMode } from '@/lib/mock-mode'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres')
})

export async function POST(request: NextRequest) {
  try {
    // Rate limit por IP (bypass in MOCK_MODE/TEST_MODE and dev)
    const isDev = process.env.NODE_ENV === 'development'
    if (!isBypassMode && !isDev) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
      const rateLimit = await checkRateLimit(ip, 'admin_login')
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Muitas tentativas. Tente novamente mais tarde.' },
          { status: 429 }
        )
      }
    }

    // Validar payload
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // Verificar credenciais
    const valid = await verifyAdminCredentials(email, password)

    if (!valid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Criar sessão admin com duração reduzida (8h)
    await createSession(email, { durationHours: 8 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('[Admin Login] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    )
  }
}
