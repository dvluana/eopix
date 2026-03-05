/**
 * Playwright global setup:
 * 1. Wait for the app to be healthy
 * 2. Seed an AdminUser for E2E tests
 *
 * Uses raw SQL via @neondatabase/serverless Pool instead of PrismaClient,
 * because PrismaNeon's internal WebSocket handling fails in plain Node.js (Playwright).
 */

import dotenv from 'dotenv'
import path from 'path'
import ws from 'ws'
import { neonConfig, Pool } from '@neondatabase/serverless'

// Load .env.local so we have DATABASE_URL
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Enable WebSocket in Node.js for Neon serverless driver
neonConfig.webSocketConstructor = ws

import { ADMIN_CREDENTIALS } from './helpers/test-data'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function waitForHealth(maxRetries = 30, intervalMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`)
      if (res.ok) {
        const data = await res.json()
        console.log(`[global-setup] Health check passed: ${data.status} (${data.mode})`)
        return
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error(`[global-setup] App not healthy after ${maxRetries} retries`)
}

async function seedAdmin() {
  const bcrypt = await import('bcryptjs')
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  try {
    const { rows } = await pool.query(
      'SELECT id FROM "AdminUser" WHERE email = $1',
      [ADMIN_CREDENTIALS.email]
    )

    if (rows.length === 0) {
      const hash = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10)
      await pool.query(
        `INSERT INTO "AdminUser" (id, email, "passwordHash", name, role, active, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'admin', true, NOW(), NOW())`,
        [ADMIN_CREDENTIALS.email, hash, ADMIN_CREDENTIALS.name]
      )
      console.log(`[global-setup] Admin user seeded: ${ADMIN_CREDENTIALS.email}`)
    } else {
      console.log(`[global-setup] Admin user already exists: ${ADMIN_CREDENTIALS.email}`)
    }
  } finally {
    await pool.end()
  }
}

export default async function globalSetup() {
  console.log('[global-setup] Starting...')

  await waitForHealth()
  await seedAdmin()

  // Also set ADMIN_EMAILS env so requireAdmin works with our seeded admin
  if (!process.env.ADMIN_EMAILS?.includes(ADMIN_CREDENTIALS.email)) {
    process.env.ADMIN_EMAILS = [
      process.env.ADMIN_EMAILS || '',
      ADMIN_CREDENTIALS.email,
    ]
      .filter(Boolean)
      .join(',')
  }

  console.log('[global-setup] Done.')
}
