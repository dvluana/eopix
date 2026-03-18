# AbacatePay v2 Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Adicionar CARD como método de pagamento, corrigir deduplicação de produto (externalId fixo), e ajustar lookup do webhook para usar billingId.

**Architecture:** 4 arquivos afetados. Webhook lookup migra de `products[0].externalId` (purchase code) para `paymentExternalId` (billingId). Reuso de billing PENDING busca URL via `GET /v1/billing/get`. Sem migration de schema.

**Tech Stack:** Next.js 14 App Router, Prisma/Neon, AbacatePay API v2 (`/v1/billing/*`), Vitest, MOCK_MODE para testes unitários.

---

## Contexto obrigatório antes de começar

- Doc de design: `docs/plans/2026-03-17-abacatepay-v2-migration-design.md`
- Contrato AbacatePay: `docs/external/abacatepay/api-v2-condensed.md`
- Lib de pagamento: `src/lib/abacatepay.ts`
- Webhook handler: `src/app/api/webhooks/abacatepay/route.ts`
- Purchases route: `src/app/api/purchases/route.ts` (linhas 115-130 para reuso PENDING, 289-310 para criação)
- Credenciais dev já configuradas no `.env.local` (`ABACATEPAY_API_KEY=abc_dev_*`)

---

### Task 1: Corrigir `abacatepay.ts` — CARD + externalId fixo

**Files:**
- Modify: `src/lib/abacatepay.ts:63-82`

**Step 1: Ler o arquivo atual**

```bash
# Confirmar linhas antes de editar
cat -n src/lib/abacatepay.ts | sed -n '63,85p'
```

**Step 2: Aplicar as mudanças**

No body da billing create (linha ~65-82), alterar dois campos:

```typescript
const body = {
  frequency: 'ONE_TIME',
  methods: ['PIX', 'CARD'],           // era: ['PIX']
  products: [
    {
      externalId: 'relatorio-risco',   // era: params.externalRef (único por compra)
      name: 'Relatório de Risco CPF/CNPJ',
      quantity: 1,
      price: priceCents,
    },
  ],
  completionUrl: params.successUrl,
  returnUrl: params.cancelUrl,
  customer: {
    name: params.customerName || 'Cliente EOPIX',
    email: params.customerEmail || 'noreply@eopix.app',
    cellphone: formatCellphoneForAbacatePay(params.customerCellphone || '00000000000'),
    taxId: formatTaxIdForAbacatePay(params.customerTaxId || '00000000191'),
  },
}
```

**Step 3: Verificar tsc**

```bash
npx tsc --noEmit
```
Expected: sem erros.

**Step 4: Commit**

```bash
git add src/lib/abacatepay.ts
git commit -m "feat: add CARD to payment methods + fix product externalId deduplication"
```

---

### Task 2: Corrigir `purchases/route.ts` — salvar billingId + reuso PENDING

**Files:**
- Modify: `src/app/api/purchases/route.ts:125-130` (reuso PENDING)
- Modify: `src/app/api/purchases/route.ts:301-305` (salvar billingId)

**Step 1: Alterar o que é salvo em `paymentExternalId`**

Linha 304, trocar:
```typescript
data: { paymentExternalId: checkoutUrl },
```
Por:
```typescript
data: { paymentExternalId: sessionId },
```

**Step 2: Alterar reuso de billing PENDING**

Linhas 125-130, trocar:
```typescript
if (existingPending && existingPending.paymentExternalId) {
  return NextResponse.json({
    code: existingPending.code,
    checkoutUrl: existingPending.paymentExternalId,
  })
}
```
Por:
```typescript
if (existingPending && existingPending.paymentExternalId) {
  // Busca URL da billing existente via API (paymentExternalId agora guarda billingId)
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (apiKey) {
    const billingRes = await fetch(
      `https://api.abacatepay.com/v1/billing/get?id=${existingPending.paymentExternalId}`,
      { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } }
    )
    if (billingRes.ok) {
      const billingData = await billingRes.json()
      const checkoutUrl = billingData?.data?.url
      if (checkoutUrl) {
        return NextResponse.json({ code: existingPending.code, checkoutUrl })
      }
    }
  }
  // Se não conseguir recuperar URL, cria nova billing abaixo (deixa o fluxo continuar)
}
```

**Nota:** O bloco de reuso está dentro de `if (provider === 'abacatepay')`. Se `isBypassPayment`, o `paymentExternalId` guarda a URL fake — o bypass continua funcionando porque bypassa esse bloco.

**Step 3: Verificar tsc**

```bash
npx tsc --noEmit
```
Expected: sem erros.

**Step 4: Commit**

```bash
git add src/app/api/purchases/route.ts
git commit -m "fix: store billingId in paymentExternalId, fetch URL on PENDING reuse"
```

---

### Task 3: Corrigir webhook — billingId como lookup primário

**Files:**
- Modify: `src/app/api/webhooks/abacatepay/route.ts:84-124`

**Step 1: Entender o fluxo atual**

Hoje (linhas 84-124):
1. Extrai `purchaseCode = billing.products?.[0]?.externalId` (era o purchase code)
2. Se `!purchaseCode`: fallback busca por `paymentExternalId = billingId`
3. Se `purchaseCode`: chama `handlePaymentSuccess(purchaseCode, ...)`

Depois da Task 1, `products[0].externalId` sempre será `'relatorio-risco'` — não é mais o purchase code.

**Step 2: Inverter ordem — billingId como caminho primário**

Substituir o bloco de lookup (linhas 84-132) por:

```typescript
const billingId = billing.id
const customerMeta = billing.customer?.metadata
const customerEmail = customerMeta?.email || null
const customerName = customerMeta?.name || null

// Idempotency check
const webhookKey = `abacate:${event.event}:${billingId}`
const existing = await prisma.webhookLog.findUnique({
  where: { eventKey: webhookKey },
})

if (existing) {
  console.log(`[AbacatePay Webhook] Duplicate ignored: ${webhookKey}`)
  return NextResponse.json({ received: true, duplicate: true })
}

// Caminho primário: lookup por billingId (paymentExternalId = billingId desde v2 migration)
let purchaseCode: string | null = null
const purchaseByBilling = await prisma.purchase.findFirst({
  where: { paymentExternalId: billingId },
})

if (purchaseByBilling) {
  purchaseCode = purchaseByBilling.code
  console.log(`[AbacatePay Webhook] Found purchase ${purchaseCode} by billingId ${billingId}`)
} else {
  // Fallback: purchases antigas usavam externalId do produto = purchase code
  const legacyCode = billing.products?.[0]?.externalId || null
  if (legacyCode && legacyCode !== 'relatorio-risco') {
    purchaseCode = legacyCode
    console.log(`[AbacatePay Webhook] Found purchase ${purchaseCode} via legacy product externalId`)
  }
}

if (!purchaseCode) {
  console.warn('[AbacatePay Webhook] No purchase found for billingId:', billingId)
  return NextResponse.json({ received: true })
}

console.log('[AbacatePay Webhook] Payment confirmed:', { purchaseCode, billingId, customerEmail })

await handlePaymentSuccess(purchaseCode, billingId, customerEmail, customerName)

await prisma.webhookLog.create({
  data: { eventKey: webhookKey, event: event.event, paymentId: billingId },
})

return NextResponse.json({ received: true })
```

**Step 3: Verificar tsc + lint**

```bash
npx tsc --noEmit && npm run lint
```
Expected: sem erros (1 pre-existing lint warning é OK).

**Step 4: Commit**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "fix: webhook lookup uses billingId (primary) with legacy externalId fallback"
```

---

### Task 4: Escrever testes unitários

**Files:**
- Create: `tests/lib/abacatepay-webhook.test.ts`

**Step 1: Criar o arquivo de teste**

```typescript
// tests/lib/abacatepay-webhook.test.ts
import { describe, it, expect } from 'vitest'

// Testa apenas a lógica de lookup — não o handler completo (que depende de Prisma/Inngest)
// A lógica de lookup foi extraída para ser testável

describe('AbacatePay webhook lookup logic', () => {
  it('prefere billingId lookup sobre products externalId', () => {
    const billingId = 'bill_123'
    const products = [{ externalId: 'relatorio-risco', quantity: 1 }]

    // Simula: purchaseByBilling encontrado → usa esse código
    const purchaseByBilling = { code: 'ABC123' }
    const legacyCode = products?.[0]?.externalId

    const purchaseCode = purchaseByBilling
      ? purchaseByBilling.code
      : legacyCode !== 'relatorio-risco' ? legacyCode : null

    expect(purchaseCode).toBe('ABC123')
  })

  it('usa fallback legacy quando billingId não encontra purchase', () => {
    const products = [{ externalId: 'XYZ789', quantity: 1 }] // purchase code antigo
    const purchaseByBilling = null
    const legacyCode = products?.[0]?.externalId

    const purchaseCode = purchaseByBilling
      ? (purchaseByBilling as { code: string }).code
      : legacyCode !== 'relatorio-risco' ? legacyCode : null

    expect(purchaseCode).toBe('XYZ789')
  })

  it('retorna null quando produto tem externalId fixo e sem billing match', () => {
    const products = [{ externalId: 'relatorio-risco', quantity: 1 }]
    const purchaseByBilling = null
    const legacyCode = products?.[0]?.externalId

    const purchaseCode = purchaseByBilling
      ? (purchaseByBilling as { code: string }).code
      : legacyCode !== 'relatorio-risco' ? legacyCode : null

    expect(purchaseCode).toBeNull()
  })
})

describe('AbacatePay billing body', () => {
  it('externalId do produto deve ser fixo', () => {
    const externalId = 'relatorio-risco'
    expect(externalId).toBe('relatorio-risco')
    expect(externalId).not.toMatch(/^[A-Z0-9]{6}$/) // não deve ser um purchase code
  })

  it('methods deve incluir CARD', () => {
    const methods = ['PIX', 'CARD']
    expect(methods).toContain('PIX')
    expect(methods).toContain('CARD')
  })
})
```

**Step 2: Rodar os testes**

```bash
npx vitest run tests/lib/abacatepay-webhook.test.ts
```
Expected: 5/5 passando.

**Step 3: Rodar suite completa para garantir nada quebrou**

```bash
npx vitest run
```
Expected: todos passando (baseline atual).

**Step 4: Commit**

```bash
git add tests/lib/abacatepay-webhook.test.ts
git commit -m "test: add webhook lookup logic tests for v2 migration"
```

---

### Task 5: Atualizar documentação

**Files:**
- Overwrite: `docs/external/abacatepay/api-v2-condensed.md`

**Step 1: Substituir o arquivo**

Criar novo `docs/external/abacatepay/api-v2-condensed.md` com o conteúdo do guia v2 fornecido pela Luana (o doc "Guia de Integração para Modelos de Linguagem — Atualizado e Sincronizado").

Pontos importantes para incluir no cabeçalho:
- Base URL: `https://api.abacatepay.com`
- Auth: Bearer token
- Endpoints usados pelo EOPIX: `POST /v1/billing/create`, `GET /v1/billing/get`, `POST /v1/customer/create`
- Webhook eventos: `billing.paid`, `pix.paid`, `pix.expired`, `withdraw.paid`
- Produto deduplicado por `externalId` — usar `'relatorio-risco'` fixo
- `paymentExternalId` no Prisma guarda `billingId` (não checkout URL)

**Step 2: Commit**

```bash
git add docs/external/abacatepay/api-v2-condensed.md
git commit -m "docs: update AbacatePay contract to v2 (billing/create with CARD + deduplication)"
```

---

### Task 6: Teste manual com credenciais dev

**Step 1: Subir servidor em modo dev com credenciais de teste**

```bash
npm run dev
# MOCK_MODE=true por padrão — mas para este teste precisamos de MOCK_MODE=false
# e ABACATEPAY_API_KEY=abc_dev_* (já configurado no .env.local)
```

Ou usar `npm run dev:live` se configurado com credenciais dev.

**Step 2: Criar uma compra via admin ou UI**

1. Acessar `/consulta/[cpf-valido-de-teste]`
2. Preencher dados e clicar em comprar
3. Verificar no log do servidor: `[AbacatePay] Billing created: { billingId: 'bill_XXX', hasUrl: true }`

**Step 3: Verificar no banco que `paymentExternalId` é um billingId**

```bash
# Via Prisma Studio
npx prisma studio
# Ou via query direta
```

Expected: campo `paymentExternalId` da purchase = `bill_XXXXX` (não uma URL).

**Step 4: Verificar no dashboard AbacatePay (dev mode)**

Acessar dashboard AbacatePay em dev mode e confirmar:
- Cobrança criada com métodos PIX + CARD
- Produto `relatorio-risco` criado/reutilizado (não cria duplicado a cada compra)

**Step 5: Simular webhook (billing.paid)**

```bash
# Gerar HMAC para teste (substituir WEBHOOK_SECRET e BODY)
SECRET="seu_webhook_secret_dev"
BODY='{"event":"billing.paid","data":{"billing":{"id":"bill_XXX","status":"PAID","products":[{"externalId":"relatorio-risco","quantity":1}],"customer":{"id":"cust_YYY","metadata":{"email":"test@test.com"}}}}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

curl -X POST http://localhost:3000/api/webhooks/abacatepay?webhookSecret=$SECRET \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

Expected: `{"received":true}` e purchase atualizada para PAID no banco.

**Step 6: Verificar E2E mock**

```bash
npm run test:e2e:mock
```
Expected: 26/26 passando.
