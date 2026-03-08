# Core Flow Audit Fix — Pipeline Timeout + Confirmation Race Condition

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two production bugs: (1) Inngest pipeline always times out on Vercel Hobby (10s limit), (2) confirmation page shows "Compra aprovada!" when payment webhook hasn't arrived yet.

**Architecture:** Split the monolithic `process-all` Inngest step into 4 smaller steps that each complete within 10s. Add fetch timeouts (8s) to all external API calls. Add a `confirming_payment` state to the confirmation page that polls until the webhook arrives.

**Tech Stack:** Inngest step functions, AbortController (fetch timeouts), React state machine

---

## Root Cause Analysis

### Bug 1: Pipeline travando em producao

**Sintoma:** Purchases ficam presas em PAID ou PROCESSING infinitamente.

**Causa raiz:** Vercel Hobby tem timeout de 10 segundos por serverless function. O Inngest usa replay-based architecture — cada `step.run()` e uma chamada HTTP separada. O step `process-all` faz TUDO em uma unica chamada:

- APIFull cadastral: 2-5s
- APIFull financial + processos (parallel): 3-10s
- Serper web search: 2-5s
- OpenAI analise x2: 5-15s
- DB save: 1-2s

**Total: 13-37 segundos.** Sempre excede o limite de 10s. Vercel mata a function, Inngest retenta 3x, todas falham, purchase fica presa.

O codigo ate tem um comentario explicando a decisao anterior:
```
// Previous version had 14-16 Inngest steps, each causing a full HTTP replay.
// Collapsing to 3 eliminates ~2-3 min of orchestration overhead.
```

A solucao: dividir `process-all` em 4 steps menores, cada um completando em <10s. Inngest memoiza os resultados entre steps automaticamente — sem perda de dados entre replays.

### Bug 2: Confirmacao mostra "Compra aprovada!" com status PENDING

**Sintoma:** Usuario paga no AbacatePay, e redirecionado para `/compra/confirmacao?code=XXX`, mas ve "Compra aprovada!" mesmo antes do webhook chegar. O progresso fica parado em 0/6 porque nada esta processando ainda.

**Causa raiz:** Race condition. O redirect do AbacatePay (successUrl) acontece ANTES do webhook `checkout.completed` chegar ao servidor. Sequencia:

1. User paga → AbacatePay mostra "confirmado" → redirect para successUrl
2. Pagina busca `GET /api/purchases/XXX` → status = PENDING (webhook nao chegou)
3. Codigo na linha 98: `else { setPageState('approved') }` — PENDING cai no else
4. User ve "Compra aprovada!" + barra de progresso 0/6 + spinner eterno

**Fix:** Adicionar estado `confirming_payment` para quando status = PENDING na pagina de confirmacao (sem param `?cancelled`). Mostrar "Confirmando seu pagamento..." com spinner. Polling a cada 2s ate webhook atualizar para PAID/PROCESSING/COMPLETED.

---

## Task 1: Add fetch timeouts to all external API calls

**Files:**
- Modify: `src/lib/apifull.ts`
- Modify: `src/lib/google-search.ts`
- Modify: `src/lib/openai.ts`
- Test: vitest existing tests should still pass

**Why:** Sem timeout, se uma API externa travar, o step inteiro trava. Com timeout de 8s, a chamada falha rapido e o error handler pode lidar (retry ou fallback null).

**Step 1: Create a shared fetch-with-timeout helper**

Add to `src/lib/apifull.ts` (top of file, before the existing functions):

```typescript
// Fetch with timeout — AbortController + AbortSignal.timeout
// 8s default to stay within Vercel Hobby's 10s function limit
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
```

**Step 2: Replace all `fetch()` calls in apifull.ts with `fetchWithTimeout()`**

There are 4 `fetch()` calls — one per function:
- `consultCpfCadastral` (line 38)
- `consultCpfProcessos` (line 160)
- `consultCpfFinancial` (line 231)
- `consultCnpjDossie` (line 327)
- `consultCnpjFinancial` (line 475)

Replace each `fetch(url, { ... })` with `fetchWithTimeout(url, { ... })`.

**Step 3: Add timeout to google-search.ts**

Read `src/lib/google-search.ts`, find the `fetch()` call to Serper API, add the same pattern. Use `fetchWithTimeout` or inline AbortController.

**Step 4: Add timeout to openai.ts**

Read `src/lib/openai.ts`. OpenAI SDK likely has its own timeout config. Check if `new OpenAI()` accepts a `timeout` option. If yes, set to 15000 (15s — OpenAI analysis can be slower). If using raw fetch, add AbortController.

**Step 5: Run tests**

Run: `npx vitest run`
Expected: All existing tests pass (mocks don't hit real APIs, timeout is irrelevant in mock mode).

**Step 6: Commit**

```bash
git add src/lib/apifull.ts src/lib/google-search.ts src/lib/openai.ts
git commit -m "fix: add 8s fetch timeout to all external API calls (APIFull, Serper, OpenAI)"
```

---

## Task 2: Split Inngest `process-all` into 4 steps

**Files:**
- Modify: `src/lib/inngest/process-search.ts`
- Test: `npx vitest run` (existing tests)

**Why:** Each `step.run()` e uma chamada HTTP separada no Inngest. Vercel Hobby tem 10s de timeout. Dividindo o trabalho em steps menores, cada um completa dentro do limite. Inngest memoiza resultados automaticamente entre replays.

**Step 1: Redesign the step architecture**

Current (2 steps):
```
check-cache → process-all (EVERYTHING: 15-37s) ❌ TIMEOUT
```

New (5 steps):
```
check-cache → fetch-data → fetch-web → analyze-ai → save-result
```

Each step's estimated time:
- `check-cache`: <1s (DB query only)
- `fetch-data`: 3-8s (APIFull cadastral + financial/processos in parallel)
- `fetch-web`: 2-5s (Serper search)
- `analyze-ai`: 5-9s (OpenAI analyze — with 8s timeout this won't hang)
- `save-result`: 1-2s (DB write + purchase update)

**Step 2: Rewrite process-search.ts**

Replace the single `process-all` step with 4 steps. Key points:
- Each step returns serializable data (Inngest memoizes between replays)
- `updateStep()` calls move into the appropriate step
- Error handling in each step marks FAILED + re-throws
- Types need to be explicit since Inngest serializes/deserializes between steps

```typescript
export const processSearch = inngest.createFunction(
  { id: 'process-search', retries: 3 },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { purchaseId, term, type } = event.data

    // ========== Step 1: check-cache ==========
    const cacheResult = await step.run('check-cache', async () => {
      // ... (unchanged — keep existing cache logic)
    })

    if (cacheResult.cached) {
      return { success: true, cached: true, searchResultId: cacheResult.searchResultId }
    }

    // ========== Step 2: fetch-data ==========
    // APIFull calls: cadastral + financial/processos
    const apiData = await step.run('fetch-data', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'PROCESSING', processingStep: 1 },
      })

      if (type === 'CPF') {
        const cadastralData = await consultCpfCadastral(term)
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 2 },
        })

        const [cpfFinancialResult, processosResult] = await Promise.all([
          consultCpfFinancial(term).catch((err) => {
            console.error('CPF Financial error:', err)
            return null
          }),
          consultCpfProcessos(term).catch((err) => {
            console.error('CPF Processos error:', err)
            return { processos: [], totalProcessos: 0 }
          }),
        ])

        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 3 },
        })

        return {
          type: 'CPF' as const,
          name: cadastralData.nome,
          region: cadastralData.enderecos?.[0]?.uf || '',
          cadastralData,
          cpfFinancialData: cpfFinancialResult,
          processosData: processosResult,
          dossieData: null,
          cnpjFinancialData: null,
        }
      } else {
        const dossieData = await consultCnpjDossie(term)
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 2 },
        })

        const cnpjFinancialData = await consultCnpjFinancial(term).catch((err) => {
          console.error('CNPJ Financial error:', err)
          return null
        })

        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { processingStep: 3 },
        })

        return {
          type: 'CNPJ' as const,
          name: dossieData.razaoSocial,
          region: dossieData.endereco?.uf || '',
          cadastralData: null,
          cpfFinancialData: null,
          processosData: null,
          dossieData,
          cnpjFinancialData,
        }
      }
    })

    // ========== Step 3: fetch-web ==========
    const webData = await step.run('fetch-web', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { processingStep: 4 },
      })

      const googleData = await searchWeb(apiData.name, term, type).catch((err) => {
        console.error('Serper error:', err)
        return { byDocument: [], byName: [], reclameAqui: [] }
      })

      return googleData
    })

    // ========== Step 4: analyze-ai ==========
    const aiResult = await step.run('analyze-ai', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { processingStep: 5 },
      })

      // Financial summary (no AI, pure calculation)
      const financialSummary = type === 'CPF'
        ? calculateCpfFinancialSummary(apiData.cpfFinancialData)
        : calculateCnpjFinancialSummary(apiData.cnpjFinancialData)

      // AI 1: Process analysis
      let processAnalysis = []
      if (type === 'CPF' && apiData.processosData?.processos?.length > 0) {
        const result = await analyzeProcessos(apiData.processosData.processos, term)
        processAnalysis = result.processAnalysis
      }

      // AI 2: Mentions + summary
      const mentions = [
        ...(webData?.byDocument || []),
        ...(webData?.byName || []),
        ...(webData?.reclameAqui || []),
      ]

      const summaryResult = await analyzeMentionsAndSummary({
        mentions,
        financialSummary,
        processAnalysis,
        type,
        region: apiData.region,
      }, term)

      return { financialSummary, processAnalysis, summaryResult }
    })

    // ========== Step 5: save-result ==========
    const searchResult = await step.run('save-result', async () => {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { processingStep: 6 },
      })

      // Apply mention classifications to web data
      let googleDataWithClassifications = webData
      if (googleDataWithClassifications && aiResult.summaryResult.mentionClassifications) {
        // ... (classification mapping — copy existing logic)
      }

      // Build data payload
      const dataToSave = type === 'CPF'
        ? {
            cadastral: apiData.cadastralData,
            processos: apiData.processosData,
            financial: apiData.cpfFinancialData,
            financialSummary: aiResult.financialSummary,
            processAnalysis: aiResult.processAnalysis,
            google: googleDataWithClassifications,
            reclameAqui: aiResult.summaryResult.reclameAqui || null,
          }
        : {
            dossie: apiData.dossieData,
            financial: apiData.cnpjFinancialData,
            financialSummary: aiResult.financialSummary,
            google: googleDataWithClassifications,
            reclameAqui: aiResult.summaryResult.reclameAqui || null,
          }

      const jsonData = JSON.parse(JSON.stringify(dataToSave))

      const result = await prisma.searchResult.create({
        data: {
          term,
          type,
          name: apiData.name,
          data: jsonData,
          summary: aiResult.summaryResult.summary,
          expiresAt: getReportExpiresAt(),
        },
      })

      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: 'COMPLETED',
          searchResultId: result.id,
          processingStep: 0,
        },
      })

      return { id: result.id }
    })

    return { success: true, searchResultId: searchResult.id }
  }
)
```

**IMPORTANT:** Wrap the entire function body in a try/catch for the FAILED state update. Each individual step already re-throws on failure (Inngest handles retries). But we need to catch errors in each step and update the purchase to FAILED:

```typescript
// Add to each step.run() that does API calls:
try {
  // ... step logic ...
} catch (error) {
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'FAILED',
      failureReason: 'PROCESSING_ERROR',
      failureDetails: JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        step: 'fetch-data', // step name
        timestamp: new Date().toISOString(),
      }),
    },
  })
  throw error
}
```

**Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass. The mock mode still works because each step runs the same functions.

**Step 4: Commit**

```bash
git add src/lib/inngest/process-search.ts
git commit -m "fix: split Inngest process-all into 4 steps for Vercel Hobby 10s timeout"
```

---

## Task 3: Fix confirmation page race condition (PENDING → "Compra aprovada!")

**Files:**
- Modify: `src/app/compra/confirmacao/page.tsx`

**Why:** Quando AbacatePay redireciona o usuario apos pagamento, o webhook pode nao ter chegado ainda. A pagina mostra "Compra aprovada!" mesmo com status PENDING, confundindo o usuario. Precisa de um estado intermediario "Confirmando pagamento..." que faz polling ate o webhook chegar.

**Step 1: Add `confirming_payment` state**

In `confirmacao/page.tsx`, update the PageState type:

```typescript
type PageState =
  | 'loading'              // Carregando dados
  | 'not_found'            // Codigo invalido
  | 'cancelled'            // Pagamento cancelado pelo usuario
  | 'confirming_payment'   // NEW: Webhook nao chegou ainda, aguardando
  | 'approved'             // Pagamento confirmado, processando relatorio
  | 'completed'            // Relatorio pronto
```

**Step 2: Update state determination logic**

In the `fetchAndProcess` function, change the else branch (line 98):

```typescript
// 3. Determinar estado baseado no status
if (data.status === 'COMPLETED' || data.hasReport) {
  setPageState('completed')
} else if (isCancelled && data.status === 'PENDING') {
  setPageState('cancelled')
} else if (data.status === 'PENDING') {
  // NEW: Webhook nao chegou ainda — aguardar confirmacao
  setPageState('confirming_payment')
} else {
  setPageState('approved') // PAID ou PROCESSING — pagamento ja confirmado
}
```

**Step 3: Add polling for `confirming_payment` state**

Update the polling useEffect to also poll in `confirming_payment` state:

```typescript
React.useEffect(() => {
  if ((pageState !== 'approved' && pageState !== 'confirming_payment') || !purchaseCode) return;

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`/api/purchases/${purchaseCode}`);
      if (!res.ok) return;
      const data = await res.json();
      setPurchaseData(data);

      if (data.status === 'COMPLETED' || data.hasReport) {
        setPageState('completed');
      } else if (data.status === 'PAID' || data.status === 'PROCESSING') {
        // Webhook arrived! Transition to approved
        setPageState('approved');
      }
    } catch {
      // silently ignore polling errors
    }
  }, 2000);

  return () => clearInterval(interval);
}, [pageState, purchaseCode]);
```

**Step 4: Add `confirming_payment` render case**

In `renderContent()`, add a new case before `approved`:

```typescript
case 'confirming_payment':
  return (
    <>
      {/* Spinner */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--primitive-yellow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto'
      }}>
        <Loader2 size={24} color="#000" style={{ animation: 'spin 1s linear infinite' }} />
      </div>

      <h1 style={{
        fontFamily: 'var(--font-family-heading)',
        fontSize: '28px',
        fontWeight: 'var(--primitive-weight-bold)',
        color: 'var(--color-text-primary)',
        marginTop: 'var(--primitive-space-4)',
        marginBottom: 0
      }}>
        Confirmando seu pagamento...
      </h1>

      <p style={{
        fontFamily: 'var(--font-family-body)',
        fontSize: '15px',
        color: 'var(--color-text-secondary)',
        marginTop: 'var(--primitive-space-4)',
        lineHeight: 1.6
      }}>
        Estamos verificando a confirmacao do seu pagamento. Isso geralmente leva alguns segundos.
      </p>

      {/* Codigo */}
      <div style={{
        marginTop: 'var(--primitive-space-4)',
        fontFamily: 'var(--font-family-body)'
      }}>
        <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          Codigo:{' '}
        </span>
        <span style={{ fontSize: '14px', fontWeight: 'var(--primitive-weight-bold)', color: 'var(--color-text-primary)' }}>
          #{purchaseCode}
        </span>
      </div>
    </>
  );
```

**Step 5: Run lint + typecheck**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean output.

**Step 6: Commit**

```bash
git add src/app/compra/confirmacao/page.tsx
git commit -m "fix: add confirming_payment state to handle webhook race condition"
```

---

## Task 4: Add stuck purchase timeout on confirmation page

**Files:**
- Modify: `src/app/compra/confirmacao/page.tsx`

**Why:** Se o webhook nunca chegar (AbacatePay falha, Inngest down), o usuario fica preso em "Confirmando pagamento..." eternamente. Precisamos de um timeout com mensagem util.

**Step 1: Add timeout counter**

```typescript
const [confirmingSeconds, setConfirmingSeconds] = React.useState(0);

React.useEffect(() => {
  if (pageState !== 'confirming_payment') {
    setConfirmingSeconds(0);
    return;
  }

  const timer = setInterval(() => {
    setConfirmingSeconds(prev => prev + 1);
  }, 1000);

  return () => clearInterval(timer);
}, [pageState]);
```

**Step 2: Show timeout message after 60 seconds**

In the `confirming_payment` render case, add after the paragraph:

```typescript
{confirmingSeconds > 60 && (
  <div style={{
    marginTop: 'var(--primitive-space-4)',
    padding: '12px 16px',
    background: 'var(--color-bg-secondary)',
    borderRadius: 'var(--primitive-radius-sm)',
    border: '1px solid var(--color-border-default)',
  }}>
    <p style={{
      fontFamily: 'var(--font-family-body)',
      fontSize: '13px',
      color: 'var(--color-text-secondary)',
      margin: 0,
    }}>
      Esta demorando mais que o esperado. Se voce ja pagou, entre em contato pelo email suporte@eopix.app com o codigo <strong>#{purchaseCode}</strong>.
    </p>
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/app/compra/confirmacao/page.tsx
git commit -m "fix: add 60s timeout message for stuck payment confirmation"
```

---

## Task 5: Verify fixes with E2E tests

**Files:**
- Run: `MOCK_MODE=true npm run test:e2e:mock`

**Why:** Garantir que as mudancas nao quebraram nenhum fluxo existente.

**Step 1: Run unit tests**

Run: `npx vitest run`
Expected: All tests pass (66/66 or similar).

**Step 2: Run lint + typecheck**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean.

**Step 3: Run E2E mock tests**

Run: `npm run test:e2e:mock`
Expected: 26/26 pass. The E2E tests use MOCK_MODE which bypasses payment, so:
- `confirming_payment` state won't appear (bypass sets PAID immediately)
- Split steps work identically in mock mode

**Step 4: Commit test results verification**

No code changes — just verify everything passes.

---

## Task 6: Manual production verification checklist

**No code changes — verification only.**

After deploying to production (merge develop → main):

1. [ ] Check Inngest dashboard: `process-search` function appears
2. [ ] Check Inngest dashboard: verify step names are `check-cache`, `fetch-data`, `fetch-web`, `analyze-ai`, `save-result`
3. [ ] Make a test purchase (real AbacatePay sandbox or prod)
4. [ ] Verify confirmation page shows "Confirmando pagamento..." initially
5. [ ] Verify it transitions to "Compra aprovada!" when webhook arrives
6. [ ] Verify progress bar updates through steps 1-6
7. [ ] Verify report is accessible at `/relatorio/[id]`
8. [ ] Check for any FAILED purchases in admin panel
9. [ ] If any purchase is stuck, use admin mark-paid + process to recover

---

## Summary

| Task | Files | Estimated | Fix |
|------|-------|-----------|-----|
| 1. Fetch timeouts | apifull.ts, google-search.ts, openai.ts | 5 min | 8s timeout em todas as APIs externas |
| 2. Split Inngest steps | process-search.ts | 15 min | 1 step → 4 steps (cada <10s) |
| 3. Confirmation race condition | confirmacao/page.tsx | 5 min | Novo estado `confirming_payment` |
| 4. Stuck purchase timeout | confirmacao/page.tsx | 3 min | Mensagem apos 60s sem confirmacao |
| 5. E2E verification | — | 5 min | vitest + tsc + lint + e2e |
| 6. Production verification | — | 10 min | Checklist manual pos-deploy |

**Total: ~43 min de implementacao.**

### Riscos e mitigacoes

1. **Inngest step serialization**: Dados entre steps devem ser JSON-serializaveis. Os tipos de retorno da APIFull ja sao objetos planos (sem classes/Date objects), entao deve funcionar.

2. **Replay overhead**: Com 5 steps em vez de 2, ha mais HTTP roundtrips (replay). Cada replay adiciona ~500ms-1s. Total adicional: ~2-4s. Aceitavel vs. o pipeline nunca completar.

3. **Error handling entre steps**: Se `fetch-data` falha apos 3 retries, purchase fica FAILED. O admin pode reprocessar via painel. Nao muda vs. comportamento atual (que ja falha, so que silenciosamente).

4. **OpenAI timeout**: Com fetch timeout de 8s, a analise da OpenAI pode nao completar (GPT-4o-mini as vezes leva 10-15s). Alternativa: usar 15s de timeout para OpenAI especificamente, mas isso excede os 10s do Vercel. Solucao: o step `analyze-ai` pode levar ate ~9s (Vercel tem margem ate 10s), e o OpenAI SDK tem timeout proprio. Monitorar em producao.
