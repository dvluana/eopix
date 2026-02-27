# Modos De Execucao

Este projeto opera com dois flags:

- `MOCK_MODE=true`
- `TEST_MODE=true`

Se ambos estiverem `false` (ou ausentes), o sistema roda em modo live.

## Resumo

| Modo | Flags | Dados | Pagamento | Processamento | Email |
|---|---|---|---|---|---|
| mock | `MOCK_MODE=true` | mock | bypass Stripe | fallback sincrono | log only |
| test | `TEST_MODE=true` | real | bypass Stripe | fallback sincrono | log only |
| live | ambos false | real | Stripe real | Inngest real | envio real |

## Comportamento Por Modo

### Mock

- APIFull/OpenAI/Serper retornam respostas mockadas.
- Compra e criada como `PENDING` sem checkout real.
- Fluxo de processamento ocorre por acao admin + endpoint de fallback.

### Test

- APIFull/OpenAI/Serper em modo real.
- Stripe continua em bypass.
- Inngest pode usar fallback sincrono quando necessario.

### Live

- `POST /api/purchases` cria checkout Stripe real.
- Webhook Stripe confirma pagamento:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
- Inngest executa `search/process` e jobs cron.

## Auth Atual

- Login principal: Google Sign-In (`/api/auth/google`).
- Sessao por cookie (`eopix_session`).
- Auto-login por codigo de compra: `/api/auth/auto-login`.

## Endpoints De Suporte Em Bypass

- `POST /api/process-search/[code]`
  - permitido em `MOCK_MODE` / `TEST_MODE` ou `INNGEST_DEV=true`.

## Validacao Rapida

```bash
# mock
MOCK_MODE=true npm run dev

# test
TEST_MODE=true npm run dev

# live local (com variaveis reais)
MOCK_MODE=false TEST_MODE=false npm run dev
```

## Checklist Minimo Antes De Live

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` configurados
- `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` configurados
- `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY` validos
- `NEXT_PUBLIC_APP_URL` apontando para dominio correto
