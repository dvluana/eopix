import { test, expect } from '@playwright/test'
import { createPurchase, markPaid, processSearch, adminFindPurchaseByCode, getPurchase } from '../helpers/api-client'
import { getAdminCookie } from '../helpers/admin-auth'
import { TEST_CNPJS, TEST_EMAIL, TEST_USER } from '../helpers/test-data'

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

    // 3. Fill registration form + click purchase button
    await page.locator('#name').fill(TEST_USER.name)
    await page.locator('#email').fill(`cnpj-sol-${Date.now()}@eopix.test`)
    await page.locator('#password').fill(TEST_USER.password)
    await page.locator('#confirmPassword').fill(TEST_USER.password)
    await page.locator('#cellphone').fill(TEST_USER.cellphone)
    await page.locator('#buyerTaxId').fill(TEST_USER.taxId)
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()

    // 4. Redirect to confirmation
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const code = new URL(page.url()).searchParams.get('code')!

    // 5. Admin: mark paid + process
    const adminCookie = await getAdminCookie()
    const listRes = await adminFindPurchaseByCode(code, adminCookie)
    const purchaseId = listRes.data.purchases[0].id
    await markPaid(purchaseId, adminCookie)
    await processSearch(code)

    // 6. Verify COMPLETED
    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // 7. Navigate to report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATORIO")').first().click()
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

    const adminCookie = await getAdminCookie()
    const listRes = await adminFindPurchaseByCode(code, adminCookie)
    const purchaseId = listRes.data.purchases[0].id
    await markPaid(purchaseId, adminCookie)
    await processSearch(code)

    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // Navigate directly to report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATORIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // Chuva = issues
    await expect(page.locator('text=pontos de atenção')).toBeVisible({ timeout: 15_000 })
  })
})
