# Documentation Audit & Self-Update System Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auditar toda a documentacao, corrigir gaps, e tornar o sistema auto-atualizavel pela IA a cada mudanca de codigo.

**Architecture:** Expandir o sistema existente de rules + hooks + check-docs.sh para cobrir TODOS os code paths do projeto. Adicionar regras faltantes, expandir o hook de docs, consolidar docs duplicados, e adicionar cross-links entre paginas wiki/specs.

**Tech Stack:** Mintlify (docs), Claude Code hooks/rules (shell + markdown), git

---

### Task 1: Fix stale frontmatter dates

**Files:**
- Modify: `docs/architecture.md:3` (date line)
- Modify: `docs/modos-de-execucao.md` (no date in frontmatter)
- Modify: `docs/custos-e-fluxo-processamento.md` (no date in frontmatter)

**Step 1: Update architecture.md date**

In `docs/architecture.md`, find the line:
```
> **Última atualização:** 2026-03-05
```
Change to:
```
> **Última atualização:** 2026-03-12
```

**Step 2: Verify other two files have no stale dates**

Read `docs/modos-de-execucao.md` and `docs/custos-e-fluxo-processamento.md`. If they have explicit dates, update to 2026-03-12. If not, skip.

**Step 3: Commit**

```bash
git add docs/architecture.md docs/modos-de-execucao.md docs/custos-e-fluxo-processamento.md
git commit -m "docs: update stale dates in architecture/modos/custos"
```

---

### Task 2: Consolidate duplicate AbacatePay external docs

**Files:**
- Move: `docs/external/abacatepay/api-v2-completa.md` → `docs/archive/legacy-2026/`
- Move: `docs/external/abacatepay/api-v2-full.md` → `docs/archive/legacy-2026/`
- Keep: `docs/external/abacatepay/api-v2-condensed.md` (canonical, referenced in CLAUDE.md)
- Move: `docs/external/abacatepay/api-v1-completa.md` → `docs/archive/legacy-2026/`
- Move: `docs/external/abacatepay/api-v1-full.md` → `docs/archive/legacy-2026/`

**Step 1: Move duplicate/legacy files**

```bash
mv docs/external/abacatepay/api-v2-completa.md docs/archive/legacy-2026/
mv docs/external/abacatepay/api-v2-full.md docs/archive/legacy-2026/
mv docs/external/abacatepay/api-v1-completa.md docs/archive/legacy-2026/
mv docs/external/abacatepay/api-v1-full.md docs/archive/legacy-2026/
```

**Step 2: Verify no active docs reference the moved files**

```bash
grep -r "api-v2-completa\|api-v2-full\|api-v1-completa\|api-v1-full" docs/ --include="*.md" | grep -v archive/
```

Expected: No matches (only CLAUDE.md references `api-v2-condensed.md`).

**Step 3: Commit**

```bash
git add docs/external/abacatepay/ docs/archive/legacy-2026/
git commit -m "docs: archive duplicate AbacatePay docs (keep condensed as canonical)"
```

---

### Task 3: Add missing rules for uncovered code paths

The audit found these `src/` paths have NO rules triggering doc updates:

| Path | Should trigger | Missing rule |
|------|---------------|-------------|
| `src/lib/auth.ts`, `src/lib/server-auth.ts` | `docs/specs/auth.md` | auth.md |
| `src/lib/apifull.ts` | `docs/api-contracts/`, `docs/specs/report-pipeline.md` | apifull.md |
| `src/lib/openai.ts`, `src/lib/ai-analysis.ts` | `docs/specs/report-pipeline.md` | pipeline.md |
| `src/lib/google-search.ts` | `docs/specs/report-pipeline.md` | pipeline.md |
| `src/app/relatorio/**` | `docs/specs/report-pipeline.md` | relatorio.md |
| `src/app/api/report/**`, `src/app/api/search/**` | `docs/specs/report-pipeline.md` | relatorio.md |

**Step 1: Create `.claude/rules/auth.md`**

```markdown
---
paths:
  - src/lib/auth.ts
  - src/lib/server-auth.ts
  - src/app/api/auth/**
---
## Auth Rules

- Session JWT: HMAC-SHA256, cookie `eopix_session`, 7d TTL
- Passwords: bcrypt (never plain text)
- Magic codes: single-use, auto-cleanup via cron
- Ao alterar: atualizar `docs/specs/auth.md`
```

**Step 2: Create `.claude/rules/pipeline.md`**

```markdown
---
paths:
  - src/lib/apifull.ts
  - src/lib/openai.ts
  - src/lib/ai-analysis.ts
  - src/lib/google-search.ts
  - src/lib/financial-summary.ts
  - src/app/api/report/**
  - src/app/api/search/**
  - src/app/api/process-search/**
---
## Report Pipeline Rules

- APIFull exige `User-Agent: EOPIX/1.0` (403 sem ele)
- `srs-premium` retorna `dados.data.serasaPremium` — NAO usar `serasa-premium`
- Contratos: `docs/api-contracts/` (source of truth)
- Ao alterar pipeline: atualizar `docs/specs/report-pipeline.md`
- Ao alterar mappers/formatters: verificar `docs/api-contracts/` correspondente
```

**Step 3: Create `.claude/rules/relatorio.md`**

```markdown
---
paths:
  - src/app/relatorio/**
---
## Relatorio Display Rules

- Relatório tem TTL de 7 dias (verificar expiração antes de exibir)
- Tipos centrais: `src/types/report.ts`
- Ao alterar layout/campos: atualizar `docs/specs/report-pipeline.md`
```

**Step 4: Verify rules load correctly**

```bash
ls -la .claude/rules/
```

Expected: 7 files (admin.md, auth.md, inngest.md, payment.md, pipeline.md, purchases.md, relatorio.md)

**Step 5: Commit**

```bash
git add .claude/rules/auth.md .claude/rules/pipeline.md .claude/rules/relatorio.md
git commit -m "feat: add rules for auth, pipeline, relatorio (doc update triggers)"
```

---

### Task 4: Expand check-docs.sh to cover all paths

**Files:**
- Modify: `.claude/hooks/check-docs.sh:23-42` (case block)

**Step 1: Add missing case patterns**

In `.claude/hooks/check-docs.sh`, expand the `case` block. The current mapping covers:
- `src/lib/inngest/*` → inngest + report-pipeline
- `src/lib/abacatepay.ts|src/lib/payment.ts` → purchase-flow
- `src/app/api/purchases/*` → purchase-flow
- `src/app/api/webhooks/*` → purchase-flow
- `src/app/api/auth/*` → auth
- `src/app/api/admin/*|src/app/admin/*` → admin

Add these missing patterns BEFORE the `esac`:

```bash
  src/lib/auth.ts|src/lib/server-auth.ts)
    DOCS="docs/specs/auth.md"
    ;;
  src/lib/apifull.ts)
    DOCS="docs/specs/report-pipeline.md + docs/api-contracts/"
    ;;
  src/lib/openai.ts|src/lib/ai-analysis.ts|src/lib/google-search.ts|src/lib/financial-summary.ts)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/app/api/report/*|src/app/api/search/*|src/app/api/process-search/*)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/app/relatorio/*)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/lib/mock-mode.ts|src/lib/mocks/*)
    DOCS="docs/modos-de-execucao.md"
    ;;
  src/lib/prisma.ts)
    DOCS="docs/wiki/setup.md"
    ;;
```

**Step 2: Test the hook**

```bash
echo '{"tool_input":{"file_path":"src/lib/apifull.ts"}}' | bash .claude/hooks/check-docs.sh
```

Expected stderr: `Lembre de atualizar: docs/specs/report-pipeline.md + docs/api-contracts/`

**Step 3: Commit**

```bash
git add .claude/hooks/check-docs.sh
git commit -m "feat: expand check-docs hook to cover all code paths"
```

---

### Task 5: Remove duplicate auth rule from check-docs.sh

**Files:**
- Modify: `.claude/hooks/check-docs.sh`

After Task 4, the `src/app/api/auth/*` pattern exists TWICE (original + new `src/lib/auth.ts` pattern). Verify there's no duplication and the patterns are distinct:

- `src/app/api/auth/*` → auth (routes)
- `src/lib/auth.ts|src/lib/server-auth.ts` → auth (library)

**Step 1: Read the file and verify no overlap**

Read `.claude/hooks/check-docs.sh` after Task 4 edits. Confirm the two auth patterns target different files.

**Step 2: No commit needed if clean**

---

### Task 6: Add cross-links to wiki pages

**Files:**
- Modify: `docs/wiki/setup.md` (add related links at bottom)
- Modify: `docs/wiki/testing.md`
- Modify: `docs/wiki/deploy.md`
- Modify: `docs/wiki/admin.md`
- Modify: `docs/wiki/inngest.md`
- Modify: `docs/wiki/claude-workflow.md`

**Step 1: Add "Paginas Relacionadas" section to each wiki page**

At the bottom of each file, add a section with Mintlify Card links. Use `<CardGroup>` for consistent display.

For `docs/wiki/setup.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Modos de teste e E2E
  </Card>
  <Card title="Deploy" icon="rocket" href="/wiki/deploy">
    Como fazer deploy
  </Card>
</CardGroup>
```

For `docs/wiki/testing.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Setup" icon="gear" href="/wiki/setup">
    Configuracao do ambiente
  </Card>
  <Card title="Modos de Execucao" icon="sliders" href="/modos-de-execucao">
    MOCK, TEST, LIVE detalhado
  </Card>
</CardGroup>
```

For `docs/wiki/deploy.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Rodar testes antes do deploy
  </Card>
  <Card title="Status" icon="signal" href="/status">
    Status vivo do projeto
  </Card>
</CardGroup>
```

For `docs/wiki/admin.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Purchase Flow" icon="cart-shopping" href="/specs/purchase-flow">
    Fluxo de compra detalhado
  </Card>
  <Card title="Auth" icon="lock" href="/specs/auth">
    Sistema de autenticacao
  </Card>
</CardGroup>
```

For `docs/wiki/inngest.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Report Pipeline" icon="diagram-project" href="/specs/report-pipeline">
    Pipeline de geracao de relatorio
  </Card>
  <Card title="Arquitetura" icon="sitemap" href="/architecture">
    Visao geral da arquitetura
  </Card>
</CardGroup>
```

For `docs/wiki/claude-workflow.md`:
```markdown

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Setup" icon="gear" href="/wiki/setup">
    Configuracao do ambiente
  </Card>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Como rodar testes
  </Card>
</CardGroup>
```

**Step 2: Rename wiki .md files to .mdx**

Since `<CardGroup>` and `<Card>` are JSX components, the wiki files need `.mdx` extension to render them. Rename all 7 wiki files:

```bash
for f in docs/wiki/*.md; do mv "$f" "${f%.md}.mdx"; done
```

Then update `docs/docs.json` navigation to reference `.mdx` files... Actually, check first — Mintlify may auto-resolve `.md` vs `.mdx`. Test with one file first.

**Step 3: Update docs.json if needed**

If Mintlify requires explicit `.mdx` in navigation, update the `pages` array. If it resolves automatically (like it does for index.md → index.mdx), no change needed.

**Step 4: Verify cross-links render**

```bash
pkill -f "mint dev"; sleep 2; cd docs && mint dev --port 3333 &
sleep 15; curl -s -o /dev/null -w "%{http_code}" http://localhost:3333/wiki/setup
```

Expected: HTTP 200

**Step 5: Commit**

```bash
git add docs/wiki/ docs/docs.json
git commit -m "docs: add cross-links between wiki pages (CardGroup)"
```

---

### Task 7: Add specs cross-links

**Files:**
- Modify: `docs/specs/purchase-flow.md`
- Modify: `docs/specs/report-pipeline.md`
- Modify: `docs/specs/auth.md`

**Step 1: Add related links to each spec**

At the bottom of `docs/specs/purchase-flow.md`:
```markdown

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Arquitetura" icon="sitemap" href="/architecture">
    State machine e bounded contexts
  </Card>
  <Card title="API Contracts" icon="file-contract" href="/api-contracts/cpf-cadastral">
    Contratos APIFull
  </Card>
</CardGroup>
```

At the bottom of `docs/specs/report-pipeline.md`:
```markdown

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Inngest" icon="clock" href="/wiki/inngest">
    Jobs async e debug
  </Card>
  <Card title="Custos e Pipeline" icon="money-bill" href="/custos-e-fluxo-processamento">
    Custo por API call
  </Card>
</CardGroup>
```

At the bottom of `docs/specs/auth.md`:
```markdown

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Admin Panel" icon="shield" href="/wiki/admin">
    Admin auth e endpoints
  </Card>
  <Card title="Purchase Flow" icon="cart-shopping" href="/specs/purchase-flow">
    Fluxo que usa auth
  </Card>
</CardGroup>
```

**Step 2: Rename to .mdx if needed (same logic as Task 6)**

**Step 3: Commit**

```bash
git add docs/specs/
git commit -m "docs: add cross-links between spec pages"
```

---

### Task 8: Update CLAUDE.md doc hygiene section

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add doc coverage reference**

In the "Higiene de Documentação" section of CLAUDE.md, add:

```markdown
- Rules em `.claude/rules/` cobrem: admin, auth, inngest, payment, pipeline, purchases, relatorio.
- Hook `check-docs.sh` cobre todos os paths acima + mocks + prisma.
- Se criar novo modulo em `src/lib/` ou `src/app/api/`: criar rule correspondente em `.claude/rules/`.
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with expanded rule/hook coverage"
```

---

### Task 9: Verify complete system

**Step 1: Run full verification**

```bash
# Verify all rules exist
ls .claude/rules/
# Expected: 7 files

# Verify hook covers all patterns
for path in \
  "src/lib/inngest/client.ts" \
  "src/lib/abacatepay.ts" \
  "src/app/api/purchases/route.ts" \
  "src/app/api/auth/login/route.ts" \
  "src/app/api/admin/login/route.ts" \
  "src/lib/apifull.ts" \
  "src/lib/openai.ts" \
  "src/app/relatorio/page.tsx" \
  "src/lib/mock-mode.ts" \
  "src/lib/prisma.ts"; do
  RESULT=$(echo "{\"tool_input\":{\"file_path\":\"$path\"}}" | bash .claude/hooks/check-docs.sh 2>&1)
  echo "$path → $RESULT"
done
```

Expected: Every path outputs a doc reminder.

**Step 2: Verify Mintlify renders all pages**

```bash
pkill -f "mint dev"; sleep 2; cd docs && mint dev --port 3333 &
sleep 15
for page in / /wiki/setup /wiki/testing /wiki/deploy /wiki/admin /wiki/inngest /wiki/claude-workflow /specs/purchase-flow /specs/report-pipeline /specs/auth /architecture /status; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3333$page")
  echo "$page → $CODE"
done
```

Expected: All HTTP 200.

**Step 3: Commit final state**

```bash
git add -A
git commit -m "docs: complete audit — all rules, hooks, cross-links verified"
```

---

## Summary of Changes

| Area | Before | After |
|------|--------|-------|
| Rules | 4 files (admin, inngest, payment, purchases) | 7 files (+auth, pipeline, relatorio) |
| check-docs.sh | 6 case patterns | 13 case patterns |
| External docs | 5 AbacatePay files (3 duplicates) | 2 files (condensed + contexto) |
| Wiki cross-links | None | 6 pages with CardGroup links |
| Specs cross-links | None | 3 pages with CardGroup links |
| Stale dates | 3 files with 2026-03-05 | Updated to 2026-03-12 |
| CLAUDE.md | Basic hygiene section | Expanded with rule/hook coverage |
