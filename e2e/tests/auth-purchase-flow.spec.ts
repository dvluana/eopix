import { test, expect } from '@playwright/test'
import { getPurchase } from '../helpers/api-client'
import { completePurchase } from '../helpers/complete-purchase'
import { TEST_CPFS, TEST_USER, TEST_BUYER } from '../helpers/test-data'

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

    // 3. Click DESBLOQUEAR → opens registration modal
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()
    await expect(page.locator('.rm-content')).toBeVisible({ timeout: 5_000 })

    // 4. Fill registration modal fields
    await page.locator('#reg-name').fill(TEST_BUYER.name)
    await page.locator('#reg-email').fill(uniqueEmail)
    await page.locator('#reg-cellphone').fill(TEST_BUYER.cellphone)
    await page.locator('#reg-taxId').fill(TEST_BUYER.taxId)
    await page.locator('#reg-password').fill(TEST_USER.password)
    await page.locator('#reg-confirm-password').fill(TEST_USER.password)
    await page.locator('.rm-submit').click()

    // 5. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url1 = new URL(page.url())
    const code1 = url1.searchParams.get('code')!
    expect(code1).toBeTruthy()

    // 6. Complete purchase (bypass-aware)
    await completePurchase(code1)

    // 7. Verify purchase COMPLETED
    const final1 = await getPurchase(code1)
    expect(final1.ok).toBeTruthy()
    expect(final1.data.status).toBe('COMPLETED')
    expect(final1.data.reportId).toBeTruthy()

    // ============================
    // Phase 2: Logout + Login + Purchase (CPF Chuva)
    // ============================

    // 8. Logout via API
    await page.request.post('/api/auth/logout')

    // 9. Landing page → type CPF Chuva → submit
    await page.goto('/')
    const searchInput2 = page.locator('.search-bar__input').first()
    await expect(searchInput2).toBeVisible({ timeout: 10_000 })
    await searchInput2.fill(TEST_CPFS.chuva)
    await page.locator('.search-bar__button').first().click()

    // Navigate to /consulta/{cpf}
    await page.waitForURL(`**/consulta/${TEST_CPFS.chuva}`, { timeout: 10_000 })

    // 10. Click DESBLOQUEAR → opens modal
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()
    await expect(page.locator('.rm-content')).toBeVisible({ timeout: 5_000 })

    // 11. Toggle to login mode in modal
    await page.locator('.rm-toggle-btn:has-text("Faça login")').click()

    // 12. Fill login form in modal + submit
    await page.locator('#reg-email').fill(uniqueEmail)
    await page.locator('#reg-password').fill(TEST_USER.password)
    await page.locator('.rm-submit').click()

    // 13. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url2 = new URL(page.url())
    const code2 = url2.searchParams.get('code')!
    expect(code2).toBeTruthy()
    expect(code2).not.toBe(code1) // Different purchase

    // 14. Complete purchase (bypass-aware)
    await completePurchase(code2)

    // 15. Verify purchase COMPLETED
    const final2 = await getPurchase(code2)
    expect(final2.ok).toBeTruthy()
    expect(final2.data.status).toBe('COMPLETED')
    expect(final2.data.reportId).toBeTruthy()
  })
})
