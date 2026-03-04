/**
 * Poll a purchase until it reaches the expected status or times out.
 */

import { getPurchase } from './api-client'

interface WaitOptions {
  /** Max time to wait in ms (default: 30000) */
  timeout?: number
  /** Poll interval in ms (default: 1000) */
  interval?: number
}

export async function waitForPurchaseStatus(
  code: string,
  expectedStatus: string,
  options: WaitOptions = {}
): Promise<{ status: string; reportId: string | null }> {
  const { timeout = 30_000, interval = 1_000 } = options
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const res = await getPurchase(code)

    if (res.ok && res.data.status === expectedStatus) {
      return {
        status: res.data.status,
        reportId: res.data.reportId,
      }
    }

    if (res.ok && res.data.status === 'FAILED') {
      throw new Error(`Purchase ${code} reached FAILED status`)
    }

    await new Promise((r) => setTimeout(r, interval))
  }

  // Final check
  const final = await getPurchase(code)
  throw new Error(
    `Timed out waiting for purchase ${code} to reach ${expectedStatus}. ` +
      `Current: ${final.ok ? final.data.status : `HTTP ${final.status}`}`
  )
}
