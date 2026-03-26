# Phase 3: Alertas de Falha - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Quando uma compra transiciona para FAILED no pipeline Inngest pela **primeira vez**, o operador recebe uma mensagem WhatsApp via Callmebot com: código da compra, CPF/CNPJ mascarado, tipo de erro e link para o admin. Sem duplicatas mesmo com múltiplos retries do Inngest.

Fora de escopo: alertas para outros pontos de falha (webhook AbacatePay, routes admin), configurar alert rules no Sentry (já coberto pela observabilidade da Fase 2).

</domain>

<decisions>
## Implementation Decisions

### Timing do alerta (deduplicação)
- **D-01:** Alertar na **primeira transição** para FAILED — não esperar todos os retries se esgotarem. Razão: operador quer saber imediatamente, não horas depois.
- **D-02:** Deduplicação via status check antes do update: buscar `status` atual da purchase antes de marcar FAILED. Se já estava FAILED (retry seguinte), pular o alerta. Se não estava (primeira falha), enviar.
  ```
  wasAlreadyFailed = currentPurchase.status === 'FAILED'
  await prisma.purchase.update({ status: 'FAILED', ... })
  if (!wasAlreadyFailed) { sendCallmebotAlert(...) }
  ```
- **D-03:** NÃO usar `onFailure` do Inngest (dispararia somente após os 10 retries — muito tarde). NÃO usar campo `alertSent` no banco (evita migration desnecessária).

### Conteúdo da mensagem
- **D-04:** Formato da mensagem (texto, ~160 chars):
  ```
  ⚠️ EOPIX FALHA
  Compra: {code}
  Doc: {CPF/CNPJ mascarado ex: ***.***.456-78 ou **.***.***/0001-**}
  Erro: {failureReason em português}
  Ver: eopix.com.br/admin/compras?search={code}
  ```
- **D-05:** CPF/CNPJ **mascarado** — WhatsApp fica no histórico do celular, dado sensível. O `code` + link já permitem investigar no admin em 1 clique.
- **D-06:** `failureReason` em português legível — mapear os valores do enum (`PROCESSING_ERROR` → "Erro no pipeline", `PAYMENT_EXPIRED` → não alerta, etc.)

### Tratamento de falha do Callmebot
- **D-07:** Fire-and-forget — se o Callmebot falhar (fora do ar, rate limit), logar erro no console e capturar no Sentry, mas **não** deixar isso afetar o status da compra ou o flow do pipeline.
- **D-08:** O erro do Callmebot NÃO deve ser relançado — `.catch(err => console.error('[Callmebot]', err))` + Sentry.captureException silencioso.

### Arquitetura do módulo
- **D-09:** Criar `src/lib/callmebot.ts` — módulo isolado seguindo o mesmo padrão de `src/lib/email.ts` (função exportada, tipagem TypeScript, env vars `CALLMEBOT_API_KEY` e `CALLMEBOT_PHONE`).
- **D-10:** Ponto de chamada: catch block em `src/lib/inngest/process-search.ts` — imediatamente após o `prisma.purchase.update` que marca FAILED, antes do envio do email de denied.
- **D-11:** Variáveis de ambiente necessárias: `CALLMEBOT_API_KEY` e `CALLMEBOT_PHONE`. Se ausentes, logar warning e pular o envio (não lançar erro) — mesmo guard pattern do Sentry.

### O que NÃO fazer
- **D-12:** NÃO alertar para `PAYMENT_EXPIRED` — é erro de negócio esperado, não bug.
- **D-13:** NÃO incluir CPF/CNPJ completo na mensagem.
- **D-14:** NÃO cobrir outros pontos de falha nesta fase (webhook AbacatePay fica para backlog).

### Claude's Discretion
- URL exata da API Callmebot (formato do request, encoding da mensagem)
- Mapeamento completo de `failureReason` → texto legível
- Tratamento de edge case: purchase não encontrada no findUnique antes do update

</decisions>

<specifics>
## Specific Ideas

- Preocupação central da operadora: "ficar preso em um step por falha de API e só saber horas depois". O alerta na primeira transição FAILED resolve isso.
- O link `?search={code}` usa a feature construída na Fase 1 — operadora abre o admin e vê a timeline completa em 1 clique.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ponto de integração principal
- `src/lib/inngest/process-search.ts` — catch block ~linha 376 onde purchase é marcada FAILED; aqui vive o status check + chamada ao Callmebot
- `src/lib/email.ts` — padrão de módulo a seguir (estrutura, guards de env var, tipagem)

### Tipos e domínio
- `src/types/domain.ts` — enum de status da purchase, `PROCESSING_STEPS`
- `prisma/schema.prisma` — campos `status`, `failureReason`, `failureDetails` do model Purchase

### Padrão de observabilidade (Fase 2 — manter consistência)
- `src/lib/inngest/process-search.ts` §Sentry context — padrão `Sentry.withScope()` já em uso; o Callmebot deve seguir o mesmo padrão de fire-and-forget

### Requisito
- `.planning/REQUIREMENTS.md` §OBS-03 — spec desta fase

### Pré-requisitos manuais (fora do código)
- Callmebot: enviar "I allow callmebot to send me messages" para +1 (202) 858-1401 no WhatsApp → obter API key → configurar `CALLMEBOT_API_KEY` e `CALLMEBOT_PHONE` no Vercel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email.ts` — template de módulo: env guard, função exportada, tipagem, fire-and-forget com `.catch()`
- `src/lib/inngest/process-search.ts` — catch block já busca a purchase com `findUnique` (campo `code`, `userId`, `processingStep`) para o Sentry; reutilizar esse resultado para o Callmebot (sem query adicional)

### Established Patterns
- Fire-and-forget: `.then(...).catch(err => console.error('[Module]', err))` — padrão em `process-search.ts` para o email de denied
- Env guards: `if (!process.env.CALLMEBOT_API_KEY) { console.warn('[Callmebot] ...'); return }` — seguir padrão do Sentry
- Import estático no server: `import * as Sentry from '@sentry/nextjs'` — manter consistência

### Integration Points
- `process-search.ts` catch block já tem: `purchaseCode` (do event.data), `failedPurchase` (findUnique com `code`, `processingStep`, `userId`), tipo do documento (`type` do event.data)
- O `failedPurchase.status` precisa ser adicionado ao `select` do findUnique existente para viabilizar o status check de deduplicação

</code_context>

<deferred>
## Deferred Ideas

- Alertas para falha do webhook AbacatePay (purchase fica presa em PAID) — backlog, baixa frequência
- Alertas Sentry (email/Slack rules) — deliberadamente fora desta fase, cobertos pela observabilidade da Fase 2
- Rate limiting do Callmebot (muitas falhas simultâneas) — improvável no volume atual, reavaliar se necessário

</deferred>

---

*Phase: 03-alertas-de-falha*
*Context gathered: 2026-03-26*
