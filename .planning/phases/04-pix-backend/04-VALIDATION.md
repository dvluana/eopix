# Phase 04: PIX Backend — Validation

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.ts (root) |
| Quick run command | `npx vitest run tests/lib/abacatepay-pix.test.ts tests/unit/webhook-transparent.test.ts` |
| Full suite command | `npx vitest run` |

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIX-01 | `createPixCharge` builds correct request body, returns brCode/brCodeBase64 | unit | `npx vitest run tests/lib/abacatepay-pix.test.ts` | No (Wave 0) |
| PIX-01 | `checkPixStatus` calls correct endpoint, maps status values | unit | `npx vitest run tests/lib/abacatepay-pix.test.ts` | No (Wave 0) |
| PIX-01 | `POST /api/purchases/pix` returns 401 without auth, 200 with valid purchase | unit | `npx vitest run tests/unit/pix-route.test.ts` | No (Wave 0) |
| PIX-04 | Webhook `transparent.completed` advances purchase to PAID, triggers Inngest | unit | `npx vitest run tests/unit/webhook-transparent.test.ts` | No (Wave 0) |
| PIX-04 | Webhook ignores `transparent.completed` duplicate (idempotency) | unit | `npx vitest run tests/unit/webhook-transparent.test.ts` | No (Wave 0) |

## Sampling Rate

- **Per task commit:** `npx vitest run tests/lib/abacatepay-pix.test.ts tests/unit/webhook-transparent.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `npx tsc --noEmit` + `npm run lint` before `/gsd:verify-work`

## Wave 0 Gaps

- [ ] `tests/lib/abacatepay-pix.test.ts` — unit tests for `createPixCharge`, `checkPixStatus`, `simulatePixPayment` (mock fetch)
- [ ] `tests/unit/pix-route.test.ts` — route handler tests (optional, may be covered by integration)
- [ ] `tests/unit/webhook-transparent.test.ts` — transparent.completed webhook processing

Pattern references: `tests/lib/purchase-workflow.test.ts`, `tests/unit/sentry-context.test.ts`
