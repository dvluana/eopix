# Fix Data Parsing Bugs — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix R$ NaN and malformed financial data in reports by correcting parsing at the API boundary layer.

**Architecture:** Fix data parsing in `financial-summary.ts` and `apifull.ts`, add guards in `use-report-data.ts`. No UI or OpenAI changes.

**Tech Stack:** TypeScript, Vitest for testing

---

## Root Cause

APIFull `srs-premium` returns financial values as Brazilian-format strings:
- Individual debts: `"1446,43"` (string, comma decimal)
- Total: `"01446,43216,4928745,67652,42"` (concatenated strings, unusable)
- Score: `{ score: "350", probabilidadeInadimplencia: "81,24%" }` (object, not number)

Our code passes these through without parsing → `NaN` propagates to frontend.

## Changes

### 1. `src/lib/financial-summary.ts`

- Add `parseBRCurrency(value: unknown): number` helper
  - Handles: `"1.446,43"` → `1446.43`, `"1446,43"` → `1446.43`, `1446.43` → `1446.43`
  - Returns `0` for non-parseable values
- **Ignore `valorTotalPendencias`/`valorTotalProtestos` from API** (concatenated strings)
- Calculate totals by summing individual items: `pendenciasFinanceiras[].valor` and `protestos[].valor`
- Parse each individual `valor` with `parseBRCurrency()`
- Export `parseBRCurrency` for reuse

### 2. `src/lib/apifull.ts`

- Fix `_scoreInterno` mapping: extract `parseInt(obj.score)` from object, return `number | null`
- Currently returns the raw object which doesn't match the `number | null` type

### 3. `src/lib/hooks/use-report-data.ts`

- Guard all `formatCurrency()` calls with `Number.isFinite(value)` check
- Fallback to `"N/D"` (Não Disponível) when value is not a valid number
- Apply to: `totalProtestosValor`, `totalDividasValor`, individual protesto/divida valor formatting

### 4. Out of scope (Fase 2 — AI algorithm)

- OpenAI prompt improvements (polo context, profession detection)
- Mention classification accuracy
- Weather verdict weighting
- Reclame Aqui threshold

## Testing

- Unit tests for `parseBRCurrency()` with edge cases
- Unit tests for `calculateCpfFinancialSummary()` with real API response data
- Verify with existing SearchResult data (no new API calls needed)

## Validation

- Reload report page, verify R$ values display correctly
- Check OpenAI prompt receives valid numbers (not NaN)
