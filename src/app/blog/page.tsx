import type { Metadata } from 'next'
import { client } from '@/lib/sanity/client'
import { allPostsQuery } from '@/lib/sanity/queries'
import type { BlogPostPreview } from '@/lib/sanity/types'
import { BlogCard } from '@/components/blog/BlogCard'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Blog EOPIX — Consulta CPF/CNPJ e Proteção Financeira',
  description:
    'Artigos sobre como consultar CPF/CNPJ, identificar riscos financeiros e proteger seu negócio. Conteúdo para MEIs, contabilistas e empresários.',
  openGraph: {
    title: 'Blog EOPIX — Consulta CPF/CNPJ e Proteção Financeira',
    description:
      'Artigos sobre como consultar CPF/CNPJ, identificar riscos financeiros e proteger seu negócio.',
    url: 'https://somoseopix.com.br/blog',
    siteName: 'EOPIX',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default async function BlogPage() {
  const posts: BlogPostPreview[] = await client.fetch(allPostsQuery)

  return (
    <main className="blog-page">
      <header className="blog-header">
        <h1 className="blog-header__title">Blog</h1>
        <p className="blog-header__subtitle">
          Proteção financeira e consulta de risco para MEIs e empresas
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="blog-empty">
          <p>Em breve novos artigos. Volte em alguns dias.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </main>
  )
}
