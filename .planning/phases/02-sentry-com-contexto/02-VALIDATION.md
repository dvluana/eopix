---
phase: 2
slug: sentry-com-contexto
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | OBS-02 | unit | `npx vitest run tests/lib/sentry-context.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 1 | OBS-02 | unit | `npx vitest run tests/lib/sentry-context.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-03 | 01 | 2 | OBS-04 | unit | `npx vitest run tests/lib/sentry-context.test.ts` | ❌ W0 | ⬜ pending |
| 2-01-04 | 01 | 2 | OBS-02 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/lib/sentry-context.test.ts` — stubs for OBS-02, OBS-04

*Existing vitest infrastructure covers the framework — only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| DSN real configurado no Vercel | OBS-04 | Requer acesso à dashboard Vercel/Sentry em produção | Verificar env var SENTRY_DSN no Vercel → abrir Sentry → confirmar evento chegou |
| Alerta Sentry → link admin funciona | OBS-02 | Requer evento real capturado no Sentry | Disparar erro intencional → abrir alerta Sentry → checar campo admin_url |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
