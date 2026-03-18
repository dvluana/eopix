import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Leia os termos de uso da plataforma EOPIX — condições de acesso, uso dos relatórios e responsabilidades.',
  alternates: {
    canonical: 'https://somoseopix.com.br/termos',
  },
}

export default function TermosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
