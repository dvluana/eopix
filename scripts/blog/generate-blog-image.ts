/**
 * generate-blog-image.ts
 *
 * Generates a blog post cover image using Google Gemini API (imagen-3.0-generate-002)
 * and uploads it to Sanity as an asset.
 *
 * Usage:
 *   npx tsx scripts/blog/generate-blog-image.ts \
 *     --title "Como consultar CPF antes de firmar contrato" \
 *     --segment mei \
 *     --slug como-consultar-cpf-antes-contrato
 *
 * Output: Prints the Sanity asset _id to stdout for use in Sanity Studio.
 *
 * Requires in .env.local:
 *   GOOGLE_AI_API_KEY=...
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=...
 *   SANITY_API_TOKEN=...
 *   NEXT_PUBLIC_SANITY_DATASET=production
 */

import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'
import https from 'https'

// Load .env.local manually (tsx doesn't auto-load Next.js env)
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const SEGMENT_THEMES: Record<string, string> = {
  geral: 'professional finance and security concept, Brazilian business context',
  mei: 'small business owner, microentrepreneur, informal economy Brazil',
  contabilidade: 'accounting office, financial documents, Brazilian tax compliance',
  imobiliaria: 'real estate transaction, property documents, Brazilian market',
  varejo: 'retail store, commercial transaction, point of sale Brazil',
  fintech: 'financial technology, digital banking, fintech Brazil',
}

function parseArgs() {
  const args = process.argv.slice(2)
  const result: Record<string, string> = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      result[key] = args[i + 1] ?? ''
      i++
    }
  }
  return result
}

async function uploadToSanity(imageBuffer: Buffer, filename: string): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required')
  }

  return new Promise((resolve, reject) => {
    const url = `https://${projectId}.api.sanity.io/v2021-03-25/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
      },
    }

    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', (chunk) => (body += chunk))
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          if (parsed.document?._id) {
            resolve(parsed.document._id)
          } else {
            reject(new Error(`Sanity upload failed: ${body}`))
          }
        } catch {
          reject(new Error(`Invalid JSON from Sanity: ${body}`))
        }
      })
    })

    req.on('error', reject)
    req.write(imageBuffer)
    req.end()
  })
}

async function main() {
  const args = parseArgs()
  const title = args.title
  const segment = args.segment ?? 'geral'
  const slug = args.slug ?? 'blog-post'

  if (!title) {
    console.error('Usage: npx tsx scripts/blog/generate-blog-image.ts --title "..." --segment mei --slug ...')
    process.exit(1)
  }

  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not set in .env.local')
  }

  const theme = SEGMENT_THEMES[segment] ?? SEGMENT_THEMES.geral

  const prompt = [
    `Create a professional blog cover image for an article titled "${title}".`,
    `Context: ${theme}.`,
    'Style: clean, modern, minimalist. Bold typography feel.',
    'Color palette: dark background (#1a1a1a), yellow accent (#FFD600), white text elements.',
    'No text, no logos, no watermarks. Abstract geometric shapes are acceptable.',
    'Aspect ratio: 16:9 (1200x630 pixels).',
    'Avoid: people faces, personal identification, legal documents with real data.',
  ].join(' ')

  console.log(`Generating image for: "${title}"`)
  console.log(`Segment: ${segment}`)
  console.log(`Prompt: ${prompt}\n`)

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '16:9',
    },
  })

  const imageData = response.generatedImages?.[0]?.image?.imageBytes
  if (!imageData) {
    throw new Error('No image data returned from Gemini API')
  }

  const imageBuffer = Buffer.from(imageData, 'base64')
  const filename = `blog-${slug}.png`

  // Save locally as well (in /tmp)
  const localPath = path.join('/tmp', filename)
  fs.writeFileSync(localPath, imageBuffer)
  console.log(`Image saved locally: ${localPath}`)

  // Upload to Sanity
  console.log('Uploading to Sanity...')
  const assetId = await uploadToSanity(imageBuffer, filename)
  console.log(`\nSanity asset _id: ${assetId}`)
  console.log(`\nUse this in Sanity Studio → mainImage → asset._ref: "${assetId}"`)
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
