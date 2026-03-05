import { test, expect } from '@playwright/test'
import { createPurchase, markPaid, processSearch, adminFindPurchaseByCode, getPurchase } from '../helpers/api-client'
import { getAdminCookie } from '../helpers/admin-auth'
import { TEST_CPFS, TEST_EMAIL } from '../helpers/test-data'

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

    // 3. Click purchase button (no email required)
    await page.locator('button:has-text("DESBLOQUEAR")').first().click()

    // 4. Should redirect to /compra/confirmacao?code=XXX
    await page.waitForURL('**/compra/confirmacao?code=*', { timeout: 15_000 })
    const url = new URL(page.url())
    const code = url.searchParams.get('code')!
    expect(code).toBeTruthy()

    // Page should show approved state initially (user already paid, webhook may be delayed)
    await expect(page.locator('text=Compra aprovada!')).toBeVisible({ timeout: 5_000 })

    // 5. Admin: mark paid + process (via API, not browser)
    const adminCookie = await getAdminCookie()
    const listRes = await adminFindPurchaseByCode(code, adminCookie)
    expect(listRes.ok).toBeTruthy()
    const purchaseId = listRes.data.purchases[0].id

    const paidRes = await markPaid(purchaseId, adminCookie)
    expect(paidRes.ok).toBeTruthy()

    const processRes = await processSearch(code)
    expect(processRes.ok).toBeTruthy()

    // 6. Verify purchase is COMPLETED
    const finalRes = await getPurchase(code)
    expect(finalRes.ok).toBeTruthy()
    expect(finalRes.data.status).toBe('COMPLETED')
    expect(finalRes.data.reportId).toBeTruthy()

    // 7. Navigate to confirmation page → should show "Relatorio pronto!"
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 10_000 })

    // 8. Click "VER RELATORIO" → navigate to report
    await page.locator('button:has-text("VER RELATORIO")').first().click()
    await page.waitForURL(`**/relatorio/${finalRes.data.reportId}`, { timeout: 10_000 })

    // 9. Report page should show Sol weather (clean history)
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })
  })

  test('CPF Chuva: full flow shows issues', async ({ page }) => {
    const cpf = TEST_CPFS.chuva

    // Use API for speed — create, pay, process
    const purchaseRes = await createPurchase(cpf, TEST_EMAIL)
    expect(purchaseRes.ok).toBeTruthy()
    const { code } = purchaseRes.data

    const adminCookie = await getAdminCookie()
    const listRes = await adminFindPurchaseByCode(code, adminCookie)
    const purchaseId = listRes.data.purchases[0].id

    await markPaid(purchaseId, adminCookie)
    await processSearch(code)

    const finalRes = await getPurchase(code)
    expect(finalRes.data.status).toBe('COMPLETED')

    // Navigate to confirmation → report
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 10_000 })
    await page.locator('button:has-text("VER RELATORIO")').first().click()
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
    expect(res.data._bypassMode).toBe(true)

    const { code } = res.data

    // 2. Verify PENDING
    const pendingRes = await getPurchase(code)
    expect(pendingRes.data.status).toBe('PENDING')

    // 3. Mark paid → PAID
    const adminCookie = await getAdminCookie()
    const listRes = await adminFindPurchaseByCode(code, adminCookie)
    const purchaseId = listRes.data.purchases[0].id
    await markPaid(purchaseId, adminCookie)

    const paidRes = await getPurchase(code)
    expect(paidRes.data.status).toBe('PAID')

    // 4. Process → COMPLETED
    await processSearch(code)

    const completedRes = await getPurchase(code)
    expect(completedRes.data.status).toBe('COMPLETED')
    expect(completedRes.data.reportId).toBeTruthy()
    expect(completedRes.data.hasReport).toBe(true)
  })
})
