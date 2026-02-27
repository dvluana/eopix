import { redirect } from 'next/navigation'
import { getSession, isAdminEmail } from './auth'

/**
 * Server-side helper para verificar autenticação admin
 * Usa redirect() do Next.js para redirecionar ANTES de renderizar
 *
 * @throws redirect('/admin/login') se não autenticado
 * @returns { email: string } se autenticado
 */
export async function requireAdminAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }

  const isAdmin = await isAdminEmail(session.email)
  if (!isAdmin) {
    redirect('/admin/login')
  }

  return { email: session.email }
}
