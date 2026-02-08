/**
 * Script para simular webhook de pagamento do Asaas
 *
 * Uso: npx tsx scripts/simulate-payment.ts <code> [event]
 *
 * Exemplos:
 *   npx tsx scripts/simulate-payment.ts ABC123
 *   npx tsx scripts/simulate-payment.ts ABC123 PAYMENT_CONFIRMED
 *   npx tsx scripts/simulate-payment.ts ABC123 PAYMENT_REFUNDED
 */

import 'dotenv/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || 'mock-token-local'

type PaymentEvent =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'

async function simulatePayment(code: string, event: PaymentEvent = 'PAYMENT_CONFIRMED') {
  console.log(`\nSimulando webhook ${event} para compra ${code}...`)
  console.log(`URL: ${APP_URL}/api/webhooks/asaas`)
  console.log(`Token: ${WEBHOOK_TOKEN}`)

  const payload = {
    event,
    payment: {
      id: `pay_simulated_${Date.now()}`,
      status: event === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : event === 'PAYMENT_REFUNDED' ? 'REFUNDED' : 'PENDING',
      externalReference: code,
      customer: 'cus_simulated',
      value: 29.90,
      payer: {
        name: 'Simulador de Pagamento',
        cpfCnpj: '12345678901',
      },
    },
  }

  console.log('\nPayload:')
  console.log(JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(`${APP_URL}/api/webhooks/asaas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'asaas-access-token': WEBHOOK_TOKEN,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    console.log(`\nStatus: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))

    if (response.ok) {
      console.log('\nWebhook processado com sucesso!')

      if (event === 'PAYMENT_CONFIRMED') {
        console.log('\nProximos passos esperados:')
        console.log('1. Status da compra atualizado para PAID')
        console.log('2. Job de processamento iniciado')
        console.log('3. Status mudara para PROCESSING')
        console.log('4. Apos processamento, status sera COMPLETED')
        console.log(`5. Email enviado para o usuario`)
      }
    } else {
      console.log('\nErro ao processar webhook!')
    }
  } catch (error) {
    console.error('\nErro na requisicao:', error)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('Uso: npx tsx scripts/simulate-payment.ts <code> [event]')
  console.log('\nEventos disponiveis:')
  console.log('  - PAYMENT_CONFIRMED (padrao)')
  console.log('  - PAYMENT_RECEIVED')
  console.log('  - PAYMENT_REFUNDED')
  console.log('  - PAYMENT_OVERDUE')
  console.log('  - PAYMENT_DELETED')
  console.log('\nExemplos:')
  console.log('  npx tsx scripts/simulate-payment.ts ABC123')
  console.log('  npx tsx scripts/simulate-payment.ts ABC123 PAYMENT_REFUNDED')
  process.exit(1)
}

const code = args[0]
const event = (args[1] || 'PAYMENT_CONFIRMED') as PaymentEvent

simulatePayment(code, event)
