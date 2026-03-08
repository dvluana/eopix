---
title: "Report Pipeline"
---

## Visão Geral

Inngest job `search/process` (processSearch) orquestra:

1. **check-cache** — Busca SearchResult existente (24h window)
2. **process-all** — Se cache miss, executa todas as APIs em paralelo

## Etapas do process-all

| # | Etapa | Serviço | Endpoint | Custo CPF | Custo CNPJ |
|---|---|---|---|---|---|
| 1 | Cadastral | APIFull | `r-cpf-completo` / `ic-dossie-juridico` | R$0,80 | R$11,76 |
| 2 | Financeiro | APIFull | `srs-premium` | R$6,96 | R$6,96 |
| 3 | Processos | APIFull | `r-acoes-e-processos-judiciais` | R$4,14 | — |
| 4 | Web search | Serper | Google Search | ~R$0 | ~R$0 |
| 5 | Análise processos | OpenAI | gpt-4o-mini | ~R$0,01 | ~R$0,01 |
| 6 | Summary | OpenAI | gpt-4o-mini | ~R$0,01 | ~R$0,01 |

## SearchResult

- Persistida no DB com dados de todas as etapas
- TTL: 7 dias (cron cleanup diário 03:00)
- Cache: 24h (mesma consulta reutiliza resultado)
- Tipos em: `src/types/report.ts`

## Arquivos

- Pipeline: `src/lib/inngest/process-search.ts`
- APIFull: `src/lib/apifull.ts`
- Serper: `src/lib/google-search.ts`
- OpenAI: `src/lib/openai.ts`
- Mocks: `src/lib/mocks/` (apifull-data, google-data, openai-data)

## Contratos de API

Source of truth: `docs/api-contracts/`
- `cpf-cadastral.md`, `cpf-financeiro.md`, `cpf-processos.md`
- `cnpj-dossie.md`, `cnpj-financeiro.md`

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Inngest" icon="clock" href="/wiki/inngest">
    Jobs async e debug
  </Card>
  <Card title="Custos e Pipeline" icon="money-bill" href="/custos-e-fluxo-processamento">
    Custo por API call
  </Card>
</CardGroup>
