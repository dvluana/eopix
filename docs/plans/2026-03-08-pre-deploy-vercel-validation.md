# Pre-Deploy Vercel Validation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Validate all develop branch changes on a Vercel preview deployment with real APIs before merging to main/production.

**Architecture:** Push develop to GitHub → Vercel preview auto-deploys → Apply 4 new migrations on Neon main → Test full E2E (auth, CPF, CNPJ, duplicata, relatório, admin) via Chrome MCP on the preview URL.

**Tech Stack:** Vercel preview, Neon Postgres, AbacatePay (prod key), APIFull, Serper, OpenAI, Inngest, Chrome MCP

**Scope:** 28 commits, 254 files changed (+31k/-14k lines). Major changes: full UI redesign (landing, consulta, relatório, admin, confirmação), RegisterModal, AbacatePay v2, EopixLoader, AI classification fix, mentions unification, reportName display, circuit breaker, FAILED retry, deferred account fields.

---

## Pre-flight: Branch Cleanup

### Task 1: Remove temp files from git history

**Files:**
- Delete: `tmp-checkout.png`, `tmp-consulta-full.png`, `tmp-consulta.png`, `tmp-monitor-screenshot.png`, `tmp-monitor-v2.png`, `.env.production.local.bak`

**Step 1: Remove temp files**

```bash
git rm tmp-checkout.png tmp-consulta-full.png tmp-consulta.png tmp-monitor-screenshot.png tmp-monitor-v2.png .env.production.local.bak
```

**Step 2: Add to .gitignore**

Add to `.gitignore`:
```
tmp-*.png
*.bak
.env.production.local.bak
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: remove temp screenshots and bak files, update gitignore"
```

### Task 2: Squash WIP commits

There are 4 `wip: pre-compact checkpoint` commits that should be squashed into their adjacent real commits. These are artifacts of Claude Code context compaction.

**Step 1: Interactive rebase** (28 commits)

```bash
git rebase -i main
```

Mark the 4 WIP commits (`196e01d`, `bf1f7a4`, `f5fcced`, `27d3612`) as `fixup` to squash them into the preceding commit.

**Step 2: Verify**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: tsc clean, vitest 91/91.

---

## Phase 1: Deploy to Vercel Preview

### Task 3: Push develop and verify preview

**Step 1: Push develop to GitHub**

```bash
git push origin develop
```

**Step 2: Wait for Vercel preview deployment**

Check via Vercel dashboard or:
```bash
gh pr list --head develop || echo "No PR — check Vercel dashboard for preview deploy on develop branch"
```

Alternatively create a PR to trigger preview:
```bash
gh pr create --base main --head develop --title "Release: UI redesign + AI fixes + modal cadastro" --body "Pre-deploy validation in progress"
```

**Step 3: Get preview URL**

The Vercel preview URL will be something like `eopix-git-develop-*.vercel.app`. Note it down.

### Task 4: Apply new migrations on Neon main

**4 new migrations** not yet on Neon main:
- `20260307000000_add_missing_tables`
- `20260307100000_add_user_taxid`
- `20260308112232_defer_account_fields`

**Step 1: Check current Neon main migration state**

```bash
# Via Neon MCP
run_sql on main branch: SELECT "migration_name" FROM "_prisma_migrations" ORDER BY "finished_at" DESC LIMIT 10
```

**Step 2: Apply migrations**

```bash
DATABASE_URL="<neon-main-connection-string>" npx prisma migrate deploy
```

**Step 3: Verify**

```bash
# Via Neon MCP
run_sql on main branch: SELECT "migration_name" FROM "_prisma_migrations" ORDER BY "finished_at" DESC LIMIT 10
```

Expected: all 9 migrations present (up to `defer_account_fields`).

---

## Phase 2: E2E Validation on Preview (Chrome MCP)

**All tests below use Chrome MCP on the Vercel preview URL.**

### Task 5: Smoke test — pages load

**Step 1: Navigate to preview URL home page**

Verify: landing page loads, hero section visible, search input present.

**Step 2: Check key routes**

- `/` — landing page
- `/consulta/01208628240` — CPF consulta page
- `/consulta/33923798000100` — CNPJ consulta page
- `/admin/login` — admin login page

All should return 200 and render correctly.

### Task 6: Auth flow — register new account

**Step 1: Go to `/consulta/01208628240`**

**Step 2: Click "DESBLOQUEAR RELATÓRIO"**

Expected: RegisterModal opens with fields: nome, email, celular, CPF/CNPJ, senha, confirmar senha.

**Step 3: Fill and submit registration**

```
Nome: Teste Vercel Preview
Email: teste-vercel@eopix.test
Celular: 11999990000
CPF/CNPJ: 52998224725
Senha: TesteVercel123!
Confirmar: TesteVercel123!
```

**Step 4: Verify**

Expected: registration succeeds, purchase created, redirected to confirmação page showing "Compra aprovada!" with progress tracker.

### Task 7: CPF pipeline — full processing

**Context:** Continues from Task 6. Purchase was created for CPF 01208628240.

**Step 1: Monitor progress on confirmação page**

Watch steps 1-6 progress via polling (2s interval):
1. Consultando Receita Federal
2. Verificando situação financeira
3. Buscando processos judiciais
4. Analisando notícias e reputação
5. Gerando análise inteligente
6. Montando seu relatório

**Step 2: Verify completion**

Expected: "Relatório pronto!" with "VER RELATÓRIO" button.

**Step 3: Open report**

Click "VER RELATÓRIO" and verify:
- Header shows person name (not just CPF)
- Weather verdict section present
- All 4 sections expandable (Dados Cadastrais, Situação Financeira, Processos Judiciais, Web e Reputação)
- AI Resumo present
- Process analysis shows contextual labels (Advogado, Sem risco, etc.) — NOT raw "NENHUMA"
- Mentions section shows classification tags (Negativa, Neutra, Positiva)
- "Outras menções" section with unified WebMentionsCard

### Task 8: Duplicate protection

**Step 1: Navigate to `/consulta/01208628240` (same CPF)**

**Step 2: Click "DESBLOQUEAR" and log in**

Use: `teste-vercel@eopix.test` / `TesteVercel123!`

**Step 3: Verify block**

Expected: alert "Você já possui um relatório ativo para este documento" — should NOT create new purchase or redirect to AbacatePay.

### Task 9: Minhas consultas — reportName display

**Step 1: Navigate to `/minhas-consultas`**

**Step 2: Verify card display**

Expected for completed purchase:
- Primary text: person/company NAME (not CPF)
- Secondary text: "CPF: 012.086.282-40"
- Badge: "CONCLUÍDO"
- Button: "Ver Relatório"

### Task 10: CNPJ pipeline

**Step 1: Navigate to `/consulta/33923798000100`**

**Step 2: Register or log in and purchase**

If using same account: should create new purchase (different document).
If new account: register fresh.

**Step 3: Monitor processing**

Same as Task 7 but for CNPJ. Verify:
- Dossiê empresarial loads (razão social, CNAE, sócios)
- Financial data loads
- Web mentions load
- AI summary generated

**Step 4: Verify report**

CNPJ report should show:
- Company name as header
- Cadastro empresarial with sócios list
- Web mentions with classification tags

### Task 11: Admin panel

**Step 1: Navigate to `/admin/login`**

**Step 2: Log in with admin credentials**

**Step 3: Verify key pages**

- Dashboard: revenue, purchase counts
- Compras: list with search, status badges
- Monitor: SSE real-time (LIVE indicator)
- Health: API balances (APIFull, Serper, OpenAI, Inngest)
- Blocklist, Leads pages load

**Step 4: Verify purchase details**

Click on the test purchase from Task 6. Verify details dialog shows all info.

---

## Phase 3: Post-Validation

### Task 12: Clean up test data

**Step 1: Delete test users via Neon MCP**

```sql
-- Delete test purchases first (FK constraint)
DELETE FROM "Purchase" WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@eopix.test'
);
-- Delete test users
DELETE FROM "User" WHERE email LIKE '%@eopix.test';
```

### Task 13: Merge to main

**Step 1: Verify all tests passed**

Checklist:
- [ ] Landing page loads
- [ ] Auth register/login works
- [ ] CPF pipeline complete (6 steps → COMPLETED)
- [ ] CPF report renders correctly (AI labels, mentions tags)
- [ ] CNPJ pipeline complete
- [ ] CNPJ report renders correctly
- [ ] Duplicate protection works (409 + alert)
- [ ] Minhas consultas shows reportName
- [ ] Admin panel loads and functions
- [ ] Health endpoint shows API balances

**Step 2: Merge**

```bash
git checkout main
git merge develop
git push origin main
```

**Step 3: Verify production deploy**

Navigate to production URL via Chrome MCP. Smoke test: home page, one consulta page.

---

## Rollback Plan

If critical issues found on preview:
1. Do NOT merge to main
2. Fix on develop branch
3. Push again → Vercel auto-redeploys preview
4. Re-test affected flows
5. Only merge when all checks pass
