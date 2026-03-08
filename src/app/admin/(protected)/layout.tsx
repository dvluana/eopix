import { AdminLayoutShell } from '../_components/AdminLayoutShell'
import { AdminProviders } from '../_components/AdminProviders'
import { requireAdminAuth } from '@/lib/server-auth'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdminAuth()

  return (
    <AdminLayoutShell>
      <AdminProviders>{children}</AdminProviders>
    </AdminLayoutShell>
  )
}
