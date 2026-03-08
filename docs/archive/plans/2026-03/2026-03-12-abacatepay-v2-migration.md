# AbacatePay v1→v2 Migration + Form Simplification

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate AbacatePay integration from v1 (`/v1/billing/create` with inline product) to v2 (`/v2/checkouts/create` with product ID reference) and simplify the checkout form to email + password only.

**Architecture:** Replace the v1 billing endpoint with v2 checkout endpoint. Product is referenced by ID (already created in AbacatePay dashboard) instead of being created inline every purchase. Webhook handler updated from `billing.paid` (v1) to `checkout.completed` (v2). Form fields `name`, `confirmPassword`, `cellphone`, `buyerTaxId` removed from consulta page. Register endpoint no longer requires `name`.

**Tech Stack:** Next.js 14 App Router, TypeScript, AbacatePay API v2 (REST), Prisma/Neon, Vitest, Playwright

**Product IDs:** Dev: `prod_J5FSprfaALHnDCpsNhkZbrdG` | Prod: `prod_CxQkybBBLkBt26UQMhCwKPZr`

**API v2 docs:** `docs/payment/abacatepay-v2-docs-completa.md`

---

### Task 1: Rewrite `abacatepay.ts` for v2 checkout

**Files:**
- Modify: `src/lib/abacatepay.ts`
- Modify: `.env.local`

**Step 1: Add `ABACATEPAY_PRODUCT_ID` to `.env.local`**

Add to `.env.local`:
```
ABACATEPAY_PRODUCT_ID=prod_J5FSprfaALHnDCpsNhkZbrdG
```

**Step 2: Rewrite `createCheckout` in `abacatepay.ts`**

Replace the entire `createCheckout` function (lines 63-149) and remove dead code:

- Remove: `formatTaxIdForAbacatePay()` (lines 18-28)
- Remove: `formatCellphoneForAbacatePay()` (lines 30-40)
- Remove: `getAbacate()` (lines 8-16), `abacateInstance` (line 6), `AbacatePay` import (line 2)
- Remove from `CreateCheckoutParams`: `name`, `cellphone`, `taxId` fields (lines 42-50)
- Remove: `getAbacate` export (line 190)

New `createCheckout`:

```typescript
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

  console.log('[AbacatePay] Creating checkout:', {
    externalRef: params.externalRef,
    productId,
  })

  const body = {
    items: [{ id: productId, quantity: 1 }],
    externalId: params.externalRef,
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
    console.error('[AbacatePay] Checkout error:', { status: res.status, body: responseData })
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
```

New `CreateCheckoutParams` (simplified):

```typescript
export interface CreateCheckoutParams {
  externalRef: string // purchase code
  successUrl: string
  cancelUrl: string
}
```

**Step 3: Run tsc to verify types**

Run: `npx tsc --noEmit`
Expected: Errors in files that pass `name`, `cellphone`, `taxId` to `createCheckout` — these will be fixed in Task 3.

**Step 4: Commit**

```bash
git add src/lib/abacatepay.ts .env.local
git commit -m "refactor: migrate abacatepay.ts from v1 billing to v2 checkout"
```

---

### Task 2: Update webhook handler for v2 `checkout.completed`

**Files:**
- Modify: `src/app/api/webhooks/abacatepay/route.ts`

**Step 1: Replace the webhook handler**

The v2 webhook sends `checkout.completed` instead of `billing.paid`. Key differences:

| v1 | v2 |
|---|---|
| `event: "billing.paid"` | `event: "checkout.completed"` |
| `data.billing.id` | `data.checkout.id` |
| `data.billing.externalId` | `data.checkout.externalId` |
| `data.billing.customer.metadata.email` | `data.customer.email` |
| `data.billing.customer.metadata.name` | `data.customer.name` |
| `id: "log_xxx"` (top-level) | no top-level `id` — use `data.checkout.id` for idempotency |

Replace `AbacateBillingPaidEvent` interface (lines 5-34) with:

```typescript
interface AbacateCheckoutCompletedEvent {
  event: 'checkout.completed'
  apiVersion: number
  devMode: boolean
  data: {
    checkout: {
      id: string
      externalId?: string
      amount: number
      paidAmount: number
      status: string
      items: { id: string; quantity: number }[]
    }
    customer: {
      id: string
      name: string
      email: string
      taxId: string // masked: "123.***.***-**"
    } | null
  }
}
```

Update event processing (line 84):
- `event.event === 'billing.paid'` → `event.event === 'checkout.completed'`
- `event.data.billing` → `event.data.checkout`
- `billing.externalId || billing.products[0]?.externalId` → `checkout.externalId`
- `billing.customer?.metadata?.email` → `event.data.customer?.email`
- `billing.customer?.metadata?.name` → `event.data.customer?.name`
- `billing.id` → `checkout.id`

Idempotency key: `abacate:checkout.completed:{checkout.id}`

**Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean (or only errors from Task 1 callers)

**Step 3: Commit**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "refactor: update webhook handler from billing.paid (v1) to checkout.completed (v2)"
```

---

### Task 3: Simplify `purchases/route.ts` — remove customer fields

**Files:**
- Modify: `src/app/api/purchases/route.ts`

**Step 1: Remove customer fields from the route**

In `CreatePurchaseRequest` (lines 10-17):
- Remove: `name`, `cellphone`, `buyerTaxId`

In POST handler:
- Remove: `name`, `cellphone`, `buyerTaxId` from destructuring (line 31)
- Remove: buyerTaxId validation block (lines 49-55)
- Remove: cellphone cleaning (line 58)
- Remove: `name` and `cellphone` from user create/update (lines 144-157)
- Remove: `checkoutCellphone` / `checkoutBuyerTaxId` logic (lines 161-180)
- Remove: `name`, `cellphone`, `taxId` from `createCheckout()` call (lines 235-243)

Simplified `createCheckout` call:

```typescript
const { sessionId, checkoutUrl } = await createCheckout({
  externalRef: code,
  successUrl: `${appUrl}/compra/confirmacao?code=${code}`,
  cancelUrl: `${appUrl}/`,
})
```

**Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean (or only errors from `payment.ts` — fix next)

**Step 3: Update `payment.ts` interface**

In `src/lib/payment.ts`, update `CreateCheckoutParams` (lines 11-19) to match:

```typescript
export interface CreateCheckoutParams {
  externalRef: string
  successUrl: string
  cancelUrl: string
}
```

Remove: `email`, `name`, `cellphone`, `taxId` fields.

**Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 5: Commit**

```bash
git add src/app/api/purchases/route.ts src/lib/payment.ts
git commit -m "refactor: remove customer fields from purchase route (v2 checkout collects them)"
```

---

### Task 4: Simplify consulta page form — email + password only

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx`

**Step 1: Remove state variables and helpers**

Remove these state variables (lines 38-46):
- `name`, `setName`
- `confirmPassword`, `setConfirmPassword`
- `showConfirmPassword`, `setShowConfirmPassword`
- `cellphone`, `setCellphone`
- `buyerTaxId`, `setBuyerTaxId`

Remove helper functions (lines 48-70):
- `formatPhone()`
- `formatTaxId()`

**Step 2: Simplify `createPurchase()` body**

In `createPurchase()` (lines 91-106), simplify body construction:

```typescript
const body: Record<string, unknown> = {
  term: params.term,
  termsAccepted: true,
}
if (email) body.email = email
```

Remove: `cellphone`, `buyerTaxId`, `name` from body.

**Step 3: Simplify `handleRegisterAndPurchase()` validation**

In `handleRegisterAndPurchase()` (lines 139-193):

Remove validation for `name` (lines 144-147) and `confirmPassword` (lines 152-155).

Update auth body (lines 168-169):

```typescript
const authBody = authMode === 'register'
  ? { email, password }
  : { email, password }
```

Since register and login now send the same fields, simplify to:

```typescript
const authBody = { email, password }
```

**Step 4: Remove form fields from JSX**

Remove from the not-logged-in form (lines 384-660):
- Name input block (lines 397-428): the `{authMode === 'register' && (<> ... <label>Nome</label> <input id="name" ... /> </>)}`
- Confirm password block (lines 504-552): the `{authMode === 'register' && (<> ... <label>Confirmar Senha</label> ... </>)}`
- Cellphone input block (lines 554-580): `<label>Celular</label> <input id="cellphone" ...>`
- BuyerTaxId input block (lines 582-609): `<label>Seu CPF ou CNPJ</label> <input id="buyerTaxId" ...>`

**Step 5: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 6: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "refactor: simplify consulta form to email + password only"
```

---

### Task 5: Update register endpoint — name optional

**Files:**
- Modify: `src/app/api/auth/register/route.ts`

**Step 1: Make `name` optional in Zod schema**

In `registerSchema` (lines 7-11):

```typescript
const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2).optional(),
})
```

In destructuring (line 23):
```typescript
const { email, password, name } = parsed.data
```

In user create (line 48):
```typescript
await prisma.user.create({
  data: { email: normalizedEmail, name: name || null, passwordHash },
})
```

**Step 2: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "refactor: make name optional in register endpoint"
```

---

### Task 6: Simplify `AuthForm.tsx` — remove name + confirm password

**Files:**
- Modify: `src/components/AuthForm.tsx`

**Step 1: Remove fields from AuthForm**

Remove state variables (lines 70-73, 77):
- `name`, `setName`
- `confirmPassword`, `setConfirmPassword`
- `showConfirmPassword`, `setShowConfirmPassword`

Remove confirm password validation (lines 83-86):
```typescript
// DELETE: if (mode === 'register' && password !== confirmPassword) { ... }
```

Simplify auth body (lines 92-94):
```typescript
const body = { email, password }
```

Remove JSX blocks:
- Name input (lines 136-151): `{mode === 'register' && (<div> ... <label>Nome</label> ... </div>)}`
- Confirm password input (lines 187-207): `{mode === 'register' && (<div> ... <label>Confirmar Senha</label> ... </div>)}`

**Step 2: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 3: Commit**

```bash
git add src/components/AuthForm.tsx
git commit -m "refactor: simplify AuthForm to email + password only"
```

---

### Task 7: Remove `abacatepay-nodejs-sdk` dependency

**Files:**
- Modify: `package.json`

**Step 1: Uninstall SDK**

Run: `npm uninstall abacatepay-nodejs-sdk`

**Step 2: Verify no remaining imports**

Run: `grep -r "abacatepay-nodejs-sdk" src/ --include="*.ts" --include="*.tsx"`
Expected: No matches (the import was in `abacatepay.ts` which we already removed in Task 1)

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove abacatepay-nodejs-sdk (replaced by direct fetch to v2 API)"
```

---

### Task 8: Update E2E tests

**Files:**
- Modify: `e2e/tests/purchase-flow-cpf.spec.ts`
- Modify: `e2e/tests/purchase-flow-cnpj.spec.ts`
- Modify: `e2e/helpers/test-data.ts`

**Step 1: Remove cellphone and buyerTaxId from E2E tests**

In `purchase-flow-cpf.spec.ts` (lines 27-28), remove:
```typescript
await page.locator('#cellphone').fill(TEST_USER.cellphone)
await page.locator('#buyerTaxId').fill(TEST_USER.taxId)
```

In `purchase-flow-cnpj.spec.ts` (lines 25-26), remove the same.

In `test-data.ts` (lines 22-27), remove `cellphone` and `taxId` from `TEST_USER`.

Also remove `#name` fills if present (the form no longer has a name field for register).

**Step 2: Run E2E tests**

Run: `MOCK_MODE=true npx playwright test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add e2e/
git commit -m "test: update E2E tests for simplified form (email + password only)"
```

---

### Task 9: Run full validation

**Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 2: Lint**

Run: `npm run lint`
Expected: Clean

**Step 3: Unit tests**

Run: `npx vitest run`
Expected: All pass

**Step 4: E2E tests**

Run: `MOCK_MODE=true npx playwright test`
Expected: All pass

---

### Task 10: Update env vars and docs

**Files:**
- Modify: `.env.local`
- Modify: `docs/status.md`
- Modify: `TODO.md`

**Step 1: Update `.env.local` with product ID**

Ensure `.env.local` has:
```
ABACATEPAY_PRODUCT_ID=prod_J5FSprfaALHnDCpsNhkZbrdG
```

**Step 2: Update `docs/status.md`**

Add entry to "O que esta funcionando" and "Ultimas mudancas":
- AbacatePay v2 migration: `/v1/billing/create` → `/v2/checkouts/create`, product by ID
- Webhook: `billing.paid` → `checkout.completed` (v2 format)
- Form simplified: email + password only (removed name, confirmPassword, cellphone, buyerTaxId)
- `abacatepay-nodejs-sdk` removed (direct fetch)

**Step 3: Update `TODO.md`**

Mark AbacatePay v2 migration as done.

Add to Vercel env vars checklist:
```
ABACATEPAY_PRODUCT_ID=prod_CxQkybBBLkBt26UQMhCwKPZr
```

**Step 4: Commit**

```bash
git add docs/status.md TODO.md
git commit -m "docs: update status and TODO for AbacatePay v2 migration"
```

---

## Env Vars Summary

| Variable | Dev (.env.local) | Prod (Vercel) | Notes |
|---|---|---|---|
| `ABACATEPAY_PRODUCT_ID` | `prod_J5FSprfaALHnDCpsNhkZbrdG` | `prod_CxQkybBBLkBt26UQMhCwKPZr` | NEW — required |
| `ABACATEPAY_API_KEY` | (existing) | (existing) | No change |
| `ABACATEPAY_WEBHOOK_SECRET` | (existing) | (existing) | No change |

## Files Changed Summary

| File | Action | What changes |
|---|---|---|
| `src/lib/abacatepay.ts` | Rewrite | v1→v2 endpoint, product by ID, remove customer/SDK/formatters |
| `src/app/api/webhooks/abacatepay/route.ts` | Rewrite | `billing.paid`→`checkout.completed`, v2 payload format |
| `src/app/api/purchases/route.ts` | Modify | Remove customer fields (name, cellphone, buyerTaxId) |
| `src/lib/payment.ts` | Modify | Simplify `CreateCheckoutParams` |
| `src/app/consulta/[term]/page.tsx` | Modify | Remove 4 form fields, keep email + password |
| `src/app/api/auth/register/route.ts` | Modify | Make `name` optional |
| `src/components/AuthForm.tsx` | Modify | Remove name + confirm password fields |
| `e2e/tests/purchase-flow-*.spec.ts` | Modify | Remove cellphone/buyerTaxId fills |
| `e2e/helpers/test-data.ts` | Modify | Remove cellphone/taxId from TEST_USER |
| `package.json` | Modify | Remove `abacatepay-nodejs-sdk` |
| `.env.local` | Modify | Add `ABACATEPAY_PRODUCT_ID` |
| `docs/status.md` | Modify | Document changes |
| `TODO.md` | Modify | Mark done, add prod env var |
