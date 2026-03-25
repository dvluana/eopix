---
phase: 1
slug: admin-purchase-timeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run lint && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run lint && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | OBS-01 | manual | — | ✅ | ⬜ pending |
| 1-01-02 | 01 | 1 | OBS-01 | manual | — | ✅ | ⬜ pending |
| 1-01-03 | 01 | 2 | OBS-01 | manual | — | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — vitest + lint já configurados, sem dependências novas.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Timeline exibe eventos na ordem correta | OBS-01 | Verificação visual de UI | Abrir `/admin/compras`, buscar compra COMPLETED, verificar timeline PENDING→PAID→PROCESSING→COMPLETED com timestamps |
| Erro aparece inline com mensagem legível | OBS-01 | Verificação visual de UI | Buscar compra FAILED, verificar que `failureReason` aparece traduzido (não "FAILED" cru) |
| URL `?search=código` auto-abre dialog | OBS-01 | Comportamento de navegação | Acessar `/admin/compras?search=Q8HFHZ`, verificar que dialog abre automaticamente |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
