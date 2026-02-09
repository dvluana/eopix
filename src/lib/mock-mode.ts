// MOCK_MODE: todas as APIs mockadas (desenvolvimento rápido)
export const isMockMode = process.env.MOCK_MODE === 'true'

// TEST_MODE: APIs reais, mas bypass Asaas/Inngest (teste de integração)
export const isTestMode = process.env.TEST_MODE === 'true'

// Bypass mode: pula Asaas e usa fallback Inngest (ativo em ambos os modos)
export const isBypassMode = isMockMode || isTestMode
