import { test, expect } from '@playwright/test'
import { createPurchase, getPurchase } from '../helpers/api-client'
import { completePurchase } from '../helpers/complete-purchase'
import { TEST_CPFS, TEST_EMAIL, TEST_USER, TEST_BUYER } from '../helpers/test-data'

test.describe('Purchase Flow — CPF', () => {
  test.describe.configure({ mode: 'serial' })

  test('CPF Sol: full flow from landing to report', async ({ page }) => {
    const cpf = TEST_CPFS.sol

    // 1. Landing page → type CPF → submit
    await page.goto('/')
    const searchInput = page.locator('.search-bar__input').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill(cpf)
    await page.locator('.search-bar__button').first().click()

    // 2. Should navigate to /consulta/{term}
    await page.waitForURL(`**/consulta/${cpf}`, { timeout: 10_000 })

    // 3. Click DESBLOQUEAR → opens registration modal
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()
    await expect(page.locator('.rm-content')).toBeVisible({ timeout: 5_000 })

    // 4. Fill registration modal fields
    await page.locator('#reg-name').fill(TEST_BUYER.name)
    await page.locator('#reg-email').fill(`cpf-sol-${Date.now()}@eopix.test`)
    await page.locator('#reg-cellphone').fill(TEST_BUYER.cellphone)
    await page.locator('#reg-taxId').fill(TEST_BUYER.taxId)
    await page.locator('#reg-password').fill(TEST_USER.password)
    await page.locator('#reg-confirm-password').fill(TEST_USER.password)
    await page.locator('.rm-submit').click()

    // 5. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url = new URL(page.url())
    const code = url.searchParams.get('code')!
    expect(code).toBeTruthy()

    // Page should show approved state initially (user already paid, webhook may be delayed)
    await expect(page.locator('text=Compra aprovada!')).toBeVisible({ timeout: 5_000 })

    // 6. Complete purchase (bypass-aware: skips markPaid if already PAID)
    await completePurchase(code)

    // 7. Verify purchase is COMPLETED
    const finalRes = await getPurchase(code)
    expect(finalRes.ok).toBeTruthy()
    expect(finalRes.data.status).toBe('COMPLETED')
    expect(finalRes.data.reportId).toBeTruthy()

    // 8. Navigate to confirmation page → should show "Relatório pronto!"
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatório pronto!')).toBeVisible({ timeout: 10_000 })

    // 9. Click "VER RELATÓRIO" → navigate to report
    await page.locator('button:has-text("VER RELATÓRIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // 10. Report page should show Sol weather (clean history)
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })
  })

  test('CPF Chuva: full flow shows issues', async ({ page }) => {
    const cpf = TEST_CPFS.chuva

    // API-driven for speed
    const purchaseRes = await createPurchase(cpf, TEST_EMAIL)
    expect(purchaseRes.ok).toBeTruthy()
    const { code } = purchaseRes.data

    await completePurchase(code)

    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // Navigate to confirmation → report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatório pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATÓRIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // Chuva = issues found
    await expect(page.locator('text=pontos de atenção')).toBeVisible({ timeout: 15_000 })
  })

  test('CPF Sol: API-only flow verifies purchase states', async () => {
    const cpf = TEST_CPFS.sol

    // 1. Create purchase
    const res = await createPurchase(cpf, TEST_EMAIL)
    expect(res.ok).toBeTruthy()
    expect(res.data.code).toBeTruthy()

    const { code } = res.data

    // 2. Complete purchase (bypass-aware)
    await completePurchase(code)

    // 3. Verify COMPLETED
    const completedRes = await getPurchase(code)
    expect(completedRes.data.status).toBe('COMPLETED')
    expect(completedRes.data.reportId).toBeTruthy()
    expect(completedRes.data.hasReport).toBe(true)
  })
})
