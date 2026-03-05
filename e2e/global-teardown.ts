/**
 * Playwright global teardown:
 * Clean up E2E test data (purchases, users, admin) created during tests.
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

import { ADMIN_CREDENTIALS, TEST_EMAIL } from './helpers/test-data'

export default async function globalTeardown() {
  console.log('[global-teardown] Starting cleanup...')

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })

    try {
      // 1. Find test user
      const { rows: users } = await pool.query(
        'SELECT id FROM "User" WHERE email = $1',
        [TEST_EMAIL]
      )

      if (users.length > 0) {
        const userId = users[0].id

        // 2. Get search result IDs linked to test purchases
        const { rows: purchases } = await pool.query(
          'SELECT "searchResultId" FROM "Purchase" WHERE "userId" = $1 AND "searchResultId" IS NOT NULL',
          [userId]
        )
        const srIds = purchases.map((p: { searchResultId: string }) => p.searchResultId)

        // 3. Unlink search results → delete purchases → delete search results → delete user
        await pool.query(
          'UPDATE "Purchase" SET "searchResultId" = NULL WHERE "userId" = $1',
          [userId]
        )
        await pool.query(
          'DELETE FROM "Purchase" WHERE "userId" = $1',
          [userId]
        )

        if (srIds.length > 0) {
          await pool.query(
            'DELETE FROM "SearchResult" WHERE id = ANY($1)',
            [srIds]
          )
        }

        await pool.query('DELETE FROM "User" WHERE id = $1', [userId])
        console.log(`[global-teardown] Cleaned up test user: ${TEST_EMAIL}`)
      }

      // 4. Delete seeded admin
      await pool.query(
        'DELETE FROM "AdminUser" WHERE email = $1',
        [ADMIN_CREDENTIALS.email]
      )
      console.log(`[global-teardown] Cleaned up admin: ${ADMIN_CREDENTIALS.email}`)
    } finally {
      await pool.end()
    }
  } catch (error) {
    console.error('[global-teardown] Cleanup error (non-fatal):', error)
  }

  console.log('[global-teardown] Done.')
}
