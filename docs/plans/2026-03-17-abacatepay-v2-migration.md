# AbacatePay v2 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrar integração AbacatePay de v1 (`/v1/billing/create`) para v2 (`/v2/checkouts/create`) com produto pré-criado, `externalId` no checkout para rastreamento direto, e webhook `checkout.completed`.

**Architecture:** Produto pré-criado no AbacatePay (já feito). Checkout v2 usa `items: [{ id: productId }]` + `externalId: purchase.code`. Webhook `checkout.completed` retorna `data.checkout.externalId` = purchase code → lookup direto. v2 INCLUI dados do customer (`data.customer.email`, `data.customer.name`).

**Tech Stack:** Next.js 14 App Router, TypeScript, AbacatePay v2 REST API, Prisma/Neon, Vitest.

---

## Pré-condições (já feito)

- Produtos criados no AbacatePay:
  - Sandbox: `prod_CYEPYBhZBn0YcyFJHJ0DeKTw` (R$39,90, PIX+CARD)
  - Produção: `prod_P56DhUkBx2RSdFSfNPTqrhue` (R$39,90, PIX+CARD)
- Env vars atualizados: `ABACATEPAY_PRODUCT_ID`, `PRICE_CENTS=3990`
- API keys v2: `abc_dev_*` (sandbox), `abc_prod_*` (produção)

## Payload v2 `checkout.completed` (confirmado na doc oficial)

```json
{
  "event": "checkout.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "checkout": {
      "id": "bill_abc123xyz",
      "externalId": "PURCHASE_CODE",
      "amount": 3990,
      "paidAmount": 3990,
      "status": "PAID",
      "items": [{ "id": "prod_xyz", "quantity": 1 }],
      "methods": ["PIX"],
      "customerId": "cust_abc123"
    },
    "customer": {
      "id": "cust_abc123",
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "taxId": "123.***.***-**"
    },
    "payerInformation": {
      "method": "PIX",
      "PIX": { "name": "João Silva", "taxId": "123.***.***-**", "isSameAsCustomer": true }
    }
  }
}
```

## Webhook dashboard (manual — Luana)

**Evento:** `checkout.completed`

| Campo | Sandbox | Produção |
|---|---|---|
| Nome | EOPIX Sandbox | EOPIX Produção |
| URL | `http://localhost:3000/api/webhooks/abacatepay?webhookSecret=09e2998d1d7ab11cf713e19061f63b9c0a7ccfbb58646aefe2fa1697c4ab7b8f` | `https://somoseopix.com.br/api/webhooks/abacatepay?webhookSecret=3f8c2d64694137b07184597f1cb7b057065a74afad4a191f637506c9f51ce095` |
| Secret | `09e2998d1d7ab11cf713e19061f63b9c0a7ccfbb58646aefe2fa1697c4ab7b8f` | `3f8c2d64694137b07184597f1cb7b057065a74afad4a191f637506c9f51ce095` |
| Evento | `checkout.completed` | `checkout.completed` |

## Vercel Env Vars (manual — Luana)

- `ABACATEPAY_PRODUCT_ID=prod_P56DhUkBx2RSdFSfNPTqrhue`
- `PRICE_CENTS=3990`
- `ABACATEPAY_API_KEY=abc_prod_WEqf1rGx6LaK4x1cFduJXcTq`

---

## Task 1: Reescrever `src/lib/abacatepay.ts` para v2

**Files:**
- Modify: `src/lib/abacatepay.ts`

**O que muda:**
- `POST /v1/billing/create` → `POST /v2/checkouts/create`
- `products: [{ externalId, name, quantity, price }]` → `items: [{ id: productId, quantity: 1 }]`
- Adicionar `externalId: params.externalRef` ao body do checkout (echoed no webhook)
- Remover campos de customer inline (v2 não aceita customer inline no checkout)
- Remover helpers `formatCellphoneForAbacatePay` e `formatTaxIdForAbacatePay`
- Simplificar `CreateCheckoutParams` — remover campos customer

**Step 1: Substituir todo o conteúdo de `src/lib/abacatepay.ts`**

```typescript
import crypto from 'node:crypto'
import { isBypassPayment } from './mock-mode'

export interface CreateCheckoutParams {
  externalRef: string // purchase code — set as checkout externalId, echoed in webhook
  successUrl: string
  cancelUrl: string
}

export interface CheckoutResponse {
  sessionId: string  // AbacatePay checkout id (bill_xxx) — stored in paymentExternalId
  checkoutUrl: string
}

export interface RefundResponse {
  success: boolean
  refundId?: string
  message?: string
}

export async function createCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResponse> {
  if (isBypassPayment) {
    console.log(`[BYPASS] AbacatePay bypass: ${params.externalRef}`)
    const fakeId = `bill_bypass_${Date.now()}`
    return {
      sessionId: fakeId,
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&bypass=true`,
    }
  }

  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) {
    throw new Error('ABACATEPAY_API_KEY is not configured')
  }

  const productId = process.env.ABACATEPAY_PRODUCT_ID
  if (!productId) {
    throw new Error('ABACATEPAY_PRODUCT_ID is not configured')
  }

  console.log('[AbacatePay] Creating checkout v2:', {
    externalRef: params.externalRef,
    productId,
    completionUrl: params.successUrl,
    returnUrl: params.cancelUrl,
  })

  const body = {
    items: [{ id: productId, quantity: 1 }],
    externalId: params.externalRef,
    methods: ['PIX', 'CARD'],
    completionUrl: params.successUrl,
    returnUrl: params.cancelUrl,
  }

  const res = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseData = await res.json()

  if (!res.ok || !responseData.success || !responseData.data) {
    const errorDetail = JSON.stringify(responseData)
    console.error(`[AbacatePay] Checkout error: status=${res.status} body=${errorDetail}`)
    const errorMsg = responseData.error || `HTTP ${res.status}`
    throw new Error(`AbacatePay checkout error: ${errorMsg}`)
  }

  const { data } = responseData

  console.log('[AbacatePay] Checkout created:', {
    checkoutId: data.id,
    hasUrl: !!data.url,
  })

  return {
    sessionId: data.id,
    checkoutUrl: data.url,
  }
}

export async function processRefund(_billingId: string): Promise<RefundResponse> {
  if (isBypassPayment) {
    console.log(`[BYPASS] AbacatePay refund: ${_billingId}`)
    await new Promise((r) => setTimeout(r, 300))
    return {
      success: true,
      refundId: `ref_bypass_${Date.now()}`,
    }
  }

  // AbacatePay does not have a refund API endpoint — refunds must be done via dashboard
  return {
    success: false,
    message: 'Reembolso deve ser feito pelo dashboard AbacatePay',
  }
}

// HMAC-SHA256 public key from AbacatePay docs
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9'

export function validateWebhookSecret(url: string): boolean {
  const parsed = new URL(url)
  const secret = parsed.searchParams.get('webhookSecret')
  return secret === process.env.ABACATEPAY_WEBHOOK_SECRET
}

export function validateWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')

  const A = Buffer.from(expectedSig)
  const B = Buffer.from(signatureHeader)

  return A.length === B.length && crypto.timingSafeEqual(A, B)
}
```

**Step 2: Verificar TypeScript**

```bash
cd "/Users/luana/Documents/Code Projects/eopix" && npx tsc --noEmit 2>&1 | head -40
```

Esperado: sem erros em `abacatepay.ts`. Pode ter erros no webhook handler e purchases/route (resolvidos nas próximas tasks).

**Step 3: Commit**

```bash
git add src/lib/abacatepay.ts
git commit -m "feat: migrate abacatepay to v2 — items by ID, externalId on checkout, no inline customer"
```

---

## Task 2: Reescrever `src/app/api/webhooks/abacatepay/route.ts` para v2

**Files:**
- Modify: `src/app/api/webhooks/abacatepay/route.ts`

**O que muda:**
- Evento: `billing.paid` → `checkout.completed`
- Interface: `data.billing` → `data.checkout`, `data.customer` agora disponível
- Lookup primário: `data.checkout.externalId` = purchase.code → `findUnique({ where: { code } })`
- Lookup fallback: `data.checkout.id` (billing id) → `findFirst({ where: { paymentExternalId } })` para purchases antigas
- Customer disponível: `data.customer.email`, `data.customer.name` (taxId vem mascarado)

**Step 1: Substituir todo o conteúdo de `src/app/api/webhooks/abacatepay/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSecret, validateWebhookSignature } from '@/lib/abacatepay'

// v2 checkout.completed payload (from AbacatePay v2 webhook docs)
interface AbacateWebhookEvent {
  event: string
  apiVersion: number
  devMode?: boolean
  data: {
    checkout: {
      id: string         // bill_*
      externalId?: string // purchase code (set by us at checkout creation)
      url?: string
      amount: number
      paidAmount?: number
      status: string
      methods?: string[]
      customerId?: string
    }
    customer?: {
      id: string
      name?: string
      email?: string
      taxId?: string  // masked: "123.***.***-**"
    }
    payerInformation?: {
      method: string
    }
  }
}

export async function POST(request: NextRequest) {
  console.log('[AbacatePay Webhook] Request received:', {
    url: request.url,
    method: request.method,
    hasSignature: !!request.headers.get('x-webhook-signature'),
    contentType: request.headers.get('content-type'),
  })

  try {
    // Layer 1: Validate webhook secret from query string
    if (!validateWebhookSecret(request.url)) {
      console.warn('[AbacatePay Webhook] Invalid webhook secret')
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    // Read raw body for signature verification
    const rawBody = await request.text()

    // Layer 2: Validate HMAC-SHA256 signature (if present)
    const signature = request.headers.get('x-webhook-signature')
    if (signature && !validateWebhookSignature(rawBody, signature)) {
      console.warn('[AbacatePay Webhook] Invalid HMAC signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody) as AbacateWebhookEvent

    console.log('[AbacatePay Webhook] Event:', event.event, 'Data:', JSON.stringify(event.data).slice(0, 500))

    if (event.event !== 'checkout.completed') {
      console.log(`[AbacatePay Webhook] Ignoring event: ${event.event}`)
      return NextResponse.json({ received: true })
    }

    const checkout = event.data.checkout
    if (!checkout) {
      console.warn('[AbacatePay Webhook] No checkout object in payload')
      return NextResponse.json({ received: true })
    }

    const checkoutId = checkout.id

    // Idempotency check
    const webhookKey = `abacate:${event.event}:${checkoutId}`
    const existing = await prisma.webhookLog.findUnique({
      where: { eventKey: webhookKey },
    })

    if (existing) {
      console.log(`[AbacatePay Webhook] Duplicate ignored: ${webhookKey}`)
      return NextResponse.json({ received: true, duplicate: true })
    }

    // Primary: externalId = purchase.code (set by us when creating v2 checkout)
    let purchaseCode: string | null = checkout.externalId || null

    if (purchaseCode) {
      console.log(`[AbacatePay Webhook] Found purchase code via externalId: ${purchaseCode}`)
    } else {
      // Fallback: lookup by checkoutId stored in paymentExternalId (pre-migration purchases)
      const purchaseByCheckout = await prisma.purchase.findFirst({
        where: { paymentExternalId: checkoutId },
      })
      if (purchaseByCheckout) {
        purchaseCode = purchaseByCheckout.code
        console.log(`[AbacatePay Webhook] Found purchase ${purchaseCode} by checkoutId ${checkoutId} (legacy fallback)`)
      }
    }

    if (!purchaseCode) {
      console.warn('[AbacatePay Webhook] No purchase found for checkoutId:', checkoutId, 'externalId:', checkout.externalId)
      return NextResponse.json({ received: true })
    }

    const customerEmail = event.data.customer?.email || null
    const customerName = event.data.customer?.name || null

    console.log('[AbacatePay Webhook] Payment confirmed:', { purchaseCode, checkoutId, customerEmail })

    await handlePaymentSuccess(purchaseCode, checkoutId, customerEmail, customerName)

    await prisma.webhookLog.create({
      data: { eventKey: webhookKey, event: event.event, paymentId: checkoutId },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[AbacatePay Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(
  purchaseCode: string,
  checkoutId: string,
  customerEmail: string | null,
  customerName: string | null
) {
  const purchase = await prisma.purchase.findUnique({
    where: { code: purchaseCode },
    include: { user: true },
  })

  if (!purchase) {
    console.warn(`[AbacatePay Webhook] Purchase not found for code: ${purchaseCode}`)
    return
  }

  // Skip if already past PAID (processing or done)
  if (['PROCESSING', 'COMPLETED', 'REFUNDED'].includes(purchase.status)) {
    console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} already processed (${purchase.status})`)
    return
  }

  // Update to PAID (idempotent if already PAID from a previous retry)
  if (purchase.status === 'PENDING') {
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentProvider: 'abacatepay',
        paymentExternalId: checkoutId,
        buyerName: customerName || undefined,
      },
    })
  }

  // Capture email from checkout — update guest user with real email
  if (customerEmail && purchase.user.email.includes('@guest.eopix.app')) {
    const normalizedEmail = customerEmail.toLowerCase()
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { userId: existingUser.id },
      })
      console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} linked to existing user ${normalizedEmail}`)
    } else {
      await prisma.user.update({
        where: { id: purchase.userId },
        data: { email: normalizedEmail },
      })
      console.log(`[AbacatePay Webhook] Guest user updated with email: ${normalizedEmail}`)
    }
  }

  // Activate user account: move pending password hash from Purchase to User
  if (purchase.pendingPasswordHash && !purchase.user.passwordHash) {
    await prisma.user.update({
      where: { id: purchase.userId },
      data: { passwordHash: purchase.pendingPasswordHash },
    })
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { pendingPasswordHash: null },
    })
    console.log(`[AbacatePay Webhook] User account activated for ${purchaseCode}`)
  }

  console.log(`[AbacatePay Webhook] Purchase ${purchaseCode} updated to PAID`)

  // Trigger Inngest job — re-throw on failure so webhook returns 500
  // and AbacatePay retries delivery
  const { inngest } = await import('@/lib/inngest')
  await inngest.send({
    name: 'search/process',
    data: {
      purchaseId: purchase.id,
      purchaseCode: purchase.code,
      term: purchase.term,
      type: purchase.term.length === 11 ? 'CPF' : 'CNPJ',
      email: purchase.user.email,
    },
  })
  console.log(`[AbacatePay Webhook] Inngest job triggered for purchase ${purchaseCode}`)
}
```

**Step 2: Verificar TypeScript compila sem erros**

```bash
cd "/Users/luana/Documents/Code Projects/eopix" && npx tsc --noEmit 2>&1 | head -40
```

Esperado: zero erros.

**Step 3: Commit**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "fix: webhook handler v2 — checkout.completed event, externalId lookup, customer from data"
```

---

## Task 3: Corrigir PENDING reuse e removeCustomer params em `purchases/route.ts`

**Files:**
- Modify: `src/app/api/purchases/route.ts`

**Step 1: Atualizar URL do PENDING reuse**

Encontrar:
```typescript
const billingRes = await fetch(
  `https://api.abacatepay.com/v1/billing/get?id=${existingPending.paymentExternalId}`,
```

Substituir por:
```typescript
const billingRes = await fetch(
  `https://api.abacatepay.com/v2/checkouts/get?id=${existingPending.paymentExternalId}`,
```

**Step 2: Simplificar o `createCheckout` call — remover campos customer**

Encontrar o bloco:
```typescript
const customerName = name || user.name || undefined
const customerEmail = email || user.email
const customerCellphone = cellphone || user.cellphone || undefined
const customerTaxId = buyerTaxId || user.taxId || undefined

const { sessionId, checkoutUrl } = await createCheckout({
  externalRef: code,
  successUrl: `${appUrl}/compra/confirmacao?code=${code}`,
  cancelUrl: `${appUrl}/`,
  ...(customerName ? { customerName } : {}),
  ...(customerEmail ? { customerEmail } : {}),
  ...(customerCellphone ? { customerCellphone } : {}),
  ...(customerTaxId ? { customerTaxId } : {}),
})
```

Substituir por:
```typescript
const { sessionId, checkoutUrl } = await createCheckout({
  externalRef: code,
  successUrl: `${appUrl}/compra/confirmacao?code=${code}`,
  cancelUrl: `${appUrl}/`,
})
```

(As variáveis `customerName`, `customerEmail`, etc. ficam unused — remover as 4 declarações também.)

**Step 3: Verificar TypeScript e lint**

```bash
cd "/Users/luana/Documents/Code Projects/eopix" && npx tsc --noEmit 2>&1 | head -40 && npm run lint 2>&1 | tail -20
```

Esperado: zero erros, sem novos warnings.

**Step 4: Commit**

```bash
git add src/app/api/purchases/route.ts
git commit -m "fix: v2 checkouts/get for PENDING reuse, remove customer params from createCheckout"
```

---

## Task 4: Rodar testes

**Step 1: Suite completa**

```bash
cd "/Users/luana/Documents/Code Projects/eopix" && npx vitest run 2>&1
```

Esperado: mesmo count (72/72 ou atual).

**Step 2: Corrigir falhas**

Se falhar, procurar testes que mockam `createCheckout` com campos `customerName`, `customerEmail` etc. e remover esses campos.

**Step 3: Commit de fixes se necessário**

```bash
git add tests/
git commit -m "test: update mocks for abacatepay v2 interface"
```

---

## Task 5: Smoke test manual com payload v2 real

**Step 1: Criar purchase PENDING via BYPASS**

```bash
# Garantir que BYPASS_PAYMENT=true e dev server rodando
curl -s -X POST http://localhost:3000/api/purchases \
  -H "Content-Type: application/json" \
  -d '{"term":"52998224725","termsAccepted":true}' | jq .
```

Pegar o `code` retornado.

**Step 2: Resetar purchase para PENDING para testar webhook**

```bash
npx prisma studio
```

Mudar o status da purchase de PAID para PENDING para poder testar o webhook.

**Step 3: Simular webhook v2 `checkout.completed`**

```bash
SECRET=$(grep ABACATEPAY_WEBHOOK_SECRET .env.local | cut -d= -f2)
PURCHASE_CODE="TROCAR_PELO_CODE"

BODY="{\"event\":\"checkout.completed\",\"apiVersion\":2,\"devMode\":true,\"data\":{\"checkout\":{\"id\":\"bill_test456\",\"externalId\":\"${PURCHASE_CODE}\",\"amount\":3990,\"paidAmount\":3990,\"status\":\"PAID\",\"methods\":[\"PIX\"]},\"customer\":{\"id\":\"cust_test\",\"name\":\"Test User\",\"email\":\"test@test.com\",\"taxId\":\"123.***.***-**\"},\"payerInformation\":{\"method\":\"PIX\",\"PIX\":{\"name\":\"Test User\",\"taxId\":\"123.***.***-**\",\"isSameAsCustomer\":true}}}}"

SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

curl -X POST "http://localhost:3000/api/webhooks/abacatepay?webhookSecret=$SECRET" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

Esperado: `{"received":true}`.

**Step 4: Verificar no Prisma Studio**

Purchase deve estar PAID, Inngest job disparado.

---

## Task 6: Atualizar docs

**Files:**
- Modify: `docs/wiki/credenciais-abacatepay.md`
- Modify: `docs/status.md`

**Step 1: Atualizar `credenciais-abacatepay.md`**

1. Adicionar `ABACATEPAY_PRODUCT_ID` na tabela de env vars
2. Atualizar "Evento a registrar": `billing.paid` → `checkout.completed`
3. Atualizar "Simular Webhook em Dev" com payload v2 correto
4. Atualizar tabela de ambientes

**Step 2: Adicionar entrada em `docs/status.md`**

```
- **AbacatePay v2 migration** (2026-03-17): (1) `abacatepay.ts` reescrito — `/v1/billing/create` → `/v2/checkouts/create` com produto por ID (`items: [{ id }]`), `externalId: purchase.code`, sem customer inline. (2) Webhook: evento `billing.paid` → `checkout.completed`, estrutura `data.billing` → `data.checkout`, customer disponível via `data.customer`. Lookup primário por `externalId` (purchase code), fallback por `paymentExternalId`. (3) PENDING reuse: `GET /v2/checkouts/get`. (4) Produtos criados: sandbox `prod_CYEPYBhZBn0YcyFJHJ0DeKTw`, produção `prod_P56DhUkBx2RSdFSfNPTqrhue`, ambos a R$39,90 (PRICE_CENTS=3990).
```

**Step 3: Commit**

```bash
git add docs/wiki/credenciais-abacatepay.md docs/status.md
git commit -m "docs: abacatepay v2 — checkout.completed event, product ID, webhook payload v2"
```
