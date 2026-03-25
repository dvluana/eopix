# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**
- API routes: `src/app/api/{resource}/route.ts` — Next.js App Router convention, consistently applied
- Lib modules: `src/lib/{module}.ts` — camelCase, single responsibility (e.g., `abacatepay.ts`, `mock-mode.ts`, `report-ttl.ts`)
- React components: `PascalCase.tsx` (e.g., `RegisterModal.tsx`, `TopBar.tsx`)
- Component subdirectories: `src/components/{domain}/ComponentName.tsx` (e.g., `src/components/relatorio/FinancialCard.tsx`)
- Test files: `tests/unit/{module}.test.ts` or `tests/lib/{module}.test.ts` — inconsistent depth (some in `tests/unit/`, some in `tests/lib/`)
- E2E tests: `e2e/tests/{feature}.spec.ts`
- Mock data: `src/lib/mocks/{service}-data.ts`
- Hooks: `src/lib/hooks/use-{feature}.ts` (e.g., `use-report-data.ts`, `use-purchase-polling.ts`)

**Functions:**
- Public lib functions: camelCase verb+noun (e.g., `consultCpfCadastral`, `createCheckout`, `validateCanProcess`)
- Private helpers: camelCase, local scope (e.g., `generateCode`, `isChuvaScenario`, `fetchWithTimeout`)
- Email functions: `send{EventName}Email` pattern consistently used across all 10+ email functions
- Mapper functions: `map{Entity}Response` (e.g., `mapCpfCadastralResponse`)
- React: component functions match filename (e.g., `export default function RegisterModal()`)

**Variables:**
- camelCase throughout
- Boolean flags: `is{State}` prefix (e.g., `isMockMode`, `isBypassPayment`, `isCpf`, `isCnpj`)
- Constants: SCREAMING_SNAKE_CASE for env-level constants (e.g., `FROM`, `YEAR` in email.ts), camelCase for runtime values

**Types:**
- Interfaces: PascalCase (e.g., `CreateCheckoutParams`, `CheckoutResponse`, `ValidationResult`)
- Type aliases: PascalCase (e.g., `PurchaseStatus`)
- All types live in `src/types/report.ts` (domain types) and `src/types/domain.ts` (Purchase states, UI types)
- API response types suffixed with `Response` (e.g., `CpfCadastralResponse`, `GoogleSearchResponse`)

## TypeScript Usage

**Strict Mode:** Yes — `tsconfig.json` uses strict TypeScript.

**`any` usage:** Rare and confined. Found in `src/lib/apifull.ts` (mapper functions that handle raw external API responses) with explicit `eslint-disable-next-line` comments. This is acceptable: external API shapes are not typed at the boundary and are immediately mapped to typed interfaces. Total: ~14 occurrences across 3 files (`apifull.ts`, `health/route.ts`, `sanity/client.ts`).

**Type casting patterns:**
```typescript
// Explicit casts after validation (process-search.ts)
cadastralData: cadastralData as CpfCadastralResponse | null,
const jsonData = JSON.parse(JSON.stringify(dataToSave)) as Prisma.InputJsonValue
```

**Missing types:**
- Inline type defined at usage in `purchases/route.ts` (lines 409-419): a full purchase list item type is defined inline as a `Array<{...}>` rather than referencing `src/types/domain.ts`. This should use `AdminPurchase` or a similar exported type.
- `Record<string, unknown>` used for Prisma `where` clauses in admin routes — acceptable workaround for dynamic Prisma query building.

**Interface vs Type:** Interfaces used for object shapes, `type` used for unions. Consistent.

## Error Handling

**Pattern in API routes:** All API routes wrap handler logic in a top-level `try/catch` that returns a 500 response:
```typescript
// Standard pattern — every route.ts
export async function POST(request: NextRequest) {
  try {
    // ... handler logic
  } catch (error) {
    console.error('Description error:', error)
    return NextResponse.json({ error: 'User-facing message' }, { status: 500 })
  }
}
```

**Sentry capture:** Only used in the checkout error path in `src/app/api/purchases/route.ts`. Not systematically applied to all 500 paths — most errors only `console.error`. Inconsistent Sentry coverage.

**Fire-and-forget pattern:** Used extensively for non-critical operations (email sending, Inngest events, lead capture). Pattern:
```typescript
someAsyncOperation().catch(err => console.warn('[Context] Description:', err))
// or
await someOperation().catch(err => {
  console.warn('[Context] Non-critical failed:', err)
})
```

**External API errors:** `src/lib/apifull.ts` throws on non-ok HTTP responses. In `process-search.ts`, cadastral and processos calls use `.catch()` to return null/empty on failure (fail-open), while financial calls propagate errors to trigger Inngest retry (fail-strict). This distinction is intentional but not documented inline beyond comments.

**Error messages:** English for logging (`console.error`), Portuguese for user-facing API responses. Consistent.

**No custom Error classes** — all errors are built-in `Error` instances or string-coerced values. `error instanceof Error ? error.message : String(error)` pattern used in failure handlers.

## Data Validation

**Zod usage:** Used in API routes that accept structured POST bodies:
- `src/app/api/auth/forgot-password/route.ts` — `z.object({ email: z.string().email() })`
- `src/app/api/auth/reset-password/route.ts` — Zod schema
- Admin routes (blocklist POST)
- Pattern: `schema.safeParse(body)` — safe parse, check `parsed.success` before proceeding

**Custom validators in `src/lib/validators.ts`:** `isValidCPF`, `isValidCNPJ`, `isValidEmail`, `cleanDocument`, `formatDocument`, `maskDocument`. Used in API routes directly (not through Zod) for document validation.

**Inconsistency:** The main `POST /api/purchases` route (`src/app/api/purchases/route.ts`) does NOT use Zod — it uses manual checks (`if (!term || !termsAccepted)`) and calls validators directly. Meanwhile, auth routes do use Zod. The purchases route is the most complex handler and would most benefit from Zod.

**Server-side validation location:** All validation happens at the route handler entry point before any DB operations — consistent pattern.

**Client-side validation:** Minimal — forms rely on server responses for most validation. `maskDocument` is used for live input masking in the UI.

## Code Organization Within Files

**Typical lib file structure:**
1. Imports (Node built-ins → external packages → internal `@/` aliases)
2. Type/interface declarations
3. Constants
4. Private helper functions
5. Exported functions

**API route files structure:**
1. Next.js/third-party imports
2. Local interface for request body
3. Helper functions (e.g., `generateCode`)
4. Exported HTTP handlers (`GET`, `POST`, `PATCH`)

**Import ordering:** Not enforced by ESLint — some files mix external and internal imports. No import sorting plugin detected.

**One notable violation:** `src/lib/inngest/process-search.ts` has an import statement after a `const` declaration (line 20-21: `mockDelay` const before the type imports). This compiles because TypeScript hoists type imports, but it's visually confusing.

## Comment Style

**Where comments exist:**
- Section dividers with `// ========== Step N: name ==========` in `process-search.ts` — clear and useful
- Inline Portuguese comments for business logic (`// Verifica se existe relatório válido`)
- Warning comments for recurring bugs: `apifull.ts` has `// IMPORTANTE: O endpoint correto é ic-cpf-completo, NÃO r-cpf-completo` — critical knowledge preserved
- JSDoc-style `/** */` used in `server-auth.ts` for the `requireAdminAuth` function (shows params, throws, returns)

**Where comments are absent:**
- Most React components have no comments at all
- Complex conditional logic in `purchases/route.ts` (PENDING reuse logic) has brief inline comments but no function-level doc
- `src/lib/mock-mode.ts` has full comments per export — good model to follow elsewhere

**No TSDoc/JSDoc standard applied broadly.** Only `server-auth.ts` uses it.

## React Patterns

**Server vs Client Components:**
- Default: Server Components (no directive = server by default)
- `"use client"` applied to ~50 files — correctly scoped to interactive UI (forms, polling hooks, modals, landing animations)
- Page files like `src/app/relatorio/[id]/page.tsx` are Client Components (`"use client"`) because they use hooks — this is a known tradeoff for the report display, where real-time polling is needed
- `src/app/api/` routes are always server-side (Next.js Route Handlers)

**State management:** Local `useState`/`useReducer` in components — no global state manager (no Zustand, Redux, etc.). Appropriate for the app's complexity.

**Custom hooks:**
- `src/lib/hooks/use-report-data.ts` — fetches and transforms report data
- `src/lib/hooks/use-purchase-polling.ts` — SSE + fallback polling for purchase status

**Data fetching:** Direct `fetch()` in components and hooks (no React Query or SWR). SSE via `EventSource` in `use-purchase-polling.ts`.

## Database Access Patterns

**Client:** `src/lib/prisma.ts` exports a singleton `prisma` client. All DB access goes through this import.

**Query patterns:**
- `prisma.{model}.findUnique` for ID/unique key lookups
- `prisma.{model}.findFirst` with `where` + `orderBy` for conditional lookups
- `prisma.{model}.create` / `update` / `delete` directly — no repository abstraction layer
- `Promise.all` used for parallel queries (e.g., admin purchases route: `[purchases, total] = await Promise.all([...])`)

**Transactions:** Used in `reset-password` route (`prisma.$transaction`) for atomic token invalidation + password update. Not used elsewhere — the abandonment email setup and purchase creation are sequential awaits without transactions, creating potential inconsistency if steps fail mid-sequence.

**Select optimization:** Most queries use `select: { id: true, field: true }` to limit returned fields. Some places use `include` which fetches full related models — e.g., the GET `/api/purchases` route includes full `purchases` array with nested `searchResult`. This is acceptable at current scale.

**E2E test DB access:** Uses raw SQL via `@neondatabase/serverless Pool` (not Prisma) due to WebSocket compatibility issues in Node.js context. Raw SQL is isolated to `e2e/global-setup.ts` and `e2e/global-teardown.ts`.

## Inconsistencies to Standardize

1. **Zod vs manual validation:** Auth routes use Zod; `purchases/route.ts` uses manual checks. Standardize on Zod for all POST handlers.

2. **Import order in `process-search.ts`:** `mockDelay` const declared before type imports (lines 20-21). Fix import ordering.

3. **Test file location:** Some tests in `tests/unit/`, some in `tests/lib/`. No clear rule — `tests/lib/` mirrors `src/lib/`, `tests/unit/` is for miscellaneous. Should pick one or document the distinction.

4. **Inline type in purchases GET:** The array type at lines 409-419 of `purchases/route.ts` should reference `src/types/domain.ts` instead of being declared inline.

5. **Sentry coverage:** Only one `Sentry.captureException` call in the entire codebase (checkout error). Either add it to all 500 error paths or document that only checkout errors are tracked.

6. **Fire-and-forget for emails:** Two fire-and-forget email patterns exist — `.catch(err => ...)` directly and wrapping in `.then().catch()`. Standardize on one pattern.

## Over-Engineering

- **`isBypassPayment` + `isBypassMode` + `isMockMode` + `isTestMode`:** Four boolean flags from `src/lib/mock-mode.ts` create complex branching throughout the codebase. The `effectiveBypass` local variable in `purchases/route.ts` adds another layer. This is justified by the distinct test scenarios but is hard to reason about.

- **AbacatePay PENDING reuse logic:** Lines 122-152 in `purchases/route.ts` fetch an existing PENDING purchase and attempt to retrieve its checkout URL from AbacatePay, with a fallback to creating a new one. This multi-step inline logic should be extracted to `src/lib/abacatepay.ts`.

## Under-Engineering

- **No repository layer:** DB queries are inlined in route handlers. The purchases route has 5+ Prisma queries directly in the handler. Extracting query logic to `src/lib/queries/` would improve testability.

- **`generateCode()` in purchases/route.ts:** A local helper that should live in `src/lib/utils.ts` alongside other shared utilities.

- **Missing abstraction for guest user creation:** The guest email pattern (`guest-${code.toLowerCase()}@guest.eopix.app`) is created inline in the purchases route. This should be a named function in a shared location.

---

*Convention analysis: 2026-03-25*
