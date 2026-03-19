import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const apiVersion = '2024-01-01'

// Client is null when Sanity env vars are not configured (e.g. Vercel without blog setup)
export const client = projectId
  ? createClient({ projectId, dataset, apiVersion, useCdn: true })
  : null

const builder = projectId ? imageUrlBuilder(client!) : null

export function urlFor(source: SanityImageSource) {
  if (!builder) throw new Error('Sanity not configured: missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  return builder.image(source)
}
