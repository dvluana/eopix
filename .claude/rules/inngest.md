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
