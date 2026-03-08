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
