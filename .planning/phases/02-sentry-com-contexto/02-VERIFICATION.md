---
phase: 02-sentry-com-contexto
verified: 2026-03-25T22:40:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Configure NEXT_PUBLIC_SENTRY_DSN on Vercel (sentry.io -> Project Settings -> Client Keys), then trigger a test pipeline error via admin panel reprocess on a FAILED purchase"
    expected: "Error appears in Sentry dashboard with tags: error_category=pipeline, purchase_code=<code>, pipeline_step, document_type; user set with userId"
    why_human: "Requires live Sentry project with real DSN and a Vercel deployment; cannot verify SDK integration against real external service programmatically"
  - test: "Trigger an inngest_unreachable scenario in production (admin process with Inngest dev server offline) and check Sentry"
    expected: "Error tagged error_category=infra, infra_type=inngest_unreachable, purchase_code=<code>"
    why_human: "Requires production environment and deliberate infra failure"
---

# Phase 02: Sentry com Contexto Verification Report

**Phase Goal:** Cada erro capturado pelo Sentry inclui contexto suficiente para identificar a compra afetada sem abrir outro sistema
**Verified:** 2026-03-25T22:40:00Z
**Status:** human_needed — all automated checks pass; DSN configuration requires human action
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Pipeline errors in Sentry include purchase_code, pipeline_step, document_type, userId | ✓ VERIFIED | process-search.ts lines 413-422: setUser(userId), setTag purchase_code/pipeline_step/document_type |
| 2 | Webhook errors in Sentry include purchase_code when available | ✓ VERIFIED | webhooks/abacatepay/route.ts line 161-165: setTag purchase_code (or 'unknown') |
| 3 | Systemic errors (INSUFFICIENT_API_BALANCE, inngest_unreachable) tagged error_category:infra | ✓ VERIFIED | process-search.ts lines 405-410 (apifull_balance); admin/process/route.ts lines 90-96 (inngest_unreachable) |
| 4 | No CPF/CNPJ data leaks into Sentry (LGPD) | ✓ VERIFIED | grep "setTag.*term\|setExtra.*term" across all 4 files returns NO matches |
| 5 | Sentry calls are no-op when DSN is absent | ✓ VERIFIED | @sentry/nextjs SDK is no-op without init per D-07; no guards needed and none present |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/unit/sentry-context.test.ts` | Unit tests verifying Sentry context at all 5 points (min 80 lines) | ✓ VERIFIED | 415 lines; 8 tests pass |
| `src/lib/inngest/process-search.ts` | Sentry.withScope in catch block with pipeline/infra bifurcation | ✓ VERIFIED | Lines 405-423: bifurcation on INSUFFICIENT_API_BALANCE; 2 withScope calls |
| `src/app/api/webhooks/abacatepay/route.ts` | Sentry.withScope in POST catch block | ✓ VERIFIED | Line 161 |
| `src/app/api/purchases/route.ts` | Sentry.withScope in outer catch block | ✓ VERIFIED | Line 361 |
| `src/app/api/admin/purchases/[id]/process/route.ts` | Sentry.withScope in else block (prod inngest.send failure) | ✓ VERIFIED | Line 90 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| process-search.ts | @sentry/nextjs | import * as Sentry + withScope in catch | ✓ WIRED | Line 1: import; lines 405 + 413: withScope |
| webhooks/abacatepay/route.ts | @sentry/nextjs | import * as Sentry + withScope in catch | ✓ WIRED | withScope confirmed at line 161 |

### Data-Flow Trace (Level 4)

Not applicable — this phase instruments error-capture paths, not data rendering. No dynamic data rendering artifacts to trace.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 8 Sentry context unit tests pass | npx vitest run tests/unit/sentry-context.test.ts | 8 passed, 183ms | ✓ PASS |
| No CPF/CNPJ leaks in instrumented files | grep setTag.*term across 4 files | NO matches | ✓ PASS |
| withScope count matches plan (5 total) | grep Sentry.withScope across 4 files | 2+1+1+1=5 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| OBS-02 | 02-01-PLAN.md | Sentry configurado com contexto completo (purchase code, user ID, pipeline step, status) em todos os erros do pipeline Inngest e API routes | ✓ SATISFIED | 5 withScope points covering process-search (pipeline+infra), webhook, purchases, admin/process. Note: REQUIREMENTS.md text mentions "CPF/CNPJ" in context but implementation deliberately excludes it per LGPD D-04 — this is the correct and more restrictive interpretation |
| OBS-04 | 02-01-PLAN.md | Sentry com DSN real configurado no Vercel (pré-requisito manual: criar conta sentry.io) | ? NEEDS HUMAN | Code is wired; DSN env var configuration on Vercel is a manual step requiring human action outside the codebase |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODOs, placeholders, stubs, or hardcoded empty values found in the instrumented files.

### Human Verification Required

#### 1. Sentry DSN Live Test

**Test:** Configure `NEXT_PUBLIC_SENTRY_DSN` on Vercel (sentry.io -> Projects -> Create Project -> Client Keys). Trigger a pipeline error by reprocessing a FAILED purchase via the admin panel. Check Sentry Issues.

**Expected:** Error appears in Sentry with tags `error_category=pipeline`, `purchase_code=<6-char code>`, `pipeline_step`, `document_type`; user set to `userId`.

**Why human:** Requires creating a sentry.io account, getting a real DSN, configuring it in Vercel env vars, deploying, and then triggering a real error. Cannot test SDK-to-Sentry connectivity programmatically.

#### 2. Infra Error Category in Sentry

**Test:** With Inngest dev server offline, use admin panel to trigger process on a PAID purchase. Check Sentry.

**Expected:** Error tagged `error_category=infra`, `infra_type=inngest_unreachable`, `purchase_code=<code>`.

**Why human:** Requires deliberate infra failure in a deployed environment.

### Gaps Summary

No gaps found. All 5 instrumentation points are wired with correct structured context. The phase goal — every Sentry error includes enough context to identify the affected purchase — is fully achieved in code. OBS-04 is blocked on a manual human action (Sentry DSN setup on Vercel), which was documented as such in the PLAN's `user_setup` section and the SUMMARY's "Pending Manual Action" note.

---

_Verified: 2026-03-25T22:40:00Z_
_Verifier: Claude (gsd-verifier)_
