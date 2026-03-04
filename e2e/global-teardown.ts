/**
 * Playwright global teardown:
 * Clean up E2E test data (purchases, users, admin) created during tests.
 */

import { ADMIN_CREDENTIALS, TEST_EMAIL } from './helpers/test-data'

export default async function globalTeardown() {
  console.log('[global-teardown] Starting cleanup...')

  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      // Delete purchases created by test email
      const testUser = await prisma.user.findUnique({
        where: { email: TEST_EMAIL },
      })

      if (testUser) {
        // Delete search results linked to test purchases
        const purchases = await prisma.purchase.findMany({
          where: { userId: testUser.id },
          select: { searchResultId: true },
        })

        const searchResultIds = purchases
          .map((p) => p.searchResultId)
          .filter((id): id is string => id !== null)

        if (searchResultIds.length > 0) {
          // Unlink search results from purchases first
          await prisma.purchase.updateMany({
            where: { userId: testUser.id },
            data: { searchResultId: null },
          })

          await prisma.searchResult.deleteMany({
            where: { id: { in: searchResultIds } },
          })
        }

        await prisma.purchase.deleteMany({
          where: { userId: testUser.id },
        })

        await prisma.user.delete({ where: { id: testUser.id } })
        console.log(`[global-teardown] Cleaned up test user: ${TEST_EMAIL}`)
      }

      // Delete seeded admin
      await prisma.adminUser.deleteMany({
        where: { email: ADMIN_CREDENTIALS.email },
      })
      console.log(`[global-teardown] Cleaned up admin: ${ADMIN_CREDENTIALS.email}`)
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('[global-teardown] Cleanup error (non-fatal):', error)
  }

  console.log('[global-teardown] Done.')
}
