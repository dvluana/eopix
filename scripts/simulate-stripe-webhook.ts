/**
 * Script para simular webhook do Stripe
 *
 * NOTA: Este script é apenas para referência. Para testar webhooks do Stripe
 * em desenvolvimento local, use o Stripe CLI:
 *
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *   stripe trigger checkout.session.completed
 *   stripe trigger checkout.session.async_payment_succeeded
 *
 * Uso manual (sem validação de assinatura):
 *   npx tsx scripts/simulate-stripe-webhook.ts <code> [event]
 *
 * Exemplos:
 *   npx tsx scripts/simulate-stripe-webhook.ts ABC123
 *   npx tsx scripts/simulate-stripe-webhook.ts ABC123 checkout.session.completed
 *   npx tsx scripts/simulate-stripe-webhook.ts ABC123 checkout.session.async_payment_succeeded
 */

import 'dotenv/config'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

type StripeEvent =
  | 'checkout.session.completed'
  | 'checkout.session.async_payment_succeeded'
  | 'checkout.session.async_payment_failed'

async function simulateStripeWebhook(code: string, event: StripeEvent = 'checkout.session.completed') {
  console.log(`\n⚠️  IMPORTANTE: Este script NÃO funciona com validação de assinatura ativa.`)
  console.log(`Para testes locais, use o Stripe CLI:\n`)
  console.log(`  stripe listen --forward-to ${APP_URL}/api/webhooks/stripe`)
  console.log(`  stripe trigger ${event}`)
  console.log(`\n---\n`)

  console.log(`Simulando webhook ${event} para compra ${code}...`)
  console.log(`URL: ${APP_URL}/api/webhooks/stripe`)

  const payload = {
    id: `evt_simulated_${Date.now()}`,
    type: event,
    data: {
      object: {
        id: `cs_simulated_${Date.now()}`,
        client_reference_id: code,
        payment_status: event === 'checkout.session.completed' ? 'paid' : 'unpaid',
        payment_intent: `pi_simulated_${Date.now()}`,
        customer_details: {
          email: 'simulador@teste.com',
          name: 'Simulador de Pagamento',
        },
      },
    },
  }

  console.log('\nPayload:')
  console.log(JSON.stringify(payload, null, 2))

  console.log('\n⚠️  Envio desabilitado - use Stripe CLI para testes reais.')
  console.log('\nComandos úteis do Stripe CLI:')
  console.log('  stripe login                                    # Autenticar')
  console.log('  stripe listen --forward-to localhost:3000/api/webhooks/stripe')
  console.log('  stripe trigger checkout.session.completed       # Simular cartão')
  console.log('  stripe trigger checkout.session.async_payment_succeeded  # Simular Pix')
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('Uso: npx tsx scripts/simulate-stripe-webhook.ts <code> [event]')
  console.log('\nEventos disponiveis:')
  console.log('  - checkout.session.completed (padrao - cartao)')
  console.log('  - checkout.session.async_payment_succeeded (Pix pago)')
  console.log('  - checkout.session.async_payment_failed (Pix expirado)')
  console.log('\nPara testes reais, use o Stripe CLI:')
  console.log('  stripe listen --forward-to localhost:3000/api/webhooks/stripe')
  console.log('  stripe trigger checkout.session.completed')
  process.exit(1)
}

const code = args[0]
const event = (args[1] || 'checkout.session.completed') as StripeEvent

simulateStripeWebhook(code, event)
