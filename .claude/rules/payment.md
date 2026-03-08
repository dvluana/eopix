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
