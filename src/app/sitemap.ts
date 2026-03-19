import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity/client'
import { allSlugsQuery } from '@/lib/sanity/queries'

const BASE_URL = 'https://somoseopix.com.br'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs: { slug: string }[] = await client.fetch(allSlugsQuery).catch(() => [])

  const blogUrls: MetadataRoute.Sitemap = slugs.map(({ slug }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/termos`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacidade`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...blogUrls,
  ]
}
