---
phase: 02-sentry-com-contexto
plan: 01
subsystem: observability
tags: [sentry, error-monitoring, lgpd, inngest, webhook, purchases, admin]
dependency_graph:
  requires: []
  provides: [sentry-structured-context]
  affects: [src/lib/inngest/process-search.ts, src/app/api/webhooks/abacatepay/route.ts, src/app/api/purchases/route.ts, src/app/api/admin/purchases/[id]/process/route.ts]
tech_stack:
  added: []
  patterns: [Sentry.withScope for isolated context per error, pipeline vs infra error bifurcation]
key_files:
  created:
    - tests/unit/sentry-context.test.ts
  modified:
    - src/lib/inngest/process-search.ts
    - src/app/api/webhooks/abacatepay/route.ts
    - src/app/api/purchases/route.ts
    - src/app/api/admin/purchases/[id]/process/route.ts
decisions:
  - "Used Sentry.withScope (not captureException extras) for per-error scope isolation"
  - "Pipeline vs infra bifurcation via error.message.includes('INSUFFICIENT_API_BALANCE')"
  - "purchaseCode hoisted before try in webhook handler to be accessible in catch"
  - "Session and purchase variables hoisted before try in purchases/route.ts"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_modified: 5
requirements: [OBS-02, OBS-04]
---

# Phase 02 Plan 01: Sentry Structured Context Summary

**One-liner:** Structured Sentry context at 5 pipeline/webhook/admin error points with purchase_code tags and LGPD-safe data (no CPF/CNPJ).

## What Was Built

Added `Sentry.withScope()` instrumentation to 5 critical error capture points so every Sentry error includes enough context (purchase_code, pipeline_step, document_type, userId, error_category) to identify the affected purchase without opening another system.

### Instrumentation Points

| Point | File | Tags |
|-------|------|------|
| 1 | process-search.ts (pipeline error) | error_category=pipeline, purchase_code, pipeline_step, document_type, userId |
| 2 | process-search.ts (balance error) | error_category=infra, infra_type=apifull_balance, detail |
| 3 | webhooks/abacatepay/route.ts | error_category=pipeline, purchase_code (or 'unknown') |
| 4 | purchases/route.ts outer catch | error_category=pipeline, purchase_code, document_type, userId |
| 5 | admin/purchases/[id]/process/route.ts | error_category=infra, infra_type=inngest_unreachable, purchase_code, detail |

### Design Decisions

1. **Sentry.withScope** chosen over `captureException(error, { extra })` — withScope provides proper scope isolation preventing tag bleed between concurrent errors in serverless functions.

2. **Pipeline vs infra bifurcation** in process-search.ts: checks `error.message?.includes('INSUFFICIENT_API_BALANCE')`. If YES → `error_category=infra` (systemic, not per-purchase). If NO → `error_category=pipeline` (per-purchase, needs investigation).

3. **Variable hoisting**: `purchaseCode` in webhook handler and `session`/`purchase`/`cleanedTerm` in purchases/route.ts were hoisted before the `try` block so they survive into catch scope. This was the key structural change needed.

4. **LGPD D-04 compliance**: No CPF/CNPJ raw digits (the `term` variable) are ever passed to any Sentry field. Only `purchase_code` (opaque 6-char alphanumeric) is used for lookup, which maps to a purchase in the admin panel.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (TDD RED) | Create Sentry context unit tests | 770e3fe | tests/unit/sentry-context.test.ts |
| 2 (GREEN) | Instrument 5 Sentry capture points | 9aa3114 | 4 source files + test fix |

## Verification Results

- `npx vitest run tests/unit/sentry-context.test.ts` — 8 tests PASS
- `npx vitest run` — 116 tests PASS (no regressions)
- `npx tsc --noEmit` — CLEAN
- `npm run lint` — No ESLint warnings or errors
- `grep -c "Sentry.withScope"` — 2 in process-search, 1 in webhook, 1 in purchases, 1 in admin/process
- LGPD: `grep -rn "setTag.*term|setExtra.*term"` — NO matches

## Deviations from Plan

None — plan executed exactly as written. The test structure (testing contract/structure via direct Sentry mock calls rather than end-to-end through Inngest step.run) was anticipated by the plan's NOTE in Task 1.

## Known Stubs

None — all 5 instrumentation points are fully wired. Sentry SDK calls are no-op when DSN is absent (per D-07).

## Pending Manual Action (OBS-04)

User must configure `NEXT_PUBLIC_SENTRY_DSN` on Vercel (from sentry.io project settings) and trigger a test error to confirm errors appear in Sentry dashboard with correct tags. This is documented as a blocker in STATE.md.

## Self-Check: PASSED

- tests/unit/sentry-context.test.ts: FOUND
- src/lib/inngest/process-search.ts: FOUND
- Commits 770e3fe and 9aa3114: VERIFIED
