---
phase: 04-pix-backend
plan: 01
subsystem: payments
tags: [pix, abacatepay, webhook, prisma, tdd]
dependency_graph:
  requires: []
  provides: [pix-backend, pix-routes, transparent-webhook]
  affects: [purchase-flow, abacatepay-lib, webhook-handler]
tech_stack:
  added: []
  patterns: [tdd, prisma-migration, route-handler, webhook-extension]
key_files:
  created:
    - src/lib/abacatepay.ts (extended)
    - src/app/api/purchases/pix/route.ts
    - src/app/api/purchases/pix/status/route.ts
    - src/app/api/webhooks/abacatepay/route.ts (extended)
    - prisma/migrations/20260326032804_add_pix_fields/migration.sql
    - tests/lib/abacatepay-pix.test.ts
    - tests/unit/webhook-transparent.test.ts
    - tests/unit/pix-route.test.ts
    - docs/api-contracts/pix-transparent.md
  modified:
    - prisma/schema.prisma
    - docs/specs/purchase-flow.md
    - docs/status.md
decisions:
  - Use /v1/pixQrCode/* endpoints (not /v2/transparents/*) — v1 paths verified in AbacatePay API reference
  - Store pixBrCode/pixBrCodeBase64 in Purchase DB — status check endpoint does not return brCode
  - Separate idempotency key namespace abacate:transparent:<pixId> vs abacate:payment:<checkoutId>
  - Reuse existing PIX charge on page refresh (check paymentExternalId.startsWith("pix_") + pixBrCode)
  - Use getSessionWithUser() (not getSession()) for userId in PIX routes
metrics:
  duration_minutes: 30
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 11
requirements: [PIX-01, PIX-04]
---

# Phase 04 Plan 01: PIX Transparent Checkout Backend Summary

**One-liner:** PIX QR Code backend via AbacatePay v1/pixQrCode API with DB storage, polling routes, and webhook transparent.completed handling.

## What Was Built

### Task 1: PIX lib functions + Prisma migration + unit tests

Added three new functions to `src/lib/abacatepay.ts`:

- **`createPixCharge(params)`** — calls `POST /v1/pixQrCode/create`, returns `{ pixId, brCode, brCodeBase64, expiresAt, status }`. Bypass mode returns mock data (`pix_bypass_*`) without calling AbacatePay.
- **`checkPixStatus(pixId)`** — calls `GET /v1/pixQrCode/check?id=...`, returns `{ status, expiresAt }`.
- **`simulatePixPayment(pixId)`** — calls `POST /v1/pixQrCode/simulate-payment?id=...` (dev/sandbox only).

Prisma migration `add_pix_fields` adds three nullable columns to `Purchase`:
- `pixBrCode TEXT` — PIX copia-e-cola string
- `pixBrCodeBase64 TEXT` — QR code as base64 PNG
- `pixExpiresAt TIMESTAMP` — charge expiry

8 unit tests in `tests/lib/abacatepay-pix.test.ts` cover: correct URL/method/headers/body, bypass mock, error handling.

**Commits:** `60dd308`

### Task 2: PIX API routes + webhook extension + tests + docs

**`POST /api/purchases/pix`** (`src/app/api/purchases/pix/route.ts`):
- Requires authenticated session (`getSessionWithUser`)
- Zod validates `{ purchaseId: string }`
- Finds PENDING purchase owned by user — 404 if not found, 400 if not PENDING
- Reuses existing PIX charge if `paymentExternalId` starts with `pix_` and `pixBrCode` exists
- Calls `createPixCharge()`, updates Purchase with pixId/brCode/brCodeBase64/pixExpiresAt
- Returns `{ pixId, brCode, brCodeBase64, expiresAt }`

**`GET /api/purchases/pix/status`** (`src/app/api/purchases/pix/status/route.ts`):
- Returns DB status directly for COMPLETED/FAILED (no AbacatePay call)
- Calls `checkPixStatus()` for PENDING purchases with PIX charge id
- Returns `{ status, expiresAt }`

**Webhook extension** (`src/app/api/webhooks/abacatepay/route.ts`):
- Added `transparent.completed` to `isPaymentEvent` check
- Extended `AbacateWebhookEvent.data` interface with `transparent` field
- Purchase code resolution: primary via `metadata.externalId`, fallback via `paymentExternalId` DB lookup
- Idempotency key: `abacate:transparent:<pixId>` (separate namespace from checkout)
- Existing `handlePaymentSuccess()` reused for PAID transition + Inngest trigger

**Tests:** 5 tests for pix-route (401/404/400/200/reuse), 5 for webhook-transparent (PAID/duplicate/metadata/fallback/ignore-other-events)

**Docs:** `docs/api-contracts/pix-transparent.md` created, `docs/specs/purchase-flow.md` and `docs/status.md` updated.

**Commits:** `7953217`

## Verification Results

- `npx vitest run` — 142/142 tests passed (16 test files)
- `npx tsc --noEmit` — clean
- `npm run lint` — no warnings or errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Use getSessionWithUser instead of getSession**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `getSession()` returns `SessionPayload` which does not have `userId`. Plan said to use `getSession` but the codebase provides `getSessionWithUser()` which resolves the user from DB and includes `userId`.
- **Fix:** Both routes use `getSessionWithUser()`. Test mocks updated to mock `getSessionWithUser`.
- **Files modified:** `src/app/api/purchases/pix/route.ts`, `src/app/api/purchases/pix/status/route.ts`, `tests/unit/pix-route.test.ts`
- **Commit:** included in `7953217`

**2. [Rule 3 - Blocking issue] Prisma client regeneration after schema change**
- **Found during:** Task 2 (TypeScript check after Task 1 migration)
- **Issue:** TypeScript reported `pixBrCode`, `pixBrCodeBase64`, `pixExpiresAt` as unknown properties — Prisma client was stale and needed regenerating after the new migration.
- **Fix:** Ran `npx prisma generate` to regenerate the Prisma client with updated schema types.
- **Impact:** No code changes needed.

## Known Stubs

None — all PIX backend functionality is fully wired. Phase 5 (frontend) will consume the routes.

## Self-Check: PASSED

Files verified:
- `src/app/api/purchases/pix/route.ts` — FOUND
- `src/app/api/purchases/pix/status/route.ts` — FOUND
- `src/lib/abacatepay.ts` (createPixCharge) — FOUND
- `docs/api-contracts/pix-transparent.md` — FOUND
- `prisma/migrations/20260326032804_add_pix_fields/migration.sql` — FOUND

Commits verified:
- `60dd308` — feat(04-01): PIX lib functions + Prisma migration + unit tests — FOUND
- `7953217` — feat(04-01): PIX API routes + webhook extension + tests + docs — FOUND
