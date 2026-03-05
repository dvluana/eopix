// MOCK_MODE: todas as APIs mockadas (desenvolvimento rápido)
export const isMockMode = process.env.MOCK_MODE === 'true'

// TEST_MODE: APIs reais, mas bypass pagamento/Inngest (teste de integração)
export const isTestMode = process.env.TEST_MODE === 'true'

// Bypass mode: pula pagamento e usa fallback Inngest (ativo em ambos os modos)
export const isBypassMode = isMockMode || isTestMode

// Bypass de pagamento: por default segue isBypassMode, mas pode ser overridden.
// BYPASS_PAYMENT=false + MOCK_MODE=true → APIs mockadas, pagamento real (ex: sandbox checkout)
export const isBypassPayment = process.env.BYPASS_PAYMENT !== undefined
  ? process.env.BYPASS_PAYMENT === 'true'
  : isBypassMode
