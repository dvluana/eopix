#!/usr/bin/env node

/**
 * Script que exibe banner com modo de execucao antes de iniciar o dev server
 */

const MOCK_MODE = process.env.MOCK_MODE === 'true'
const TEST_MODE = process.env.TEST_MODE === 'true'

console.log('')
console.log('╔════════════════════════════════════════════════════════════╗')
console.log('║                        E O PIX?                            ║')
console.log('╠════════════════════════════════════════════════════════════╣')

if (MOCK_MODE) {
  console.log('║  🧪 MOCK_MODE=true                                         ║')
  console.log('║     - APIs mockadas (dados ficticios)                      ║')
  console.log('║     - Pagamento bypass (sem Stripe)                        ║')
  console.log('║     - Email apenas no console                              ║')
} else if (TEST_MODE) {
  console.log('║  🔬 TEST_MODE=true                                         ║')
  console.log('║     - APIs REAIS (consome creditos!)                       ║')
  console.log('║     - Pagamento bypass (sem Stripe)                        ║')
  console.log('║     - Email apenas no console                              ║')
} else {
  console.log('║  🚀 PRODUCAO (APIs reais)                                  ║')
  console.log('║     - APIs reais                                           ║')
  console.log('║     - Pagamento via Stripe                                 ║')
  console.log('║     - Email via Brevo                                      ║')
}

console.log('╚════════════════════════════════════════════════════════════╝')
console.log('')
