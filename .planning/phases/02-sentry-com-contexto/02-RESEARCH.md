# Phase 2: Sentry com Contexto — Research

**Researched:** 2026-03-25
**Domain:** Sentry SDK (@sentry/nextjs) — structured error context, scoped captures
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: 5 instrumentation points in two categories:**

Erros por-compra (tag `error_category: "pipeline"`):
1. `src/lib/inngest/process-search.ts` — catch block final (~linha 370)
2. `src/app/api/webhooks/abacatepay/route.ts` — catch block do POST
3. `src/app/api/purchases/route.ts` — outer catch (falta o wrapper geral)

Erros sistêmicos (tag `error_category: "infra"`):
4. `src/lib/inngest/process-search.ts` — `INSUFFICIENT_API_BALANCE` no step `check-balance`
5. `src/app/api/admin/purchases/[id]/process/route.ts` — falha de `inngest.send()` em prod (bloco else ~linha 79)

**D-02: NÃO instrumentar:** `.catch(() => null)` de APIFull (graceful fallback), falhas de email (fire-and-forget), rotas admin (UI mostra direto), `PAYMENT_EXPIRED` (erro de negócio esperado).

**D-03: Estrutura de contexto Sentry:**
- Por-compra: `scope.setUser({ id: purchase.userId })`, tags `error_category`, `purchase_code`, `pipeline_step`, `document_type`; extras `purchase_id`, `processing_step_number`
- Sistêmico: tags `error_category: "infra"`, `infra_type`; extra `detail`

**D-04: CPF/CNPJ NÃO incluir em nenhum campo Sentry** (dado sensível, LGPD). Operador usa `purchase_code` para lookup.

**D-05: `purchase_code` como tag** (pesquisável no dashboard Sentry).

**D-06: Não configurar alert rules no Sentry** nesta phase (Phase 3 cobre via Callmebot).

**D-07: Guard `NEXT_PUBLIC_SENTRY_DSN`** — instrumentação silenciosa quando DSN ausente. Padrão já existe, manter.

**D-08: `sentry.client.config.ts` já existe** (verificado no codebase — criado anteriormente). Não criar de novo.

### Claude's Discretion
- Localização exata do `withScope` (inline vs helper function) — Claude decide o que mantiver código mais limpo.
- `tracesSampleRate` em prod: manter 0.1 (já configurado).

### Deferred Ideas (OUT OF SCOPE)
- Alertas Sentry (email/Slack) — Phase 3
- Sentry Performance / Tracing por transaction
- Breadcrumbs por step do pipeline
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OBS-02 | Sentry configurado com contexto completo (purchase code, user ID, pipeline step, status) em todos os erros do pipeline Inngest e API routes | `Sentry.withScope()` + tags estruturadas nos 5 pontos identificados em D-01 |
| OBS-04 | Sentry com DSN real configurado no Vercel (pré-requisito manual: criar conta sentry.io) | Guard já existe em `sentry.server.config.ts` e `instrumentation.ts`; implementação de código funciona sem DSN (silenciosa); a task do planner deve incluir instrução de pré-requisito manual |
</phase_requirements>

---

## Summary

A phase é essencialmente uma operação de instrumentação cirúrgica: adicionar `Sentry.withScope()` em 5 pontos específicos do codebase sem alterar fluxo de negócio. A complexidade real é baixa — `@sentry/nextjs` já está instalado e o padrão `captureException` já existe em `purchases/route.ts`.

O principal valor da pesquisa foi **verificar o estado atual do código** em cada ponto de instrumentação para que o planner saiba exatamente onde inserir cada bloco, quais variáveis já estão disponíveis, e o que falta.

**Primary recommendation:** Adicionar `Sentry.withScope()` inline nos catch blocks existentes usando import estático `import * as Sentry from '@sentry/nextjs'` no server. Estrutura de contexto definida em D-03 é suficiente — não criar helper function (overhead desnecessário para 5 pontos).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @sentry/nextjs | já instalado | SDK Next.js com suporte a App Router, Inngest, Edge | Já no package.json; padrão estabelecido no projeto |

**Não instalar nada.** Todas as dependências já estão presentes.

---

## Architecture Patterns

### Padrão Estabelecido no Projeto

O padrão já usado em `purchases/route.ts` (~linha 341):

```typescript
// Source: src/app/api/purchases/route.ts (linha 341 — existente)
import * as Sentry from '@sentry/nextjs'

Sentry.captureException(checkoutError, {
  tags: { service: provider, operation: 'createCheckout' },
  extra: { code, term: cleanedTerm, email },
})
```

### Padrão a Adotar: withScope para Contexto Estruturado

`withScope` isola o contexto para não contaminar outros eventos:

```typescript
// Source: CONTEXT.md D-03 (decisão do usuário)
import * as Sentry from '@sentry/nextjs'

// Para erros por-compra (pipeline):
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

// Para erros sistêmicos (infra):
Sentry.withScope(scope => {
  scope.setTag('error_category', 'infra')
  scope.setTag('infra_type', 'apifull_balance' | 'inngest_unreachable')
  scope.setExtra('detail', error instanceof Error ? error.message : String(error))
  Sentry.captureException(error)
})
```

### DSN Guard (manter padrão existente)

```typescript
// NÃO fazer: if (process.env.NEXT_PUBLIC_SENTRY_DSN) { Sentry.withScope(...) }
// O SDK já é no-op quando não inicializado — guard é desnecessário nos pontos de capture.
// O guard existe APENAS em sentry.server.config.ts e instrumentation.ts (inicialização).
```

Verificado: `@sentry/nextjs` quando não inicializado (sem DSN) simplesmente descarta calls — `captureException` e `withScope` são no-op. Portanto, NÃO é necessário guard nas chamadas individuais de capture.

---

## Estado Atual de Cada Ponto de Instrumentação

### Ponto 1: `process-search.ts` — Catch Block Final (por-compra)

**Localização:** `src/lib/inngest/process-search.ts`, linha ~366
**Código atual:**
```typescript
} catch (error) {
  console.error('Process search error:', error)
  const failedPurchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    select: { processingStep: true },
  })
  await prisma.purchase.update({ ... status: 'FAILED' ... })
  // <-- INSERIR Sentry.withScope() AQUI antes do throw
  throw error
}
```

**Variáveis disponíveis:** `purchaseId` (do `event.data`), `type` (do `event.data`), `failedPurchase.processingStep`.
**O que falta:** `purchase.code` e `purchase.userId`. O evento `search/process` já carrega `purchaseCode` (verificado em `webhooks/abacatepay/route.ts` linha 251 — campo `purchaseCode: purchase.code` no send). Verificar se `process-search.ts` usa `event.data.purchaseCode` — se sim, disponível direto. Se não, ou buscar no DB (já tem query `failedPurchase`) ou adicionar `userId` ao evento.

**Ação do planner:** Verificar se `event.data.purchaseCode` está acessível. Expandir a query `failedPurchase` para incluir `{ processingStep: true, code: true, userId: true }` para evitar query extra.

**Step name para tag:** Usar o `processingStep` numérico → mapear para nome descritivo usando `PROCESSING_STEPS` de `src/types/domain.ts` ou simplesmente usar o número como string.

### Ponto 2: `webhooks/abacatepay/route.ts` — Catch Block POST (por-compra)

**Localização:** `src/app/api/webhooks/abacatepay/route.ts`, linha ~154
**Código atual:**
```typescript
} catch (error) {
  console.error('[AbacatePay Webhook] Error:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

**Variáveis disponíveis quando erro ocorre:** `purchaseCode` pode ou não estar definido (depende de onde no try o erro ocorre). Se o erro é pré-`purchaseCode`, a variável é `null`. Usar `purchaseCode ?? 'unknown'` para a tag.

**Ação do planner:** Adicionar `import * as Sentry from '@sentry/nextjs'` (não está importado atualmente) e inserir `withScope` no catch com `purchase_code: purchaseCode ?? 'unknown'`.

### Ponto 3: `purchases/route.ts` — Outer Catch (por-compra)

**Localização:** `src/app/api/purchases/route.ts`, linha ~353
**Código atual:**
```typescript
} catch (error) {
  console.error('Create purchase error:', error)
  return NextResponse.json({ error: 'Erro ao criar compra' }, { status: 500 })
}
```

**Variáveis disponíveis:** No outer catch, `purchase` pode não ter sido criada ainda (erro antes do INSERT). Contexto disponível: `cleanedTerm`, `type` (derivado do length), session do usuário (se disponível). `purchase.code` pode não existir. Usar session.userId se disponível.

**Ação do planner:** Adicionar `withScope` com o que estiver disponível — `document_type` (de `cleanedTerm.length`), `userId` da sessão se obtida antes do catch.

**Nota:** `Sentry` já está importado neste arquivo (linha 341 usa `Sentry.captureException`).

### Ponto 4: `process-search.ts` — `INSUFFICIENT_API_BALANCE` (sistêmico)

**Localização:** `src/lib/inngest/process-search.ts`, linha ~128-134
**Código atual:**
```typescript
await step.run('check-balance', async () => {
  const { balance, sufficient } = await checkApifullBalance()
  if (!sufficient) {
    console.warn(`APIFull balance too low: R$${balance}. Will retry in 5min.`)
    throw new Error(`INSUFFICIENT_API_BALANCE: R$${balance}`)
  }
})
```

**Onde capturar:** O `throw` dentro de `step.run` propaga para o catch final (Ponto 1). Detectar `INSUFFICIENT_API_BALANCE` no catch final e usar tag `infra_type: 'apifull_balance'`.

**Alternativa:** Capturar inline no `step.run` antes do throw. Mas o catch final já existe e reaproveitar é mais limpo — verificar se a mensagem do erro contém `INSUFFICIENT_API_BALANCE` para bifurcar `error_category`.

**Ação do planner:** No catch final (Ponto 1), detectar se `error.message.includes('INSUFFICIENT_API_BALANCE')` para decidir entre context pipeline vs. context infra.

### Ponto 5: `admin/purchases/[id]/process/route.ts` — `inngest.send()` falha (sistêmico)

**Localização:** linha ~69-92
**Código atual:**
```typescript
} catch (err) {
  console.error('Failed to trigger Inngest job:', err)
  if (isBypassMode || process.env.INNGEST_DEV === 'true') {
    // sync fallback (não capturar no Sentry — esperado em dev)
  } else {
    // rollback status → PAID
    // <-- INSERIR Sentry.withScope() AQUI (bloco else, produção)
    return NextResponse.json({ error: ... }, { status: 500 })
  }
}
```

**Variáveis disponíveis:** `purchase.code`, `purchase.id`, `err`.
**Ação do planner:** Adicionar `import * as Sentry from '@sentry/nextjs'` e `withScope` no bloco `else` (apenas em produção — isBypassMode já garante o filtro).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error context isolation | Custom scope management | `Sentry.withScope()` | SDK já gerencia stack de scopes corretamente |
| Error deduplication | Fingerprinting manual | Sentry default fingerprinting | Baseado em stack trace — funciona bem para esses erros |
| Sentry initialization guard | Check manual em cada capture | SDK no-op quando não inicializado | `captureException` é seguro mesmo sem init |

---

## Common Pitfalls

### Pitfall 1: Import dinâmico no servidor
**What goes wrong:** Usar `import("@sentry/nextjs").then(Sentry => ...)` no servidor dentro de um catch async — o `await` pode não completar se o processo encerrar.
**Why it happens:** O padrão de `sentry.server.config.ts` usa dynamic import para inicialização lazy. Mas em catch blocks de handlers HTTP e Inngest, o contexto persiste tempo suficiente.
**How to avoid:** Usar import estático `import * as Sentry from '@sentry/nextjs'` em todos os arquivos server-side que precisam de `captureException`. O SDK faz no-op quando não inicializado — não há custo.

### Pitfall 2: Contaminar escopo global
**What goes wrong:** Usar `Sentry.setTag()` ou `Sentry.setUser()` no nível global em vez de `withScope` — tags de uma request vazam para outra em ambientes com request concorrentes.
**How to avoid:** Sempre `Sentry.withScope(scope => { ... Sentry.captureException(error) })` nos pontos de instrumentação.

### Pitfall 3: `purchaseCode` indisponível no catch
**What goes wrong:** `purchaseCode` é extraído dentro do try — se o erro ocorre antes, a variável não existe no catch.
**How to avoid:** Declarar `let purchaseCode: string | null = null` antes do try e atribuir o mais cedo possível. Usar `purchaseCode ?? 'unknown'` nas tags.

### Pitfall 4: CPF/CNPJ em `extra` por acidente
**What goes wrong:** Incluir `term` no `extra` do Sentry — viola LGPD.
**How to avoid:** Nunca passar `term` (CPF/CNPJ) para nenhum campo Sentry. Operador usa `purchase_code` para lookup no admin.

### Pitfall 5: `sentry.client.config.ts` — já existe
**What goes wrong:** CONTEXT.md menciona "criar" o arquivo, mas ele já existe no codebase (verificado via glob). Recriar sobrescreveria a configuração atual com Replay integration.
**How to avoid:** NÃO criar. O arquivo já existe com configuração de Replay. Apenas verificar que o DSN guard está presente (está).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/unit/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-02 | `withScope` captura exception com tags corretas | unit | `npx vitest run tests/unit/sentry-context.test.ts -x` | ❌ Wave 0 |
| OBS-02 | Sentry não captura quando DSN ausente (no-op) | unit | incluído no mesmo arquivo | ❌ Wave 0 |
| OBS-04 | DSN guard — inicialização silenciosa sem DSN | manual | verificar Vercel env vars | manual-only |

**OBS-04 é pré-requisito manual** — não automatizável via testes de código. A task do planner deve incluir checklist de verificação manual (DSN configurado no Vercel, evento de teste chega ao Sentry).

### Sampling Rate
- **Per task commit:** `npx vitest run tests/unit/sentry-context.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green antes de `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/sentry-context.test.ts` — testes de mock do Sentry SDK, verificação das tags por ponto

**Estratégia de teste:** Mock `@sentry/nextjs` com `vi.mock()`, verificar que `withScope` e `captureException` são chamados com os argumentos corretos em cada ponto de instrumentação. As funções de instrumentação podem ser testadas em isolamento se extraídas para helpers, mas dado que o planner pode optar por inline, o teste pode exercer a lógica do catch block via mocks de dependências (Prisma, Inngest).

---

## Environment Availability

Step 2.6: SKIPPED — phase é puramente code change. `@sentry/nextjs` já instalado. Não há dependências externas novas. OBS-04 (DSN no Vercel) é pré-requisito manual documentado, não uma dependência de runtime para desenvolvimento local.

---

## Open Questions

1. **`purchaseCode` em `event.data` do Inngest**
   - What we know: Webhook envia `purchaseCode: purchase.code` no `inngest.send()` (verificado em `webhooks/abacatepay/route.ts` linha 251). Admin process route também envia `purchaseCode`.
   - What's unclear: Se `process-search.ts` desestrutura `purchaseCode` de `event.data` — verificar linha 51 (`const { purchaseId, term, type } = event.data`). Se não desestrutura, adicionar ao destructuring.
   - Recommendation: Planner deve verificar e expandir o destructuring se necessário. Custo: 1 linha.

2. **`userId` disponível no catch do pipeline**
   - What we know: `purchaseId` está disponível. A query `failedPurchase` já vai ao DB.
   - What's unclear: Se é melhor incluir `userId` no evento `search/process` (evita query extra) ou expandir a query existente.
   - Recommendation: Expandir a query `failedPurchase` para `{ processingStep: true, code: true, userId: true }` — mais simples, sem alterar contrato do evento Inngest.

---

## Sources

### Primary (HIGH confidence)
- Código fonte lido diretamente: `sentry.server.config.ts`, `sentry.client.config.ts`, `instrumentation.ts`, `src/lib/inngest/process-search.ts` (linhas 1-150, 340-405), `src/app/api/webhooks/abacatepay/route.ts`, `src/app/api/admin/purchases/[id]/process/route.ts`, `src/app/api/purchases/route.ts` (linhas 320-360)
- `.planning/phases/02-sentry-com-contexto/02-CONTEXT.md` — decisões do usuário
- `.planning/REQUIREMENTS.md` — OBS-02, OBS-04

### Secondary (MEDIUM confidence)
- `@sentry/nextjs` SDK behavior (no-op sem init) — conhecimento documentado, confirmado pelo padrão de guard no projeto

---

## Metadata

**Confidence breakdown:**
- Estado atual do código: HIGH — lido diretamente
- Padrão withScope: HIGH — decidido pelo usuário em D-03
- Comportamento no-op do SDK: HIGH — padrão estabelecido no projeto
- Estratégia de teste: MEDIUM — estrutura do mock precisa ser validada na implementação

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (estável — sem dependências de APIs externas)
