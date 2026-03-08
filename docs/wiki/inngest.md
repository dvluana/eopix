---
title: "Inngest"
---

## Jobs Registrados

| Job | Trigger | Frequência | O que faz |
|---|---|---|---|
| `search/process` (processSearch) | Evento | On demand | Pipeline principal: cache → APIFull → Serper → OpenAI → SearchResult |
| `cleanupSearchResults` | Cron | Diário 03:00 | Remove SearchResults > 7 dias |
| `cleanupLeads` | Cron | Diário 03:15 | Remove leads antigos |
| `cleanupMagicCodes` | Cron | Diário 03:30 | Remove magic codes expirados |
| `cleanupPendingPurchases` | Cron | 15 min | Remove purchases PENDING > 30 min |
| `anonymizePurchases` | Cron | Mensal 1º dia | LGPD Art. 16 |

## Arquivos

- `src/lib/inngest/client.ts` — Instância Inngest + event types
- `src/lib/inngest/process-search.ts` — Pipeline principal (~250 lines)
- `src/lib/inngest/crons.ts` — 5 cron jobs + array `functions[]` para `serve()`
- `src/lib/inngest.ts` — Barrel re-export
- `src/app/api/inngest/route.ts` — Handler do serve()

## Como Adicionar um Job

1. Criar função em `src/lib/inngest/crons.ts` (ou novo arquivo se complexo)
2. Adicionar ao array `functions` em `crons.ts` (CRÍTICO — se esquecer, job é silenciosamente ignorado)
3. Se evento custom: adicionar tipo em `client.ts` > `Events`
4. Testar: `npm run dev:live` (Inngest dev server integrado)

## Debug

- Dashboard local: `http://localhost:8288` (roda com `npm run dev:live`)
- Dashboard standalone: `npm run inngest`
- Fallback síncrono (sem Inngest): `POST /api/process-search/{code}` (requer MOCK/TEST/INNGEST_DEV)

## Armadilha Conhecida

O `processSearch` DEVE estar no array `functions` passado ao `serve()`. Se ausente, eventos são aceitos mas silenciosamente descartados — purchases ficam presas em PAID/PROCESSING.

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Report Pipeline" icon="diagram-project" href="/specs/report-pipeline">
    Pipeline de geracao de relatorio
  </Card>
  <Card title="Arquitetura" icon="sitemap" href="/architecture">
    Visao geral da arquitetura
  </Card>
</CardGroup>
