/**
 * Helper to complete a purchase in bypass-aware mode.
 * In BYPASS_PAYMENT=true, purchases are created as PAID — skip markPaid.
 */
import { markPaid, processSearch, adminFindPurchaseByCode, getPurchase } from './api-client'
import { getAdminCookie } from './admin-auth'

export async function completePurchase(code: string) {
  const adminCookie = await getAdminCookie()
  const listRes = await adminFindPurchaseByCode(code, adminCookie)
  if (!listRes.ok || !listRes.data.purchases?.length) {
    throw new Error(`Failed to find purchase ${code}: ${JSON.stringify(listRes.data)}`)
  }
  const purchaseId = listRes.data.purchases[0].id

  // Check current status — skip markPaid if already PAID (bypass mode)
  const checkRes = await getPurchase(code)
  const status = checkRes.data?.status

  if (status === 'COMPLETED') {
    return // Already done
  }

  if (status === 'PENDING') {
    const paidRes = await markPaid(purchaseId, adminCookie)
    if (!paidRes.ok) {
      throw new Error(`Failed to mark paid: ${JSON.stringify(paidRes.data)}`)
    }
  }

  // Process search (sync fallback)
  const processRes = await processSearch(code)
  if (!processRes.ok) {
    throw new Error(`Failed to process: ${JSON.stringify(processRes.data)}`)
  }
}
