# Design: Concurrency + Circuit Breaker para processSearch

**Data:** 2026-03-13
**Status:** Aprovado

## Problema

O pipeline `processSearch` não tem limite de concorrência. Com 20-50 compras simultâneas (cenário de pico com marketing ativo), riscos:

1. **Inngest Free tier**: ~25 runs simultâneas max, compras acima disso acumulam delay
2. **Saldo APIFull**: cada compra CPF gasta ~R$11,90, CNPJ ~R$18,72. 50 compras = ~R$600-900
3. **OpenAI rate limits**: 2 chamadas sequenciais por compra, ~100 requests em pico
4. **Serper**: free tier 2.500/mês, pico consome rápido

## Solução

### 1. Concurrency Limit (Inngest nativo)

Adicionar `concurrency: { limit: 10 }` no `createFunction` do `processSearch`.

- Inngest gerencia a fila automaticamente
- Compras além do limite esperam, não são descartadas
- Pior caso compra #50: ~5min de espera

### 2. Paralelizar chamadas OpenAI

Hoje `analyzeProcessos()` e `analyzeMentionsAndSummary()` rodam sequencialmente (~3s).
Sem dependência entre elas → `Promise.all` reduz para ~1.5s.

### 3. Circuit Breaker — Check de saldo APIFull

Antes de chamar APIs da APIFull, verificar saldo:

- Se saldo < R$20 (`APIFULL_MIN_BALANCE`, default 20): `step.sleep('wait-for-balance', '5m')`
- Inngest re-executa em 5min (até max retries = 10, ~50min de tentativas)
- Se esgotar retries → FAILED com motivo `INSUFFICIENT_API_BALANCE`
- Threshold R$20 cobre o pior caso (CNPJ = R$18,72) com margem

### Custos de referência (docs/custos-e-fluxo-processamento.md)

| Tipo | Custo APIFull |
|------|-------------|
| CPF  | R$ 0,80 + R$ 4,14 + R$ 6,96 = R$ 11,90 |
| CNPJ | R$ 11,76 + R$ 6,96 = R$ 18,72 |

## Mudanças

| Mudança | Arquivo | Complexidade |
|---------|---------|-------------|
| Concurrency limit 10 | `src/lib/inngest/process-search.ts` | 1 linha |
| Paralelizar OpenAI | `src/lib/inngest/process-search.ts` | ~10 linhas |
| Check saldo APIFull | `src/lib/inngest/process-search.ts` + helper | ~30 linhas |
| Env var `APIFULL_MIN_BALANCE` | `.env` | 1 linha |

**Arquivos afetados**: apenas `process-search.ts` e helper de saldo. Zero mudanças em frontend, webhook, ou schema.
