---
phase: 05-pix-frontend
plan: 01
subsystem: ui
tags: [pix, qr-code, checkout, polling, countdown, abacatepay, react]

# Dependency graph
requires:
  - phase: 04-pix-backend
    provides: POST /api/purchases/pix and GET /api/purchases/pix/status endpoints
provides:
  - PIX inline checkout page at /compra/pix with QR Code display
  - PixCheckout component with 5-state machine (loading/waiting/expired/paid/error)
  - purchaseId UUID in all POST /api/purchases success responses
  - Redirect from consulta page to /compra/pix instead of AbacatePay hosted checkout
affects: [05-02, testing, e2e]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PixState machine pattern: loading → waiting → expired/paid/error, renewKey counter re-triggers init effect
    - Dual interval pattern: 1s countdown + 3s status polling coexist via separate useEffects with pixState guards
    - eslint-disable for @next/next/no-img-element on base64 QR Code img element

key-files:
  created:
    - src/components/PixCheckout.tsx
    - src/app/compra/pix/page.tsx
    - src/app/compra/pix/PixCheckoutWrapper.tsx
  modified:
    - src/app/api/purchases/route.ts
    - src/app/consulta/[term]/page.tsx
    - src/styles/components.css

key-decisions:
  - "purchaseId UUID added to all 3 purchase route responses (reuse/bypass/live) for PIX API compatibility"
  - "Replaced window.location.href AbacatePay redirect with router.push to /compra/pix inline checkout"
  - "eslint-disable for no-img-element: base64 data URI QR codes do not benefit from Next.js Image optimization"
  - "renewKey counter state re-triggers init useEffect on expired/error retry without unmounting component"

patterns-established:
  - "PIX state machine: 5 states handled in separate render branches per state"
  - "Dual setInterval pattern: countdown (1s) and polling (3s) each in own useEffect with pixState guard"

requirements-completed: [PIX-01, PIX-02, PIX-03]

# Metrics
duration: 12min
completed: 2026-03-27
---

# Phase 05 Plan 01: PIX Frontend Checkout Summary

**PIX inline checkout via QR Code at /compra/pix — 5-state machine with 3s polling, MM:SS countdown, expiry renewal, and consulta page wired to skip AbacatePay redirect**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-27T17:16:04Z
- **Completed:** 2026-03-27T17:28:00Z
- **Tasks:** 2
- **Files modified:** 5 (2 created new dirs + 3 new files + 2 modified)

## Accomplishments
- PixCheckout component: full 5-state machine with QR Code display, 1s countdown (red at <=60s), 3s status polling with auto-redirect to /minhas-consultas on PAID/COMPLETED, PIX code copy button, expired state with renewal
- /compra/pix page with Suspense wrapper and PixCheckoutWrapper reading purchaseId from useSearchParams
- POST /api/purchases now returns `purchaseId` in all 3 success response paths; consulta page redirects to /compra/pix instead of AbacatePay hosted checkout
- Mock mode QR placeholder: detects BYPASS in brCodeBase64, shows grey dashed box instead of img

## Task Commits

Each task was committed atomically:

1. **Task 1: Add purchaseId to purchases route response and redirect to PIX page** - `9d46d04` (feat)
2. **Task 2: Create PixCheckout component and /compra/pix page with PIX CSS** - `a6058c9` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/components/PixCheckout.tsx` - PIX checkout state machine component (loading/waiting/expired/paid/error)
- `src/app/compra/pix/page.tsx` - Server page with metadata "Pague com PIX — EOPIX"
- `src/app/compra/pix/PixCheckoutWrapper.tsx` - Client wrapper reading purchaseId from useSearchParams
- `src/app/api/purchases/route.ts` - Added purchaseId to 3 NextResponse.json success paths
- `src/app/consulta/[term]/page.tsx` - Changed redirect to router.push /compra/pix?purchaseId=UUID
- `src/styles/components.css` - Appended PIX CSS block (pix-page, pix-badge, pix-qr-card, pix-countdown--urgent, pix-expired-callout, pix-error-callout, pix-code-block, pix-trust, pix-paid-msg)

## Decisions Made
- Used `renewKey` counter state to re-trigger init `useEffect` on expired/error retry — avoids duplicating init logic or unmounting/remounting the component
- Added `eslint-disable @next/next/no-img-element` at file level: base64 QR Code data URIs bypass Next.js image optimization anyway, and the plan explicitly specified `<img>` with `image-rendering: pixelated`
- purchaseId UUID is what PIX API endpoints require (per RESEARCH.md Pitfall 5 — D-04); the short code is not accepted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added eslint-disable for no-img-element on QR img**
- **Found during:** Task 2 (PixCheckout component)
- **Issue:** `npm run lint` failed with warning-as-error on `<img>` element in JSX, blocking clean lint
- **Fix:** Added `/* eslint-disable @next/next/no-img-element */` at file top (base64 data URIs not eligible for Next.js Image optimization)
- **Files modified:** src/components/PixCheckout.tsx
- **Verification:** `npm run lint` passes with no warnings or errors
- **Committed in:** a6058c9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical / blocking lint issue)
**Impact on plan:** Minor lint fix, no functional scope change.

## Issues Encountered
- ESLint-disable-next-line syntax does not work inside JSX expressions (parsing error). File-level eslint-disable comment used instead.

## Known Stubs
None — QR Code data is real from AbacatePay API in live mode; mock mode shows explicit placeholder div with "QR Code (Mock)" text.

## Next Phase Readiness
- PIX checkout frontend complete; /compra/pix page live and wired from consulta
- Phase 05-02 can proceed (if it exists) or phase is complete
- E2E tests will need to be updated to handle /compra/pix redirect (previously went to AbacatePay or /compra/confirmacao)

---
*Phase: 05-pix-frontend*
*Completed: 2026-03-27*
