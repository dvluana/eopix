/**
 * Playwright global setup:
 * 1. Wait for the app to be healthy
 * 2. Seed an AdminUser for E2E tests
 */

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
  // Use Prisma directly to seed the admin user with bcrypt hash.
  // We use dynamic import to avoid bundling issues.
  const bcrypt = await import('bcryptjs')

  // In CI, DATABASE_URL is set by the workflow. Locally, it comes from .env.local.
  // We need to use @prisma/client directly since we're outside the Next.js context.
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  try {
    const existing = await prisma.adminUser.findUnique({
      where: { email: ADMIN_CREDENTIALS.email },
    })

    if (!existing) {
      const hash = await bcrypt.hash(ADMIN_CREDENTIALS.password, 10)
      await prisma.adminUser.create({
        data: {
          email: ADMIN_CREDENTIALS.email,
          passwordHash: hash,
          name: ADMIN_CREDENTIALS.name,
          active: true,
        },
      })
      console.log(`[global-setup] Admin user seeded: ${ADMIN_CREDENTIALS.email}`)
    } else {
      console.log(`[global-setup] Admin user already exists: ${ADMIN_CREDENTIALS.email}`)
    }
  } finally {
    await prisma.$disconnect()
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
