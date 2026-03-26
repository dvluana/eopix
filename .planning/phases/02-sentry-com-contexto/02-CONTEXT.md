# Phase 2: Sentry com Contexto — Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Adicionar contexto estruturado de compra (purchase_code, pipeline_step, document_type, userId) aos erros capturados pelo Sentry nos pontos críticos do sistema. O objetivo é que cada erro no Sentry seja suficiente para identificar a compra afetada sem abrir outro sistema — e que falhas sistêmicas (saldo insuficiente, Inngest unreachable) apareçam no radar antes de acumular compras travadas.

Fora de escopo: configurar alertas Sentry (Phase 3 cobre alertas via Callmebot), instrumentar chamadas individuais de APIFull que já têm fallback gracioso, rotas admin (operador vê erro direto na UI).

</domain>

<decisions>
## Implementation Decisions

### Pontos de Instrumentação
- **D-01:** Instrumentar 5 pontos com `captureException` + `Sentry.withScope()`, separados em duas categorias:

  **Erros por-compra** (impacta 1 cliente, tag `error_category: "pipeline"`):
  1. `src/lib/inngest/process-search.ts` — catch block final (~linha 370) que marca purchase como FAILED
  2. `src/app/api/webhooks/abacatepay/route.ts` — catch block da rota POST (webhook falhou = compra fica PAID para sempre)
  3. `src/app/api/purchases/route.ts` — catch block externo (já tem um interno para checkout, falta o wrapper geral)

  **Erros sistêmicos** (impacta todas as compras, tag `error_category: "infra"`):
  4. `src/lib/inngest/process-search.ts` — `INSUFFICIENT_API_BALANCE` no step `check-balance`: sistema inteiro não processa até saldo ser recarregado
  5. `src/app/api/admin/purchases/[id]/process/route.ts` — falha de `inngest.send()` em produção (não-bypass): compra fica PAID presa, operador não sabe que o Inngest está unreachable

- **D-02:** NÃO instrumentar:
  - `.catch(() => null)` nas chamadas individuais de APIFull (fallback gracioso por design — 1 API falha, pipeline continua)
  - Falhas de email (fire-and-forget, não afeta entrega do relatório)
  - Rotas admin em geral (operador vê o erro HTTP diretamente na UI)
  - `PAYMENT_EXPIRED` (erro de negócio esperado, não é bug)

### Estrutura do Contexto Sentry
- **D-03:** Usar `Sentry.withScope()` em cada capture para não poluir escopo global. Tags variam por categoria:

  **Erros por-compra:**
  ```
  Sentry.withScope(scope => {
    scope.setUser({ id: purchase.userId })
    scope.setTag('error_category', 'pipeline')
    scope.setTag('purchase_code', purchase.code)
    scope.setTag('pipeline_step', stepName)       // ex: 'fetch-data', 'analyze-summary'
    scope.setTag('document_type', type)           // 'CPF' ou 'CNPJ'
    scope.setExtra('purchase_id', purchase.id)
    scope.setExtra('processing_step_number', processingStep)
    Sentry.captureException(error)
  })
  ```

  **Erros sistêmicos:**
  ```
  Sentry.withScope(scope => {
    scope.setTag('error_category', 'infra')
    scope.setTag('infra_type', 'apifull_balance' | 'inngest_unreachable')
    scope.setExtra('detail', error.message)       // ex: 'R$2.50 remaining'
    Sentry.captureException(error)
  })
  ```
- **D-04:** CPF/CNPJ NÃO incluir em nenhum campo Sentry (tags ou extra). Razão: dado sensível sob LGPD; o operador usa `purchase_code` para lookup no admin panel (Phase 1 já construiu isso).
- **D-05:** `purchase_code` como tag (pesquisável/filtrável no dashboard Sentry) — é o elo entre Sentry e o admin panel.

### Alertas Sentry
- **D-06:** Não configurar alert rules no Sentry nesta phase. Phase 3 (Alertas de Falha) cobre notificações ativas via Callmebot WhatsApp. Dois sistemas de alerta para o mesmo evento criam ruído.

### OBS-04 (pré-requisito manual)
- **D-07:** A instrumentação deve funcionar quando `NEXT_PUBLIC_SENTRY_DSN` está presente e ser silenciosa (sem erros) quando ausente — padrão já existe em `instrumentation.ts` e `sentry.server.config.ts`. Manter esse guard.
- **D-08:** `sentry.client.config.ts` não existe ainda — criar junto com a instrumentação server-side para capturar erros de client components.

### Claude's Discretion
- Localização exata do `withScope` no pipeline (inline no catch block ou helper function) — Claude decide o que mantiver o código mais limpo.
- `tracesSampleRate` em prod: manter 0.1 (já configurado em `sentry.server.config.ts`) — sampling de traces é diferente de error capture (erros são 100% capturados por padrão no Sentry).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Sentry no Codebase (ler antes de modificar)
- `sentry.server.config.ts` — configuração atual do server (DSN guard, tracesSampleRate)
- `instrumentation.ts` — ponto de inicialização do Sentry (register + onRequestError)
- `src/app/global-error.tsx` — captura erros genéricos de UI (não modificar)

### Pontos de Instrumentação (ler o código antes de editar)
- `src/lib/inngest/process-search.ts` — pipeline principal; (1) catch block final ~linha 370 para erros por-compra; (2) step `check-balance` ~linha 127 para `INSUFFICIENT_API_BALANCE` sistêmico
- `src/app/api/webhooks/abacatepay/route.ts` — webhook handler; catch block da rota POST; `purchaseCode` já está disponível quando o erro ocorre na maioria dos casos
- `src/app/api/purchases/route.ts` — rota de criação; já tem 1 captureException interno (~linha 341) para checkout error; falta wrapper no outer catch
- `src/app/api/admin/purchases/[id]/process/route.ts` — falha de `inngest.send()` em prod (~linha 70); bloco `else` faz rollback mas não captura no Sentry

### Requirements
- `.planning/REQUIREMENTS.md` §OBS-02 — spec do que deve ser capturado
- `.planning/REQUIREMENTS.md` §OBS-04 — pré-requisito manual (DSN no Vercel)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `@sentry/nextjs` já instalado (package.json)
- `Sentry.captureException` já importado e usado em `purchases/route.ts` — padrão estabelecido
- Guard `if (process.env.NEXT_PUBLIC_SENTRY_DSN)` já usado em `global-error.tsx` e `instrumentation.ts`

### Established Patterns
- Importação dinâmica: `import("@sentry/nextjs").then(Sentry => ...)` em alguns lugares (client-side); import estático `import * as Sentry from '@sentry/nextjs'` no servidor — manter import estático no server
- Async pipeline steps têm acesso a `purchaseId`, `term`, `type` via event.data desde o início do job
- O `purchaseId` no pipeline permite buscar `userId` se necessário, mas pode-se também incluir `userId` no evento `search/process` para evitar query extra

### Integration Points
- Inngest pipeline recebe `{ purchaseId, term, type }` via `event.data` — `purchase.code` precisa ser buscado do DB ou adicionado ao evento
- Webhook já extrai `purchaseCode` antes do catch block — disponível para tag no error
- `purchases/route.ts` tem `purchase.code` disponível após criação da purchase no DB

</code_context>

<specifics>
## Specific Ideas

- Incluir `purchase.code` no evento `search/process` enviado pelo webhook (`purchaseCode` já está sendo enviado!) — verificar que process-search.ts usa esse campo para evitar query extra no catch block.
- Verificar se `sentry.client.config.ts` precisa ser criado do zero (arquivo não existe hoje).

</specifics>

<deferred>
## Deferred Ideas

- Alertas Sentry (email/Slack) — deliberadamente fora desta phase; cobertos por Phase 3 via Callmebot
- Sentry Performance / Tracing por transaction — fora de escopo, não agrega para o caso de uso de investigação de compras
- Breadcrumbs por step do pipeline — nice-to-have, mas tags já resolvem o caso de uso principal

</deferred>

---

*Phase: 02-sentry-com-contexto*
*Context gathered: 2026-03-25*
