import { PortableText as SanityPortableText, PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/client'

const components: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: object; alt?: string; caption?: string } }) => (
      <figure className="blog-figure">
        <Image
          src={urlFor(value.asset).width(800).url()}
          alt={value.alt ?? ''}
          width={800}
          height={450}
          className="blog-image"
        />
        {value.caption && (
          <figcaption className="blog-caption">{value.caption}</figcaption>
        )}
      </figure>
    ),
  },
  block: {
    h2: ({ children }) => <h2 className="blog-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="blog-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="blog-h4">{children}</h4>,
    blockquote: ({ children }) => <blockquote className="blog-quote">{children}</blockquote>,
    normal: ({ children }) => <p className="blog-p">{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code className="blog-inline-code">{children}</code>,
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="blog-link">
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="blog-ul">{children}</ul>,
    number: ({ children }) => <ol className="blog-ol">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="blog-li">{children}</li>,
    number: ({ children }) => <li className="blog-li">{children}</li>,
  },
}

export function PortableText({ value }: { value: PortableTextBlock[] }) {
  return <SanityPortableText value={value} components={components} />
}
