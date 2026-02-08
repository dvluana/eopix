import { isMockMode } from './mock-mode'

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (isMockMode) {
    console.log('[MOCK] Turnstile bypass')
    return true
  }

  // === CHAMADA REAL (Parte B) ===
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  )

  if (!res.ok) {
    console.error(`Turnstile error: ${res.status}`)
    return false
  }

  const data = await res.json()
  return data.success === true
}
