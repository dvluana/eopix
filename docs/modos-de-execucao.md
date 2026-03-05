# Modos de Execução — EOPIX

> **Última atualização:** 2026-03-05

Este projeto opera com dois flags de ambiente:

- `MOCK_MODE=true` — Desenvolvimento local, dados mockados
- `TEST_MODE=true` — Integração com APIs reais, sem pagamento real

Se ambos os modos estiverem `false` (ou ausentes), o sistema roda em **modo live** (produção) com AbacatePay.

---

## Resumo

| Aspecto | MOCK_MODE | TEST_MODE | LIVE |
|---|---|---|---|
| **APIFull** | Mock (500ms delay) | Real | Real |
| **Serper** | Mock (700ms delay) | Real | Real |
| **OpenAI** | Mock (600–800ms delay) | Real | Real |
| **Pagamento** | Bypass (fake URL) | Bypass (fake URL) | Real checkout (AbacatePay) |
| **Inngest** | Fallback síncrono | Fallback síncrono | Async real |
| **Email (Brevo)** | Console.log | Console.log | Envio real |
| **Rate limit** | Bypassed | Bypassed | Checado por IP |
| **Sentry** | Ativo se DSN configurado | Ativo se DSN configurado | Ativo se DSN configurado |
| **Dados** | Cenários Chuva/Sol | Reais | Reais |

---

## Flags e Constantes

Definidos em `src/lib/mock-mode.ts`:

```ts
export const isMockMode = process.env.MOCK_MODE === 'true'
export const isTestMode = process.env.TEST_MODE === 'true'
export const isBypassMode = isMockMode || isTestMode

// Override independente de pagamento
export const isBypassPayment = process.env.BYPASS_PAYMENT !== undefined
  ? process.env.BYPASS_PAYMENT === 'true'
  : isBypassMode
```

- `isMockMode` — Todas as APIs mockadas
- `isTestMode` — APIs reais, mas pagamento e Inngest em bypass
- `isBypassMode` — Ativo em ambos; pula pagamento (AbacatePay) e usa fallback síncrono Inngest
- `isBypassPayment` — Controla bypass de pagamento independentemente. Por default segue `isBypassMode`, mas pode ser overridden via `BYPASS_PAYMENT` env var

### Override `BYPASS_PAYMENT`

Permite separar bypass de APIs do bypass de pagamento:

| Cenário | `MOCK_MODE` | `BYPASS_PAYMENT` | APIs | Pagamento |
|---------|-------------|-------------------|------|-----------|
| Dev normal | `true` | (não setado) | Mock | Bypass |
| **Sandbox checkout** | `true` | `false` | Mock | **Real (sandbox)** |
| Test com APIs reais | — | (não setado, `TEST_MODE=true`) | Real | Bypass |
| Produção | — | — | Real | Real |

Exemplo para testar checkout AbacatePay sandbox com APIs mockadas:
```bash
MOCK_MODE=true BYPASS_PAYMENT=false npm run dev
```

---

## Pipeline por Modo

### LIVE (produção)

```
POST /api/purchases → AbacatePay billing create
  → Webhook /api/webhooks/abacatepay (billing.paid)
  → Inngest search/process (async)
  → APIFull + Serper + OpenAI (reais)
  → SearchResult persistida → Purchase → COMPLETED
```

Evento relevante:
- `billing.paid`

### TEST_MODE (integração com APIs reais)

```
POST /api/purchases → bypass pagamento (fake URL)
  → Admin marca Purchase como PAID
  → POST /api/process-search/[code] (fallback síncrono)
  → APIFull + Serper + OpenAI (reais — consome crédito)
  → SearchResult persistida → Purchase → COMPLETED
```

**Atenção:** TEST_MODE consome crédito real de APIFull, Serper e OpenAI. Use com moderação.

### MOCK_MODE (desenvolvimento local)

```
POST /api/purchases → bypass pagamento (fake URL)
  → Admin marca Purchase como PAID
  → POST /api/process-search/[code] (fallback síncrono)
  → APIFull mock + Serper mock + OpenAI mock (cenários Chuva/Sol)
  → SearchResult persistida → Purchase → COMPLETED
```

Zero custo de API. Ideal para desenvolvimento diário.

---

## Mocks: Localização e Cenários Chuva/Sol

### Localização dos Arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/lib/mocks/apifull-data.ts` | 10 mocks: CPF/CNPJ × cadastral/financeiro/processos/dossier × Chuva/Sol |
| `src/lib/mocks/google-data.ts` | 4 mocks: CPF/CNPJ × Chuva/Sol para Serper |
| `src/lib/mocks/openai-data.ts` | 6 mocks: processos + summary × CPF/CNPJ × Chuva/Sol |

### Cenários Chuva/Sol

A seleção do cenário é determinística baseada no **último dígito** do documento:

```ts
function isChuvaScenario(document: string): boolean {
  const lastDigit = parseInt(document.slice(-1))
  return lastDigit < 5
}
```

| Último dígito | Cenário | Resultado |
|---|---|---|
| 0–4 | **Chuva** | Processos, protestos, pendências, menções negativas |
| 5–9 | **Sol** | Histórico limpo, sem ocorrências |

A mesma função `isChuvaScenario()` é replicada em:
- `src/lib/apifull.ts`
- `src/lib/google-search.ts`
- `src/lib/openai.ts`

### Delays por Serviço (mock)

| Serviço | Delay simulado |
|---|---|
| APIFull (todos os endpoints) | 500ms |
| Serper (busca web) | 700ms |
| OpenAI (análise processos) | 600ms |
| OpenAI (summary) | 800ms |

---

## Sentry: Monitoramento de Erros

### Comportamento

Sentry é **opcional** e funciona **identicamente** em todos os modos. Se `NEXT_PUBLIC_SENTRY_DSN` não está configurado, faz fallback para `console.error`.

### Configuração

Variável de ambiente: `NEXT_PUBLIC_SENTRY_DSN`

- **Produção:** `tracesSampleRate: 0.1` (10%)
- **Desenvolvimento:** `tracesSampleRate: 1` (100%)

### Arquivos de Inicialização

| Arquivo | Runtime |
|---|---|
| `sentry.client.config.ts` | Client-side (replays + traces) |
| `sentry.server.config.ts` | Server-side (traces) |
| `sentry.edge.config.ts` | Edge runtime (traces) |
| `instrumentation.ts` | `register()` + `onRequestError()` — erros de request globais |

### Pontos de Captura (`Sentry.captureException`)

| Arquivo | O que captura |
|---|---|
| `src/app/api/purchases/route.ts` | Erros de checkout (AbacatePay) |
| `src/app/api/auth/auto-login/route.ts` | Erros de auto-login |
| `src/app/global-error.tsx` | Erros não-capturados (global boundary) |
| `instrumentation.ts` | Erros de request (via `captureRequestError`) |

### Features Client-Side

- **Session Replay:** `replaysSessionSampleRate: 0.1` (10%), `replaysOnErrorSampleRate: 1.0` (100% em erros)
- **Masking:** `maskAllText: true`, `blockAllMedia: true`

---

## Auth Atual

- Registro: Email + Senha (`/api/auth/register`) — bcrypt hash, Zod validation
- Login: Email + Senha (`/api/auth/login`) — bcrypt compare
- Sessão por cookie (`eopix_session`, HMAC-SHA256)
- Auto-login por código de compra: `/api/auth/auto-login`
- Admin: bcrypt password (`/api/admin/login`)

---

## Endpoints de Bypass

- `POST /api/process-search/[code]`
  - Permitido quando `MOCK_MODE=true`, `TEST_MODE=true`, ou `INNGEST_DEV=true`
  - Executa o pipeline de forma síncrona (sem Inngest)

### Fluxo manual TEST_MODE (sem Inngest local)

```bash
# 1. Admin login
curl -X POST localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'
# → cookie eopix_session

# 2. Mark paid (purchase já criada via /api/purchases com _bypassMode)
curl -X POST localhost:3000/api/admin/purchases/{ID}/mark-paid \
  -H "Cookie: eopix_session=..."

# 3. Process (fallback síncrono — consome crédito real)
curl -X POST localhost:3000/api/process-search/{CODE}
```

**Nota:** Não use `/mark-paid-and-process` sem Inngest dev server — ele tenta enviar evento Inngest e falha com ECONNREFUSED.

---

## Validação Rápida

```bash
# mock (zero custo, dados fictícios)
MOCK_MODE=true npm run dev

# test (APIs reais, consome crédito)
TEST_MODE=true npm run dev

# live local (AbacatePay)
MOCK_MODE=false TEST_MODE=false npm run dev
```

---

## CI/CD — E2E Tests com Playwright

### Execução Local

```bash
# Roda E2E em mock mode (requer dev server rodando)
MOCK_MODE=true npm run test:e2e

# Ou com servidor automático (Playwright inicia npm run dev)
npm run test:e2e
```

### GitHub Actions Matrix

| Job | MOCK_MODE | TEST_MODE | Trigger | Custo |
|---|---|---|---|---|
| **mock** | true | false | Todo PR + push develop | Zero |
| **integration** | false | true | Nightly 03:00 UTC + manual | APIs reais |

### Neon Branching

- CI cria branch `ci/{name}-{run_id}` a partir de `develop`
- Migrations rodam contra branch isolado
- Branch deletado automaticamente no `always` step e no `neon-cleanup.yml` (PR close)

### Secrets Necessários no GitHub

| Secret | Usado em |
|---|---|
| `NEON_API_KEY` | Todos os jobs (branching) |
| `APIFULL_API_KEY` | Integration only |
| `SERPER_API_KEY` | Integration only |
| `OPENAI_API_KEY` | Integration only |

### Estrutura de Testes

```
e2e/
  playwright.config.ts       # Config (Chromium only, 60s timeout)
  global-setup.ts            # Seed admin, wait health
  global-teardown.ts         # Cleanup test data
  helpers/                   # api-client, admin-auth, test-data, wait-for-status
  fixtures/                  # purchase.fixture.ts (create+pay+process)
  tests/
    smoke.spec.ts            # Health + landing page + validate
    purchase-flow-cpf.spec.ts  # CPF Sol + Chuva (browser + API)
    purchase-flow-cnpj.spec.ts # CNPJ Sol + Chuva
    report-content.spec.ts     # Deep report verification
    error-handling.spec.ts     # Invalid inputs, 404s, auth errors
```

---

## Checklist Antes de Live

- [ ] `ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET` configurados
- [ ] `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` configurados
- [ ] `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY` válidos
- [ ] `NEXT_PUBLIC_APP_URL` apontando para domínio correto
- [ ] `NEXT_PUBLIC_SENTRY_DSN` configurado (opcional, mas recomendado)
- [ ] `BREVO_API_KEY` configurado para envio de emails

---

## Credenciais de Teste — AbacatePay (Dev Mode)

- Prefixo `abc_dev_*` na `ABACATEPAY_API_KEY` = sandbox (zero custo, transações simuladas)
- Webhooks de dev **isolados** — só recebem eventos de sandbox
- Simular PIX: `POST /v1/pixQrCode/simulate-payment` (apenas em dev mode)
- Cartão de teste: `4242 4242 4242 4242`
- Quando LIVE, usar credenciais reais (`abc_*` sem `_dev_`)

