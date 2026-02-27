import { test, expect } from '@playwright/test'

interface AdminPurchase {
  id: string
  status: string
}

interface AdminPurchasesResponse {
  purchases: AdminPurchase[]
}

test.describe('Admin Purchase Status Contract (API)', () => {
  test('requires authentication for admin endpoints', async ({ request }) => {
    const purchases = await request.get('/api/admin/purchases')
    expect(purchases.status()).toBe(401)

    const process = await request.post('/api/admin/purchases/fake-id/process')
    expect(process.status()).toBe(401)
  })

  test('enforces invalid transition guards for authenticated admin', async ({ request }) => {
    const email = process.env.ADMIN_TEST_EMAIL
    const password = process.env.ADMIN_TEST_PASSWORD

    test.skip(!email || !password, 'Set ADMIN_TEST_EMAIL and ADMIN_TEST_PASSWORD to run authenticated checks')

    const login = await request.post('/api/admin/login', {
      data: { email, password },
    })
    expect(login.status()).toBe(200)

    const purchasesRes = await request.get('/api/admin/purchases?limit=50')
    expect(purchasesRes.status()).toBe(200)

    const purchasesData = await purchasesRes.json() as AdminPurchasesResponse
    const purchases = purchasesData.purchases || []

    // Contract 1: mark-paid is invalid for non-PENDING statuses
    const nonPending = purchases.find((p) => p.status !== 'PENDING')
    if (nonPending) {
      const res = await request.post(`/api/admin/purchases/${nonPending.id}/mark-paid`)
      expect([400, 409]).toContain(res.status())
    }

    // Contract 2: process is invalid for non-PAID statuses
    const nonPaid = purchases.find((p) => p.status !== 'PAID')
    if (nonPaid) {
      const res = await request.post(`/api/admin/purchases/${nonPaid.id}/process`)
      expect([400, 409]).toContain(res.status())
    }

    // Contract 3: mark-paid-and-process is invalid for non-PENDING statuses
    const nonPendingForCombined = purchases.find((p) => p.status !== 'PENDING')
    if (nonPendingForCombined) {
      const res = await request.post(`/api/admin/purchases/${nonPendingForCombined.id}/mark-paid-and-process`)
      expect([400, 409]).toContain(res.status())
    }
  })
})
