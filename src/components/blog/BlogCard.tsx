import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostPreview } from '@/lib/sanity/types'
import { urlFor } from '@/lib/sanity/client'

const SEGMENT_LABELS: Record<BlogPostPreview['segment'], string> = {
  geral: 'Geral',
  mei: 'MEI / Autônomo',
  contabilidade: 'Contabilidade',
  imobiliaria: 'Imobiliária',
  varejo: 'Varejo',
  fintech: 'Fintech',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function BlogCard({ post }: { post: BlogPostPreview }) {
  return (
    <article className="blog-card">
      {post.mainImage?.asset && (
        <Link href={`/blog/${post.slug.current}`} className="blog-card__image-link">
          <Image
            src={urlFor(post.mainImage.asset).width(600).height(340).url()}
            alt={post.mainImage.alt ?? post.title}
            width={600}
            height={340}
            className="blog-card__image"
          />
        </Link>
      )}
      <div className="blog-card__body">
        <span className="blog-card__tag">{SEGMENT_LABELS[post.segment]}</span>
        <h2 className="blog-card__title">
          <Link href={`/blog/${post.slug.current}`}>{post.title}</Link>
        </h2>
        <p className="blog-card__excerpt">{post.excerpt}</p>
        <time className="blog-card__date" dateTime={post.publishedAt}>
          {formatDate(post.publishedAt)}
        </time>
      </div>
    </article>
  )
}
