import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { client, urlFor } from '@/lib/sanity/client'
import { postBySlugQuery, allSlugsQuery } from '@/lib/sanity/queries'
import type { BlogPost } from '@/lib/sanity/types'
import { PortableText } from '@/components/blog/PortableText'
import type { PortableTextBlock } from '@portabletext/types'

export const revalidate = 60

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  if (!client) return []
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery)
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!client) return {}
  const post: BlogPost | null = await client.fetch(postBySlugQuery, { slug: params.slug })
  if (!post) return {}

  const imageUrl = post.mainImage?.asset
    ? urlFor(post.mainImage.asset).width(1200).height(630).url()
    : undefined

  return {
    title: `${post.title} | Blog EOPIX`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://somoseopix.com.br/blog/${post.slug.current}`,
      siteName: 'EOPIX',
      locale: 'pt_BR',
      type: 'article',
      publishedTime: post.publishedAt,
      ...(imageUrl && { images: [{ url: imageUrl, width: 1200, height: 630, alt: post.title }] }),
    },
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: Props) {
  if (!client) notFound()
  const post: BlogPost | null = await client.fetch(postBySlugQuery, { slug: params.slug })
  if (!post) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Organization', name: 'EOPIX', url: 'https://somoseopix.com.br' },
    publisher: {
      '@type': 'Organization',
      name: 'EOPIX',
      url: 'https://somoseopix.com.br',
      logo: { '@type': 'ImageObject', url: 'https://somoseopix.com.br/logo.png' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://somoseopix.com.br/blog/${post.slug.current}`,
    },
    ...(post.mainImage?.asset && {
      image: urlFor(post.mainImage.asset).width(1200).height(630).url(),
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="blog-post-page">
        <article className="blog-post">
          <header className="blog-post__header">
            <nav className="blog-post__breadcrumb">
              <Link href="/">EOPIX</Link>
              <span> / </span>
              <Link href="/blog">Blog</Link>
              <span> / </span>
              <span>{post.title}</span>
            </nav>

            <h1 className="blog-post__title">{post.title}</h1>
            <p className="blog-post__excerpt">{post.excerpt}</p>

            <div className="blog-post__meta">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {post.estimatedReadingTime && (
                <span>{post.estimatedReadingTime} min de leitura</span>
              )}
            </div>
          </header>

          {post.mainImage?.asset && (
            <div className="blog-post__cover">
              <Image
                src={urlFor(post.mainImage.asset).width(1200).height(630).url()}
                alt={post.mainImage.alt ?? post.title}
                width={1200}
                height={630}
                priority
                className="blog-post__cover-img"
              />
            </div>
          )}

          <div className="blog-post__body">
            <PortableText value={post.body as PortableTextBlock[]} />
          </div>

          <footer className="blog-post__footer">
            <div className="blog-post__disclaimer">
              <p>
                <strong>Aviso Legal:</strong> Este artigo é informativo e não constitui
                assessoria jurídica ou financeira. As informações de terceiros citadas são públicas
                e foram verificadas na data de publicação. Consulte um profissional habilitado para
                decisões específicas.
              </p>
              <p>
                As consultas realizadas pelo EOPIX utilizam bases de dados governamentais e fontes
                públicas oficiais, com base legal no legítimo interesse (LGPD, Art. 7º, IX) para
                finalidades de análise de crédito e prevenção a fraudes.
              </p>
            </div>
            <Link href="/blog" className="blog-post__back">
              ← Voltar para o Blog
            </Link>
          </footer>
        </article>

        <aside className="blog-post__cta">
          <div className="blog-post__cta-card">
            <p className="blog-post__cta-label">CONSULTA COMPLETA</p>
            <h2 className="blog-post__cta-title">Consulte CPF ou CNPJ agora</h2>
            <p className="blog-post__cta-text">
              Relatório completo com dados cadastrais, financeiros e processos judiciais. Pagamento
              único, sem assinatura.
            </p>
            <Link href="/" className="blog-post__cta-btn">
              CONSULTAR AGORA — R$39,90
            </Link>
          </div>
        </aside>
      </main>
    </>
  )
}
