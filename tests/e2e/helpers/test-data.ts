/**
 * Helpers para criar dados de teste
 */

export async function createTestUser(baseUrl: string, email: string) {
  // Criar um usuário e compra de teste via API
  // Nota: Em um cenário real, precisaríamos ter endpoints de setup de teste
  // Por enquanto, vamos assumir que existe uma compra no banco

  return {
    email,
    purchaseCode: 'TEST123', // Código de compra de teste
  };
}

/**
 * Login helper usando cookies
 */
export async function loginViaAPI(page: any, email: string) {
  // Em TEST_MODE, podemos fazer auto-login via API
  const response = await page.request.post('http://localhost:3000/api/auth/send-code', {
    data: { email },
  });

  if (response.ok()) {
    const data = await response.json();
    console.log('[Login Helper] Code sent response:', data);

    // Usar código fixo 123456 em TEST_MODE
    const verifyResponse = await page.request.post('http://localhost:3000/api/auth/verify-code', {
      data: { email, code: '123456' },
    });

    if (verifyResponse.ok()) {
      const verifyData = await verifyResponse.json();
      console.log('[Login Helper] Verify response:', verifyData);
      return true;
    }
  }

  return false;
}
