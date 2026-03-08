import { test, expect } from '@playwright/test'
import { createPurchase, getPurchase } from '../helpers/api-client'
import { completePurchase } from '../helpers/complete-purchase'
import { TEST_CNPJS, TEST_EMAIL, TEST_USER, TEST_BUYER } from '../helpers/test-data'

test.describe('Purchase Flow — CNPJ', () => {
  test('CNPJ Sol: full flow from landing to report', async ({ page }) => {
    const cnpj = TEST_CNPJS.sol

    // 1. Landing page → type CNPJ → submit
    await page.goto('/')
    const searchInput = page.locator('.search-bar__input').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
    await searchInput.fill(cnpj)
    await page.locator('.search-bar__button').first().click()

    // 2. Navigate to /consulta/{term}
    await page.waitForURL(`**/consulta/${cnpj}`, { timeout: 10_000 })

    // 3. Click DESBLOQUEAR → opens registration modal
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()
    await expect(page.locator('.rm-content')).toBeVisible({ timeout: 5_000 })

    // 4. Fill registration modal fields
    await page.locator('#reg-name').fill(TEST_BUYER.name)
    await page.locator('#reg-email').fill(`cnpj-sol-${Date.now()}@eopix.test`)
    await page.locator('#reg-cellphone').fill(TEST_BUYER.cellphone)
    await page.locator('#reg-taxId').fill(TEST_BUYER.taxId)
    await page.locator('#reg-password').fill(TEST_USER.password)
    await page.locator('#reg-confirm-password').fill(TEST_USER.password)
    await page.locator('.rm-submit').click()

    // 4. Redirect to confirmation
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const code = new URL(page.url()).searchParams.get('code')!

    // 5. Complete purchase (bypass-aware)
    await completePurchase(code)

    // 6. Verify COMPLETED
    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // 7. Navigate to report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatório pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATÓRIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // 8. Sol = clean history
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })
  })

  test('CNPJ Chuva: API flow shows issues on report', async ({ page }) => {
    const cnpj = TEST_CNPJS.chuva

    // API-driven for speed
    const purchaseRes = await createPurchase(cnpj, TEST_EMAIL)
    expect(purchaseRes.ok).toBeTruthy()
    const { code } = purchaseRes.data

    await completePurchase(code)

    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // Navigate directly to report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatório pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATÓRIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // Chuva = issues
    await expect(page.locator('text=pontos de atenção')).toBeVisible({ timeout: 15_000 })
  })
})
