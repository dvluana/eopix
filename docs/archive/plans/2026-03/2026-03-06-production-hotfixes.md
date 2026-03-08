# Production Hotfixes — Inngest, Webhook, Checkout UX

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical production bugs: Inngest not processing purchases, webhook delivery issues, and logged-in user UX in the checkout flow.

**Architecture:** The Inngest `processSearch` function is defined but never registered with `serve()`. The `functions` array in `crons.ts` only includes 5 cron jobs, not the main pipeline. Additionally, the webhook handler silently swallows Inngest failures with no retry/fallback. The checkout UX forces logged-in users to re-enter cellphone/taxId when the backend already has this data or can skip it.

**Tech Stack:** Next.js 14, Inngest v3, AbacatePay, Prisma/Neon, TypeScript

---

## Summary of Issues Found

### CRITICAL (Production Broken)

| # | Bug | Impact | Root Cause |
|---|-----|--------|-----------|
| 1 | `processSearch` not in Inngest `functions` array | ALL paid purchases stuck forever — Inngest event accepted but no handler | `crons.ts` exports `functions` with only 5 crons; `processSearch` not included |
| 2 | Webhook possibly not reaching endpoint | Zero `WebhookLog` entries in prod; `paymentExternalId` null for ALL purchases | Likely webhook URL misconfigured in AbacatePay dashboard, or `ABACATEPAY_WEBHOOK_SECRET` mismatch |
| 3 | Purchase `RUVW8B` stuck at PROCESSING step 1 | User paid R$29.90 real money, got nothing | Admin triggered process → `inngest.send()` succeeded (event accepted) but no handler registered |
| 4 | Webhook handler silently swallows Inngest failure | Purchase stays PAID forever, webhook returns 200, no retry | `catch(err)` at line 197 of webhook handler only logs, doesn't fail the response |

### UX BUGS

| # | Bug | Impact | Root Cause |
|---|-----|--------|-----------|
| 5 | Logged-in users must fill cellphone + buyerTaxId | Unnecessary friction for returning customers | Form always shows 2 empty fields; no data stored on User model |
| 6 | `name`/`email` sent as empty strings for logged-in users | Works by accident (backend fallback), but fragile | `useState('')` never populated from session data |

### DATA (Neon Main — Production)

```
RUVW8B  PROCESSING  step=1  paymentExternalId=null  term=01208628240  (Luana's real purchase)
JAJ99T  FAILED      PAYMENT_EXPIRED  term=01208628240
F63NZG  FAILED      PAYMENT_EXPIRED  term=92615155253
RJCNH7  FAILED      PAYMENT_EXPIRED  term=33923798000100
SCGASX  FAILED      PAYMENT_EXPIRED  term=52998224725
```

Zero WebhookLog entries. All `paymentExternalId` values are null.

---

## Task 1: Fix `processSearch` not registered with Inngest serve

**Priority:** P0 — CRITICAL. Nothing works without this.

**Files:**
- Modify: `src/lib/inngest/crons.ts:163-170`

**Step 1: Write the failing test**

```ts
// src/lib/inngest/__tests__/functions-export.test.ts
import { describe, it, expect } from 'vitest'
import { functions } from '../crons'
import { processSearch } from '../process-search'

describe('Inngest functions export', () => {
  it('should include processSearch in the functions array', () => {
    const functionIds = functions.map((fn: { id?: string[] }) => {
      // Inngest functions have an internal config with id
      return JSON.stringify(fn)
    })
    // processSearch must be in the array
    expect(functions).toContain(processSearch)
  })

  it('should have exactly 6 functions (5 crons + processSearch)', () => {
    expect(functions).toHaveLength(6)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/inngest/__tests__/functions-export.test.ts`
Expected: FAIL — `processSearch` not in array, length is 5 not 6

**Step 3: Fix — Add processSearch to functions array**

In `src/lib/inngest/crons.ts`, add the import and include in array:

```ts
// At top of file, add:
import { processSearch } from './process-search'

// Change the functions array (line 164) to:
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
  anonymizePurchases,
]
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/inngest/__tests__/functions-export.test.ts`
Expected: PASS

**Step 5: Verify build**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 6: Commit**

```bash
git add src/lib/inngest/crons.ts src/lib/inngest/__tests__/functions-export.test.ts
git commit -m "fix(critical): register processSearch with Inngest serve

processSearch was defined and exported but never included in the
functions array passed to serve(). All search/process events were
silently dropped — paid purchases stuck at PAID/PROCESSING forever."
```

---

## Task 2: Add fallback in webhook handler when Inngest fails

**Priority:** P0 — Without this, even with Task 1 fixed, a transient Inngest failure loses the purchase.

**Files:**
- Modify: `src/app/api/webhooks/abacatepay/route.ts:183-199`

**Step 1: Understand the fix**

Currently the webhook handler catches Inngest errors silently and returns 200. Two improvements:
1. If `inngest.send()` fails, return HTTP 500 so AbacatePay retries the webhook
2. Log a structured error for monitoring

**Step 2: Implement the fix**

In `src/app/api/webhooks/abacatepay/route.ts`, change the Inngest trigger block (lines 183-199):

```ts
  // Trigger Inngest job
  try {
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
  } catch (err) {
    console.error('[AbacatePay Webhook] Failed to trigger Inngest job:', err)
    // Re-throw so the webhook returns 500 and AbacatePay retries
    throw err
  }
```

This means the outer catch at line 115-120 will handle it, returning 500. AbacatePay will retry the webhook. The purchase is already PAID (updated before Inngest trigger), so the idempotency check for the DB update won't conflict — only the Inngest send will be retried.

**IMPORTANT:** The WebhookLog entry must NOT be created if Inngest fails. Currently it's created after the if-block (line 104-111). With the re-throw, execution jumps to the outer catch and the WebhookLog is never created — this is correct behavior because the webhook wasn't fully processed.

**Step 3: Verify build**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "fix: webhook returns 500 when Inngest fails, enabling retry

Previously the webhook handler silently caught Inngest errors and
returned 200. AbacatePay thought the webhook was processed, but
the purchase was stuck at PAID forever. Now re-throws so AbacatePay
retries the webhook delivery."
```

---

## Task 3: Recover stuck purchase RUVW8B

**Priority:** P0 — Real customer paid R$29.90 and got nothing.

**Approach:** After deploying Tasks 1+2, the Inngest function will be registered. We can then re-trigger processing for RUVW8B via admin panel or by resetting it to PAID and re-sending the Inngest event.

**Step 1: After deploying fix, reset purchase to PAID via Neon SQL**

```sql
UPDATE "Purchase"
SET status = 'PAID', "processingStep" = 0
WHERE code = 'RUVW8B' AND status = 'PROCESSING';
```

**Step 2: Trigger processing via admin panel**

Use the admin `/api/admin/purchases/{id}/process` endpoint. This will:
1. Set status to PROCESSING, step 1
2. Send `search/process` event to Inngest
3. With processSearch now registered, Inngest will handle it

```bash
# Admin login
curl -X POST https://{DOMAIN}/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'

# Process
curl -X POST https://{DOMAIN}/api/admin/purchases/cmmf42760000704l58mxca8qd/process \
  -H "Cookie: eopix_session=..."
```

**Step 3: Verify purchase completes**

Check via Neon SQL:
```sql
SELECT code, status, "processingStep", "searchResultId"
FROM "Purchase" WHERE code = 'RUVW8B';
```

Expected: status=COMPLETED, searchResultId not null

---

## Task 4: Verify AbacatePay webhook configuration

**Priority:** P0 — Must verify webhook URL is correctly configured.

**This is a MANUAL task for Luana**, but we can add logging to help debug.

**Step 1: Add request logging to webhook endpoint**

In `src/app/api/webhooks/abacatepay/route.ts`, add at the very start of POST:

```ts
export async function POST(request: NextRequest) {
  console.log('[AbacatePay Webhook] Request received:', {
    url: request.url,
    method: request.method,
    hasSignature: !!request.headers.get('x-webhook-signature'),
    contentType: request.headers.get('content-type'),
  })
  // ... rest of handler
```

**Step 2: Check AbacatePay dashboard webhook config**

The webhook URL must be:
```
https://{DOMAIN}/api/webhooks/abacatepay?webhookSecret={ABACATEPAY_WEBHOOK_SECRET}
```

Verify:
- [ ] URL uses HTTPS (not HTTP)
- [ ] Domain matches `NEXT_PUBLIC_APP_URL` (no trailing slash)
- [ ] `webhookSecret` query param matches `ABACATEPAY_WEBHOOK_SECRET` env var on Vercel
- [ ] Event `billing.paid` is selected

**Step 3: Test with a small real payment or AbacatePay's webhook test feature**

After deploying, create a test purchase and pay. Check Vercel function logs for the `[AbacatePay Webhook] Request received` log.

**Step 4: Commit the logging**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "fix: add request logging to webhook for debugging delivery"
```

---

## Task 5: Skip cellphone/buyerTaxId for logged-in users

**Priority:** P1 — UX friction for returning customers.

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (logged-in form section)
- Modify: `src/app/api/purchases/route.ts` (use stored data)

**Step 1: Understand the desired behavior**

When a user is logged in:
- They should see ONLY the "DESBLOQUEAR RELATORIO" button (no fields)
- Backend should use `session.email` for email, `user.name` for name
- For `cellphone` and `buyerTaxId`: use data from the user's most recent COMPLETED purchase (if any), otherwise use fallback values

**Step 2: Modify the backend to fetch previous purchase data**

In `src/app/api/purchases/route.ts`, after finding/creating the user (around line 152), add:

```ts
// For logged-in users: retrieve cellphone/taxId from most recent purchase
let storedCellphone = cleanedCellphone
let storedBuyerTaxId = cleanedBuyerTaxId

if (session && (!storedCellphone || !storedBuyerTaxId)) {
  const lastPurchase = await prisma.purchase.findFirst({
    where: {
      userId: user.id,
      status: 'COMPLETED',
      buyerCellphone: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    select: { buyerCellphone: true, buyerCpfCnpj: true },
  })

  if (lastPurchase) {
    if (!storedCellphone && lastPurchase.buyerCellphone) {
      storedCellphone = lastPurchase.buyerCellphone
    }
    if (!storedBuyerTaxId && lastPurchase.buyerCpfCnpj) {
      storedBuyerTaxId = lastPurchase.buyerCpfCnpj
    }
  }
}
```

Then use `storedCellphone` and `storedBuyerTaxId` in the `createCheckout` call.

**NOTE:** Check if `buyerCellphone` field exists on the Purchase model. If not, we need a migration to store it, OR we store cellphone on the User model instead. Check `prisma/schema.prisma` first.

**Step 3: Remove the 2 form fields from logged-in view**

In `src/app/consulta/[term]/page.tsx`, replace the logged-in form (around line 360-430) with just a button:

```tsx
<form onSubmit={handlePurchaseLoggedIn} style={{ width: '100%' }}>
  <button
    type="submit"
    disabled={isLoading}
    className="caption"
    style={{
      width: '100%',
      padding: 'var(--primitive-space-3) var(--primitive-space-4)',
      backgroundColor: isLoading ? '#999' : '#DCFE50',
      color: '#000',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontWeight: 800,
      fontSize: '1rem',
      letterSpacing: '0.04em',
      cursor: isLoading ? 'not-allowed' : 'pointer',
    }}
  >
    {isLoading ? 'PROCESSANDO...' : 'DESBLOQUEAR RELATORIO'}
  </button>
</form>
```

**Step 4: Verify build + lint**

Run: `npx tsc --noEmit && npm run lint`

**Step 5: Run E2E tests**

Run: `MOCK_MODE=true npx playwright test`
Expected: All tests pass (may need to update E2E tests that look for `#cellphone-logged`)

**Step 6: Update E2E tests if needed**

If E2E tests fill `#cellphone-logged` and `#buyerTaxId-logged`, update them to handle the new logged-in flow (just click the button, no fields).

**Step 7: Commit**

```bash
git add src/app/consulta/[term]/page.tsx src/app/api/purchases/route.ts
git commit -m "fix: skip cellphone/taxId fields for logged-in users

Logged-in users now see only the purchase button. Backend pulls
cellphone/taxId from the most recent completed purchase. Reduces
friction for returning customers."
```

---

## Task 6: Fix `name`/`email` sent as empty strings for logged-in users

**Priority:** P1 — Works by accident but is fragile.

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx`

**Step 1: Populate name/email from session for logged-in users**

Modify the `/api/auth/me` response to include name, OR populate the state from `userEmail`:

Option A (simpler — just don't send empty values):

In `createPurchase()` function (line 91-103), conditionally include name/email:

```ts
const createPurchase = async () => {
  const body: Record<string, unknown> = {
    term: params.term,
    termsAccepted: true,
  }

  // Only send these if they have real values (guest flow)
  if (cellphone) body.cellphone = cellphone.replace(/\D/g, '')
  if (buyerTaxId) body.buyerTaxId = buyerTaxId.replace(/\D/g, '')
  if (name) body.name = name
  if (email) body.email = email

  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  // ... rest unchanged
}
```

This way, logged-in users send `{ term, termsAccepted }` only, and the backend uses session data for everything.

**Step 2: Verify build**

Run: `npx tsc --noEmit && npm run lint`

**Step 3: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "fix: don't send empty name/email in purchase request

Logged-in users were sending empty strings for name/email. Backend
compensated via fallback but this was fragile. Now only sends fields
with actual values."
```

---

## Task 7: Add `buyerCellphone` to Purchase model (if needed)

**Priority:** P1 — Required for Task 5 if field doesn't exist.

**Step 1: Check schema**

Run: `grep -n 'buyerCellphone\|buyerPhone\|cellphone' prisma/schema.prisma`

If the field does NOT exist:

**Step 2: Create migration**

```bash
npx prisma migrate dev --name add_buyer_cellphone
```

Add to `Purchase` model in `prisma/schema.prisma`:
```prisma
buyerCellphone String?
```

**Step 3: Update purchase creation to store cellphone**

In `src/app/api/purchases/route.ts`, add `buyerCellphone: storedCellphone` to the `prisma.purchase.create()` call.

**Step 4: Apply migration to Neon develop**

```bash
DATABASE_URL=<develop_url> npx prisma migrate deploy
```

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add buyerCellphone to Purchase model

Stores the buyer's cellphone on each purchase so it can be
re-used for returning customers without re-entering."
```

---

## Deployment Order

1. **Deploy Tasks 1 + 2 + 4 IMMEDIATELY** — These fix the critical production breakage
2. **Execute Task 3** — Recover RUVW8B after deploy
3. **Verify Task 4** — Confirm webhook is reaching the endpoint
4. **Deploy Tasks 5 + 6 + 7** — UX improvements for logged-in users

---

## Checklist for Luana (Manual Steps)

- [ ] Verify AbacatePay webhook URL in dashboard: `https://{DOMAIN}/api/webhooks/abacatepay?webhookSecret={SECRET}`
- [ ] Verify `ABACATEPAY_WEBHOOK_SECRET` env var matches the secret in the webhook URL
- [ ] Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set on Vercel
- [ ] After deploy: check Inngest dashboard (app.inngest.com) that `process-search` function appears in registered functions
- [ ] After deploy: recover purchase RUVW8B via admin panel
- [ ] After deploy: make a test purchase to verify full flow end-to-end
