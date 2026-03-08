# Serper Query Improvement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve Serper web search queries so results include real news articles instead of only legal/cadastral databases, and enhance OpenAI prompt to classify source types.

**Architecture:** Add `simplifyCompanyName()` for CNPJ, add locale params (`gl: 'br'`, `hl: 'pt-br'`), improve `byName` search terms, add 4th `news` query (open search by name only), and enhance OpenAI prompt to classify sources as news/legal/complaint/government/other.

**Tech Stack:** TypeScript, Serper API, OpenAI gpt-4o-mini, Vitest

---

### Task 1: Add `news` field to types

**Files:**
- Modify: `src/types/report.ts:205-216`

**Step 1: Add `sourceType` to `GoogleSearchResult` and `news` to `GoogleSearchResponse`**

```typescript
export interface GoogleSearchResult {
  title: string
  url: string
  snippet: string
  classification?: 'positive' | 'neutral' | 'negative'
  sourceType?: 'news' | 'legal' | 'complaint' | 'government' | 'other'
}

export interface GoogleSearchResponse {
  byDocument: GoogleSearchResult[]  // Busca por CPF/CNPJ formatado
  byName: GoogleSearchResult[]      // Busca por nome + termos de risco
  reclameAqui: GoogleSearchResult[] // Busca Reclame Aqui (CPF e CNPJ)
  news: GoogleSearchResult[]        // Busca aberta por nome (sem filtros)
}
```

**Step 2: Run tsc to verify no breakage**

Run: `npx tsc --noEmit`
Expected: Errors in files that destructure `GoogleSearchResponse` without `news` — these are fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add src/types/report.ts
git commit -m "feat: add news field to GoogleSearchResponse and sourceType to GoogleSearchResult"
```

---

### Task 2: Rewrite `google-search.ts` — simplifyCompanyName + locale + 4 queries

**Files:**
- Modify: `src/lib/google-search.ts`
- Create: `tests/lib/google-search.test.ts`

**Step 1: Write tests for `simplifyCompanyName`**

```typescript
import { describe, it, expect } from 'vitest'
import { simplifyCompanyName } from '@/lib/google-search'

describe('simplifyCompanyName', () => {
  it('removes S/A suffix', () => {
    expect(simplifyCompanyName('BANCO MASTER S/A')).toBe('Banco Master')
  })

  it('removes S.A. suffix', () => {
    expect(simplifyCompanyName('PETROBRAS S.A.')).toBe('Petrobras')
  })

  it('removes LTDA suffix', () => {
    expect(simplifyCompanyName('COMERCIO SILVA LTDA')).toBe('Comercio Silva')
  })

  it('removes EM LIQUIDACAO EXTRAJUDICIAL', () => {
    expect(simplifyCompanyName('BANCO MASTER S/A - EM LIQUIDACAO EXTRAJUDICIAL')).toBe('Banco Master')
  })

  it('removes EM RECUPERACAO JUDICIAL', () => {
    expect(simplifyCompanyName('EMPRESA XYZ LTDA - EM RECUPERACAO JUDICIAL')).toBe('Empresa Xyz')
  })

  it('removes ME, MEI, EIRELI, EPP', () => {
    expect(simplifyCompanyName('JOAO SILVA ME')).toBe('Joao Silva')
    expect(simplifyCompanyName('MARIA SANTOS MEI')).toBe('Maria Santos')
    expect(simplifyCompanyName('TECH CORP EIRELI')).toBe('Tech Corp')
    expect(simplifyCompanyName('LOJA LEGAL EPP')).toBe('Loja Legal')
  })

  it('removes trailing dash and spaces', () => {
    expect(simplifyCompanyName('EMPRESA ABC - ')).toBe('Empresa Abc')
  })

  it('converts to title case', () => {
    expect(simplifyCompanyName('BANCO DO BRASIL S.A.')).toBe('Banco Do Brasil')
  })

  it('handles already clean names', () => {
    expect(simplifyCompanyName('GOOGLE')).toBe('Google')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/google-search.test.ts`
Expected: FAIL — `simplifyCompanyName` is not exported.

**Step 3: Implement `simplifyCompanyName` and update `searchWeb`**

In `google-search.ts`, add the function and update `executeSearch` + `searchWeb`:

```typescript
// Add after isChuvaScenario function:

/**
 * Simplifica razao social para buscas mais eficazes.
 * Remove sufixos juridicos (S/A, LTDA, etc.) e status (EM LIQUIDACAO, etc.)
 * Converte para title case.
 */
export function simplifyCompanyName(name: string): string {
  let simplified = name
    // Remove status juridicos (antes dos sufixos para pegar "S/A - EM LIQUIDACAO")
    .replace(/\s*-?\s*EM\s+(LIQUIDACAO\s+EXTRAJUDICIAL|RECUPERACAO\s+JUDICIAL|FALENCIA)\s*/gi, '')
    // Remove sufixos juridicos
    .replace(/\s+(S\/A|S\.A\.|SA|LTDA|ME|MEI|EIRELI|EPP)\.?\s*$/gi, '')
    // Remove tracos e espacos finais
    .replace(/[\s-]+$/, '')
    .trim()

  // Title case
  simplified = simplified
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return simplified
}
```

Update `executeSearch` to add locale params:

```typescript
async function executeSearch(query: string): Promise<GoogleSearchResult[]> {
  // ... (keep apiKey check)

  const res = await fetchWithTimeout('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 10, gl: 'br', hl: 'pt-br' }),
  })

  // ... (rest stays the same)
}
```

Update `searchWeb` to use 4 queries:

```typescript
export async function searchWeb(
  name: string,
  document: string,
  type: 'CPF' | 'CNPJ'
): Promise<GoogleSearchResponse> {
  if (isMockMode) {
    // ... (keep mock logic, add news: [] to return — handled in Task 4)
  }

  const formattedDoc = type === 'CPF'
    ? document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  // Simplificar nome para CNPJ (remover S/A, LTDA, EM LIQUIDACAO, etc.)
  const searchName = type === 'CNPJ' ? simplifyCompanyName(name) : name

  // Executar 4 buscas em paralelo
  const [byDocument, byName, reclameAqui, news] = await Promise.all([
    // Busca 1: Por documento formatado
    executeSearch(`"${formattedDoc}"`),

    // Busca 2: Por nome + termos de risco
    executeSearch(`"${searchName}" escândalo OR investigação OR denúncia OR irregularidade OR fraude OR lavagem`),

    // Busca 3: Reclame Aqui
    executeSearch(`"${searchName}" site:reclameaqui.com.br`),

    // Busca 4: Busca aberta por nome (sem filtros — Google retorna os mais relevantes)
    executeSearch(`"${searchName}"`),
  ])

  console.log(`🔍 Serper: byDocument=${byDocument.length}, byName=${byName.length}, reclameAqui=${reclameAqui.length}, news=${news.length}`)

  return { byDocument, byName, reclameAqui, news }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/google-search.test.ts`
Expected: PASS

**Step 5: Run tsc**

Run: `npx tsc --noEmit`
Expected: Errors in mocks (missing `news` field) — fixed in Task 4.

**Step 6: Commit**

```bash
git add src/lib/google-search.ts tests/lib/google-search.test.ts
git commit -m "feat: simplifyCompanyName + locale params + 4th news query in Serper"
```

---

### Task 3: Update OpenAI prompt to classify source types

**Files:**
- Modify: `src/lib/openai.ts:184-238`

**Step 1: Add `sourceType` to the prompt output schema**

In `analyzeMentionsAndSummary`, update the prompt's TAREFA 1 section:

```
TAREFA 1 - CLASSIFICAR MENCOES:
O ${type} e da regiao ${region}. Ignore homonimos de outras regioes.

Para cada mencao na web:
- relevant: true se e sobre a pessoa/empresa consultada, false se for homonimo
- classification: positive | neutral | negative
- sourceType: identifique o tipo de fonte:
  - "news": portal de noticia ou jornalismo (G1, Folha, Estadao, UOL, Valor, InfoMoney, Reuters, BBC, etc.)
  - "legal": base juridica, tribunal, processo judicial (JusBrasil, Escavador, TJ*, STF, STJ)
  - "complaint": reclamacao ou forum de consumidor (Reclame Aqui, Procon, Consumidor.gov)
  - "government": orgao governamental ou regulador (Receita Federal, CVM, BACEN, gov.br)
  - "other": blogs, redes sociais, wikis, sites institucionais
- reason: breve explicacao (1 frase)

REGRA DE PESO: Mencoes de portais de noticia (sourceType "news") tem mais peso na avaliacao de risco reputacional do que bases juridicas (que sao registros burocraticos). Uma manchete do G1 sobre fraude e mais relevante que um registro de processo no JusBrasil.
```

Update the JSON output schema to include `sourceType`:

```json
"mentionClassifications": [
  { "url": "...", "relevant": true|false, "classification": "positive|neutral|negative", "sourceType": "news|legal|complaint|government|other", "reason": "..." }
]
```

**Step 2: Update `MentionClassification` type if needed**

Check `src/types/report.ts` for `MentionClassification` — add `sourceType` field if not present.

**Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean (or only mock errors from Task 4).

**Step 4: Commit**

```bash
git add src/lib/openai.ts src/types/report.ts
git commit -m "feat: OpenAI prompt classifies source type (news/legal/complaint/government/other)"
```

---

### Task 4: Update mocks and pipeline references

**Files:**
- Modify: `src/lib/mocks/google-data.ts`
- Modify: `src/lib/inngest/process-search.ts:243-284`
- Modify: `src/lib/hooks/use-report-data.ts:172`
- Modify: `src/lib/openai.ts:291` (generateSummary compat function)

**Step 1: Add `news: []` to all mock GoogleSearchResponse objects**

In `google-data.ts`, add `news: []` (or sample news items for chuva scenarios) to each of the 4 mock objects: `MOCK_GOOGLE_SOL`, `MOCK_GOOGLE_CHUVA`, `MOCK_GOOGLE_CPF_SOL`, `MOCK_GOOGLE_CPF_CHUVA`.

For chuva CNPJ, add a sample news item:
```typescript
news: [
  {
    title: 'Empresa investigada por desvio de recursos',
    url: 'https://g1.globo.com/example/empresa-investigada',
    snippet: 'Policia Federal investiga empresa por suspeita de desvio...',
    classification: 'negative',
    sourceType: 'news',
  },
],
```

For sol and CPF mocks, `news: []`.

**Step 2: Update mentions spread in `process-search.ts:243-247`**

```typescript
const mentions = [
  ...(webData?.byDocument || []),
  ...(webData?.byName || []),
  ...(webData?.reclameAqui || []),
  ...(webData?.news || []),
]
```

**Step 3: Update classification matching in `process-search.ts:270-284`**

Add `news` matching after reclameAqui:
```typescript
const matchNews = googleDataFinal.news.find((r) => r.url === classification.url)
if (matchNews) matchNews.classification = classification.classification
```

**Step 4: Update `use-report-data.ts:172`**

Add `news` to allMentions:
```typescript
const allMentions = [...(google?.byDocument || []), ...(google?.byName || []), ...(google?.news || [])]
```

**Step 5: Update `generateSummary` compat function in `openai.ts:291`**

Add `news` to the google destructure:
```typescript
const google = data.google as { byDocument?: GoogleSearchResult[]; byName?: GoogleSearchResult[]; reclameAqui?: GoogleSearchResult[]; news?: GoogleSearchResult[] } | undefined
const mentions: GoogleSearchResult[] = [
  ...(google?.byDocument || []),
  ...(google?.byName || []),
  ...(google?.reclameAqui || []),
  ...(google?.news || []),
]
```

**Step 6: Run tsc + vitest + lint**

Run: `npx tsc --noEmit && npx vitest run && npm run lint`
Expected: All pass, no type errors.

**Step 7: Commit**

```bash
git add src/lib/mocks/google-data.ts src/lib/inngest/process-search.ts src/lib/hooks/use-report-data.ts src/lib/openai.ts
git commit -m "feat: wire news query through pipeline, mocks, and hooks"
```

---

### Task 5: Validate E2E (mock mode)

**Step 1: Run E2E tests in mock mode**

Run: `npm run test:e2e:mock`
Expected: 26/26 pass. Mock data now includes `news` field.

**Step 2: If failures, fix and re-run**

Most likely cause: snapshot or assertion mismatch on report data structure.

**Step 3: Commit any E2E fixes**

```bash
git add -A
git commit -m "fix: E2E tests pass with news query changes"
```

---

### Task 6: Update docs

**Files:**
- Modify: `docs/specs/report-pipeline.md`
- Modify: `docs/status.md`

**Step 1: Update report-pipeline.md**

Add note that Serper now runs 4 queries (was 3), and that OpenAI classifies source types.

**Step 2: Update status.md**

Add entry to "Últimas mudanças" describing the Serper query improvements.

**Step 3: Commit**

```bash
git add docs/specs/report-pipeline.md docs/status.md
git commit -m "docs: update pipeline spec and status for Serper query improvements"
```
