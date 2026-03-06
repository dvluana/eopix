import { AdminSidebar } from '../_components/AdminSidebar'
import { AdminProviders } from '../_components/AdminProviders'
import { requireAdminAuth } from '@/lib/server-auth'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticação no servidor
  // Se não autenticado, redirect() é chamado automaticamente
  await requireAdminAuth()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--color-bg-secondary)',
      }}
    >
      <AdminSidebar />

      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          padding: '32px',
          minHeight: '100vh',
        }}
      >
        <AdminProviders>{children}</AdminProviders>
      </main>
    </div>
  )
}
