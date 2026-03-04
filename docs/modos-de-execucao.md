# Modos de Execução — EOPIX

> **Última atualização:** 2026-03-04

Este projeto opera com dois flags de ambiente:

- `MOCK_MODE=true` — Desenvolvimento local, dados mockados
- `TEST_MODE=true` — Integração com APIs reais, sem Stripe

Se ambos estiverem `false` (ou ausentes), o sistema roda em **modo live** (produção).

---

## Resumo

| Aspecto | MOCK_MODE | TEST_MODE | LIVE |
|---|---|---|---|
| **APIFull** | Mock (500ms delay) | Real | Real |
| **Serper** | Mock (700ms delay) | Real | Real |
| **OpenAI** | Mock (600–800ms delay) | Real | Real |
| **Stripe** | Bypass (fake URL) | Bypass (fake URL) | Real checkout |
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
```

- `isMockMode` — Todas as APIs mockadas
- `isTestMode` — APIs reais, mas Stripe e Inngest em bypass
- `isBypassMode` — Ativo em ambos; pula Stripe e usa fallback síncrono Inngest

---

## Pipeline por Modo

### LIVE (produção)

```
POST /api/purchases → Stripe checkout real
  → Webhook (checkout.session.completed)
  → Inngest search/process (async)
  → APIFull + Serper + OpenAI (reais)
  → SearchResult persistida → Purchase → COMPLETED
```

Eventos Stripe relevantes:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

### TEST_MODE (integração com APIs reais)

```
POST /api/purchases → bypass Stripe (fake URL)
  → Admin marca Purchase como PAID
  → POST /api/process-search/[code] (fallback síncrono)
  → APIFull + Serper + OpenAI (reais — consome crédito)
  → SearchResult persistida → Purchase → COMPLETED
```

**Atenção:** TEST_MODE consome crédito real de APIFull, Serper e OpenAI. Use com moderação.

### MOCK_MODE (desenvolvimento local)

```
POST /api/purchases → bypass Stripe (fake URL)
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
| `src/app/api/purchases/route.ts` | Erros de Stripe checkout |
| `src/app/api/auth/auto-login/route.ts` | Erros de auto-login |
| `src/app/global-error.tsx` | Erros não-capturados (global boundary) |
| `instrumentation.ts` | Erros de request (via `captureRequestError`) |

### Features Client-Side

- **Session Replay:** `replaysSessionSampleRate: 0.1` (10%), `replaysOnErrorSampleRate: 1.0` (100% em erros)
- **Masking:** `maskAllText: true`, `blockAllMedia: true`

---

## Auth Atual

- Login principal: Google Sign-In (`/api/auth/google`)
- Sessão por cookie (`eopix_session`, HMAC-SHA256)
- Auto-login por código de compra: `/api/auth/auto-login`
- Admin: bcrypt password (`/api/auth/admin`)

---

## Endpoints de Bypass

- `POST /api/process-search/[code]`
  - Permitido quando `MOCK_MODE=true`, `TEST_MODE=true`, ou `INNGEST_DEV=true`
  - Executa o pipeline de forma síncrona (sem Inngest)

---

## Validação Rápida

```bash
# mock (zero custo, dados fictícios)
MOCK_MODE=true npm run dev

# test (APIs reais, consome crédito)
TEST_MODE=true npm run dev

# live local (Stripe + Inngest reais)
MOCK_MODE=false TEST_MODE=false npm run dev
```

---

## Checklist Antes de Live

- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` configurados
- [ ] `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` configurados
- [ ] `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY` válidos
- [ ] `NEXT_PUBLIC_APP_URL` apontando para domínio correto
- [ ] `NEXT_PUBLIC_SENTRY_DSN` configurado (opcional, mas recomendado)
- [ ] `BREVO_API_KEY` configurado para envio de emails
