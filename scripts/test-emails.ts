/**
 * Script de teste: dispara todos os 9 tipos de email para verificação manual.
 * Uso: npx tsx scripts/test-emails.ts
 */

process.env.NEXT_PUBLIC_APP_URL = 'https://somoseopix.com.br'

// Precisa do RESEND_API_KEY — lê do .env.local
import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  sendWelcomeEmail,
  sendPurchaseReceivedEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendPurchaseRefundedEmail,
  sendPurchaseExpiredEmail,
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
} from '../src/lib/email'

const TO = 'luanacrdl@gmail.com'
const NAME = 'Luana'
const CPF = '12345678900'
const CODE = 'TST001'
const PURCHASE_ID = 'test-preview-001'
const REPORT_URL = 'https://somoseopix.com.br/relatorio/test'

const emails = [
  { label: '1. Boas-vindas',           fn: () => sendWelcomeEmail(TO, NAME, PURCHASE_ID) },
  { label: '2. Pedido recebido',        fn: () => sendPurchaseReceivedEmail(TO, NAME, CODE, '123.456.789-00', PURCHASE_ID) },
  { label: '3. Relatório pronto',       fn: () => sendPurchaseApprovedEmail(TO, NAME, CODE, REPORT_URL, PURCHASE_ID) },
  { label: '4. Problema no pedido',     fn: () => sendPurchaseDeniedEmail(TO, NAME, CODE, PURCHASE_ID) },
  { label: '5. Reembolso processado',   fn: () => sendPurchaseRefundedEmail(TO, NAME, CODE, PURCHASE_ID) },
  { label: '6. Pedido expirado',        fn: () => sendPurchaseExpiredEmail(TO, NAME, CODE, CPF, PURCHASE_ID) },
  { label: '7. Abandono R1 (30min)',    fn: () => sendAbandonmentEmail1(TO, NAME, CPF, PURCHASE_ID) },
  { label: '8. Abandono R2 (24h)',      fn: () => sendAbandonmentEmail2(TO, NAME, CPF, PURCHASE_ID) },
  { label: '9. Abandono R3 (72h)',      fn: () => sendAbandonmentEmail3(TO, NAME, CPF, PURCHASE_ID) },
]

async function run() {
  console.log(`\n📧 Disparando ${emails.length} emails para ${TO}\n`)

  for (const { label, fn } of emails) {
    try {
      const result = await fn()
      console.log(`✅ ${label} — id: ${result.id}`)
    } catch (err) {
      console.error(`❌ ${label} — ERRO:`, err instanceof Error ? err.message : err)
    }
    // Resend rate limit: 2 req/s
    await new Promise(r => setTimeout(r, 600))
  }

  console.log('\n✅ Concluído. Verifique luanacrdl@gmail.com (e spam).\n')
}

run()
