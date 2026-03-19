import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostPreview } from '@/lib/sanity/types'
import { urlFor } from '@/lib/sanity/client'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function BlogPreviewSection({ posts }: { posts: BlogPostPreview[] }) {
  if (posts.length === 0) return null

  return (
    <section className="blog-preview">
      <div className="blog-preview__inner">
        <div className="blog-preview__header">
          <h2 className="blog-preview__title">DO BLOG</h2>
          <Link href="/blog" className="blog-preview__link">
            Ver todos os artigos →
          </Link>
        </div>

        <div className="blog-preview__grid">
          {posts.map((post) => (
            <article key={post._id} className="blog-preview__card">
              {post.mainImage?.asset && (
                <Link href={`/blog/${post.slug.current}`} className="blog-preview__img-link">
                  <Image
                    src={urlFor(post.mainImage.asset).width(400).height(220).url()}
                    alt={post.mainImage.alt ?? post.title}
                    width={400}
                    height={220}
                    className="blog-preview__img"
                  />
                </Link>
              )}
              <div className="blog-preview__card-body">
                <time className="blog-preview__date" dateTime={post.publishedAt}>
                  {formatDate(post.publishedAt)}
                </time>
                <h3 className="blog-preview__card-title">
                  <Link href={`/blog/${post.slug.current}`}>{post.title}</Link>
                </h3>
                <p className="blog-preview__excerpt">{post.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
