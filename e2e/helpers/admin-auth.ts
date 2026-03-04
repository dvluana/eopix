/**
 * Admin authentication helper for E2E tests.
 * Logs in as the seeded admin user and returns the session cookie.
 */

import { adminLogin } from './api-client'
import { ADMIN_CREDENTIALS } from './test-data'

let cachedCookie: string | undefined

export async function getAdminCookie(): Promise<string> {
  if (cachedCookie) return cachedCookie

  const res = await adminLogin(ADMIN_CREDENTIALS.email, ADMIN_CREDENTIALS.password)

  if (!res.ok || !res.cookie) {
    throw new Error(
      `Admin login failed: ${res.status} — ${JSON.stringify(res.data)}. ` +
        'Did global-setup.ts seed the admin user?'
    )
  }

  cachedCookie = res.cookie
  return cachedCookie
}

export function clearAdminCookie() {
  cachedCookie = undefined
}
