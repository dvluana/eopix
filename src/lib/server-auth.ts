import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Server-side helper para verificar autenticação admin
 * Usa redirect() do Next.js para redirecionar ANTES de renderizar
 *
 * @throws redirect('/admin/login') se não autenticado
 * @returns { email: string } se autenticado
 */
export async function requireAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('eopix_session')

  if (!sessionCookie) {
    redirect('/admin/login')
  }

  try {
    // Decode JWT payload (sem verificar assinatura, apenas checar claims)
    const [, payloadB64] = sessionCookie.value.split('.')
    if (!payloadB64) redirect('/admin/login')

    // Base64url decode
    let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const decoded = JSON.parse(atob(base64))

    // Check expiration
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      redirect('/admin/login')
    }

    const email = decoded.email?.toLowerCase()
    if (!email) redirect('/admin/login')

    // Check ADMIN_EMAILS
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())

    if (!adminEmails.includes(email)) {
      redirect('/admin/login')
    }

    return { email }
  } catch {
    redirect('/admin/login')
  }
}
