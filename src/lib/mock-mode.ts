// Usar mock se MOCK_MODE=true OU TEST_MODE=true
// Isso garante que em ambiente de teste local, APIs externas não são chamadas
export const isMockMode =
  process.env.MOCK_MODE === 'true' ||
  process.env.TEST_MODE === 'true'
