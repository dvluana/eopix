# Phase 1: Admin Purchase Timeline - Research

**Researched:** 2026-03-25
**Domain:** Next.js 14 Admin UI — melhorar componente existente (PurchaseDetailsDialog + compras page)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Melhorar o `PurchaseDetailsDialog` existente — não criar página dedicada nova
- **D-02:** A busca permanece na página `/admin/compras` (filtro por código/CPF já existe)
- **D-03:** URL da compra deve ser compartilhável: `/admin/compras?search=Q8HFHZ` abre diretamente com o dialog da compra correspondente
- **D-04:** Timeline inferida dos campos existentes no DB — sem migration, sem nova tabela `PurchaseEvent`
- **D-05:** Campos disponíveis para inferência: `createdAt` (PENDING), `paidAt` (PAID), `updatedAt` (última atualização), `processingStep` (step atual 0-6), `status`, `failureReason`, `failureDetails`, `searchResultId`
- **D-06:** Steps do pipeline sem timestamp preciso (só inferidos do `processingStep` atual) — aceitável para esta fase
- **D-07:** Mostrar timeline de status: PENDING → PAID → PROCESSING → COMPLETED/FAILED com timestamps reais onde disponíveis
- **D-08:** Steps do pipeline (6 steps) com indicação de qual foi o último executado e qual falhou
- **D-09:** Erros aparecem inline na timeline com mensagem legível — usar `failureReason` + `failureDetails` com mapeamento para português
- **D-10:** Mostrar: código da compra, CPF/CNPJ formatado, nome do comprador, email, valor, link para relatório (se existir)

### Claude's Discretion

- Design visual da timeline (vertical vs horizontal, cores, ícones)
- Exato formato de exibição dos timestamps
- Tratamento de edge cases (compra sem `paidAt`, step = 0, etc.)

### Deferred Ideas (OUT OF SCOPE)

- Timestamps precisos por step do pipeline (requer tabela `PurchaseEvent` com migration)
- Link direto `/admin/compras/[id]` como página dedicada — `?search=código` resolve o caso de uso imediato
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OBS-01 | Operador consegue buscar uma compra por código ou CPF/CNPJ no admin e ver timeline completa (status, cada step do pipeline, erros, timestamps) em uma única tela | Mapeado em: melhorias no PurchaseDetailsDialog (timeline, steps, erros inline) + auto-open dialog via URL query param `?id=` |
</phase_requirements>

---

## Summary

Esta fase é pura melhoria de UI/UX sobre código existente, sem backend novo ou migration. O `PurchaseDetailsDialog` já existe com estrutura básica de timeline (seção "Timeline" com `createdAt` e `paidAt`) e seção de "Progresso do Processamento" para status PROCESSING/PAID. O trabalho é expandir e unificar essas seções em uma timeline visual coerente para todos os estados, e adicionar o comportamento de auto-abertura via URL query param.

O backend (`details/route.ts`) já retorna todos os campos necessários: `createdAt`, `paidAt`, `updatedAt`, `processingStep`, `status`, `failureReason`, `failureDetails`, `searchResultId`, `buyerName`, `hasReport`, `reportId`. Nenhuma alteração de API é necessária.

A única lacuna é o `buyerName` que o dialog atual não exibe no Info Grid, e o comportamento de `?id=` para auto-abrir o dialog na page `compras/page.tsx`.

**Primary recommendation:** Modificar `PurchaseDetailsDialog.tsx` para unificar timeline de status + steps do pipeline em uma única seção visual vertical, exibir `buyerName`, link para relatório quando `hasReport=true`, e adicionar `useEffect` na `compras/page.tsx` para ler `?id=` da URL e auto-abrir o dialog correspondente.

---

## Standard Stack

### Core (já no projeto — nenhuma instalação necessária)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (Next.js 14) | State, effects, memoization no dialog | Já instalado |
| Radix UI Dialog | já instalado | Modal/dialog acessível | Já em uso no PurchaseDetailsDialog |
| lucide-react | já instalado | Ícones (CheckCircle, XCircle, Clock, AlertTriangle) | Já em uso |
| next/navigation | Next.js 14 built-in | `useSearchParams` para ler `?id=` da URL | Built-in |

**Nenhuma instalação nova necessária.** Todo o stack já está presente.

---

## Architecture Patterns

### Fluxo atual do dialog

```
compras/page.tsx
  └─ estado: detailsPurchase (Purchase | null)
  └─ menu action "Ver detalhes" → setDetailsPurchase(purchase)
  └─ <PurchaseDetailsDialog purchase={detailsPurchase} ... />
       └─ fetch /api/admin/purchases/[id]/details
       └─ renderiza: Info Grid + Stuck Warning + Processing Progress + Failure Box + Timeline
```

### Padrão de URL compartilhável (D-03)

O `compras/page.tsx` já tem `searchQuery` como estado local. Para `?search=Q8HFHZ` funcionar e abrir o dialog automaticamente:

1. Na montagem, ler `useSearchParams()` → se `?search=X` presente, setar `searchQuery` inicial
2. Após fetch dos dados, se `?id=Y` presente, encontrar purchase com `id === Y` e chamar `setDetailsPurchase`
3. Alternativamente (mais simples per D-03): se apenas um resultado retornar do search (busca exata por código), auto-abrir o dialog desse resultado

Pattern correto para Next.js 14 App Router com `'use client'`:
```typescript
// compras/page.tsx — adicionar no topo
import { useSearchParams, useRouter } from 'next/navigation'

// No componente:
const searchParams = useSearchParams()
const initialSearch = searchParams.get('search') ?? ''
// Setar searchQuery inicial como initialSearch
// Após fetchData retornar 1 resultado e initialSearch estiver setado → auto-abrir dialog
```

### Estrutura da timeline unificada (D-07 + D-08)

Timeline vertical com eventos ordenados cronologicamente. Cada evento tem: ícone de status, label, timestamp (quando disponível).

```
Eventos de status (com timestamps reais):
  ● PENDING   → createdAt          (sempre presente)
  ● PAID      → paidAt             (presente se PAID+)
  ● PROCESSING → paidAt (aprox)    (sem timestamp preciso — D-06)
  ● COMPLETED → updatedAt          (inferido — quando status=COMPLETED)
  ● FAILED    → updatedAt          (inferido — quando status=FAILED)

Steps do pipeline (sem timestamps — inferidos de processingStep):
  step 1-6: completed / in_progress / pending / failed-at
```

Edge cases a tratar:
- `paidAt === null` quando status é PENDING — não mostrar linha PAID
- `processingStep === 0` quando status é PAID — nenhum step iniciado ainda
- Status FAILED com `processingStep > 0` — o step atual é onde falhou
- Status COMPLETED — todos os 6 steps marcados como `completed`
- Status REFUNDED — mostrar transição FAILED/COMPLETED → REFUNDED com `refundReason`

### Localização dos arquivos a modificar

| Arquivo | Tipo de mudança |
|---------|-----------------|
| `src/app/admin/_components/PurchaseDetailsDialog.tsx` | Refactor da seção Timeline + seção Processing Progress → unified timeline visual; adicionar `buyerName` no Info Grid; adicionar link para relatório |
| `src/app/admin/(protected)/compras/page.tsx` | Adicionar leitura de `searchParams` para inicializar `searchQuery` e auto-abrir dialog |
| `src/app/api/admin/purchases/[id]/details/route.ts` | Nenhuma mudança necessária — já retorna todos os campos |

### Anti-Patterns a Evitar

- **Não criar nova API route:** `details/route.ts` já retorna tudo necessário.
- **Não usar `window.location`** para ler query params — usar `useSearchParams()` do Next.js.
- **Não adicionar `'use client'` desnecessário** — `compras/page.tsx` já é client component.
- **Não criar nova tabela ou migration** — D-04 é locked.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Leitura de query params | Parsing manual de `window.location.search` | `useSearchParams()` (next/navigation) | SSR-safe, reativo a mudanças de rota |
| Formatação de datas | `new Date().toLocaleDateString()` manual | `formatDate()` já em `admin-utils.ts` | Consistência com o resto do admin |
| Ícones de status | SVG inline | `lucide-react` já instalado | Já em uso (CheckCircle, AlertTriangle, etc.) |
| Modal/Dialog | `<div>` com z-index manual | Radix UI Dialog já instalado | Acessibilidade, focus trap, já em uso |

---

## Common Pitfalls

### Pitfall 1: `useSearchParams()` requer Suspense boundary no Next.js 14
**What goes wrong:** Componente que usa `useSearchParams()` sem estar wrapped em `<Suspense>` causa erro de build: "useSearchParams() should be wrapped in a suspense boundary".
**Why it happens:** Next.js 14 App Router trata `useSearchParams()` como dynamic, requer Suspense.
**How to avoid:** Extrair a lógica que usa `useSearchParams()` para um sub-componente, wrappear com `<Suspense fallback={null}>` no page.tsx pai. Alternativa: `compras/page.tsx` já é `'use client'` — verificar se o erro ocorre; em alguns casos client components não precisam de Suspense explícito.
**Warning signs:** Build error mencionando Suspense + useSearchParams.

### Pitfall 2: Auto-open dialog com dados ainda carregando
**What goes wrong:** URL tem `?search=Q8HFHZ`, página monta, `fetchData()` é chamado, mas antes dos dados chegarem o código tenta encontrar a purchase no array vazio e não encontra nada — dialog nunca abre.
**Why it happens:** Race condition entre fetch assíncrono e lógica de auto-open.
**How to avoid:** Implementar auto-open no callback de `fetchData()` quando `initialSearch` está presente — após `setData(await res.json())`, verificar se há exatamente 1 resultado e abrir o dialog. Ou usar `useEffect` com dependência em `data` e flag `autoOpenDone`.

### Pitfall 3: Timeline com `updatedAt` enganoso
**What goes wrong:** `updatedAt` muda a cada polling do Inngest (step updates) — usar `updatedAt` como "timestamp de COMPLETED" é válido apenas quando `status === 'COMPLETED'`. Para outros status o valor pode ser recente mas não representar a conclusão.
**Why it happens:** Prisma `@updatedAt` atualiza em qualquer `update`.
**How to avoid:** Só usar `updatedAt` como timestamp do estado final (COMPLETED/FAILED/REFUNDED) — nunca como "última atividade" genérica, pois isso já está coberto pelo `ElapsedTimer`.

### Pitfall 4: `processingStep` = 0 em compras PROCESSING antigas
**What goes wrong:** Compras criadas antes do campo `processingStep` existir ou com step nunca atualizado podem ter `processingStep = 0` mesmo estando em PROCESSING.
**Why it happens:** Campo tem default(0) — sem atualização pelo Inngest, permanece 0.
**How to avoid:** Tratar `processingStep = 0` + status PROCESSING como "iniciando" (nenhum step marcado como in_progress), não como bug.

---

## Code Examples

### Leitura de searchParams em Client Component (Next.js 14)

```typescript
// Source: Next.js 14 docs — useSearchParams em client components
'use client'
import { useSearchParams } from 'next/navigation'

export default function ComprasPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = React.useState(
    searchParams.get('search') ?? ''
  )
  // ...
}
```

### Inferência de timeline a partir dos campos do DB

```typescript
// Sem nova API — inferir eventos a partir dos campos existentes
function buildTimeline(purchase: PurchaseDetails['purchase']) {
  const events = []

  // Sempre presente
  events.push({ status: 'PENDING', label: 'Compra criada', ts: purchase.createdAt, done: true })

  if (purchase.paidAt) {
    events.push({ status: 'PAID', label: 'Pagamento confirmado', ts: purchase.paidAt, done: true })
  }

  if (['PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(purchase.status)) {
    events.push({ status: 'PROCESSING', label: 'Pipeline iniciado', ts: null, done: true })
  }

  if (purchase.status === 'COMPLETED') {
    events.push({ status: 'COMPLETED', label: 'Relatório gerado', ts: purchase.updatedAt, done: true })
  }

  if (purchase.status === 'FAILED') {
    events.push({ status: 'FAILED', label: getFailureMessage(purchase.failureReason), ts: purchase.updatedAt, done: true, error: true })
  }

  if (purchase.status === 'REFUNDED') {
    events.push({ status: 'REFUNDED', label: 'Reembolso processado', ts: purchase.updatedAt, done: true })
  }

  return events
}
```

### Mapeamento de failure reasons para português (já existe, completar)

```typescript
// Já em PurchaseDetailsDialog.tsx — apenas verificar cobertura
const FAILURE_MESSAGES: Record<string, string> = {
  PAYMENT_RISK: 'Reprovado por analise de risco',
  PROCESSING_ERROR: 'Erro durante processamento',
  PROCESSING_TIMEOUT: 'Processamento excedeu 4 horas',
  PAYMENT_EXPIRED: 'Pagamento nao confirmado em 30min',
  // Adicionar outros se existirem no código
}
```

---

## State of the Art

| Old State | Current State | Impact |
|-----------|--------------|--------|
| Timeline básica (só criado + pago como texto simples) | Timeline unificada vertical com status + steps + erros inline | Investigação em uma tela sem Inngest/Vercel |
| Dialog não reage a URL | `?search=código` abre dialog automaticamente | URL compartilhável entre operadores |
| `buyerName` retornado pela API mas não exibido | Exibir no Info Grid | Identificação do comprador |
| Link para relatório não no dialog | Link direto quando `hasReport=true` | Acesso rápido ao output |

---

## Open Questions

1. **Comportamento exato do auto-open via URL**
   - O que sabemos: `?search=Q8HFHZ` já filtra a lista. D-03 diz que deve abrir o dialog.
   - O que está em aberto: abrir quando há 1 resultado exato? Ou adicionar `?id=purchaseId` como param separado?
   - Recommendation: usar `?search=código` (busca por código é única) → se 1 resultado retornar, auto-abrir. Simples, sem param adicional.

2. **Steps do pipeline quando status é FAILED: qual step falhou?**
   - O que sabemos: `processingStep` indica o step atual quando falhou. Ex: `processingStep = 3` + status FAILED → falhou no step 3.
   - O que está em aberto: step 3 foi iniciado e falhou, ou step 2 terminou e step 3 nem começou?
   - Recommendation: tratar `processingStep` como "último step alcançado" — steps < processingStep = completed, step = processingStep + FAILED = failed-at, steps > = não executados. Isso é coerente com como `details/route.ts` funciona para PROCESSING.

---

## Environment Availability

Step 2.6: SKIPPED (sem dependências externas — mudanças são code/UI only, sem novas ferramentas ou serviços).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (unit) + Playwright (E2E) |
| Config file | `vitest.config.ts` (raiz) / `e2e/playwright.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run && npm run test:e2e:mock` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-01 | Timeline exibe eventos de status com timestamps | unit | `npx vitest run tests/unit/timeline.test.ts` | ❌ Wave 0 |
| OBS-01 | `buildTimeline()` edge cases (sem paidAt, step=0, FAILED) | unit | `npx vitest run tests/unit/timeline.test.ts` | ❌ Wave 0 |
| OBS-01 | Auto-open dialog via `?search=code` abre dialog | E2E smoke | `MOCK_MODE=true playwright test e2e/tests/admin-timeline.spec.ts` | ❌ Wave 0 |
| OBS-01 | Erro aparece inline com mensagem em português | E2E | `MOCK_MODE=true playwright test e2e/tests/admin-timeline.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run && MOCK_MODE=true playwright test --config e2e/playwright.config.ts`
- **Phase gate:** Full suite green antes de `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/unit/timeline.test.ts` — unit tests de `buildTimeline()` cobrindo OBS-01 (inferência de eventos, edge cases)
- [ ] `e2e/tests/admin-timeline.spec.ts` — smoke E2E: busca por código → dialog abre → timeline visível → erro legível

*(Testes de lógica pura do `buildTimeline` são os mais valiosos — a função será extraível e testável sem render.)*

---

## Sources

### Primary (HIGH confidence)

- Código fonte lido diretamente: `PurchaseDetailsDialog.tsx`, `details/route.ts`, `compras/page.tsx`, `admin-utils.ts`, `domain.ts`, `schema.prisma` — estado real do código verificado
- CONTEXT.md da fase — decisões locked verificadas

### Secondary (MEDIUM confidence)

- Next.js 14 `useSearchParams` behavior in client components — conhecimento de treinamento, padrão bem estabelecido

---

## Project Constraints (from CLAUDE.md)

Directives obrigatórias que o planner DEVE verificar:

- Trabalhar SEMPRE em `develop` — nenhum commit em `main`
- Tipos centrais em `src/types/domain.ts` e `src/types/report.ts` — não criar tipos duplicados
- Prefira Server Components; `'use client'` só para interatividade — o dialog já é client, manter
- Após edição: atualizar `docs/status.md`
- Validações server-side com Zod — não aplicável aqui (sem nova API route)
- Source of truth de APIs: `docs/api-contracts/` — não aplicável (sem nova integração externa)
- CSS classes `adm-*` para componentes admin (brutalist design, border preta, box-shadow offset)
- `requireAdmin()` em todas as API routes admin — `details/route.ts` já usa, sem mudança necessária

---

## Metadata

**Confidence breakdown:**

- Estado atual do código: HIGH — lido diretamente dos arquivos
- Padrão de URL compartilhável (useSearchParams): HIGH — padrão Next.js 14 estabelecido
- Inferência de timeline dos campos DB: HIGH — campos verificados no schema e na API route
- Design visual da timeline: a definir pelo planner (Claude's Discretion)

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (código estável, sem dependências externas)
