# Documentation System — Self-Managing Docs

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a self-managing documentation system with wiki (operational knowledge), specs (product flows), path-based rules (token-efficient referencing), and enforcement hooks (docs stay alive).

**Architecture:** 3-layer referencing (CLAUDE.md always loaded → .claude/rules/ auto-loaded by path → docs/ on demand). Stop hook enforces doc updates when code changes. MkDocs for visual browsing.

**Tech Stack:** MkDocs Material (Python), Claude Code hooks (bash), .claude/rules/ (YAML frontmatter)

---

### Task 1: Create docs/wiki/ — Operational Knowledge

**Files:**
- Create: `docs/wiki/index.md`
- Create: `docs/wiki/setup.md`
- Create: `docs/wiki/testing.md`
- Create: `docs/wiki/deploy.md`
- Create: `docs/wiki/admin.md`
- Create: `docs/wiki/inngest.md`
- Create: `docs/wiki/claude-workflow.md`

**Step 1: Create wiki directory and index**

`docs/wiki/index.md` — Homepage linking to all wiki pages:
```markdown
# EOPIX Wiki

Conhecimento operacional do projeto. Cada página cobre um domínio.

| Página | Conteúdo |
|---|---|
| [Setup](setup.md) | Scripts, env vars, como rodar |
| [Testing](testing.md) | Modos, credenciais, E2E, CI |
| [Deploy](deploy.md) | Workflow develop → main → Vercel |
| [Admin](admin.md) | Painel admin, endpoints, operações |
| [Inngest](inngest.md) | Jobs, debug, como adicionar |
| [Claude Workflow](claude-workflow.md) | Hooks, skills, como interagir |

> Atualizado automaticamente conforme o projeto evolui.
```

**Step 2: Create setup.md**

Extract from `modos-de-execucao.md` (scripts section) + `CLAUDE.md` (commands) + package.json:
```markdown
# Setup & Scripts

## Comandos Principais

| Comando | O que faz |
|---|---|
| `npm run dev` | Next.js + Inngest (MOCK_MODE=true) |
| `npm run dev:live` | Next.js + Inngest (APIs reais) |
| `npm run lint` | ESLint |
| `npx vitest run` | Unit tests |
| `npm run test:e2e` | Playwright E2E (Neon branch real) |
| `npm run test:e2e:mock` | E2E rápido (mock, sem Neon) |
| `npx prisma studio` | DB visual |
| `npx prisma migrate dev` | Aplicar migrations |

## Env Vars

| Variável | Dev | Produção | Descrição |
|---|---|---|---|
| `MOCK_MODE` | `true` | ausente | Mocks todas as APIs |
| `TEST_MODE` | `true` | ausente | APIs reais, sem pagamento |
| `BYPASS_PAYMENT` | `true`/`false` | ausente | Override independente de pagamento |
| `ABACATEPAY_API_KEY` | `abc_dev_*` | `abc_*` | Key da API AbacatePay |
| `ABACATEPAY_WEBHOOK_SECRET` | local | produção | Secret p/ HMAC webhook |
| `DATABASE_URL` | Neon develop | Neon main | Postgres connection |
| `INNGEST_EVENT_KEY` | local | produção | Inngest auth |
| `INNGEST_SIGNING_KEY` | local | produção | Inngest auth |
| `APIFULL_API_KEY` | — | real | APIFull consultas |
| `SERPER_API_KEY` | — | real | Serper web search |
| `OPENAI_API_KEY` | — | real | OpenAI gpt-4o-mini |

## Como Rodar

```bash
# Dev local (zero custo, dados mock)
npm run dev

# Dev com APIs reais + Inngest
npm run dev:live

# Testar checkout AbacatePay sandbox (mock APIs, pagamento real sandbox)
MOCK_MODE=true BYPASS_PAYMENT=false npm run dev
```

## Prisma / Neon

- Branch de trabalho: Neon `develop`
- Produção: Neon `main` (NUNCA rodar migrations aqui diretamente)
- Criar branch Neon via MCP: sempre rodar `prisma migrate deploy` depois (MCP cria do main)
```

**Step 3: Create testing.md**

Extract from `modos-de-execucao.md` (modos, credentials, E2E, CI sections):
```markdown
# Testing

## Modos de Execução

| Aspecto | MOCK_MODE | TEST_MODE | LIVE |
|---|---|---|---|
| APIFull | Mock | Real | Real |
| Serper | Mock | Real | Real |
| OpenAI | Mock | Real | Real |
| Pagamento | Bypass | Bypass | Real (AbacatePay) |
| Inngest | Fallback síncrono | Fallback síncrono | Async real |
| Custo | Zero | Real (APIs) | Real (tudo) |

## Cenários Chuva/Sol (Mock)

Último dígito do documento determina cenário:
- **0-4 (Chuva):** Processos, protestos, pendências
- **5-9 (Sol):** Histórico limpo

Arquivos: `src/lib/mocks/apifull-data.ts`, `google-data.ts`, `openai-data.ts`

## Credenciais de Teste

- **AbacatePay sandbox:** Key com prefixo `abc_dev_*`
- **Cartão teste:** `4242 4242 4242 4242`
- **Admin E2E:** `e2e-admin@eopix.test` / `E2eAdminPass!2026`
- **CPF teste (Chuva):** `006.780.809-33`

## E2E com Playwright

```bash
# Mock (rápido, zero custo)
npm run test:e2e:mock

# Real (Neon branch isolado, TTL 1h)
npm run test:e2e
```

Estrutura: `e2e/tests/` (smoke, purchase-flow-cpf, purchase-flow-cnpj, report-content, error-handling)

## CI/CD (GitHub Actions)

| Job | Modo | Trigger | Custo |
|---|---|---|---|
| mock | MOCK_MODE=true | PR + push develop | Zero |
| integration | TEST_MODE=true | Nightly 03:00 UTC | Real |

Neon branching: CI cria `ci/{name}-{run_id}`, deleta automaticamente.
```

**Step 4: Create deploy.md**

Based on `.claude/skills/deploy/SKILL.md` + production experience:
```markdown
# Deploy

## Workflow: develop → main → Vercel

### Pre-flight
1. `npm run lint` — deve passar
2. `npx vitest run` — deve passar
3. `git status` — deve estar limpo

### Merge
4. `git push origin develop`
5. `git checkout main && git pull origin main`
6. `git merge develop --ff-only`
7. `git push origin main`
8. `git checkout develop`

### Verificação pós-deploy
9. Aguardar ~60s
10. `curl -s https://somoseopix.com.br/api/health | jq .status`
11. Chrome MCP: screenshot da homepage

### Rollback
- Reportar problema, perguntar antes de agir
- `git revert` ou redeploy do commit anterior

## Checklist Produção

- [ ] `ABACATEPAY_API_KEY` (sem prefixo `_dev_`)
- [ ] `ABACATEPAY_WEBHOOK_SECRET`
- [ ] `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`
- [ ] `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` apontando pro domínio
- [ ] Saldos: APIFull ≥ R$30, Serper ≥ 500 credits
```

**Step 5: Create admin.md**

```markdown
# Admin Panel

## Acesso

- URL: `/admin`
- Login: `/api/admin/login` (email + senha bcrypt)
- Sessão: cookie `eopix_session` (8h, sameSite: strict)
- Rate limit: 5 tentativas / 15 min por IP

## Endpoints

| Endpoint | Método | O que faz |
|---|---|---|
| `/api/admin/login` | POST | Login admin |
| `/api/admin/purchases` | GET | Listar purchases (search, pagination) |
| `/api/admin/purchases/:id/mark-paid` | POST | Marcar como paga (sem Inngest) |
| `/api/admin/purchases/:id/mark-paid-and-process` | POST | Marcar + disparar Inngest |
| `/api/admin/purchases/:id/process` | POST | Reprocessar |
| `/api/admin/purchases/:id/refund` | POST | Registrar refund |
| `/api/admin/health` | GET | Status serviços + saldos |
| `/api/admin/blocklist` | GET/POST | Gerenciar blocklist |
| `/api/admin/leads` | GET | Listar leads |

## Operações Comuns

**Reprocessar purchase presa:**
1. Login admin
2. Buscar purchase por código
3. Se PAID: usar mark-paid-and-process (com Inngest) ou process (fallback)
4. Se PROCESSING/FAILED: usar process para retentar

**Refund:**
- Via dashboard AbacatePay (sem API de refund)
- Registrar no admin panel para controle interno
```

**Step 6: Create inngest.md**

```markdown
# Inngest

## Jobs Registrados

| Job | Trigger | Frequência | O que faz |
|---|---|---|---|
| `search/process` (processSearch) | Evento | On demand | Pipeline principal: cache → APIFull → Serper → OpenAI → SearchResult |
| `cleanupSearchResults` | Cron | Diário 03:00 | Remove SearchResults > 7 dias |
| `cleanupLeads` | Cron | Diário 03:15 | Remove leads antigos |
| `cleanupMagicCodes` | Cron | Diário 03:30 | Remove magic codes expirados |
| `cleanupPendingPurchases` | Cron | 15 min | Remove purchases PENDING > 30 min |
| `anonymizePurchases` | Cron | Mensal 1º dia | LGPD Art. 16 |

## Arquivos

- `src/lib/inngest/client.ts` — Instância Inngest + event types
- `src/lib/inngest/process-search.ts` — Pipeline principal (~250 lines)
- `src/lib/inngest/crons.ts` — 5 cron jobs + array `functions[]` para `serve()`
- `src/lib/inngest.ts` — Barrel re-export
- `src/app/api/inngest/route.ts` — Handler do serve()

## Como Adicionar um Job

1. Criar função em `src/lib/inngest/crons.ts` (ou novo arquivo se complexo)
2. Adicionar ao array `functions` em `crons.ts` (CRÍTICO — se esquecer, job é silenciosamente ignorado)
3. Se evento custom: adicionar tipo em `client.ts` > `Events`
4. Testar: `npm run dev:live` (Inngest dev server integrado)

## Debug

- Dashboard local: `http://localhost:8288` (roda com `npm run dev:live`)
- Dashboard standalone: `npm run inngest`
- Fallback síncrono (sem Inngest): `POST /api/process-search/{code}` (requer MOCK/TEST/INNGEST_DEV)

## Armadilha Conhecida

O `processSearch` DEVE estar no array `functions` passado ao `serve()`. Se ausente, eventos são aceitos mas silenciosamente descartados — purchases ficam presas em PAID/PROCESSING.
```

**Step 7: Create claude-workflow.md**

```markdown
# Claude Workflow

Como o Claude Code está configurado neste projeto.

## Hooks (`.claude/settings.json`)

| Hook | Trigger | O que faz |
|---|---|---|
| SessionStart (startup/resume) | Início/retomada | Mostra branch, últimos commits, TODO.md |
| SessionStart (compact) | Pós-compactação | Mostra branch + TODO.md |
| PreCompact (auto) | Antes de compactar | Auto-commit via smart-commit.sh |
| PostToolUse (Write/Edit) | Após editar .ts/.tsx | TypeScript check + ESLint |
| PostToolUse (Write/Edit) | Após editar .ts/.tsx | Roda testes relacionados |

## Custom Skills

| Skill | Comando | O que faz |
|---|---|---|
| `/commit` | `git add` + conventional commit | Commit estruturado em develop |
| `/deploy` | lint → test → merge → push → verify | Deploy completo develop → main |

## Rules (`.claude/rules/`)

Arquivos com frontmatter `paths:` que auto-carregam quando editando arquivos matching.
Economizam tokens: só carregam contexto relevante ao arquivo sendo editado.

## CLAUDE.md

Sempre carregado. Contém:
- Regras obrigatórias (branch develop, source of truth, etc.)
- Mapa do projeto (ponteiros para onde encontrar cada coisa)
- Referências obrigatórias (@docs/wiki/, @docs/specs/)

## Boas Práticas

- Sempre ler TODO.md ao iniciar
- Atualizar TODO.md ao pausar
- Usar `/commit` para commits estruturados
- Usar `/deploy` para deploy completo
- Verificar Chrome MCP após deploy
```

**Step 8: Commit wiki**

```bash
git add docs/wiki/
git commit -m "docs: create wiki/ with operational knowledge (setup, testing, deploy, admin, inngest, claude-workflow)"
```

---

### Task 2: Create docs/specs/ — Living Product Specs

**Files:**
- Create: `docs/specs/purchase-flow.md`
- Create: `docs/specs/report-pipeline.md`
- Create: `docs/specs/auth.md`

**Step 1: Create purchase-flow.md**

Extract from `architecture.md` (state machine + sequence) into living spec:
```markdown
# Purchase Flow

## Estados

```
PENDING → PAID → PROCESSING → COMPLETED
                            → FAILED → REFUNDED
```

## Fluxo Principal (LIVE)

1. User submete CPF/CNPJ em `/consulta/[term]`
2. Frontend POST `/api/purchases` com document + metadata
3. Backend valida rate limit, blocklist, duplicata (409 se já existe relatório)
4. Cria Purchase(PENDING) + User (ou reutiliza)
5. Cria billing no AbacatePay (produto inline com externalId fixo)
6. Retorna checkout URL → frontend redireciona
7. User paga (PIX/cartão)
8. AbacatePay envia webhook `billing.paid` → `/api/webhooks/abacatepay`
9. Webhook marca Purchase PAID + dispara Inngest `search/process`
10. Pipeline processa → Purchase COMPLETED
11. User vê relatório em `/relatorio/[id]`

## Fluxo Bypass (MOCK/TEST)

1-4 igual
5. Retorna fake URL (bypass payment)
6. Admin marca PAID via `/api/admin/purchases/:id/mark-paid`
7. `POST /api/process-search/{code}` (fallback síncrono)
8-11 igual

## Validações

- **Rate limit:** Por IP (bypassed em dev)
- **Blocklist:** CPF/CNPJ banidos
- **Duplicata:** 409 se user logado já tem relatório ativo pro mesmo documento
- **AbacatePay:** Produto inline (`externalId: 'relatorio-risco'`), customer com email real

## Cancelamento

- `cancelUrl` redireciona para `/` (home)
- Se user chega em confirmação com `?cancelled=true` + Purchase PENDING → mostra "pagamento não concluído"
- Se Purchase já PAID/COMPLETED → ignora cancelled (race condition protection)
```

**Step 2: Create report-pipeline.md**

```markdown
# Report Pipeline

## Visão Geral

Inngest job `search/process` (processSearch) orquestra:

1. **check-cache** — Busca SearchResult existente (24h window)
2. **process-all** — Se cache miss, executa todas as APIs em paralelo

## Etapas do process-all

| # | Etapa | Serviço | Endpoint | Custo CPF | Custo CNPJ |
|---|---|---|---|---|---|
| 1 | Cadastral | APIFull | `r-cpf-completo` / `ic-dossie-juridico` | R$0,80 | R$11,76 |
| 2 | Financeiro | APIFull | `srs-premium` | R$6,96 | R$6,96 |
| 3 | Processos | APIFull | `r-acoes-e-processos-judiciais` | R$4,14 | — |
| 4 | Web search | Serper | Google Search | ~R$0 | ~R$0 |
| 5 | Análise processos | OpenAI | gpt-4o-mini | ~R$0,01 | ~R$0,01 |
| 6 | Summary | OpenAI | gpt-4o-mini | ~R$0,01 | ~R$0,01 |

## SearchResult

- Persistida no DB com dados de todas as etapas
- TTL: 7 dias (cron cleanup diário 03:00)
- Cache: 24h (mesma consulta reutiliza resultado)
- Tipos em: `src/types/report.ts`

## Arquivos

- Pipeline: `src/lib/inngest/process-search.ts`
- APIFull: `src/lib/apifull.ts`
- Serper: `src/lib/google-search.ts`
- OpenAI: `src/lib/openai.ts`
- Mocks: `src/lib/mocks/` (apifull-data, google-data, openai-data)

## Contratos de API

Source of truth: `docs/api-contracts/`
- `cpf-cadastral.md`, `cpf-financeiro.md`, `cpf-processos.md`
- `cnpj-dossie.md`, `cnpj-financeiro.md`
```

**Step 3: Create auth.md**

```markdown
# Auth

## Métodos

| Método | Rota | Quem usa |
|---|---|---|
| Registro | POST `/api/auth/register` | Novo user (nome+email+senha) |
| Login | POST `/api/auth/login` | User existente (email+senha) |
| Auto-login | POST `/api/auth/auto-login` | Magic code pós-compra |
| Admin login | POST `/api/admin/login` | Admin (email+senha bcrypt) |

## Sessão

- Cookie: `eopix_session` (HMAC-SHA256)
- User session: duração padrão
- Admin session: 8h, `sameSite: strict`
- Verificação: `hmacVerify()` com `crypto.subtle.verify()` (constant-time)

## Fluxo de Compra + Auth

1. User não logado em `/consulta/[term]`:
   - Mostra form registro (nome/email/senha) + botão compra
   - 1-clique: registra + cria purchase
2. User logado:
   - Mostra só botão compra (sem campos extras)
   - Backend resolve dados do perfil (cellphone, taxId da última compra)
3. Pós-pagamento:
   - Auto-login via magic code (cookie setado automaticamente)
   - Redirect para `/confirmacao` → `/minhas-consultas`

## Segurança

- Senhas: bcrypt hash
- JWT: HMAC-SHA256 (constant-time verify)
- Admin rate limit: 5 tentativas / 15 min por IP
- CSRF: `sameSite: strict` em rotas admin
- Flash prevention: `isAuthenticated` tri-state (null→spinner, false→form, true→lista)

## Arquivos

- Auth lib: `src/lib/auth.ts`
- Register: `src/app/api/auth/register/route.ts`
- Login: `src/app/api/auth/login/route.ts`
- Auto-login: `src/app/api/auth/auto-login/route.ts`
- Admin login: `src/app/api/admin/login/route.ts`
```

**Step 4: Commit specs**

```bash
git add docs/specs/
git commit -m "docs: create specs/ with living product specs (purchase-flow, report-pipeline, auth)"
```

---

### Task 3: Reorganize external docs

**Files:**
- Create: `docs/external/abacatepay/` directory
- Move: `docs/payment/*.md` → `docs/external/abacatepay/`
- Archive: `docs/payment/abacatepay-v1-legacy.md` → `docs/archive/legacy-2026/`

**Step 1: Create external directory and move files**

```bash
mkdir -p docs/external/abacatepay
git mv docs/payment/abacatepay-v2-docs-completa.md docs/external/abacatepay/api-v2-completa.md
git mv docs/payment/abacatepay-v2-llms.md docs/external/abacatepay/api-v2-condensed.md
git mv docs/payment/abacatepay-v2-llms-full.md docs/external/abacatepay/api-v2-full.md
git mv docs/payment/contexto-migracao-v1-v2.md docs/external/abacatepay/contexto-migracao.md
git mv docs/payment/abacatepay-v1-legacy.md docs/archive/legacy-2026/abacatepay-v1-legacy.md
rmdir docs/payment
```

**Step 2: Commit reorganization**

```bash
git add docs/external/ docs/archive/ docs/payment/
git commit -m "refactor: move payment docs to docs/external/abacatepay/, archive v1-legacy"
```

---

### Task 4: Create .claude/rules/ — Path-Specific Rules

**Files:**
- Create: `.claude/rules/inngest.md`
- Create: `.claude/rules/payment.md`
- Create: `.claude/rules/admin.md`
- Create: `.claude/rules/purchases.md`

**Step 1: Create inngest rule**

```markdown
---
paths:
  - src/lib/inngest/**
  - src/app/api/inngest/**
---
## Inngest Rules

- Todo job DEVE estar no array `functions` em `crons.ts` → se esquecer, job é silenciosamente ignorado
- Event types em `client.ts` > `Events`
- Testar: `npm run dev:live` (Inngest dev server integrado)
- Ao alterar jobs: atualizar `docs/wiki/inngest.md` e `docs/specs/report-pipeline.md`
```

**Step 2: Create payment rule**

```markdown
---
paths:
  - src/lib/abacatepay.ts
  - src/lib/payment.ts
  - src/app/api/webhooks/**
---
## Payment Rules

- API docs: `docs/external/abacatepay/api-v2-condensed.md`
- Produto inline com `externalId: 'relatorio-risco'` (API reutiliza automaticamente)
- NUNCA usar `{ id }` no billing create (causa 500)
- Customer: email real, taxId com formatação (pontos/traço), cellphone com parênteses
- Webhook: HMAC-SHA256 validation, retornar 500 em erro (AbacatePay retenta)
- Ao alterar: atualizar `docs/specs/purchase-flow.md`
```

**Step 3: Create admin rule**

```markdown
---
paths:
  - src/app/admin/**
  - src/app/api/admin/**
---
## Admin Rules

- JWT: NUNCA usar fallback dev-secret (throws se env var missing)
- Session: 8h, sameSite strict
- Rate limit login: 5/15min por IP
- Paginação: clamp 1-100
- Revenue: só COMPLETED (não PAID/PROCESSING)
- Ao alterar endpoints: atualizar `docs/wiki/admin.md`
```

**Step 4: Create purchases rule**

```markdown
---
paths:
  - src/app/api/purchases/**
---
## Purchases Rules

- Validar: rate limit → blocklist → duplicata (409)
- Duplicata: user logado + COMPLETED + SearchResult não expirado + mesmo document
- Bypass payment: usar `isBypassPayment` (não `isBypassMode`)
- Ao alterar fluxo de compra: atualizar `docs/specs/purchase-flow.md`
- Ao alterar estados: verificar `docs/architecture.md` (state machine)
```

**Step 5: Commit rules**

```bash
git add .claude/rules/
git commit -m "feat: add .claude/rules/ with path-specific context (inngest, payment, admin, purchases)"
```

---

### Task 5: Slim CLAUDE.md — Rules + Pointers Only

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Rewrite CLAUDE.md**

Keep mandatory rules and replace detailed content with pointers to wiki/specs. Target: ~60 lines (down from 120). Remove sections that are now in wiki/ or specs/. Keep: project context, mandatory rules, project map, commands, branch policy.

Specifically:
- Keep: "Contexto do Projeto" (1 line)
- Keep: "Stack & Modos" (1 line)
- Keep: "Regras Obrigatórias" (6 rules)
- **Add rule:** "Após alterar código de produto, atualizar spec correspondente em docs/specs/"
- **Add rule:** "Após alterar configuração/operacional, atualizar wiki correspondente em docs/wiki/"
- Keep: "Mapa do projeto" (slim)
- Keep: "NUNCA ABRA"
- Keep: "Ao iniciar" / "Ao pausar"
- **Replace** "Arquivos de Referência Obrigatória" with pointers to wiki/specs
- **Remove** "Fluxo Resumido" (now in specs/purchase-flow.md)
- **Remove** "Estados de Purchase" (now in specs/purchase-flow.md)
- Keep: "Comandos" (3 lines)
- Keep: "Branch e Neon Policy"
- Keep: "MCP Usage Policy"
- **Remove** "Higiene de Documentação" long version, keep 1-liner

**Step 2: Verify CLAUDE.md loads correctly**

```bash
wc -l CLAUDE.md  # Should be ~60-70 lines
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "refactor: slim CLAUDE.md to rules+pointers (120→~65 lines), detail moved to wiki/specs"
```

---

### Task 6: Create Stop Hook — Doc Enforcement

**Files:**
- Create: `.claude/hooks/check-docs.sh`
- Modify: `.claude/settings.json`

**Step 1: Create check-docs.sh**

```bash
#!/bin/bash
# Stop hook: verifica se docs foram atualizados quando código-fonte muda
# Roda no PostToolUse para Write|Edit

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Só verifica arquivos em src/
if [[ "$FILE_PATH" != src/* ]]; then
  exit 0
fi

cd '/Users/luana/Documents/Code Projects/eopix'

# Mapeamento código → docs
declare -A CODE_TO_DOCS
CODE_TO_DOCS["src/lib/inngest/"]="docs/wiki/inngest.md docs/specs/report-pipeline.md"
CODE_TO_DOCS["src/lib/abacatepay.ts"]="docs/specs/purchase-flow.md"
CODE_TO_DOCS["src/lib/payment.ts"]="docs/specs/purchase-flow.md"
CODE_TO_DOCS["src/app/api/purchases/"]="docs/specs/purchase-flow.md"
CODE_TO_DOCS["src/app/api/webhooks/"]="docs/specs/purchase-flow.md"
CODE_TO_DOCS["src/app/api/auth/"]="docs/specs/auth.md"
CODE_TO_DOCS["src/app/api/admin/"]="docs/wiki/admin.md"
CODE_TO_DOCS["src/app/admin/"]="docs/wiki/admin.md"

# Verifica se o arquivo editado corresponde a algum mapeamento
for pattern in "${!CODE_TO_DOCS[@]}"; do
  if [[ "$FILE_PATH" == ${pattern}* ]]; then
    DOCS="${CODE_TO_DOCS[$pattern]}"
    # Informativo (não bloqueia) — lembra o dev de atualizar
    echo "Lembre de atualizar: $DOCS" >&2
    exit 0
  fi
done

exit 0
```

**Step 2: Add hook to settings.json**

Add new PostToolUse entry for check-docs.sh:
```json
{
  "matcher": "Write|Edit",
  "hooks": [{ "type": "command", "command": "bash '/Users/luana/Documents/Code Projects/eopix/.claude/hooks/check-docs.sh'" }]
}
```

**Step 3: Commit**

```bash
git add .claude/hooks/check-docs.sh .claude/settings.json
git commit -m "feat: add check-docs hook — reminds to update wiki/specs when editing mapped code"
```

---

### Task 7: Setup MkDocs

**Files:**
- Create: `mkdocs.yml`
- Modify: `.gitignore`

**Step 1: Create mkdocs.yml**

```yaml
site_name: EOPIX Docs
site_description: Documentação operacional e specs do EOPIX
docs_dir: docs
theme:
  name: material
  language: pt-BR
  palette:
    scheme: slate
    primary: deep purple
    accent: amber
  features:
    - navigation.tabs
    - navigation.sections
    - search.suggest
    - content.code.copy

nav:
  - Home: wiki/index.md
  - Wiki:
    - Setup: wiki/setup.md
    - Testing: wiki/testing.md
    - Deploy: wiki/deploy.md
    - Admin: wiki/admin.md
    - Inngest: wiki/inngest.md
    - Claude Workflow: wiki/claude-workflow.md
  - Specs:
    - Purchase Flow: specs/purchase-flow.md
    - Report Pipeline: specs/report-pipeline.md
    - Auth: specs/auth.md
  - Referência:
    - Arquitetura: architecture.md
    - Custos: custos-e-fluxo-processamento.md
    - Modos: modos-de-execucao.md

markdown_extensions:
  - tables
  - admonition
  - pymdownx.highlight
  - pymdownx.superfences
  - pymdownx.tabbed
```

**Step 2: Add site/ to .gitignore**

Append `site/` to `.gitignore` (MkDocs build output).

**Step 3: Add script to package.json**

Add `"docs": "mkdocs serve"` to scripts (requires `pip install mkdocs-material`).

**Step 4: Commit**

```bash
git add mkdocs.yml .gitignore package.json
git commit -m "feat: add MkDocs Material config for visual wiki browsing"
```

---

### Task 8: Final verification and cleanup

**Step 1: Verify structure**

```bash
find docs/wiki docs/specs docs/external .claude/rules -type f | sort
```

Expected:
```
.claude/rules/admin.md
.claude/rules/inngest.md
.claude/rules/payment.md
.claude/rules/purchases.md
docs/external/abacatepay/api-v2-completa.md
docs/external/abacatepay/api-v2-condensed.md
docs/external/abacatepay/api-v2-full.md
docs/external/abacatepay/contexto-migracao.md
docs/specs/auth.md
docs/specs/purchase-flow.md
docs/specs/report-pipeline.md
docs/wiki/admin.md
docs/wiki/claude-workflow.md
docs/wiki/deploy.md
docs/wiki/index.md
docs/wiki/inngest.md
docs/wiki/setup.md
docs/wiki/testing.md
```

**Step 2: Verify CLAUDE.md references are valid**

```bash
grep '@docs/' CLAUDE.md
# All referenced files should exist
```

**Step 3: Run tsc and lint**

```bash
npx tsc --noEmit && npm run lint
```

**Step 4: Update TODO.md** with documentation system entry

**Step 5: Update docs/status.md** with entry about documentation system

**Step 6: Final commit**

```bash
git add TODO.md docs/status.md
git commit -m "docs: update status and TODO with documentation system"
```
