# formatDocument + Details Route Bugfix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix two display bugs: (1) `formatDocument()` doesn't format documents with invalid checksums (blocklist/leads show raw digits), (2) purchase details API returns unformatted document.

**Architecture:** Change `formatDocument()` to format by length (11→CPF, 14→CNPJ) regardless of checksum validity, since it's a display function. Add `formatDocument()` to the details API route. TDD with vitest.

**Tech Stack:** TypeScript, Vitest, Next.js API routes

---

## Pre-requisites

- Branch: `develop`
- Existing tests: `tests/unit/validators.test.ts`
- Existing code: `src/lib/validators.ts`, `src/app/api/admin/purchases/[id]/details/route.ts`

---

## Task 1: Fix `formatDocument()` to format by length

**Files:**
- Modify: `src/lib/validators.ts:112-117`
- Modify: `tests/unit/validators.test.ts:82-92`

**Step 1: Update the failing test**

In `tests/unit/validators.test.ts`, update the "Document Formatting" describe block. Replace lines 82-92 with:

```ts
  it('should auto-format valid CPF', () => {
    expect(formatDocument('12345678909')).toBe('123.456.789-09')
  })

  it('should auto-format valid CNPJ', () => {
    expect(formatDocument('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('should format 11-digit string as CPF even with invalid checksum', () => {
    expect(formatDocument('99999999999')).toBe('999.999.999-99')
    expect(formatDocument('12345678900')).toBe('123.456.789-00')
  })

  it('should format 14-digit string as CNPJ even with invalid checksum', () => {
    expect(formatDocument('11111111111111')).toBe('11.111.111/1111-11')
    expect(formatDocument('11222333000180')).toBe('11.222.333/0001-80')
  })

  it('should return original value for non-11/14 digit strings', () => {
    expect(formatDocument('123')).toBe('123')
    expect(formatDocument('1234567890')).toBe('1234567890')
    expect(formatDocument('123456789012345')).toBe('123456789012345')
  })
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/validators.test.ts`
Expected: FAIL — `formatDocument('99999999999')` returns `'99999999999'` instead of `'999.999.999-99'`

**Step 3: Fix `formatDocument` in `src/lib/validators.ts`**

Replace lines 109-117 with:

```ts
/**
 * Formata automaticamente CPF ou CNPJ baseado no comprimento.
 * Formata por comprimento (11 → CPF, 14 → CNPJ) sem exigir checksum válido,
 * pois é uma função de exibição (blocklist pode ter documentos inválidos).
 */
export function formatDocument(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) return formatCPF(cleaned)
  if (cleaned.length === 14) return formatCNPJ(cleaned)
  return value
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/validators.test.ts`
Expected: ALL PASS

**Step 5: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS (no regressions — `formatDocument` is only used for display)

**Step 6: Commit**

```bash
git add src/lib/validators.ts tests/unit/validators.test.ts
git commit -m "fix: formatDocument formats by length, not checksum validation"
```

---

## Task 2: Add `formatDocument` to purchase details API

**Files:**
- Modify: `src/app/api/admin/purchases/[id]/details/route.ts:1-4,40`

**Step 1: Fix the route**

In `src/app/api/admin/purchases/[id]/details/route.ts`:

Add import on line 3:
```ts
import { formatDocument } from '@/lib/validators'
```

Change line 40 from:
```ts
        term: purchase.term,
```
to:
```ts
        term: formatDocument(purchase.term),
```

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: Clean (no errors)

**Step 3: Run lint**

Run: `npm run lint`
Expected: Clean

**Step 4: Commit**

```bash
git add src/app/api/admin/purchases/[id]/details/route.ts
git commit -m "fix: format document in purchase details API response"
```

---

## Task 3: Verify fixes via MCP

**Step 1: Start dev server**

```bash
MOCK_MODE=true npm run dev
```

**Step 2: Seed test admin + login via chrome-devtools MCP**

Same flow as the MCP test plan (seed admin in Neon develop, navigate to `/admin/login`, fill credentials, submit).

**Step 3: Verify blocklist formatting**

Navigate to `/admin/blocklist`. The entry `99999999999` should now show as `999.999.999-99`.

**Step 4: Verify details dialog formatting**

Navigate to `/admin/compras`, open details on any purchase. The document should show formatted (e.g., `012.086.282-40` instead of `01208628240`).

**Step 5: Cleanup**

Kill dev server, delete test admin from Neon develop.

**Step 6: Update docs/status.md**

Add entry under "O que está funcionando":
```
- **Fix formatDocument + details route** — `formatDocument()` agora formata por comprimento (11→CPF, 14→CNPJ) sem exigir checksum válido. Details API route usa `formatDocument()` para consistência com lista de compras.
```
