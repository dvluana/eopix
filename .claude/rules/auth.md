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
