# Fluxo Do Sistema (Atual)

Documento enxuto com o fluxo real em producao/staging.

## 1. Entrada E Validacao

1. Usuario informa CPF/CNPJ e email.
2. Backend valida documento, email, termos e rate limit.
3. Backend verifica blocklist.

Endpoint principal:
- `POST /api/purchases`

## 2. Criacao De Compra

A compra sempre nasce `PENDING`.

### Modo Live

1. Backend cria `Purchase`.
2. Cria checkout Stripe via `createCheckoutSession`.
3. Retorna `checkoutUrl`.

### Modo Bypass (`MOCK_MODE` ou `TEST_MODE`)

1. Backend cria `Purchase` em `PENDING`.
2. Retorna URL de confirmacao local (sem checkout real).
3. Admin pode marcar como paga e disparar processamento.

## 3. Confirmacao De Pagamento (Live)

Webhook:
- `POST /api/webhooks/stripe`

Eventos tratados:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `charge.refunded`

Regras:
- Valida assinatura Stripe.
- Aplica idempotencia por `WebhookLog.eventKey`.
- Em sucesso: `PENDING -> PAID` e dispara `inngest.send('search/process')`.

## 4. Processamento

Pipeline principal em `src/lib/inngest.ts`:
- Step 1: `check-cache`
- Step 2: `process-all`

Etapas de progresso (`processingStep`):
- 1 dados cadastrais
- 2 dados financeiros
- 3 processos
- 4 mencoes web
- 5 resumo IA
- 6 finalizacao

Resultado:
- cria `SearchResult`
- atualiza compra para `COMPLETED`

## 5. Fallback E Operacao Manual

Admin endpoints:
- `POST /api/admin/purchases/[id]/mark-paid-and-process`
- `POST /api/admin/purchases/[id]/process`

Fallback sincrono (bypass/dev):
- `POST /api/process-search/[code]`

## 6. Consulta E Acesso

- Lista do usuario: `GET /api/purchases`
- Atualizacao em tempo real: `GET /api/purchases/stream` (SSE)
- Auth/session:
  - `POST /api/auth/google`
  - `POST /api/auth/auto-login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`

## 7. Estados Da Compra

Estados usados no fluxo:
- `PENDING`
- `PAID`
- `PROCESSING`
- `COMPLETED`
- `FAILED`
- `REFUNDED`
- `REFUND_FAILED`

## 8. Observacoes De Governanca

- API docs canonica: `docs/api-contracts/`
- Operacao obrigatoria: `CLAUDE.md`
- Branch de trabalho: `develop`
- Neon dev/teste: branch `develop`
