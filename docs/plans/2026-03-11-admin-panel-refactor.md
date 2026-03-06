# Admin Panel Refactor — Health, Security, Cleanup, UX

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the health endpoint so it works correctly, clean up stale Stripe references, fix security issues, and improve admin UX with toasts and error states.

**Architecture:** The health endpoint has broken balance parsing (APIFull/Serper), checks a dead service (Brevo), and misses a critical one (Inngest). The admin panel has 15+ `alert()` calls, no error states on most pages, duplicated components, and stale Stripe code. Security has a JWT fallback to a hardcoded secret and 30-day admin sessions.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma/Neon, Tailwind + Radix

---

## Audit Summary

### Health Endpoint (`/api/health`)
| Issue | Severity |
|-------|----------|
| APIFull balance parses `data.balance` — field name unverified, shows R$0 when real balance is R$19 | High |
| Serper credits parses `data.credits` — field name unverified | High |
| No Inngest health check — core pipeline invisible | High |
| Brevo check present but email lib (`src/lib/email.ts`) has zero callers — dead service | Medium |
| Stripe health check code path still present (lines 182-195) | Low |
| Incidents endpoint uses in-memory store — empty on every Vercel cold start | Medium |

### Security
| Issue | Severity |
|-------|----------|
| JWT fallback `'dev-secret-insecure'` if `JWT_SECRET` env var missing | Critical |
| 30-day admin session duration (industry standard: 1-8h) | High |
| `include: { user: true }` in details route leaks `passwordHash` to handler scope | Medium |
| No audit logging for admin actions | Medium |

### Stale Stripe Code
| File | Issue |
|------|-------|
| `src/app/api/webhooks/stripe/route.ts` | Entire 276-line file is dead code |
| `src/app/api/health/route.ts:182-195` | Stripe balance check branch |
| `src/app/api/admin/purchases/route.ts:63` | Returns `stripePaymentIntentId` |
| `src/app/api/admin/purchases/[id]/details/route.ts:57` | Returns `stripePaymentIntentId` |
| `src/app/api/admin/purchases/[id]/refund/route.ts:45` | Defaults to `'stripe'` |
| `src/app/admin/(protected)/compras/page.tsx:36` | Interface has `stripePaymentIntentId` |
| `src/app/api/admin/health/incidents/route.ts:22` | Mock incident references Stripe |
| `prisma/schema.prisma:43` | Default `"stripe"` on paymentProvider |

### UX
| Issue | Count |
|-------|-------|
| `alert()` calls across admin pages | 15+ |
| `confirm()` calls (blocklist delete) | 1 |
| Pages with no error state (health, leads, blocklist) | 3 |
| Duplicated `StatusBadge` component | 2 files |
| Duplicated `formatDate` function | 4 files |
| Duplicated `formatCurrency` function | 2 files |
| `JSON.parse` without try/catch (compras details) | 2 |
| Missing mobile responsiveness | All pages |

---

## Task 1: Probe real API response formats and fix health endpoint

**Priority:** P0 — Health endpoint is broken in production.

**Files:**
- Modify: `src/app/api/health/route.ts`

**Step 1: Probe APIFull balance endpoint**

Run locally (with real API key):
```bash
curl -s -H "Authorization: Bearer $APIFULL_API_KEY" -H "User-Agent: EOPIX/1.0" \
  https://api.apifull.com.br/api/get-balance | jq .
```

Document the response format. Expected something like `{ saldo: "19.00" }` or `{ dados: { balance: 19 } }`.

**Step 2: Probe Serper account endpoint**

```bash
curl -s -H "X-API-KEY: $SERPER_API_KEY" \
  https://google.serper.dev/account | jq .
```

Document the response format. Expected something like `{ credits: 2500 }` or `{ plan: { credits: 2500 } }`.

**Step 3: Probe Inngest status**

Check if Inngest has a status/health API we can call. The Inngest cloud API likely has an endpoint. Alternatively, we can check the Inngest event key by attempting a lightweight API call.

```bash
curl -s -H "Authorization: Bearer $INNGEST_EVENT_KEY" \
  https://inn.gs/e/health-check 2>&1 | head -5
```

Or simply verify the event key is configured (non-empty).

**Step 4: Rewrite health endpoint**

Replace the current checks with correct parsing based on probed formats. Changes:

1. **APIFull**: Fix field parsing to match real response
2. **Serper**: Fix field parsing to match real response
3. **Add Inngest check**: Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` env vars are set. Optionally ping Inngest API.
4. **Remove Brevo check**: `email.ts` has zero callers — dead code. Remove from health checks.
5. **Remove Stripe check branch**: Lines 182-195 are dead code.
6. **Update mock mode**: Remove `brevo` from mock data, add `inngest`.

```ts
// New service list:
// database, apifull (with balance), serper (with credits), openai, inngest, payment (abacatepay)
```

**Step 5: Update admin health page type**

In `src/app/admin/(protected)/health/page.tsx`:
- Fix `HealthData.mode` type: add `'test'` option
- Remove `brevo` from any conditional rendering
- Add `inngest` to service display

**Step 6: Verify build**

```bash
npx tsc --noEmit && npm run lint
```

**Step 7: Commit**

```bash
git add src/app/api/health/route.ts src/app/admin/(protected)/health/page.tsx
git commit -m "fix: health endpoint — correct balance parsing, add Inngest, remove dead services"
```

---

## Task 2: Fix security issues

**Priority:** P0 — JWT fallback is critical.

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/api/admin/purchases/[id]/details/route.ts`

**Step 1: Remove JWT secret fallback**

In `src/lib/auth.ts`, change:
```ts
// BEFORE:
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-insecure'

// AFTER:
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET env var is required')
}
```

**Step 2: Reduce admin session duration**

In `src/lib/auth.ts`, add a separate constant for admin sessions:
```ts
const ADMIN_SESSION_DURATION_HOURS = 8
```

And use it in the admin login route when creating the session. Check how `createSession` is called in `/api/admin/login/route.ts` — it may need an optional `durationDays` parameter.

**Step 3: Fix over-fetching in details route**

In `src/app/api/admin/purchases/[id]/details/route.ts`, change:
```ts
// BEFORE:
include: { user: true }

// AFTER:
include: { user: { select: { email: true, name: true } } }
```

**Step 4: Fix over-fetching in mark-paid route**

In `src/app/api/admin/purchases/[id]/mark-paid/route.ts`, change:
```ts
// BEFORE:
include: { user: true }

// AFTER:
select: { id: true, code: true, status: true, searchResultId: true }
```

The user data is never used in this endpoint.

**Step 5: Verify build**

```bash
npx tsc --noEmit && npm run lint
```

**Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/admin/purchases/[id]/details/route.ts src/app/api/admin/purchases/[id]/mark-paid/route.ts
git commit -m "fix: security — remove JWT fallback, reduce admin session, fix over-fetching"
```

---

## Task 3: Remove stale Stripe code

**Priority:** P1 — Dead code, confusing.

**Files:**
- Delete: `src/app/api/webhooks/stripe/route.ts`
- Modify: `src/app/api/admin/purchases/route.ts`
- Modify: `src/app/api/admin/purchases/[id]/details/route.ts`
- Modify: `src/app/api/admin/purchases/[id]/refund/route.ts`
- Modify: `src/app/admin/(protected)/compras/page.tsx`
- Modify: `src/app/api/admin/health/incidents/route.ts`
- Modify: `src/lib/payment.ts`
- Modify: `prisma/schema.prisma`

**Step 1: Delete Stripe webhook route**

```bash
rm src/app/api/webhooks/stripe/route.ts
```

If the directory is now empty, delete it too.

**Step 2: Remove `stripePaymentIntentId` from admin API responses**

In `purchases/route.ts` and `details/route.ts`: remove `stripePaymentIntentId` from the response object. Keep the Prisma field for now (backward compatibility with old data).

**Step 3: Remove `stripePaymentIntentId` from frontend interface**

In `compras/page.tsx`: remove `stripePaymentIntentId` from the `Purchase` interface.

**Step 4: Fix refund route default provider**

In `refund/route.ts`, change:
```ts
// BEFORE:
(purchase.paymentProvider || 'stripe') as PaymentProvider

// AFTER:
(purchase.paymentProvider || 'abacatepay') as PaymentProvider
```

**Step 5: Fix incidents mock data**

In `incidents/route.ts`: change `'stripe'` reference to `'abacatepay'` in the mock incident.

**Step 6: Remove Stripe import from payment.ts**

In `src/lib/payment.ts`: remove Stripe-specific imports and code paths if they exist. Keep only AbacatePay.

**Step 7: Update Prisma schema default**

In `prisma/schema.prisma`, change:
```prisma
paymentProvider  String?  @default("abacatepay")  // "abacatepay"
```

Create migration:
```bash
npx prisma migrate dev --name update_payment_provider_default --create-only
```

Review the migration SQL — it should only change the default, not alter existing data.

**Step 8: Verify build + run tests**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

**Step 9: Commit**

```bash
git add -A
git commit -m "cleanup: remove all stale Stripe code and references

Deleted webhook handler, removed stripePaymentIntentId from API
responses, fixed default provider to abacatepay, cleaned payment.ts."
```

---

## Task 4: Add toast system and replace alert()/confirm()

**Priority:** P1 — UX is embarrassing with browser alerts.

**Files:**
- Create: `src/app/admin/_components/Toast.tsx`
- Modify: `src/app/admin/(protected)/compras/page.tsx`
- Modify: `src/app/admin/(protected)/blocklist/page.tsx`
- Modify: `src/app/admin/(protected)/leads/page.tsx`

**Step 1: Create Toast component**

Use Radix `@radix-ui/react-toast` (already in dependencies via Radix). Create a simple toast system:

```tsx
// src/app/admin/_components/Toast.tsx
'use client'
import * as RadixToast from '@radix-ui/react-toast'
// ... provider, hook useToast(), Toast component
// Types: success, error, info
```

Export a `useToast()` hook that returns `{ toast, Toaster }`.

**Step 2: Replace alert() in compras page**

Replace all ~11 `alert()` calls with `toast()`:
```ts
// BEFORE:
alert('Compra marcada como paga')

// AFTER:
toast({ type: 'success', message: 'Compra marcada como paga' })
```

Replace error alerts:
```ts
// BEFORE:
alert('Erro ao marcar como paga')

// AFTER:
toast({ type: 'error', message: 'Erro ao marcar como paga' })
```

**Step 3: Replace confirm() in blocklist with Dialog**

The compras page already uses Radix Dialog for confirmations. Reuse the same pattern for blocklist delete.

**Step 4: Replace alert() in blocklist and leads**

Same pattern as Step 2.

**Step 5: Add try/catch around JSON.parse in compras details**

Lines 835 and 851:
```ts
// BEFORE:
JSON.parse(detailsData.purchase.failureDetails)

// AFTER:
try { JSON.parse(detailsData.purchase.failureDetails) } catch { detailsData.purchase.failureDetails }
```

**Step 6: Verify build**

```bash
npx tsc --noEmit && npm run lint
```

**Step 7: Commit**

```bash
git add src/app/admin/
git commit -m "fix: replace alert/confirm with toast system in admin panel

Added Radix Toast component. Replaced 15+ alert() calls with typed
toasts (success/error). Added JSON.parse safety in purchase details."
```

---

## Task 5: Add error states and extract shared components

**Priority:** P2 — Polish.

**Files:**
- Create: `src/app/admin/_components/AdminError.tsx`
- Create: `src/app/admin/_components/StatusBadge.tsx`
- Create: `src/app/admin/_components/admin-utils.ts`
- Modify: all admin pages

**Step 1: Create AdminError component**

Simple error state with retry button:
```tsx
// src/app/admin/_components/AdminError.tsx
interface AdminErrorProps {
  message: string
  onRetry?: () => void
}
```

**Step 2: Add error states to health, leads, blocklist pages**

Currently these pages show nothing on fetch failure. Add the AdminError component.

**Step 3: Extract StatusBadge**

`StatusBadge` is duplicated in `page.tsx` (dashboard) and `compras/page.tsx`. Extract to shared component.

**Step 4: Extract formatDate, formatCurrency to admin-utils.ts**

`formatDate` is duplicated in 4 files, `formatCurrency` in 2. Extract to `admin-utils.ts`.

**Step 5: Import shared components in all pages**

Replace inline definitions with imports.

**Step 6: Fix dashboard retry button styling**

Line 126 of dashboard page: the "Tentar novamente" button has no classes. Add styling.

**Step 7: Verify build**

```bash
npx tsc --noEmit && npm run lint
```

**Step 8: Commit**

```bash
git add src/app/admin/
git commit -m "refactor: extract shared admin components and add error states

StatusBadge, formatDate, formatCurrency extracted. AdminError component
added to health, leads, blocklist pages. Dashboard retry button styled."
```

---

## Task 6: Fix remaining admin issues

**Priority:** P2 — Various cleanup.

**Files:**
- Modify: `src/app/admin/(protected)/compras/page.tsx`
- Modify: `src/app/admin/(protected)/leads/page.tsx`
- Modify: `src/app/api/admin/purchases/[id]/details/route.ts`
- Modify: `src/app/api/admin/blocklist/route.ts`

**Step 1: Remove PROCESSING_STEPS duplication from details route**

In `details/route.ts`, import from `@/types/domain` instead of redefining.

**Step 2: Add Zod validation to blocklist POST**

Replace `as AddBlocklistRequest` with proper Zod schema.

**Step 3: Fix CSV export in leads**

Add proper escaping for commas and quotes in CSV fields.

**Step 4: Fix leads reason filter**

The filter dropdown only offers `API_DOWN` and `MAINTENANCE`. Fetch unique reasons from the API or accept free-text filter.

**Step 5: Fix refund UX for AbacatePay**

In compras page, when provider is `abacatepay`, show a different message on the refund button (e.g., "Reembolso via dashboard AbacatePay") instead of showing a generic error after clicking.

**Step 6: Remove `getRefundMessage` dead cases**

Remove `AUTO_FAILED_PAYMENT` and `AUTO_TIMEOUT` messages (auto-refund cron was removed).

**Step 7: Verify build + tests**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

**Step 8: Commit**

```bash
git add -A
git commit -m "fix: admin cleanup — Zod validation, CSV escape, dedup, refund UX"
```

---

## Task 7: Update docs and deploy

**Step 1: Update status.md**

Add entries for health endpoint fix, security improvements, Stripe cleanup, toast system.

**Step 2: Update TODO.md**

Mark completed items, add any new tech debt discovered.

**Step 3: Commit docs**

```bash
git add docs/status.md TODO.md
git commit -m "docs: update status and TODO with admin panel refactor"
```

**Step 4: Run full E2E**

```bash
npm run test:e2e:mock
```

**Step 5: Deploy**

```bash
git checkout main && git merge develop --ff-only && git checkout develop
git push origin main develop
```

---

## Out of Scope (Future)

These were identified in the audit but are not included in this plan:
- **Mobile responsiveness** (collapsible sidebar, breakpoints) — significant UI work
- **Audit logging** (AdminActionLog table) — needs schema design
- **Admin CRUD via UI** — create/disable admin users
- **Dashboard auto-refresh** — polling interval
- **Date range filters** — needs UI component
- **Keyboard navigation** for action menus
- **Session invalidation** mechanism (revoke tokens server-side)
- **Incidents persistence** (move from in-memory to DB) — the whole incidents feature needs rethinking
