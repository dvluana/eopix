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
