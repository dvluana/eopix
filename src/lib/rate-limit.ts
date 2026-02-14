import { prisma } from './prisma'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number // em milissegundos
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  search: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10/hora
  purchase: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3/hora
  'magic-code-send': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 envios a cada 15 min
  'magic-code-verify': { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 verificações a cada 15 min
  'magic-link': { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20/hora por IP
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

export async function checkRateLimit(
  identifier: string,
  action: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action]
  if (!config) {
    // Acao desconhecida = permitido
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(),
    }
  }

  const windowStart = new Date(Date.now() - config.windowMs)

  // Buscar ou criar registro de rate limit
  const existing = await prisma.rateLimit.findUnique({
    where: {
      identifier_action: {
        identifier,
        action,
      },
    },
  })

  if (!existing) {
    // Primeira requisicao
    await prisma.rateLimit.create({
      data: {
        identifier,
        action,
        count: 1,
        windowStart: new Date(),
      },
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowMs),
    }
  }

  // Verificar se a janela expirou
  if (existing.windowStart < windowStart) {
    // Resetar contador
    await prisma.rateLimit.update({
      where: { id: existing.id },
      data: {
        count: 1,
        windowStart: new Date(),
      },
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(Date.now() + config.windowMs),
    }
  }

  // Janela ainda ativa - verificar limite
  if (existing.count >= config.maxRequests) {
    const resetAt = new Date(existing.windowStart.getTime() + config.windowMs)
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    }
  }

  // Incrementar contador
  await prisma.rateLimit.update({
    where: { id: existing.id },
    data: {
      count: existing.count + 1,
    },
  })

  return {
    allowed: true,
    remaining: config.maxRequests - existing.count - 1,
    resetAt: new Date(existing.windowStart.getTime() + config.windowMs),
  }
}

export async function resetRateLimit(identifier: string, action: string): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: {
      identifier,
      action,
    },
  })
}
