---
phase: 03-alertas-de-falha
plan: 01
subsystem: alertas
tags: [callmebot, whatsapp, monitoring, inngest, fire-and-forget]
dependency_graph:
  requires: []
  provides: [callmebot-alerts]
  affects: [process-search-pipeline]
tech_stack:
  added: []
  patterns: [fire-and-forget, Promise.all multi-recipient, env-guard silent skip]
key_files:
  created:
    - src/lib/callmebot.ts
    - tests/lib/callmebot.test.ts
    - .claude/rules/callmebot.md
  modified:
    - src/lib/inngest/process-search.ts
    - docs/status.md
decisions:
  - wasAlreadyFailed status check prevents duplicate alerts on Inngest retries (no DB migration needed)
  - PAYMENT_EXPIRED excluded from failure alerts (abandoned checkouts)
  - COMPLETED alert fires in both cache-hit and fresh-processing paths
metrics:
  duration: ~15 min
  completed: 2026-03-26
  tasks_completed: 2
  files_modified: 5
---

# Phase 3 Plan 1: Callmebot WhatsApp Alerts Summary

WhatsApp pipeline failure and completion alerts via Callmebot for 3 operators (Luana, Kevin, Carolina), integrated fire-and-forget into Inngest process-search with deduplication and PAYMENT_EXPIRED exclusion.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create callmebot.ts module + unit tests + rule file | 8077448 | src/lib/callmebot.ts, tests/lib/callmebot.test.ts, .claude/rules/callmebot.md |
| 2 | Wire callmebot alerts into process-search.ts + update docs/status.md | b101329 | src/lib/inngest/process-search.ts, docs/status.md |

## What Was Built

**`src/lib/callmebot.ts`** — Isolated alert module:
- `sendFailureAlert(payload)`: builds message with warning header, code, date (America/Sao_Paulo), user name, email, payment provider (mapped), step/6 with label, error truncated at 100 chars, admin link
- `sendCompletedAlert(payload)`: builds message with checkmark header, code, date, user, provider, admin link
- `broadcastAlert(message)`: sends to 3 recipients in parallel via `Promise.all`, silently skips missing env var pairs, catches per-recipient failures with `Sentry.captureException`

**`src/lib/inngest/process-search.ts`** integration:
- FAILED alert: fired after `wasAlreadyFailed` check (deduplication without DB field), excludes `PAYMENT_EXPIRED` purchases, uses expanded `findUnique` select
- COMPLETED alert: fired in both fresh-processing and cache-hit paths after `prisma.purchase.update({ status: 'COMPLETED' })`
- All calls are fire-and-forget (`.catch()`) — pipeline never blocked

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all alert calls are fully wired. Env vars `CALLMEBOT_PHONE*` and `CALLMEBOT_API_KEY*` require manual setup per PLAN.md `user_setup` section.

## Verification Results

- `npx vitest run` — 124/124 tests pass (8 new callmebot tests)
- `npx tsc --noEmit` — no type errors
- `npm run lint` — no ESLint warnings or errors

## Self-Check: PASSED

- src/lib/callmebot.ts exists: FOUND
- tests/lib/callmebot.test.ts exists: FOUND
- .claude/rules/callmebot.md exists: FOUND
- Commit 8077448: FOUND
- Commit b101329: FOUND
