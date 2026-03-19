export interface BlogPost {
  _id: string
  _createdAt: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  primaryKeyword: string
  segment: 'geral' | 'mei' | 'contabilidade' | 'imobiliaria' | 'varejo' | 'fintech'
  body: unknown[]
  mainImage?: {
    asset: { _ref: string }
    alt?: string
  }
  estimatedReadingTime?: number
}

export interface BlogPostPreview {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt: string
  segment: BlogPost['segment']
  mainImage?: BlogPost['mainImage']
}
