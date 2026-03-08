---
paths:
  - src/lib/apifull.ts
  - src/lib/openai.ts
  - src/lib/ai-analysis.ts
  - src/lib/google-search.ts
  - src/lib/financial-summary.ts
  - src/app/api/report/**
  - src/app/api/search/**
  - src/app/api/process-search/**
---
## Report Pipeline Rules

- APIFull exige `User-Agent: EOPIX/1.0` (403 sem ele)
- `srs-premium` retorna `dados.data.serasaPremium` — NAO usar `serasa-premium`
- Contratos: `docs/api-contracts/` (source of truth)
- Ao alterar pipeline: atualizar `docs/specs/report-pipeline.md`
- Ao alterar mappers/formatters: verificar `docs/api-contracts/` correspondente
