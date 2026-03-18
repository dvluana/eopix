import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Layout raiz do admin - apenas wrapper
  // Autenticação é verificada nos layouts filhos
  return <>{children}</>
}
