import { groq } from 'next-sanity'

export const allPostsQuery = groq`
  *[_type == "blogPost" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    segment,
    mainImage
  }
`

export const recentPostsQuery = groq`
  *[_type == "blogPost" && defined(publishedAt)] | order(publishedAt desc) [0..2] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    segment
  }
`

export const postBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    _createdAt,
    title,
    slug,
    publishedAt,
    excerpt,
    primaryKeyword,
    segment,
    body,
    mainImage,
    estimatedReadingTime
  }
`

export const allSlugsQuery = groq`
  *[_type == "blogPost" && defined(slug.current)] {
    "slug": slug.current
  }
`
