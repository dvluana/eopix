---
phase: 5
slug: pix-frontend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + Testing Library (React) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/components/PixCheckout` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/components/PixCheckout`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | PIX-02, PIX-03 | unit | `npx vitest run src/components/PixCheckout` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | PIX-02 | unit | `npx vitest run src/components/PixCheckout` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 1 | PIX-03 | unit | `npx vitest run src/components/PixCheckout` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 2 | PIX-01, PIX-02 | e2e | `npm run test:e2e:mock` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/PixCheckout.test.tsx` — stubs for PIX-02 (polling redirect on PAID/COMPLETED) and PIX-03 (EXPIRED state shows renewal UI)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| QR Code renderiza PNG do AbacatePay corretamente | PIX-01 | Requires visual inspection | Abrir `/compra/pix` em MOCK_MODE, verificar se QR Code é exibido como imagem |
| Countdown regride em tempo real até zero | PIX-03 | Real-time timer behavior | Aguardar expiração ou simular com `pixExpiresAt` no passado |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
