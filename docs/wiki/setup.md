---
title: "Setup & Scripts"
---

## Comandos Principais

| Comando | O que faz |
|---|---|
| `npm run dev` | Next.js + Inngest (MOCK_MODE=true) |
| `npm run dev:live` | Next.js + Inngest (APIs reais) |
| `npm run lint` | ESLint |
| `npx vitest run` | Unit tests |
| `npm run test:e2e` | Playwright E2E (Neon branch real) |
| `npm run test:e2e:mock` | E2E rápido (mock, sem Neon) |
| `npx prisma studio` | DB visual |
| `npx prisma migrate dev` | Aplicar migrations |

## Env Vars

| Variável | Dev | Produção | Descrição |
|---|---|---|---|
| `MOCK_MODE` | `true` | ausente | Mocks todas as APIs |
| `TEST_MODE` | `true` | ausente | APIs reais, sem pagamento |
| `BYPASS_PAYMENT` | `true`/`false` | ausente | Override independente de pagamento |
| `ABACATEPAY_API_KEY` | `abc_dev_*` | `abc_*` | Key da API AbacatePay |
| `ABACATEPAY_WEBHOOK_SECRET` | local | produção | Secret p/ HMAC webhook |
| `DATABASE_URL` | Neon develop | Neon main | Postgres connection |
| `INNGEST_EVENT_KEY` | local | produção | Inngest auth |
| `INNGEST_SIGNING_KEY` | local | produção | Inngest auth |
| `APIFULL_API_KEY` | — | real | APIFull consultas |
| `SERPER_API_KEY` | — | real | Serper web search |
| `OPENAI_API_KEY` | — | real | OpenAI gpt-4o-mini |

## Como Rodar

```bash
# Dev local (zero custo, dados mock)
npm run dev

# Dev com APIs reais + Inngest
npm run dev:live

# Testar checkout AbacatePay sandbox (mock APIs, pagamento real sandbox)
MOCK_MODE=true BYPASS_PAYMENT=false npm run dev
```

## Prisma / Neon

- Branch de trabalho: Neon `develop`
- Produção: Neon `main` (NUNCA rodar migrations aqui diretamente)
- Criar branch Neon via MCP: sempre rodar `prisma migrate deploy` depois (MCP cria do main)

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Modos de teste e E2E
  </Card>
  <Card title="Deploy" icon="rocket" href="/wiki/deploy">
    Como fazer deploy
  </Card>
</CardGroup>
