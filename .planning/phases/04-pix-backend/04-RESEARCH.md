# Phase 4: PIX Backend - Research

**Researched:** 2026-03-26
**Domain:** AbacatePay PIX QR Code API, Next.js API routes, webhook handler extension
**Confidence:** HIGH (official AbacatePay docs verified)

---

## Summary

Phase 4 adds transparent PIX checkout support to EOPIX — meaning users will pay directly on the EOPIX page without redirecting to AbacatePay's hosted checkout. The backend must expose three new API capabilities: create a PIX charge (returning `brCode` and `brCodeBase64`), poll its status, and handle the `transparent.completed` webhook event to advance the purchase to PAID and trigger Inngest.

The existing webhook handler at `/api/webhooks/abacatepay` already implements all the security validation and `handlePaymentSuccess` logic. The PIX webhook work is an extension of that handler: add a branch for `transparent.completed` events alongside the existing `checkout.completed`/`billing.paid` branches. The purchase lookup strategy differs: transparent charges use `metadata.externalId` (not `checkout.externalId`) for the purchase code correlation.

**CRITICAL API PATH FINDING:** REQUIREMENTS.md references `/v2/transparents/create`. Official API reference pages use `/v1/pixQrCode/create`. The changelog confirms "transparent checkout" is a v2-only feature, but the actual API reference endpoints consistently use `/v1/pixQrCode/...`. The REQUIREMENTS.md notes say "Endpoint: `POST /v2/transparents/create`" — this path appears in the overview documentation but the working endpoints per the API reference are `/v1/pixQrCode/create`, `/v1/pixQrCode/check`, and `/v1/pixQrCode/simulate-payment`. The planner should use the `/v1/pixQrCode/...` paths (verified in API reference) and flag this discrepancy for manual confirmation if needed.

**Primary recommendation:** Extend `src/lib/abacatepay.ts` with PIX functions, create `POST /api/purchases/pix` and `GET /api/purchases/pix/status` routes, then extend the existing webhook handler to recognize `transparent.completed`.

---

## Project Constraints (from CLAUDE.md)

- Work always in `develop`. Never commit to `main`.
- Source of truth for APIs: `docs/api-contracts/` (but PIX contract does not exist yet — this phase creates it).
- Central types: `src/types/report.ts` and `src/types/domain.ts`.
- After edits: update `docs/status.md` and mark tasks.
- Prefer Server Components; "use client" only for interactivity.
- Server-side validation with Zod.
- Never commit to `main`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIX-04 | Webhook `payment.completed` do AbacatePay processa PIX (separado do `checkout.completed` atual) | Webhook event is `transparent.completed` (not `payment.completed`). Existing webhook handler extended with new event branch. Purchase lookup via `metadata.externalId` on the transparent payload. |
| PIX-01 | Usuário que escolhe PIX vê QR Code diretamente na página do EOPIX (sem redirect) | Backend: `POST /api/purchases/pix` calls `/v1/pixQrCode/create`, returns `brCode` + `brCodeBase64`. Status polling via `GET /api/purchases/pix/status?id=...`. Dev mode simulation via `/v1/pixQrCode/simulate-payment`. |
</phase_requirements>

---

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js 14 App Router | 14.x | API routes | Project standard |
| Prisma | existing | DB access | Project standard |
| Zod | existing | Request validation | Project standard — CLAUDE.md mandates server-side Zod |
| `node:crypto` | built-in | Webhook HMAC validation | Already used in `abacatepay.ts` |

### No new packages required.
All required functionality is implemented via direct `fetch` to AbacatePay API (same pattern as existing checkout code).

## Architecture Patterns

### Recommended File Structure for Phase 4
```
src/lib/abacatepay.ts          (extend — add createPixCharge, checkPixStatus, simulatePixPayment)
src/app/api/purchases/pix/
  route.ts                     (POST — create PIX charge)
  status/
    route.ts                   (GET — poll status)
src/app/api/webhooks/abacatepay/route.ts  (extend — add transparent.completed branch)
docs/api-contracts/pix-transparent.md   (new — document the contract for future reference)
```

### Pattern 1: PIX Charge Creation (`createPixCharge`)
**What:** Calls `/v1/pixQrCode/create`, returns `{ pixId, brCode, brCodeBase64, expiresAt }`. Stores `pixId` in `purchase.paymentExternalId` so the webhook can correlate.
**When to use:** Called from `POST /api/purchases/pix` after creating/finding an authenticated Purchase in PENDING state.
**Key fields:**
```typescript
// POST https://api.abacatepay.com/v1/pixQrCode/create
// Authorization: Bearer <api-key>
{
  amount: 3990,          // price in centavos (R$39,90)
  expiresIn: 3600,       // 1 hour (recommended)
  description: "Relatório EOPIX",
  customer: {            // all 4 fields required if any provided
    name: string,
    email: string,
    taxId: string,       // CPF/CNPJ of buyer
    cellphone: string,
  },
  metadata: {
    externalId: purchaseCode   // purchase.code — used in webhook lookup
  }
}

// Response
{
  data: {
    id: "pix_char_xxx",
    brCode: "00020101...",
    brCodeBase64: "data:image/png;base64,...",
    status: "PENDING",
    expiresAt: "ISO8601",
    devMode: boolean
  }
}
```

### Pattern 2: PIX Status Check (`checkPixStatus`)
**What:** Calls `GET /v1/pixQrCode/check?id=<pixId>`, returns `{ status, expiresAt }`.
**When to use:** Called from `GET /api/purchases/pix/status?id=<purchaseId>` — frontend polls every 3s. Route checks Purchase in DB, then calls AbacatePay for live status.
**Status values (verified):** `PENDING | PAID | EXPIRED | CANCELLED | REFUNDED`

### Pattern 3: PIX Simulate Payment (dev mode only)
**What:** Calls `POST /v1/pixQrCode/simulate-payment?id=<pixId>` — triggers AbacatePay to deliver `transparent.completed` webhook.
**When to use:** Only in `isMockMode || isBypassPayment`. Returns updated charge object.
**Route:** `POST /api/purchases/pix/status` (or separate endpoint) — admin or dev only.

### Pattern 4: Webhook Extension for `transparent.completed`
**What:** Extend the existing `isPaymentEvent` check to also accept `transparent.completed`.
**Payload structure:**
```typescript
// event.data.transparent (new, parallel to event.data.checkout)
{
  id: "pix_char_xxx",
  externalId: "ORDER_CODE",  // NOT present — use metadata.externalId instead
  amount: 3990,
  paidAmount: 3990,
  status: "PAID",
  methods: ["PIX"]
}
// Purchase code lookup: event.data.transparent.metadata?.externalId
// Fallback: lookup by paymentExternalId (pix_char_xxx stored at charge creation)
```

**IMPORTANT:** The `transparent` payload uses `metadata.externalId` for purchase code, NOT a top-level `externalId` like the `checkout` payload. The fallback lookup by `paymentExternalId` covers cases where metadata was not set.

### Anti-Patterns to Avoid
- **Creating a new webhook endpoint:** Reuse `/api/webhooks/abacatepay` — same security validation, same `handlePaymentSuccess` function. Adding a new route duplicates auth logic.
- **Storing checkout URL as paymentExternalId:** `paymentExternalId` should store the PIX charge `id` (`pix_char_xxx`) for status polling and webhook correlation. (Same pattern as existing checkout).
- **Calling AbacatePay status from client directly:** Never expose AbacatePay API keys to client. Status polling goes through `/api/purchases/pix/status`.
- **Not sending customer data:** The PIX charge should always include customer fields — AbacatePay shows payer info on QR code page.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HMAC webhook validation | Custom crypto logic | `validateWebhookSecret` + `validateWebhookSignature` from `src/lib/abacatepay.ts` | Already implemented, tested, timing-safe |
| Purchase state transition | Manual status update | `handlePaymentSuccess()` in webhook route | Handles idempotency, email, Inngest trigger |
| Idempotency key | Custom dedup logic | `WebhookLog.eventKey` pattern already in handler | Prevents double-processing on webhook retries |
| Mock bypass | Conditional fetch logic | `isBypassPayment` from `src/lib/mock-mode` | Already used in `createCheckout` |

---

## Common Pitfalls

### Pitfall 1: Wrong API path (v1 vs v2 for PIX)
**What goes wrong:** REQUIREMENTS.md says `/v2/transparents/create` but official API reference uses `/v1/pixQrCode/create`. Using v2 path may get 404 or unexpected behavior.
**Why it happens:** AbacatePay is migrating to v2 but PIX QRCode endpoints are still documented under v1.
**How to avoid:** Use `/v1/pixQrCode/create`, `/v1/pixQrCode/check`, `/v1/pixQrCode/simulate-payment` (all verified in API reference). Confirm with AbacatePay if `/v2/transparents/create` actually works.
**Warning signs:** 404 or "endpoint not found" responses.

### Pitfall 2: Wrong webhook event name
**What goes wrong:** REQUIREMENTS.md says `payment.completed` but AbacatePay docs say `transparent.completed`.
**Why it happens:** Requirements written before checking official docs.
**How to avoid:** Use `transparent.completed` as the event name. The existing handler ignores unknown events with a 200 response — this would silently fail with the wrong event name.
**Warning signs:** Webhook received but purchase stays in PAID state indefinitely.

### Pitfall 3: Purchase code lookup from transparent webhook
**What goes wrong:** `event.data.transparent` does NOT have a top-level `externalId` — unlike `event.data.checkout.externalId`. Purchase code lives in `event.data.transparent.metadata?.externalId` (or nowhere if metadata wasn't set).
**Why it happens:** Different payload structure vs checkout flow.
**How to avoid:** Primary lookup: `event.data.transparent.metadata?.externalId`. Fallback: find purchase by `paymentExternalId === event.data.transparent.id`. Store `pix_char_xxx` in `purchase.paymentExternalId` at charge creation.

### Pitfall 4: PIX charge double creation on page refresh
**What goes wrong:** User refreshes the PIX page and a new charge is created, wasting a charge slot.
**Why it happens:** No check for existing PENDING PIX charge.
**How to avoid:** Before calling AbacatePay, check if `purchase.paymentExternalId` already has a PIX charge id. If so, call status check — if still `PENDING`, return existing charge data from DB (store `brCode`/`brCodeBase64` in DB or reconstruct from status). Consider storing `brCode` in a dedicated column or in `failureDetails` field temporarily.

### Pitfall 5: Status polling hitting AbacatePay on every request
**What goes wrong:** Frontend polls every 3s, backend relays to AbacatePay every time — rate limit risk.
**Why it happens:** No caching layer.
**How to avoid:** Return purchase status from DB for `COMPLETED`/`FAILED` states. Only call AbacatePay API when DB status is `PENDING`. When AbacatePay returns `PAID`, trust the webhook to advance DB state (don't advance from status poll — avoid race condition with webhook).

---

## Code Examples

### createPixCharge — lib function
```typescript
// Source: https://docs.abacatepay.com/api-reference/criar-qrcode-pix.md
export interface CreatePixChargeParams {
  purchaseCode: string   // stored in metadata.externalId
  amount: number         // centavos
  customer?: {
    name: string
    email: string
    taxId: string
    cellphone: string
  }
  expiresIn?: number     // seconds, default 3600
}

export interface PixChargeResponse {
  pixId: string
  brCode: string
  brCodeBase64: string
  expiresAt: string
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED'
}

export async function createPixCharge(params: CreatePixChargeParams): Promise<PixChargeResponse> {
  if (isBypassPayment) {
    return {
      pixId: `pix_bypass_${Date.now()}`,
      brCode: 'BYPASS_BR_CODE',
      brCodeBase64: 'data:image/png;base64,BYPASS',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      status: 'PENDING',
    }
  }
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY not configured')
  const body: Record<string, unknown> = {
    amount: params.amount,
    expiresIn: params.expiresIn ?? 3600,
    description: 'Relatório EOPIX',
    metadata: { externalId: params.purchaseCode },
  }
  if (params.customer) body.customer = params.customer
  const res = await fetch('https://api.abacatepay.com/v1/pixQrCode/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok || !data.data?.id) throw new Error(`PIX charge error: ${data.error || res.status}`)
  return {
    pixId: data.data.id,
    brCode: data.data.brCode,
    brCodeBase64: data.data.brCodeBase64,
    expiresAt: data.data.expiresAt,
    status: data.data.status,
  }
}
```

### checkPixStatus — lib function
```typescript
// Source: https://docs.abacatepay.com/api-reference/checar-status.md
export async function checkPixStatus(pixId: string): Promise<{ status: string; expiresAt: string }> {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY not configured')
  const res = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`PIX status error: ${data.error || res.status}`)
  return { status: data.data.status, expiresAt: data.data.expiresAt }
}
```

### simulatePixPayment — lib function (dev only)
```typescript
// Source: https://docs.abacatepay.com/api-reference/simular-pagamento.md
export async function simulatePixPayment(pixId: string): Promise<void> {
  const apiKey = process.env.ABACATEPAY_API_KEY
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY not configured')
  await fetch(`https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=${pixId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}
```

### Webhook extension — add transparent.completed branch
```typescript
// In src/app/api/webhooks/abacatepay/route.ts
// Extend isPaymentEvent check:
const isPaymentEvent =
  event.event === 'checkout.completed' ||
  event.event === 'billing.paid' ||
  event.event === 'transparent.completed'

// Add transparent payload extraction alongside checkout/billing:
const transparent = event.data.transparent
const transparentId = transparent?.id

// Purchase code lookup for transparent:
if (event.event === 'transparent.completed' && transparent) {
  purchaseCode = (transparent as { metadata?: { externalId?: string } }).metadata?.externalId ?? null
  if (!purchaseCode) {
    // Fallback: lookup by pixId stored in paymentExternalId
    const byPixId = await prisma.purchase.findFirst({
      where: { paymentExternalId: transparentId },
    })
    purchaseCode = byPixId?.code ?? null
  }
}
```

---

## DB Schema Impact

No schema migration required for Phase 4. Existing `Purchase` fields cover all needs:

| Field | Use for PIX |
|-------|-------------|
| `paymentExternalId` | Store PIX charge id (`pix_char_xxx`) |
| `paymentProvider` | Set to `'abacatepay'` (already default) |
| `status` | Existing `PENDING → PAID → PROCESSING → COMPLETED` flow |
| `paidAt` | Set by `handlePaymentSuccess` on `transparent.completed` |

**Optional enhancement (not required for PIX-01/PIX-04):** Store `brCode`/`brCodeBase64`/`pixExpiresAt` to avoid re-fetching on page refresh. This could use a separate table or a new `pixBrCode`/`pixExpiresAt` column on Purchase. Since Phase 5 (frontend) will consume these, the planner can decide to add these columns or fetch on-demand. Adding columns requires a Prisma migration — flag this as a decision point.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `ABACATEPAY_API_KEY` | PIX charge creation | Configured (sandbox + prod) | - | `isBypassPayment` mock path |
| AbacatePay `/v1/pixQrCode/*` endpoints | All PIX calls | Available (sandbox verified by project) | v1 | Mock bypass |
| Vitest | Tests | ✓ | 4.0.18 | - |

**Note:** `ABACATEPAY_PRODUCT_ID` is NOT needed for PIX — PIX charges use `amount` directly, not products.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run tests/lib/abacatepay-pix.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIX-01 | `createPixCharge` builds correct request body, returns brCode/brCodeBase64 | unit | `npx vitest run tests/lib/abacatepay-pix.test.ts` | ❌ Wave 0 |
| PIX-01 | `checkPixStatus` calls correct endpoint, maps status values | unit | `npx vitest run tests/lib/abacatepay-pix.test.ts` | ❌ Wave 0 |
| PIX-01 | `POST /api/purchases/pix` returns 400 without auth, 200 with valid purchase | unit | `npx vitest run tests/unit/pix-route.test.ts` | ❌ Wave 0 |
| PIX-04 | Webhook `transparent.completed` advances purchase to PAID, triggers Inngest | unit | `npx vitest run tests/unit/webhook-transparent.test.ts` | ❌ Wave 0 |
| PIX-04 | Webhook ignores `transparent.completed` duplicate (idempotency) | unit | `npx vitest run tests/unit/webhook-transparent.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/abacatepay-pix.test.ts tests/unit/pix-route.test.ts tests/unit/webhook-transparent.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/abacatepay-pix.test.ts` — unit tests for `createPixCharge`, `checkPixStatus`, `simulatePixPayment` (mock fetch)
- [ ] `tests/unit/pix-route.test.ts` — route handler tests
- [ ] `tests/unit/webhook-transparent.test.ts` — transparent.completed webhook processing

*(Pattern: existing `tests/lib/purchase-workflow.test.ts` and `tests/unit/sentry-context.test.ts` show how to mock Prisma and test handlers)*

---

## Open Questions

1. **API path: `/v1/pixQrCode/create` vs `/v2/transparents/create`**
   - What we know: API reference docs say `/v1/pixQrCode/...`. REQUIREMENTS.md says `/v2/transparents/create`. AbacatePay changelog says v2 is beta.
   - What's unclear: Does `/v2/transparents/create` actually work for the project's API key?
   - Recommendation: Plan tasks to use `/v1/pixQrCode/create` (verified docs). Add a note to test both during implementation. If v2 works, it can be swapped.

2. **Should `brCode`/`brCodeBase64` be persisted in DB?**
   - What we know: Phase 5 (frontend) needs these to display the QR. Status polling can re-fetch if stored as `paymentExternalId` exists.
   - What's unclear: Is re-fetching on page load acceptable? Does AbacatePay return brCode from the status check endpoint?
   - Recommendation: Status check endpoint (`/v1/pixQrCode/check`) returns `status` and `expiresAt` only, NOT `brCode`. So if the frontend needs to redisplay the QR after a page refresh, the backend needs to have stored `brCode` somewhere. Plan to add `pixBrCode` and `pixExpiresAt` fields to `Purchase` via Prisma migration, OR store them in a new `PixCharge` table. Simplest: add two nullable columns to `Purchase`.

3. **Webhook event name confirmation**
   - What we know: AbacatePay webhook docs list `transparent.completed`. REQUIREMENTS.md says `payment.completed`.
   - Recommendation: Use `transparent.completed`. Also keep existing `checkout.completed`/`billing.paid` handling intact (not a replacement, an addition).

---

## Sources

### Primary (HIGH confidence)
- https://docs.abacatepay.com/api-reference/criar-qrcode-pix.md — POST /v1/pixQrCode/create full spec
- https://docs.abacatepay.com/api-reference/checar-status.md — GET /v1/pixQrCode/check with all 5 status values
- https://docs.abacatepay.com/api-reference/simular-pagamento.md — POST /v1/pixQrCode/simulate-payment spec
- https://docs.abacatepay.com/pages/webhooks — `transparent.completed` event + payload structure
- Existing code: `src/app/api/webhooks/abacatepay/route.ts` — `handlePaymentSuccess` reuse pattern
- Existing code: `src/lib/abacatepay.ts` — `createCheckout` pattern to extend

### Secondary (MEDIUM confidence)
- https://docs.abacatepay.com/pages/pix-qrcode/reference — overview page mentions `/transparents/create` path (unconfirmed v2 path)
- https://docs.abacatepay.com/pages/changelog — confirms transparent checkout is v2-only feature

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages, all existing patterns
- Architecture: HIGH — webhook extension pattern is well-established in codebase
- API endpoints: MEDIUM — v1 paths verified in API reference; v2 path in REQUIREMENTS.md not confirmed in API reference
- Pitfalls: HIGH — derived from direct code inspection and official docs

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (AbacatePay v2 is in beta and may change)
