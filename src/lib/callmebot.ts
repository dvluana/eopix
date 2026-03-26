// src/lib/callmebot.ts
// WhatsApp alert module via Callmebot API
// Source: https://www.callmebot.com/blog/free-api-whatsapp-messages/

import * as Sentry from '@sentry/nextjs'
import { PROCESSING_STEPS } from '@/types/domain'

const BASE_URL = 'https://api.callmebot.com/whatsapp.php'

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).replace(',', ' às').replace(':', 'h')
}

function mapPaymentProvider(provider: string | null): string {
  if (provider === 'abacatepay') return 'PIX (AbacatePay)'
  if (provider === 'stripe') return 'Cartão (Stripe)'
  return 'Pagamento'
}

function getStepLabel(step: number): string {
  return PROCESSING_STEPS.find(s => s.step === step)?.label ?? 'Iniciando'
}

async function sendToOne(phone: string, apiKey: string, message: string): Promise<void> {
  const url = `${BASE_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Callmebot HTTP ${res.status} for phone ${phone}`)
  }
}

interface AlertRecipient {
  phone: string | undefined
  apiKey: string | undefined
}

async function broadcastAlert(message: string): Promise<void> {
  const recipients: AlertRecipient[] = [
    { phone: process.env.CALLMEBOT_PHONE,   apiKey: process.env.CALLMEBOT_API_KEY },
    { phone: process.env.CALLMEBOT_PHONE_2, apiKey: process.env.CALLMEBOT_API_KEY_2 },
    { phone: process.env.CALLMEBOT_PHONE_3, apiKey: process.env.CALLMEBOT_API_KEY_3 },
  ]

  const active = recipients.filter(r => r.phone && r.apiKey) as Array<{ phone: string; apiKey: string }>

  if (active.length === 0) {
    console.warn('[Callmebot] No recipients configured — skipping alert')
    return
  }

  await Promise.all(
    active.map(r =>
      sendToOne(r.phone, r.apiKey, message).catch(err => {
        console.error(`[Callmebot] Failed for ${r.phone}:`, err)
        Sentry.captureException(err)
      })
    )
  )
}

export interface FailureAlertPayload {
  code: string
  createdAt: Date
  userName: string | null
  userEmail: string
  paymentProvider: string | null
  processingStep: number
  errorMessage: string
}

export async function sendFailureAlert(payload: FailureAlertPayload): Promise<void> {
  const truncatedError = payload.errorMessage.length > 100
    ? payload.errorMessage.slice(0, 100) + '...'
    : payload.errorMessage

  const message = [
    '⚠️ EOPIX — FALHA NO PIPELINE',
    '',
    `📦 Compra: ${payload.code}`,
    `📅 Data: ${formatDate(payload.createdAt)}`,
    `👤 ${payload.userName || 'Sem nome'}`,
    `📧 ${payload.userEmail}`,
    `💳 ${mapPaymentProvider(payload.paymentProvider)}`,
    `🔢 Step: ${payload.processingStep}/6 — ${getStepLabel(payload.processingStep)}`,
    '',
    '❌ Erro:',
    truncatedError,
    '',
    `🔗 eopix.com.br/admin/compras?search=${payload.code}`,
  ].join('\n')

  await broadcastAlert(message)
}

export interface CompletedAlertPayload {
  code: string
  createdAt: Date
  userName: string | null
  userEmail: string
  paymentProvider: string | null
}

export async function sendCompletedAlert(payload: CompletedAlertPayload): Promise<void> {
  const message = [
    '✅ EOPIX — RELATÓRIO ENTREGUE',
    '',
    `📦 Compra: ${payload.code}`,
    `📅 Data: ${formatDate(payload.createdAt)}`,
    `👤 ${payload.userName || 'Sem nome'}`,
    `📧 ${payload.userEmail}`,
    `💳 ${mapPaymentProvider(payload.paymentProvider)}`,
    '',
    `🔗 eopix.com.br/admin/compras?search=${payload.code}`,
  ].join('\n')

  await broadcastAlert(message)
}
