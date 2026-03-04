/**
 * Reusable fixture: create a purchase, mark it paid, process it, and return the report ID.
 * Uses API calls (not browser) for speed and reliability.
 */

import {
  createPurchase,
  markPaid,
  processSearch,
  adminFindPurchaseByCode,
  getPurchase,
} from '../helpers/api-client'
import { getAdminCookie } from '../helpers/admin-auth'
import { TEST_EMAIL } from '../helpers/test-data'

export interface CompletedPurchase {
  code: string
  purchaseId: string
  reportId: string
  reportUrl: string
}

/**
 * Creates a purchase through the full bypass-mode pipeline:
 * 1. POST /api/purchases (PENDING)
 * 2. Admin mark-paid (PAID)
 * 3. Process search sync (COMPLETED)
 *
 * Returns the purchase code and report ID.
 */
export async function createCompletedPurchase(
  term: string,
  email = TEST_EMAIL
): Promise<CompletedPurchase> {
  // 1. Create purchase
  const purchaseRes = await createPurchase(term, email)
  if (!purchaseRes.ok) {
    throw new Error(`Failed to create purchase: ${JSON.stringify(purchaseRes.data)}`)
  }
  const { code } = purchaseRes.data

  // 2. Get admin cookie and find purchase ID
  const adminCookie = await getAdminCookie()
  const listRes = await adminFindPurchaseByCode(code, adminCookie)
  if (!listRes.ok || !listRes.data.purchases?.length) {
    throw new Error(`Failed to find purchase by code ${code}: ${JSON.stringify(listRes.data)}`)
  }
  const purchaseId = listRes.data.purchases[0].id

  // 3. Mark as paid
  const paidRes = await markPaid(purchaseId, adminCookie)
  if (!paidRes.ok) {
    throw new Error(`Failed to mark paid: ${JSON.stringify(paidRes.data)}`)
  }

  // 4. Process search (sync fallback)
  const processRes = await processSearch(code)
  if (!processRes.ok) {
    throw new Error(`Failed to process search: ${JSON.stringify(processRes.data)}`)
  }

  // 5. Verify completion
  const finalRes = await getPurchase(code)
  if (!finalRes.ok || finalRes.data.status !== 'COMPLETED') {
    throw new Error(
      `Purchase not completed after processing: ${JSON.stringify(finalRes.data)}`
    )
  }

  return {
    code,
    purchaseId,
    reportId: finalRes.data.reportId!,
    reportUrl: `/relatorio/${finalRes.data.reportId}`,
  }
}
