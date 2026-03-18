import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Veja como a EOPIX coleta, usa e protege seus dados pessoais conforme a LGPD — Lei Geral de Proteção de Dados.',
  alternates: {
    canonical: 'https://somoseopix.com.br/privacidade',
  },
}

export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
