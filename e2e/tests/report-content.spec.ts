import { test, expect } from '@playwright/test'
import { createCompletedPurchase } from '../fixtures/purchase.fixture'
import { TEST_CPFS, TEST_CNPJS } from '../helpers/test-data'

test.describe('Report Content Verification', () => {
  test('CPF Sol report shows clean data', async ({ page }) => {
    const { code, reportUrl } = await createCompletedPurchase(TEST_CPFS.sol)

    // Auto-login via confirmacao page (report API requires auth)
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 15_000 })

    await page.goto(reportUrl)
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })

    // Climate block should indicate Sol
    await expect(page.locator('text=Nenhuma ocorrência encontrada')).toBeVisible()

    // Should NOT show negative indicators
    await expect(page.locator('text=pontos de atenção')).not.toBeVisible()
  })

  test('CPF Chuva report shows issues', async ({ page }) => {
    const { code, reportUrl } = await createCompletedPurchase(TEST_CPFS.chuva)

    // Auto-login via confirmacao page (report API requires auth)
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 15_000 })

    await page.goto(reportUrl)

    // Wait for report to load
    await expect(page.locator('text=pontos de atenção')).toBeVisible({ timeout: 15_000 })

    // Should NOT show "Céu limpo"
    await expect(page.locator('text=Céu limpo')).not.toBeVisible()
  })

  test('CNPJ Sol report shows clean data', async ({ page }) => {
    const { code, reportUrl } = await createCompletedPurchase(TEST_CNPJS.sol)

    // Auto-login via confirmacao page (report API requires auth)
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 15_000 })

    await page.goto(reportUrl)
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('text=Nenhuma ocorrência encontrada')).toBeVisible()
  })

  test('CNPJ Chuva report shows issues', async ({ page }) => {
    const { code, reportUrl } = await createCompletedPurchase(TEST_CNPJS.chuva)

    // Auto-login via confirmacao page (report API requires auth)
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 15_000 })

    await page.goto(reportUrl)
    await expect(page.locator('text=pontos de atenção')).toBeVisible({ timeout: 15_000 })
  })

  test('report page has expected sections', async ({ page }) => {
    const { code, reportUrl } = await createCompletedPurchase(TEST_CPFS.sol)

    // Auto-login via confirmacao page (report API requires auth)
    await page.goto(`/compra/confirmacao?code=${code}`)
    await expect(page.locator('text=Relatorio pronto!')).toBeVisible({ timeout: 15_000 })

    await page.goto(reportUrl)

    // Wait for page to fully load
    await expect(page.locator('text=Céu limpo')).toBeVisible({ timeout: 15_000 })

    // The report should have a header with the document type
    await expect(page.getByRole('heading', { name: /CPF/ })).toBeVisible()
  })
})
