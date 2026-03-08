# Concurrency + Circuit Breaker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Limitar processSearch a 10 simultâneas, paralelizar OpenAI, e pausar fila quando saldo APIFull estiver baixo.

**Architecture:** Inngest `concurrency` nativo limita slots. Helper `checkApifullBalance()` faz GET no endpoint de saldo antes de chamar APIs. Se saldo < R$20, `step.sleep` pausa 5min e re-tenta (até 10x). OpenAI calls rodam em `Promise.all`.

**Tech Stack:** Inngest v3 concurrency config, APIFull `/api/get-balance`, Vitest

**Design doc:** `docs/plans/2026-03-13-concurrency-circuit-breaker-design.md`

---

### Task 1: Concurrency Limit

**Files:**
- Modify: `src/lib/inngest/process-search.ts:37-41`

**Step 1: Add concurrency config**

Em `process-search.ts`, mudar o config do `createFunction`:

```typescript
// ANTES (linhas 37-41):
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 10,
  },

// DEPOIS:
export const processSearch = inngest.createFunction(
  {
    id: 'process-search',
    retries: 10,
    concurrency: { limit: 10 },
  },
```

**Step 2: Verificar tsc + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean, 72/72 tests pass

**Step 3: Commit**

```bash
git add src/lib/inngest/process-search.ts
git commit -m "feat: add concurrency limit of 10 to processSearch"
```

---

### Task 2: Paralelizar chamadas OpenAI

**Files:**
- Modify: `src/lib/inngest/process-search.ts:188-210`

**Step 1: Reescrever o bloco de AI no step `analyze-ai`**

Em `process-search.ts`, dentro do step `analyze-ai` (linhas 188-210), substituir as chamadas sequenciais por `Promise.all`:

```typescript
// ANTES (linhas 188-210):
        // AI 1: Analyze processos (if any)
        let processAnalysis: ProcessAnalysis[] = []
        if (apiData.type === 'CPF' && apiData.processosData && apiData.processosData.processos.length > 0) {
          const processosResult = await analyzeProcessos(apiData.processosData.processos, term)
          processAnalysis = processosResult.processAnalysis
        }

        // AI 2: Analyze mentions and generate summary
        const mentions = [
          ...(webData?.byDocument || []),
          ...(webData?.byName || []),
          ...(webData?.reclameAqui || []),
        ]

        const summaryResult = await analyzeMentionsAndSummary({
          mentions,
          financialSummary,
          processAnalysis,
          type: apiData.type,
          region: apiData.region,
        }, term)

        return { financialSummary, processAnalysis, summaryResult }

// DEPOIS:
        const mentions = [
          ...(webData?.byDocument || []),
          ...(webData?.byName || []),
          ...(webData?.reclameAqui || []),
        ]

        // Run AI calls in parallel — no dependency between them
        const hasProcessos = apiData.type === 'CPF' && apiData.processosData && apiData.processosData.processos.length > 0

        const [processosResult, summaryResult] = await Promise.all([
          hasProcessos
            ? analyzeProcessos(apiData.processosData!.processos, term)
            : Promise.resolve({ processAnalysis: [] as ProcessAnalysis[] }),
          analyzeMentionsAndSummary({
            mentions,
            financialSummary,
            processAnalysis: [], // summary doesn't depend on process analysis
            type: apiData.type,
            region: apiData.region,
          }, term),
        ])

        const processAnalysis = processosResult.processAnalysis

        return { financialSummary, processAnalysis, summaryResult }
```

**Nota:** `analyzeMentionsAndSummary` recebe `processAnalysis: []` porque o summary não depende dele — o campo é usado apenas para context enrichment que já vem nos `mentions`. Verificar em `src/lib/openai.ts` se `processAnalysis` é realmente usado no prompt de summary.

**Step 2: Verificar se processAnalysis é usado no summary prompt**

Run: `grep -n 'processAnalysis' src/lib/openai.ts | head -20`

Se processAnalysis for usado no prompt de summary, manter sequencial (reverter para versão original). Se não for usado ou for opcional, a paralelização é segura.

**Step 3: Verificar tsc + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean, 72/72 tests pass

**Step 4: Commit**

```bash
git add src/lib/inngest/process-search.ts
git commit -m "perf: parallelize OpenAI calls in processSearch"
```

---

### Task 3: Helper de saldo APIFull

**Files:**
- Create: `src/lib/apifull-balance.ts`
- Test: `tests/lib/apifull-balance.test.ts`

**Step 1: Escrever o teste**

```typescript
// tests/lib/apifull-balance.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Must import AFTER stubbing fetch
const { checkApifullBalance } = await import('@/lib/apifull-balance')

describe('checkApifullBalance', () => {
  beforeEach(() => {
    vi.stubEnv('APIFULL_API_KEY', 'test-key')
    vi.stubEnv('APIFULL_MIN_BALANCE', '')
    mockFetch.mockReset()
  })

  it('returns balance when API responds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dados: { Saldo: 150.5 } }),
    })

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: 150.5, sufficient: true })
  })

  it('returns insufficient when balance below default threshold (20)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dados: { Saldo: 15 } }),
    })

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: 15, sufficient: false })
  })

  it('respects APIFULL_MIN_BALANCE env var', async () => {
    vi.stubEnv('APIFULL_MIN_BALANCE', '50')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dados: { Saldo: 30 } }),
    })

    // Re-import to pick up new env
    const mod = await import('@/lib/apifull-balance')
    const result = await mod.checkApifullBalance()
    expect(result).toEqual({ balance: 30, sufficient: false })
  })

  it('returns sufficient=true when no API key (skip check)', async () => {
    vi.stubEnv('APIFULL_API_KEY', '')

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: -1, sufficient: true })
  })

  it('returns sufficient=true on fetch error (fail open)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await checkApifullBalance()
    expect(result).toEqual({ balance: -1, sufficient: true })
  })
})
```

**Step 2: Rodar teste, confirmar que falha**

Run: `npx vitest run tests/lib/apifull-balance.test.ts`
Expected: FAIL — module not found

**Step 3: Implementar o helper**

```typescript
// src/lib/apifull-balance.ts

interface BalanceResult {
  balance: number
  sufficient: boolean
}

/**
 * Check APIFull account balance.
 * Returns { sufficient: true } if balance >= threshold or if check fails (fail open).
 * Threshold: env APIFULL_MIN_BALANCE or default 20 (covers CNPJ worst case R$18.72).
 */
export async function checkApifullBalance(): Promise<BalanceResult> {
  const apiKey = process.env.APIFULL_API_KEY
  if (!apiKey) {
    return { balance: -1, sufficient: true } // No key = dev mode, skip check
  }

  const threshold = parseFloat(process.env.APIFULL_MIN_BALANCE || '20')

  try {
    const res = await fetch('https://api.apifull.com.br/api/get-balance', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'EOPIX/1.0',
      },
    })

    if (!res.ok) {
      console.warn(`APIFull balance check failed: HTTP ${res.status}`)
      return { balance: -1, sufficient: true } // Fail open
    }

    const data = await res.json()
    const balance = typeof data.dados?.Saldo === 'number'
      ? data.dados.Saldo
      : parseFloat(data.dados?.Saldo || '0')

    return { balance, sufficient: balance >= threshold }
  } catch (err) {
    console.warn('APIFull balance check error:', err)
    return { balance: -1, sufficient: true } // Fail open
  }
}
```

**Step 4: Rodar teste, confirmar que passa**

Run: `npx vitest run tests/lib/apifull-balance.test.ts`
Expected: 5/5 PASS

**Step 5: Commit**

```bash
git add src/lib/apifull-balance.ts tests/lib/apifull-balance.test.ts
git commit -m "feat: add APIFull balance check helper"
```

---

### Task 4: Circuit Breaker no processSearch

**Files:**
- Modify: `src/lib/inngest/process-search.ts:86-92` (início do step `fetch-data`)

**Step 1: Adicionar import e balance check antes das chamadas APIFull**

No topo de `process-search.ts`, adicionar import:

```typescript
import { checkApifullBalance } from '../apifull-balance'
```

Dentro do `try` block, **antes** do step `fetch-data` (linha 86), adicionar um novo step:

```typescript
      // ========== Step 1.5: check-balance ==========
      // Circuit breaker: pause if APIFull balance is too low
      await step.run('check-balance', async () => {
        const { balance, sufficient } = await checkApifullBalance()
        if (!sufficient) {
          console.warn(`APIFull balance too low: R$${balance}. Will retry in 5min.`)
          throw new Error(`INSUFFICIENT_API_BALANCE: R$${balance}`)
        }
      })
```

**Como funciona:** Se o saldo estiver baixo, o step faz `throw`. Inngest faz retry (com backoff exponencial, até 10 retries). Cada retry re-executa `check-balance` (steps anteriores como `check-cache` são memoizados). Se alguém recarregar o saldo, o retry seguinte passa e o processamento continua.

**Step 2: Verificar tsc + tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: tsc clean, todos os tests pass

**Step 3: Commit**

```bash
git add src/lib/inngest/process-search.ts
git commit -m "feat: circuit breaker - pause pipeline when APIFull balance low"
```

---

### Task 5: Verificação final

**Step 1: Rodar todos os checks**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: tsc clean, lint clean, all tests pass

**Step 2: Verificar diff final**

Run: `git diff --stat`

Arquivos esperados:
- `src/lib/inngest/process-search.ts` (concurrency + OpenAI parallel + balance check)
- `src/lib/apifull-balance.ts` (novo helper)
- `tests/lib/apifull-balance.test.ts` (novos testes)
- `docs/plans/2026-03-13-concurrency-circuit-breaker-design.md`
- `docs/plans/2026-03-13-concurrency-circuit-breaker.md`
