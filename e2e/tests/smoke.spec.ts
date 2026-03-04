import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('health endpoint returns healthy', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.status).toBe('healthy')
    expect(['mock', 'test', 'live']).toContain(data.mode)
  })

  test('landing page loads and shows search input', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/eopix/i)

    // Wait for the search input (typewriter effect may delay placeholder)
    const searchInput = page.locator('.search-bar__input').first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Submit button should be visible
    const submitButton = page.locator('.search-bar__button').first()
    await expect(submitButton).toBeVisible()
  })

  test('validate endpoint accepts valid CPF', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '529.982.241-30' },
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.valid).toBe(true)
    expect(data.type).toBe('CPF')
  })

  test('validate endpoint rejects invalid CPF', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '000.000.000-00' },
    })
    expect(res.ok()).toBeFalsy()
  })

  test('validate endpoint accepts valid CNPJ', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '11.222.333/0001-81' },
    })
    expect(res.ok()).toBeTruthy()

    const data = await res.json()
    expect(data.valid).toBe(true)
    expect(data.type).toBe('CNPJ')
  })
})
