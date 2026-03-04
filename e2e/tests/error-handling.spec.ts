import { test, expect } from '@playwright/test'

test.describe('Error Handling', () => {
  test('invalid CPF is rejected by validate endpoint', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '111.111.111-11' },
    })
    expect(res.ok()).toBeFalsy()
    expect(res.status()).toBe(400)
  })

  test('invalid CNPJ is rejected by validate endpoint', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '00.000.000/0000-00' },
    })
    expect(res.ok()).toBeFalsy()
  })

  test('empty document is rejected', async ({ request }) => {
    const res = await request.post('/api/search/validate', {
      data: { document: '' },
    })
    expect(res.ok()).toBeFalsy()
  })

  test('purchase with invalid email is rejected', async ({ request }) => {
    const res = await request.post('/api/purchases', {
      data: { term: '52998224130', email: 'not-an-email', termsAccepted: true },
    })
    expect(res.ok()).toBeFalsy()
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  test('purchase without terms accepted is rejected', async ({ request }) => {
    const res = await request.post('/api/purchases', {
      data: { term: '52998224130', email: 'test@test.com', termsAccepted: false },
    })
    expect(res.ok()).toBeFalsy()
  })

  test('purchase with missing fields is rejected', async ({ request }) => {
    const res = await request.post('/api/purchases', {
      data: { term: '52998224130' },
    })
    expect(res.ok()).toBeFalsy()
  })

  test('invalid purchase code returns 404', async ({ request }) => {
    const res = await request.get('/api/purchases/XXXXXX')
    expect(res.status()).toBe(404)
  })

  test('process-search with invalid code returns 404', async ({ request }) => {
    const res = await request.post('/api/process-search/INVALID')
    expect(res.status()).toBe(404)
  })

  test('admin login with wrong password returns 401', async ({ request }) => {
    const res = await request.post('/api/admin/login', {
      data: { email: 'e2e-admin@eopix.test', password: 'wrongpassword1' },
    })
    expect(res.status()).toBe(401)
  })

  test('confirmation page handles invalid code gracefully', async ({ page }) => {
    await page.goto('/compra/confirmacao?code=NONEXIST')
    // Should show not_found state
    await expect(page.locator('text=nao encontrado')).toBeVisible({ timeout: 10_000 })
  })
})
