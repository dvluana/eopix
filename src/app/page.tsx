import { client } from '@/lib/sanity/client'
import { recentPostsQuery } from '@/lib/sanity/queries'
import type { BlogPostPreview } from '@/lib/sanity/types'
import LandingPageClient from '@/components/landing/LandingPageClient'

export const revalidate = 60

export default async function LandingPage() {
  const blogPosts: BlogPostPreview[] = client ? await client.fetch(recentPostsQuery).catch(() => []) : []

  return <LandingPageClient blogPosts={blogPosts} />
}
