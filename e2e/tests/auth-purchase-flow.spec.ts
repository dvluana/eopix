import { test, expect } from '@playwright/test'
import { adminFindPurchaseByCode, markPaid, processSearch, getPurchase } from '../helpers/api-client'
import { getAdminCookie } from '../helpers/admin-auth'
import { TEST_CPFS, TEST_USER } from '../helpers/test-data'

test.describe('Auth + Purchase Flow — Register & Login', () => {
  test.describe.configure({ mode: 'serial' })

  const uniqueEmail = `auth-e2e-${Date.now()}@eopix.test`

  test('Register + purchase CPF Sol, then logout + login + purchase CPF Chuva', async ({ page }) => {
    // ============================
    // Phase 1: Register + Purchase (CPF Sol)
    // ============================

    // 1. Landing page → type CPF Sol → submit
    await page.goto('/')
    const searchInput = page.locator('.search-bar__input').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill(TEST_CPFS.sol)
    await page.locator('.search-bar__button').first().click()

    // 2. Navigate to /consulta/{cpf}
    await page.waitForURL(`**/consulta/${TEST_CPFS.sol}`, { timeout: 10_000 })

    // 3. Fill registration form + click DESBLOQUEAR
    await page.locator('#name').fill(TEST_USER.name)
    await page.locator('#email').fill(uniqueEmail)
    await page.locator('#password').fill(TEST_USER.password)
    await page.locator('#confirmPassword').fill(TEST_USER.password)
    await page.locator('#cellphone').fill(TEST_USER.cellphone)
    await page.locator('#buyerTaxId').fill(TEST_USER.taxId)
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()

    // 4. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url1 = new URL(page.url())
    const code1 = url1.searchParams.get('code')!
    expect(code1).toBeTruthy()

    // 5. Admin: mark paid + process
    const adminCookie = await getAdminCookie()
    const list1 = await adminFindPurchaseByCode(code1, adminCookie)
    expect(list1.ok).toBeTruthy()
    const purchaseId1 = list1.data.purchases[0].id

    const paid1 = await markPaid(purchaseId1, adminCookie)
    expect(paid1.ok).toBeTruthy()

    const process1 = await processSearch(code1)
    expect(process1.ok).toBeTruthy()

    // 6. Verify purchase COMPLETED
    const final1 = await getPurchase(code1)
    expect(final1.ok).toBeTruthy()
    expect(final1.data.status).toBe('COMPLETED')
    expect(final1.data.reportId).toBeTruthy()

    // ============================
    // Phase 2: Logout + Login + Purchase (CPF Chuva)
    // ============================

    // 7. Logout via API
    await page.request.post('/api/auth/logout')

    // 8. Landing page → type CPF Chuva → submit
    await page.goto('/')
    const searchInput2 = page.locator('.search-bar__input').first()
    await expect(searchInput2).toBeVisible({ timeout: 10_000 })
    await searchInput2.fill(TEST_CPFS.chuva)
    await page.locator('.search-bar__button').first().click()

    // 9. Navigate to /consulta/{cpf}
    await page.waitForURL(`**/consulta/${TEST_CPFS.chuva}`, { timeout: 10_000 })

    // 10. Toggle to login mode
    await page.locator('button:has-text("Realize o login aqui")').click()

    // 11. Fill login form + click DESBLOQUEAR
    await page.locator('#email').fill(uniqueEmail)
    await page.locator('#password').fill(TEST_USER.password)
    await page.locator('#cellphone').fill(TEST_USER.cellphone)
    await page.locator('#buyerTaxId').fill(TEST_USER.taxId)
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()

    // 12. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url2 = new URL(page.url())
    const code2 = url2.searchParams.get('code')!
    expect(code2).toBeTruthy()
    expect(code2).not.toBe(code1) // Different purchase

    // 13. Admin: mark paid + process
    const list2 = await adminFindPurchaseByCode(code2, adminCookie)
    expect(list2.ok).toBeTruthy()
    const purchaseId2 = list2.data.purchases[0].id

    const paid2 = await markPaid(purchaseId2, adminCookie)
    expect(paid2.ok).toBeTruthy()

    const process2 = await processSearch(code2)
    expect(process2.ok).toBeTruthy()

    // 14. Verify purchase COMPLETED
    const final2 = await getPurchase(code2)
    expect(final2.ok).toBeTruthy()
    expect(final2.data.status).toBe('COMPLETED')
    expect(final2.data.reportId).toBeTruthy()
  })
})
