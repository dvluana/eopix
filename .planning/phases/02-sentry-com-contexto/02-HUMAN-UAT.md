---
status: partial
phase: 02-sentry-com-contexto
source: [02-VERIFICATION.md]
started: 2026-03-25T22:38:00Z
updated: 2026-03-25T22:38:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. DSN real configurado no Vercel + erro chega ao Sentry em produção
expected: Configurar NEXT_PUBLIC_SENTRY_DSN nas env vars do Vercel a partir das settings do projeto em sentry.io. Fazer deploy. Disparar um erro intencional (ou aguardar erro real). Confirmar no dashboard do Sentry que o evento aparece com as tags: purchase_code, error_category, pipeline_step ou infra_type, document_type, userId.
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
