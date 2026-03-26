# Phase 5: PIX Frontend - Research

**Researched:** 2026-03-26
**Domain:** Next.js 14 Client Component — PIX QR Code display, polling, expiry handling
**Confidence:** HIGH

## Summary

Phase 4 delivered the complete PIX backend: `POST /api/purchases/pix` creates a PIX charge and stores `pixBrCode`/`pixBrCodeBase64`/`pixExpiresAt` in the Purchase record; `GET /api/purchases/pix/status?purchaseId=...` polls status (returns PENDING/PAID/EXPIRED from AbacatePay, or COMPLETED/FAILED from DB once Inngest finishes). The frontend only needs to:

1. Call the PIX create endpoint to get `brCode` and `brCodeBase64`
2. Render a QR Code from `brCodeBase64` (already a PNG image in base64) and a copyable `brCode` text
3. Poll the status endpoint every 3 seconds and redirect to `/minhas-consultas` on COMPLETED/PAID
4. Handle EXPIRED state — show a clear message and a "Gerar novo QR Code" button that calls the create endpoint again (backend already handles re-creation idempotently for PENDING purchases with no existing charge)

The `brCodeBase64` from AbacatePay's `v1/pixQrCode/create` is a PNG QR Code image already encoded as a base64 data URL. No QR Code generation library is needed — render it with `<img src={brCodeBase64} />`.

**Primary recommendation:** Build a single `PixCheckout` client component. No new libraries needed. Use `setInterval` for polling (clearInterval on unmount/redirect). Display `brCodeBase64` as an `<img>` tag. The "new QR Code" action calls the same create endpoint — the backend returns the existing charge on refresh and only creates a new one when the old charge is absent or expired.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIX-02 | Página faz polling automático a cada 3 segundos e redireciona para `/minhas-consultas` quando pagamento confirmado | `GET /api/purchases/pix/status` returns `{ status }` — poll on interval, redirect when status is `PAID` or `COMPLETED` |
| PIX-03 | PIX expirado mostra mensagem clara com opção de gerar novo QR Code | Status endpoint returns `EXPIRED`; create endpoint (`POST /api/purchases/pix`) accepts the same `purchaseId` and will create a fresh charge (old `paymentExternalId`/`pixBrCode` are overwritten in DB) |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (built-in) | 18 | useState/useEffect for polling state machine | Already in project |
| Next.js App Router (built-in) | 14 | `useRouter` for redirect, `"use client"` component | Already in project |
| Tailwind CSS (built-in) | in project | Styling | Already in project |

### No Additional Libraries Required

`brCodeBase64` from AbacatePay is already a complete PNG QR Code image in base64 format. Rendering it is `<img src={brCodeBase64} alt="QR Code PIX" />`. No `qrcode`, `react-qr-code`, or `qrcode.react` library is needed.

The copy-to-clipboard action uses the built-in `navigator.clipboard.writeText(brCode)` Web API.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `<img src={brCodeBase64}>` | `react-qr-code` or `qrcode.react` | Would add a dependency and require generating QR from `brCode` string — unnecessary since AbacatePay already provides the rendered PNG |
| `setInterval` polling | SSE / WebSocket | Overkill for a single-user payment screen; 3-second poll adds minimal load |

## Architecture Patterns

### Recommended Approach: New Page at `/compra/pix`

The existing `/compra/confirmacao` page is for the AbacatePay hosted checkout flow (redirect-based). The PIX flow is a different UX mode: user stays on EOPIX, sees QR code, and waits. A separate page keeps concerns clean.

**Entry point:** The `consulta/[term]/page.tsx` create-purchase flow needs to detect when a purchase is created and route to `/compra/pix?purchaseId=<id>` for the inline PIX checkout.

**Alternative:** Integrate as a state within the existing `/compra/confirmacao` page — add a `pix_pending` PageState. This avoids a new route but increases complexity of an already-complex page. Recommended: new page for clarity.

### Recommended Project Structure

```
src/app/compra/pix/
└── page.tsx           # PIX checkout page ("use client")

src/components/
└── PixCheckout.tsx    # QR code display + polling + copy + expiry (reusable)
```

### Pattern: PIX State Machine

```typescript
type PixState =
  | 'loading'      // Calling POST /api/purchases/pix to get brCode
  | 'waiting'      // QR code shown, polling every 3s
  | 'expired'      // Status returned EXPIRED — show renewal option
  | 'paid'         // Status PAID or COMPLETED — redirect
  | 'error'        // Unexpected error
```

### Pattern: Polling with useEffect + setInterval

```typescript
// Source: standard React pattern
React.useEffect(() => {
  if (pixState !== 'waiting') return
  const interval = setInterval(async () => {
    const res = await fetch(`/api/purchases/pix/status?purchaseId=${purchaseId}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.status === 'PAID' || data.status === 'COMPLETED') {
      setPixState('paid')
      router.push('/minhas-consultas')
    } else if (data.status === 'EXPIRED') {
      setPixState('expired')
    }
  }, 3000)
  return () => clearInterval(interval)
}, [pixState, purchaseId])
```

### Pattern: Expiry Countdown

Display a live countdown timer using `pixExpiresAt` from the API response. Use `setInterval` (1-second tick) to decrement. When it reaches zero, transition to `expired` state immediately without waiting for the next poll.

```typescript
// pixExpiresAt is an ISO string from the API
const secondsLeft = Math.max(0, Math.floor((new Date(pixExpiresAt).getTime() - Date.now()) / 1000))
```

### Pattern: QR Code Rendering

```typescript
// brCodeBase64 from AbacatePay is already a PNG base64 data URL
<img
  src={pixData.brCodeBase64}
  alt="QR Code PIX"
  width={200}
  height={200}
  className="pix__qr-img"
/>
```

### Pattern: Copy to Clipboard

```typescript
const [copied, setCopied] = React.useState(false)
async function handleCopy() {
  await navigator.clipboard.writeText(brCode)
  setCopied(true)
  setTimeout(() => setCopied(false), 2000)
}
```

### Pattern: Generate New QR Code (Expiry Recovery)

When `EXPIRED`, call `POST /api/purchases/pix` again with the same `purchaseId`. The backend will:
1. Detect that `purchase.status` is still `PENDING` (it is — the webhook `transparent.completed` has not fired)
2. Create a new PIX charge (previous `pixBrCode` is overwritten)
3. Return new `brCode`/`brCodeBase64`/`expiresAt`

The frontend transitions back to `waiting` state with the new QR data.

### Anti-Patterns to Avoid

- **Polling when not in `waiting` state:** Always guard the setInterval with the current state. Clear the interval on state transitions to avoid duplicate intervals.
- **Not handling 401:** The status endpoint requires auth. If the session expires, handle gracefully (show error, redirect to login).
- **Leaving interval running after redirect:** `router.push` does not unmount immediately in Next.js App Router. Set state to `paid` first (stops the interval via the effect guard), then redirect.
- **Generating QR from `brCode` string:** The `brCodeBase64` PNG is already provided — do not add a QR library.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR code image | Canvas/SVG QR generator | `<img src={brCodeBase64}>` | AbacatePay already returns the rendered PNG in base64 |
| Clipboard | Custom execCommand | `navigator.clipboard.writeText()` | Native Web API, supported in all modern browsers |
| PIX status polling | WebSocket / SSE | `setInterval` 3s | Simple and sufficient; server-sent events add infrastructure complexity for a transient payment screen |

## Common Pitfalls

### Pitfall 1: Interval Not Cleaned Up on Redirect
**What goes wrong:** `router.push()` navigates away, but the component does not unmount instantly. The interval fires additional fetch calls.
**Why it happens:** Next.js App Router navigation keeps the component mounted during transition.
**How to avoid:** Set `pixState` to `'paid'` before calling `router.push()`. The `useEffect` dependency on `pixState` clears the interval because `pixState !== 'waiting'`.

### Pitfall 2: Purchase Not in PENDING When Calling PIX Create
**What goes wrong:** User navigates back to the page after the purchase is already COMPLETED or PAID. `POST /api/purchases/pix` returns 400 (`Purchase is not PENDING`).
**Why it happens:** The backend correctly rejects non-PENDING purchases.
**How to avoid:** On load, call the status endpoint first. If status is already COMPLETED, redirect to `/minhas-consultas` directly. Only call the create endpoint if status is PENDING.

### Pitfall 3: `brCodeBase64` Is Not a Standard Data URL in All Environments
**What goes wrong:** In MOCK_MODE, `brCodeBase64` is `'data:image/png;base64,BYPASS'` — an invalid image that renders broken.
**Why it happens:** The bypass mock in `abacatepay.ts` returns a placeholder.
**How to avoid:** In the component, check if `brCodeBase64.startsWith('data:image/png;base64,BYPASS')` and render a placeholder/grey box instead.

### Pitfall 4: Showing Expired UI Before the User Sees the QR
**What goes wrong:** If the component loads slow (network delay on create endpoint) and `pixExpiresAt` is already in the past, user briefly sees QR then immediately sees expired state.
**How to avoid:** Check expiry time when transitioning to `waiting` state. If `secondsLeft <= 0` on load, go directly to `expired`.

### Pitfall 5: `purchaseId` vs `purchaseCode`
**What goes wrong:** The existing flow in `consulta/[term]/page.tsx` uses `purchase.code` for URLs (e.g., `/compra/confirmacao?code=ABC123`). The PIX API endpoints use `purchaseId` (the DB UUID, not the short code).
**Why it happens:** Two different identifiers exist: `purchase.id` (UUID) and `purchase.code` (short human-readable code).
**How to avoid:** Pass `purchaseId` (UUID) as the query param to the PIX page. The status endpoint already uses `purchaseId`.

## Code Examples

### Full PixCheckout Component Skeleton

```typescript
// Source: pattern derived from existing ProcessingTracker + confirmacao/page.tsx patterns
"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

type PixState = 'loading' | 'waiting' | 'expired' | 'paid' | 'error'

interface PixData {
  pixId: string
  brCode: string
  brCodeBase64: string
  expiresAt: string
}

export default function PixCheckout({ purchaseId }: { purchaseId: string }) {
  const router = useRouter()
  const [pixState, setPixState] = React.useState<PixState>('loading')
  const [pixData, setPixData] = React.useState<PixData | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [secondsLeft, setSecondsLeft] = React.useState(0)

  // Load or create PIX charge on mount
  React.useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/purchases/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchaseId }),
        })
        if (!res.ok) {
          setPixState('error')
          return
        }
        const data: PixData = await res.json()
        const sLeft = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
        if (sLeft <= 0) {
          setPixState('expired')
          return
        }
        setPixData(data)
        setSecondsLeft(sLeft)
        setPixState('waiting')
      } catch {
        setPixState('error')
      }
    }
    init()
  }, [purchaseId])

  // Countdown timer
  React.useEffect(() => {
    if (pixState !== 'waiting') return
    const tick = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setPixState('expired')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [pixState])

  // Status polling every 3s
  React.useEffect(() => {
    if (pixState !== 'waiting') return
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/purchases/pix/status?purchaseId=${purchaseId}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'PAID' || data.status === 'COMPLETED') {
          setPixState('paid')
          router.push('/minhas-consultas')
        } else if (data.status === 'EXPIRED') {
          setPixState('expired')
        }
      } catch {
        // silent — next poll will retry
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [pixState, purchaseId, router])

  async function handleCopy() {
    if (!pixData) return
    await navigator.clipboard.writeText(pixData.brCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRenew() {
    setPixState('loading')
    setPixData(null)
    // Re-call create endpoint — backend overwrites expired charge
    // (re-triggers the init useEffect via state, or call init() directly)
  }

  // Render based on pixState...
}
```

### Entry Point: Routing from consulta/[term]/page.tsx

```typescript
// After POST /api/purchases returns { purchaseId, ... }
// Instead of redirecting to /compra/confirmacao?code=...
// Route to PIX page:
router.push(`/compra/pix?purchaseId=${purchaseId}`)
```

### Brutalist EOPIX Styling Notes

Following existing design system (black borders, yellow/black, bold monospace):
- QR code wrapped in a bordered box: `border-2 border-black p-4`
- Copy button: same brutalist style as existing buttons in `RegisterModal.tsx` / `consulta` page
- Countdown shown as `MM:SS` in monospace
- Status messages in uppercase

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Generate QR from string client-side | Server returns base64 PNG | No library needed |
| WebSocket for payment confirmation | setInterval polling | Simpler, sufficient for single-user payment screen |

## Open Questions

1. **Entry point: new page or new state in confirmacao?**
   - What we know: `/compra/confirmacao` already handles `cancelled`, `approved`, `completed` states
   - What's unclear: adding `pix_pending` state is possible but makes that page more complex
   - Recommendation: new `/compra/pix` page — cleaner separation, PIX has unique UX (QR + countdown)

2. **What happens after PAID status — before COMPLETED?**
   - What we know: After PIX payment, webhook fires `transparent.completed` → Purchase becomes PAID → Inngest processes → COMPLETED
   - What's unclear: The status endpoint returns `PAID` from AbacatePay, but the DB still shows `PENDING` until the webhook updates it
   - Recommendation: Redirect to `/minhas-consultas` on either `PAID` (from AbacatePay) or `COMPLETED` (from DB). The existing `/minhas-consultas` page handles `PROCESSING` and `COMPLETED` states with its own polling — user lands there and processing tracker takes over.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — purely frontend code/components using existing API routes)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + Testing Library (React) |
| Config file | `vitest.config.ts` (inferred from existing `npx vitest run` command) |
| Quick run command | `npx vitest run --reporter=verbose src/components/PixCheckout` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIX-02 | Polling redirects on PAID/COMPLETED | unit (mock fetch + router) | `npx vitest run src/components/PixCheckout.test.tsx` | Wave 0 |
| PIX-03 | EXPIRED state shows renewal UI | unit (mock fetch returning EXPIRED) | `npx vitest run src/components/PixCheckout.test.tsx` | Wave 0 |

### Wave 0 Gaps

- [ ] `src/components/PixCheckout.test.tsx` — covers PIX-02 (polling redirect) and PIX-03 (expiry + renewal)

## Sources

### Primary (HIGH confidence)

- `src/app/api/purchases/pix/route.ts` — confirmed API contract (purchaseId, returns brCode/brCodeBase64/expiresAt)
- `src/app/api/purchases/pix/status/route.ts` — confirmed status response shape (status, expiresAt)
- `src/lib/abacatepay.ts` — confirmed brCodeBase64 is `data:image/png;base64,...` from AbacatePay
- Existing codebase patterns (ProcessingTracker, confirmacao/page.tsx) — polling and state machine patterns

### Secondary (MEDIUM confidence)

- AbacatePay docs condensed (`docs/external/abacatepay/api-v2-condensed.md`) — confirms v1 pixQrCode endpoint returns brCode + brCodeBase64
- REQUIREMENTS.md — PIX-02, PIX-03 requirements verified

## Project Constraints (from CLAUDE.md)

- Work on `develop` branch — NEVER commit to `main`
- Prefer Server Components; `"use client"` only for interactivity — PIX checkout requires client (polling, clipboard, countdown timers)
- Server-side validations with Zod — already done in the API routes (Phase 4)
- After editing: update `docs/status.md` and mark tasks
- After altering product flow: update spec in `docs/specs/purchase-flow.md`
- Source of truth for APIs: `@docs/api-contracts/` — no new API contracts needed for this phase
- Central types: `@src/types/report.ts` and `@src/types/domain.ts` — new PixState types can live in the component or in `domain.ts`
- Bug fix not complete until verified working (vitest + Chrome MCP if UI)
- Run `npm run lint && npx vitest run` before committing

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new libraries, all APIs confirmed in code
- Architecture: HIGH — backend is fully implemented, frontend patterns are direct extensions of existing code
- Pitfalls: HIGH — derived from actual code inspection of backend and existing client components

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (AbacatePay API contract stable; Next.js 14 patterns stable)
