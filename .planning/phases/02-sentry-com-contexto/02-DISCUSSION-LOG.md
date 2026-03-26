# Phase 2: Sentry com Contexto — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 02-sentry-com-contexto
**Areas discussed:** Escopo de instrumentação, Estrutura do contexto, Erros esperados vs bugs reais, Alertas

---

## Modo de Discussão

O usuário solicitou que Claude estudasse o código, entendesse o produto, cruzasse com padrões de mercado e propusesse recomendações — sem interrogatório. Claude fez análise profunda do pipeline (process-search.ts), webhook handler, e purchases/route.ts antes de apresentar.

---

## Escopo de Instrumentação

| Option | Description | Selected |
|--------|-------------|----------|
| 3 pontos críticos (pipeline + webhook + purchases) | Cobertura completa dos erros que afetam clientes | ✓ |
| Adicionar alertas Sentry também | Além dos 3 pontos, configurar alert rule | |
| Só pipeline, webhook pode esperar | Escopo reduzido | |

**User's choice:** Sim, exatamente os 3 pontos. Alertas ficam para Phase 3 (Callmebot WhatsApp).

---

## CPF/CNPJ no Sentry

| Option | Description | Selected |
|--------|-------------|----------|
| Não incluir — purchase_code basta | LGPD: dado sensível, operador usa admin panel para lookup | ✓ |
| Incluir mascarado no extra | term_suffix='282-40', facilita correlação | |
| Incluir completo no extra | Máximo contexto, mas risco LGPD | |

**User's choice:** Não incluir. `purchase_code` é o elo com o admin panel (Phase 1 já construiu a busca por código).

---

## Claude's Discretion

- Localização exata do withScope (inline vs helper)
- Manter tracesSampleRate: 0.1 em prod (já configurado)
- Criar sentry.client.config.ts junto com a instrumentação

## Deferred Ideas

- Alertas Sentry (email/Slack) — Phase 3 cobre com Callmebot
- Sentry Performance/Tracing
- Breadcrumbs por step
