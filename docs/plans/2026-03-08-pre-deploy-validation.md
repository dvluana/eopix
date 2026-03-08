# Pre-Deploy Validation — Commit Cleanup + E2E Manual Test

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up 84 unpushed commits into ~12 atomic commits, push to develop, then validate the entire platform end-to-end via Chrome MCP in two rounds (TEST_MODE, then LIVE).

**Architecture:** `git reset --soft origin/develop` to unstage all commits, then selective `git add` + `git commit` by feature group. Production build (`npm run build && npm start`) + Inngest dev server for testing. Chrome MCP for visual E2E validation.

**Tech Stack:** Git, Next.js 14 production build, Inngest dev server, Chrome MCP, Neon MCP

---

## Part A: Commit Cleanup (Fase 0)

### Task 1: Create safety backup branch

**Step 1: Create backup branch at current HEAD**

```bash
git branch backup/pre-cleanup-2026-03-08
```

**Step 2: Verify backup exists**

```bash
git log --oneline backup/pre-cleanup-2026-03-08 -1
```

Expected: Shows `4c7e736 wip: pre-compact checkpoint...`

---

### Task 2: Soft reset to origin/develop

**Step 1: Reset all 84 commits, keeping all changes staged**

```bash
git reset --soft origin/develop
```

**Step 2: Unstage everything to working tree**

```bash
git reset HEAD
```

**Step 3: Verify state**

```bash
git status -s | head -20
git log --oneline -1
```

Expected: HEAD is at origin/develop tip. All 240 files show as modified/untracked.

---

### Task 3: Commit group 1 — Documentation system

Files: `docs/wiki/`, `docs/specs/`, `docs/external/abacatepay/api-v2-condensed.md`, `docs/docs.json`, `docs/index.mdx`, `docs/favicon.ico`, `docs/logo.svg`, `docs/.mintignore`, `docs/archive/`, `docs/plans/`, `docs/custos-e-fluxo-processamento.md`, `docs/modos-de-execucao.md`, `docs/architecture.md`, `docs/status.md`, `docs/api-contracts/`

```bash
git add docs/
git commit -m "docs: wiki, specs, external refs, plans, and archive reorganization

- docs/wiki/: 7 operational pages (setup, testing, deploy, admin, inngest, claude-workflow)
- docs/specs/: 3 live product specs (purchase-flow, report-pipeline, auth)
- docs/external/abacatepay/: condensed API v2 reference
- docs/plans/: implementation plans and design docs
- docs/archive/: legacy docs moved from root
- Mintlify config (docs.json, index.mdx, logo, favicon)
- Updated architecture.md, status.md, modos-de-execucao.md, api-contracts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Commit group 2 — Claude hooks, rules, skills, config

Files: `.claude/hooks/`, `.claude/rules/`, `.claude/skills/`, `.claude/settings.json`, `CLAUDE.md`, `.gitignore`

```bash
git add .claude/ CLAUDE.md .gitignore
git commit -m "chore: add Claude hooks, path rules, skills, and update CLAUDE.md

- .claude/rules/: 7 auto-loading rules (admin, auth, inngest, payment, pipeline, purchases, relatorio)
- .claude/hooks/: check-docs, run-related-tests, expanded typecheck
- .claude/skills/: /commit and /deploy custom skills
- CLAUDE.md: workflow rules, doc hygiene, MCP policy, scoping rules

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Commit group 3 — Prisma schema + migrations

Files: `prisma/`

```bash
git add prisma/
git commit -m "feat(db): add missing tables, user taxId, defer account fields, payment default

- Migration: add_missing_tables (LeadCapture, ApiRequestLog, LgpdRequest, WebhookLog)
- Migration: add_user_taxid
- Migration: defer_account_fields (pendingPasswordHash on Purchase, expanded LeadCapture)
- Schema: updated defaults and new fields

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Commit group 4 — Design system + styles

Files: `src/styles/`, `src/app/globals.css`

```bash
git add src/styles/ src/app/globals.css
git commit -m "style: design system tokens, admin CSS, and component styles overhaul

- tokens.css: updated design tokens
- components.css: comprehensive component styles (landing, consulta, relatorio, minhas-consultas)
- admin.css: new admin panel stylesheet
- index.css: style imports

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Commit group 5 — Backend changes (lib, types, API routes)

Files: `src/lib/`, `src/types/`, `src/app/api/`

```bash
git add src/lib/ src/types/ src/app/api/
git commit -m "feat: backend — AbacatePay v2, circuit breaker, FAILED retry, mock data

- AbacatePay: v1→v2 migration, direct fetch (no SDK), customer formatting
- Inngest: circuit breaker, concurrency limit 10, retries 3→10
- purchases/route.ts: deferred account, lead capture, duplicate block
- webhooks: v2 payload format (checkout.completed)
- Mock data: purchases-data.ts for MOCK_MODE
- API: batch-process, monitor/stream, report/[id] mock serving
- Types: domain.ts expanded, validators updated
- apifull-balance.ts: balance check helper

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Commit group 6 — Landing page refactor

Files: `src/app/page.tsx`, `src/components/landing/`

```bash
git add src/app/page.tsx src/components/landing/
git commit -m "refactor(landing): extract 14 components, add illustrations and animations

- Extracted: Nav, SearchBar, HeroSection, ImpactStrip, ForWhoSection, HowItWorksSection,
  ConsultaTimeline, PreviewSection, PricingSection, TestimonialsSection, FaqSection, CtaSection
- SVG illustrations: CheckIcon, XIcon, FeatureIcons, ForWhoIllustrations, PricingIllustrations
- SMIL animations, scroll animations, hover enhancements
- Carousel testimonials, unicode fixes

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Commit group 7 — Consulta page + RegisterModal + AuthForm

Files: `src/app/consulta/`, `src/components/RegisterModal.tsx`, `src/components/NovaConsultaModal.tsx`, `src/components/AuthForm.tsx`

```bash
git add src/app/consulta/ src/components/RegisterModal.tsx src/components/NovaConsultaModal.tsx src/components/AuthForm.tsx
git commit -m "feat(consulta): redesign page + RegisterModal with masks and AbacatePay customer

- Consulta page: hero, cards, pricing, bottom CTA, modal trigger
- RegisterModal: Radix Dialog, nome/email/celular(mask)/CPF(mask)/senha, brutalist design
- NovaConsultaModal: modal for new consultations
- AuthForm: updated for register/login toggle
- Customer data (name, email, cellphone, taxId) passed to AbacatePay

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Commit group 8 — Relatorio refactor + shared components

Files: `src/components/relatorio/`, `src/app/relatorio/`, `src/components/TopBar.tsx`, `src/components/UserNav.tsx`, `src/components/ProcessingTracker.tsx`, `src/components/LogoFundoPreto.tsx`

```bash
git add src/components/relatorio/ src/app/relatorio/ src/components/TopBar.tsx src/components/UserNav.tsx src/components/ProcessingTracker.tsx src/components/LogoFundoPreto.tsx
git commit -m "refactor(relatorio): Phase A+B — CSS foundation, dossier components, shared TopBar/UserNav

- Phase A: CSS extraction, DossierHeader/Section/Footer, QuickScan, WeatherVerdict
- Phase B: updated data components (PersonInfo, Financial, Judicial, CompanyInfo, etc.)
- Deleted: ActivityIndicator, ChecklistCard, ClimateBlock, CollapsibleCard, ReportError, ReportHeader, ReportFooter
- TopBar: extracted from pages, standardized
- UserNav: Painel Admin button for admins
- ProcessingTracker: shared progress component

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Commit group 9 — Admin panel redesign + monitor

Files: `src/app/admin/`

```bash
git add src/app/admin/
git commit -m "refactor(admin): redesign all pages + pipeline monitor + shared components

- Dashboard: redesigned with updated stats
- Compras: PurchaseDetailsDialog, stuck detection, reprocess FAILED
- Monitor: real-time SSE pipeline monitor (processing/queue/failures/completed)
- Sidebar: collapsible, Monitor item
- Login: redesigned
- Shared: AdminDataTable, AdminFilterBar, AdminLayoutShell, AdminPageHeader, AdminPagination
- Updated: StatusBadge, Toast, AdminError
- batch-process endpoint for FAILED reprocessing

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: Commit group 10 — Minhas consultas + Confirmação + other pages

Files: `src/app/minhas-consultas/`, `src/app/compra/`, `src/app/erro/`, `src/app/privacidade/`

```bash
git add src/app/minhas-consultas/ src/app/compra/ src/app/erro/ src/app/privacidade/
git commit -m "refactor: minhas-consultas receipt cards, confirmacao progress, error + privacy pages

- minhas-consultas: receipt-style cards with paper texture, FAILED shown as processing
- confirmacao: progress bar with 6 steps, cancelled state handling
- erro/invalido: updated styling
- privacidade/titular: updated styling

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: Commit group 11 — Dead code cleanup + logo + packages

Files: `src/components/ui/`, `public/logo-eopix.webp`, `package.json`, `package-lock.json`

```bash
git add src/components/ui/ public/logo-eopix.webp package.json package-lock.json
git commit -m "chore: remove 41 unused shadcn/ui components, replace logo with webp

- Deleted 41 unused UI components (accordion, alert-dialog, avatar, calendar, chart, etc.)
- Removed 27 packages (22 Radix + recharts, cmdk, vaul, input-otp, sonner)
- Kept: button, input, dialog, select, label, badge, utils.ts
- New logo: logo-eopix.webp replacing SVG+text
- Dev server: 2483MB → 293MB RAM (-88%)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 14: Commit group 12 — E2E tests + TODO + tests

Files: `e2e/`, `tests/`, `TODO.md`, `tmp-*.png`

```bash
git add e2e/ tests/ TODO.md
git commit -m "test: update E2E for RegisterModal + new unit tests + TODO refresh

- E2E: updated for modal flow (click DESBLOQUEAR → fill modal → submit)
- E2E: auth flow login mode toggle, TEST_BUYER data, complete-purchase helper
- Unit: purchase-workflow tests (PAID, FAILED, COMPLETED, REFUNDED)
- Unit: apifull-balance tests
- Unit: validators format-by-length tests
- TODO.md: refreshed with current state

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Step: Clean up temp screenshots**

```bash
git status -s
```

If `tmp-*.png` files remain, do NOT commit them (they're temp debug screenshots):

```bash
# If tmp files exist, add to .gitignore or just leave untracked
```

---

### Task 15: Verify clean state and push

**Step 1: Check nothing is left uncommitted**

```bash
git status -s
```

Expected: Only `tmp-*.png` temp files (untracked, OK to leave).

**Step 2: Verify commit history looks clean**

```bash
git log --oneline origin/develop..HEAD
```

Expected: ~12 clean atomic commits.

**Step 3: Run tsc + lint to verify nothing is broken**

```bash
npx tsc --noEmit && npm run lint
```

Expected: Clean (pre-existing warnings OK).

**Step 4: Push to develop**

```bash
git push origin develop
```

---

## Part B: Pre-checks (Fase 1)

### Task 16: Verify migrations on Neon develop

**Step 1: Check Neon develop branch has all migrations**

Use Neon MCP to verify:
- `20260307000000_add_missing_tables`
- `20260307100000_add_user_taxid`
- `20260308112232_defer_account_fields`
- `20260311000000_update_payment_provider_default`

If any missing, run `prisma migrate deploy` against Neon develop.

---

### Task 17: Production build

**Step 1: Set env vars for TEST_MODE**

In `.env.local`, set:
```
MOCK_MODE=false
TEST_MODE=true
BYPASS_PAYMENT=true
```

**Step 2: Build**

```bash
npm run build
```

Expected: Build succeeds without errors.

**Step 3: Start production server**

```bash
npm start &
```

Server runs on `http://localhost:3000`.

**Step 4: Start Inngest dev server**

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest &
```

Inngest dashboard at `http://localhost:8288`.

---

## Part C: Rodada 1 — TEST_MODE (Fase 2)

**CPF de teste:** `012.086.282-40`
**Modo:** TEST_MODE=true, BYPASS_PAYMENT=true, MOCK_MODE=false

### Task 18: Test landing page

**Step 1:** Open `http://localhost:3000` via Chrome MCP.
**Step 2:** Screenshot. Verify: layout loads, no console errors, nav shows correctly.
**Step 3:** Verify CTA button "DESBLOQUEAR" is visible.

---

### Task 19: Test account creation + CPF consultation

**Step 1:** Navigate to `/consulta/01208628240` (or search from landing).
**Step 2:** Click "DESBLOQUEAR" button → RegisterModal should open.
**Step 3:** Fill registration:
- Nome: `Teste E2E`
- Email: `teste-predeploy@eopix.test`
- Celular: `11999998888`
- CPF/CNPJ: `01208628240`
- Senha: `TesteSenha123!`
- Confirmar senha: `TesteSenha123!`
**Step 4:** Submit. Screenshot.
**Step 5:** Verify redirect to confirmação page.
**Step 6:** Screenshot confirmation page — should show progress (6 steps).

---

### Task 20: Monitor processing via Inngest

**Step 1:** Open Inngest dashboard at `http://localhost:8288` via Chrome MCP.
**Step 2:** Verify `search/process` event was received.
**Step 3:** Wait for pipeline to complete (watch steps: cache-check → APIFull cadastral → financeiro → processos → Serper → OpenAI).
**Step 4:** Screenshot Inngest showing completed run.

---

### Task 21: Verify report and minhas-consultas

**Step 1:** Navigate to `/minhas-consultas`. Screenshot.
**Step 2:** Verify purchase shows as COMPLETED.
**Step 3:** Click to view report at `/relatorio/[id]`. Screenshot.
**Step 4:** Verify report has real data (nome, CPF, dados financeiros, processos, análise AI).

---

### Task 22: Test admin panel

**Step 1:** Navigate to `/admin`. Login with admin credentials.
**Step 2:** Screenshot dashboard. Verify revenue/purchases counters.
**Step 3:** Go to Compras. Find the test purchase. Verify status COMPLETED, customer data.
**Step 4:** Go to Health. Screenshot. Verify APIFull balance, Serper credits, Inngest status.
**Step 5:** Go to Monitor. Screenshot. Verify recent completed processing shows.

---

### Task 23: Test duplicate block

**Step 1:** Navigate to `/consulta/01208628240` again (same CPF, same logged-in user).
**Step 2:** Try to purchase again. Expected: 409 error + redirect to existing report.
**Step 3:** Screenshot the redirect behavior.

---

## Part D: Rodada 2 — LIVE (Fase 3)

### Task 24: Switch to LIVE mode

**Step 1: Update `.env.local`**

```
MOCK_MODE=false
TEST_MODE=false
BYPASS_PAYMENT=false
```

**Step 2: Rebuild and restart**

```bash
npm run build && npm start
```

**Step 3:** Restart Inngest dev server if needed.

---

### Task 25: Test CNPJ consultation with real payment

**Step 1:** User provides CNPJ.
**Step 2:** Navigate to `/consulta/{cnpj}`.
**Step 3:** Register new account or login.
**Step 4:** Submit purchase → redirect to AbacatePay sandbox checkout.
**Step 5:** Screenshot checkout page. Pay with test card `4242 4242 4242 4242`.
**Step 6:** After payment, verify webhook fires → Purchase goes PAID → PROCESSING → COMPLETED.
**Step 7:** Verify report renders with CNPJ data.
**Step 8:** Verify admin panel shows purchase with `paymentExternalId`.

---

### Task 26: Test error handling

**Step 1:** Try invalid CPF (e.g., `00000000000`) → verify error message.
**Step 2:** Try accessing `/relatorio/nonexistent` → verify graceful error.
**Step 3:** Screenshot results.

---

## Part E: Cleanup

### Task 27: Post-test cleanup

**Step 1:** Delete test user from Neon develop (if desired).
**Step 2:** Stop production server and Inngest dev server.
**Step 3:** Restore `.env.local` to MOCK_MODE=true for development.
**Step 4:** Update TODO.md with test results.
