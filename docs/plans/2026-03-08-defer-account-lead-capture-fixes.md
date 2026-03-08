# Defer Account Creation + Lead Capture + Progress Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Defer user account creation until payment succeeds, capture abandoned checkouts as Leads, fix "Nova Consulta" redirect, and fix real-time progress updates.

**Architecture:** Move registration logic from frontend pre-purchase to webhook post-payment. Store password hash temporarily on Purchase until payment confirms. Capture all form data in LeadCapture at checkout start. Verify Nova Consulta flow and add mock processing delays for progress visibility.

**Tech Stack:** Next.js 14, Prisma/Neon, AbacatePay webhooks, Inngest, bcryptjs

---

## Context

### Current flow (broken)
1. User fills RegisterModal → POST `/api/auth/register` → **account created immediately**
2. POST `/api/purchases` → Purchase created → redirect to AbacatePay
3. User abandons checkout → account exists, no lead captured

### Target flow
1. User fills RegisterModal → POST `/api/purchases` with all data (including password)
2. Backend creates User WITHOUT passwordHash, stores hash on Purchase, creates LeadCapture
3. User pays → webhook sets passwordHash on User (account activated)
4. User abandons → LeadCapture persists, User can't log in (no password)

---

## Task 1: Schema migration — add pendingPasswordHash + expand LeadCapture

**Files:**
- Create: `prisma/migrations/YYYYMMDD_defer_account_fields/migration.sql`
- Modify: `prisma/schema.prisma`

**Step 1: Add fields to Prisma schema**

In `prisma/schema.prisma`, add to Purchase model:
```prisma
pendingPasswordHash String?
```

Add to LeadCapture model:
```prisma
name      String?
phone     String?
buyerTaxId String?
```

**Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name defer_account_fields
```

**Step 3: Verify migration**

```bash
npx prisma studio
# Check Purchase has pendingPasswordHash column
# Check LeadCapture has name, phone, buyerTaxId columns
```

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: add pendingPasswordHash to Purchase + expand LeadCapture fields"
```

---

## Task 2: Backend — purchases route accepts password, creates LeadCapture

**Files:**
- Modify: `src/app/api/purchases/route.ts`

**Step 1: Add password to request interface and hashing logic**

Add `password?: string` to `CreatePurchaseRequest`. After creating the User (without passwordHash), hash the password and store on Purchase:

```typescript
// After creating the purchase (both bypass and normal flow):
let pendingPasswordHash: string | undefined
if (password) {
  const bcrypt = await import('bcryptjs')
  pendingPasswordHash = await bcrypt.hash(password, 10)
}
```

Pass `pendingPasswordHash` to `prisma.purchase.create()`.

**Step 2: Create LeadCapture on checkout creation**

After creating the Purchase (in the normal/non-bypass flow), create a LeadCapture:

```typescript
await prisma.leadCapture.create({
  data: {
    email: userEmail,
    term: cleanedTerm,
    name: name || null,
    phone: cellphone || null,
    buyerTaxId: buyerTaxId || null,
    reason: 'CHECKOUT_STARTED',
  },
})
```

**Step 3: For bypass flow — set passwordHash directly on User**

In bypass mode, payment is instant, so set the password immediately:

```typescript
if (effectiveBypass && pendingPasswordHash) {
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: pendingPasswordHash },
  })
}
```

No LeadCapture in bypass mode (payment is guaranteed).

**Step 4: Verify tsc clean**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/app/api/purchases/route.ts
git commit -m "feat: purchases route accepts password, creates LeadCapture on checkout"
```

---

## Task 3: Backend — webhook activates account on payment

**Files:**
- Modify: `src/app/api/webhooks/abacatepay/route.ts`

**Step 1: In handlePaymentSuccess, activate user account**

After updating purchase to PAID, check for pendingPasswordHash and move to User:

```typescript
// After the purchase.status === 'PENDING' → PAID update block:

// Activate user account if pending registration
if (purchase.pendingPasswordHash && !purchase.user.passwordHash) {
  await prisma.user.update({
    where: { id: purchase.userId },
    data: { passwordHash: purchase.pendingPasswordHash },
  })
  // Clear pending hash
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { pendingPasswordHash: null },
  })
  console.log(`[AbacatePay Webhook] User account activated for ${purchaseCode}`)
}
```

**Step 2: Include pendingPasswordHash in purchase query**

Update the `prisma.purchase.findUnique` call to select `pendingPasswordHash`:

```typescript
const purchase = await prisma.purchase.findUnique({
  where: { code: purchaseCode },
  include: { user: true },
  // pendingPasswordHash is included by default (no select filter)
})
```

**Step 3: Verify tsc clean**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "feat: webhook activates user account on payment success"
```

---

## Task 4: Frontend — remove register call from handleModalSubmit

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx`

**Step 1: Refactor handleModalSubmit**

Remove the call to `/api/auth/register`. Instead, pass ALL form data (including password) directly to `/api/purchases`:

```typescript
const handleModalSubmit = async (data: RegisterData) => {
  setSubmitting(true)
  setSubmitError('')

  try {
    const isLoginMode = !data.name

    if (isLoginMode) {
      // Login mode: authenticate first, then purchase
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      if (!loginRes.ok) {
        const loginData = await loginRes.json()
        setSubmitError(loginData.error || 'Erro ao fazer login')
        return
      }
    }

    // Create purchase — pass all form data (including password for new users)
    const purchaseRes = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        term: cleanedTerm,
        termsAccepted: true,
        email: data.email,
        name: data.name || undefined,
        cellphone: data.cellphone || undefined,
        buyerTaxId: data.buyerTaxId || undefined,
        ...(!isLoginMode ? { password: data.password } : {}),
      }),
    })
    const purchaseData = await purchaseRes.json()

    if (purchaseRes.status === 409 && purchaseData.existingReportId) {
      router.push(`/relatorio/${purchaseData.existingReportId}`)
      return
    }
    if (!purchaseRes.ok) {
      setSubmitError(purchaseData.error || 'Erro ao criar compra')
      return
    }

    if (purchaseData.checkoutUrl) {
      window.location.href = purchaseData.checkoutUrl
    } else {
      router.push(`/compra/confirmacao?code=${purchaseData.code}`)
    }
  } catch {
    setSubmitError('Erro de conexao. Tente novamente.')
  } finally {
    setSubmitting(false)
  }
}
```

Key change: register call removed entirely. Password sent to purchases route for new users. Login mode still authenticates first (user already has an account).

**Step 2: Verify tsc clean**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "feat: defer registration - pass password to purchases route instead of registering first"
```

---

## Task 5: Verify Nova Consulta flow (Fix 2)

**Files:**
- Read-only: `src/components/NovaConsultaModal.tsx`

**Step 1: Analyze the code**

NovaConsultaModal sends `{ term, termsAccepted }` to `/api/purchases`. For logged-in users, the purchases route resolves customer data from the session user (name, cellphone, taxId).

The "compra aprovada" redirect happens because `BYPASS_PAYMENT=true` in `.env.local`. In bypass mode, the purchase is PAID instantly and `checkoutUrl` points to confirmacao page.

**Step 2: Test with BYPASS_PAYMENT=false via Chrome MCP**

1. Set `BYPASS_PAYMENT=false` in `.env.local`
2. Restart dev server
3. Login as test user
4. Click "Nova Consulta" → enter CPF → confirm
5. Verify redirect goes to AbacatePay checkout (not confirmacao)
6. Verify customer data pre-filled on AbacatePay page
7. Revert `BYPASS_PAYMENT=true` after testing

**Step 3: Document result**

If it works → no code change needed, just a dev-mode behavior.
If broken → investigate and fix.

---

## Task 6: Fix progress updates (Fix 3) — add mock delays

**Files:**
- Modify: `src/lib/inngest/process-search.ts` (mock processing section)

**Step 1: Identify mock processing path**

In the Inngest pipeline, when MOCK_MODE is true, mock data is used instead of real API calls. The processing completes near-instantly, so processingStep jumps from 0 to 6 with no visible progress.

**Step 2: Add artificial delays in mock mode**

In each step of the mock processing pipeline, add a 1-second delay:

```typescript
if (isMockMode) {
  await new Promise(resolve => setTimeout(resolve, 1000))
}
```

This gives the frontend time to poll and display each step.

**Step 3: Verify with Chrome MCP**

1. Start dev server with `npm run dev:live` (includes Inngest)
2. Create a purchase
3. On confirmacao page: verify ProcessingTracker updates in real-time (steps 1→2→3→4→5→6)
4. On minhas-consultas: verify compact tracker updates
5. Screenshot each state

**Step 4: Run tests**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

**Step 5: Commit**

```bash
git add src/lib/inngest/process-search.ts
git commit -m "feat: add mock processing delays for visible progress tracking"
```

---

## Task 7: E2E test updates

**Files:**
- Modify: E2E tests that fill RegisterModal

**Step 1: Update E2E purchase flow tests**

The E2E tests currently:
1. Navigate to consulta page
2. Click DESBLOQUEAR → modal opens
3. Fill fields → submit
4. Wait for purchase

Since we removed the register call, the flow should still work because:
- In E2E mock mode, BYPASS_PAYMENT=true → purchase created as PAID → password set immediately
- The only change is the frontend doesn't call register separately

Run E2E to verify:

```bash
npm run test:e2e:mock
```

If tests fail, update selectors/assertions as needed.

**Step 2: Commit if changes needed**

```bash
git add e2e/
git commit -m "test: update E2E tests for deferred registration flow"
```

---

## Task 8: Chrome MCP end-to-end verification

**Step 1: Test Fix 1 — Deferred account creation**

1. Start `npm run dev:live`
2. Navigate to `/consulta/12345678909` (or valid test CPF)
3. Click DESBLOQUEAR → fill modal → submit
4. Verify: NO session cookie set before checkout
5. In bypass mode: verify account activated (can log in)
6. Check admin panel → Leads → verify LeadCapture entry with all fields

**Step 2: Test Fix 2 — Nova Consulta redirect**

1. Login to minhas-consultas
2. Click "Nova Consulta"
3. Enter new CPF → confirm
4. With BYPASS_PAYMENT=true: expect confirmacao redirect (expected behavior)
5. Optional: with BYPASS_PAYMENT=false: expect AbacatePay redirect

**Step 3: Test Fix 3 — Progress updates**

1. With `npm run dev:live` (Inngest running)
2. Create a purchase
3. Watch confirmacao page: ProcessingTracker should show steps updating
4. Navigate to minhas-consultas: compact tracker should update
5. Screenshot progress at each visible step

---

## Summary

| Task | What | Risk |
|---|---|---|
| 1 | Schema migration (pendingPasswordHash + LeadCapture fields) | Low — additive columns |
| 2 | Purchases route: accept password, create LeadCapture | Medium — core purchase flow |
| 3 | Webhook: activate account on payment | Low — additive logic |
| 4 | Frontend: remove register call | Medium — changes auth flow |
| 5 | Verify Nova Consulta (read-only test) | Zero |
| 6 | Mock processing delays | Low — mock-only change |
| 7 | E2E test updates | Low |
| 8 | Chrome MCP verification | Zero — read-only |
