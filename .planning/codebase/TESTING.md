# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**Unit/Integration Runner:**
- Vitest (version from `package.json`)
- Config: `vitest.config.ts` (project root)
- Environment: `node`
- Test glob: `tests/**/*.test.ts`
- Path alias: `@` → `./src`

**E2E Runner:**
- Playwright
- Config: `e2e/playwright.config.ts`
- Browser: Chromium only (`fullyParallel: false`, `workers: 1`)
- Timeout: 60s per test, 10s per assertion

**Run Commands:**
```bash
npx vitest run               # Run all unit tests once
npx vitest                   # Watch mode
npx vitest run --coverage    # Coverage report (v8 provider)
npm run test:e2e             # E2E with real Neon branch (requires NEON_API_KEY)
npm run test:e2e:mock        # E2E with MOCK_MODE=true (fast local)
npm run lint && npx vitest run  # Pre-commit check
```

**Coverage Thresholds:**
- Lines: 60%, Functions: 60%, Branches: 60%, Statements: 60%
- Provider: v8
- Reports: text, json, html, lcov
- Excludes: `node_modules/`, `.next/`, `tests/`, `**/*.config.{ts,js}`, `**/types.ts`, `prisma/`

## Test File Organization

**Unit tests location:** `tests/` directory (not co-located with source)

**Structure:**
```
tests/
├── smoke.test.ts                          # Trivial sanity check (expect(true).toBe(true))
├── unit/
│   ├── validators.test.ts                 # CPF/CNPJ/email validation
│   ├── report-utils.test.ts              # Report display utilities
│   ├── purchase-workflow.test.ts          # State machine (duplicate of tests/lib/purchase-workflow.test.ts)
│   └── report-ttl.test.ts               # TTL calculation
└── lib/
    ├── financial-summary.test.ts          # Financial data calculations
    ├── google-search.test.ts              # Serper/web search formatting
    ├── email.test.ts                      # Email function signatures + content
    ├── apifull-balance.test.ts            # APIFull balance parsing
    └── inngest/
        └── functions-export.test.ts       # Inngest functions array integrity
    └── purchase-workflow.test.ts          # State machine (overlaps tests/unit/)
```

**Note:** `tests/unit/purchase-workflow.test.ts` and `tests/lib/purchase-workflow.test.ts` both test `validateCanProcess` — the unit version covers 5 cases, the lib version is the same file. This duplication should be consolidated.

**E2E structure:**
```
e2e/
├── playwright.config.ts
├── global-setup.ts       # Health check + admin seed via raw SQL
├── global-teardown.ts    # Cleanup all *@eopix.test users via raw SQL
├── fixtures/
│   └── purchase.fixture.ts
├── helpers/
│   ├── api-client.ts          # HTTP helpers (createPurchase, getPurchase)
│   ├── admin-auth.ts          # Admin login cookie helper
│   ├── complete-purchase.ts   # Marks purchase PAID + waits for COMPLETED
│   ├── test-data.ts           # TEST_CPFS, TEST_CNPJS, TEST_USER, TEST_BUYER, ADMIN_CREDENTIALS
│   └── wait-for-status.ts     # Polls purchase status until target or timeout
└── tests/
    ├── smoke.spec.ts
    ├── purchase-flow-cpf.spec.ts
    ├── purchase-flow-cnpj.spec.ts
    ├── auth-purchase-flow.spec.ts
    ├── report-content.spec.ts
    └── error-handling.spec.ts
```

## Test Structure

**Vitest suite organization:**
```typescript
import { describe, it, expect } from 'vitest'

describe('Feature group', () => {
  it('should describe expected behavior', () => {
    expect(result).toBe(expected)
  })
})
```

**No `beforeAll`/`afterAll` in unit tests** — tests are stateless pure function calls. The `tests/lib/email.test.ts` is the only file using `beforeEach` (to clear mock call counts).

**Playwright test organization:**
```typescript
test.describe('Purchase Flow — CPF', () => {
  test.describe.configure({ mode: 'serial' })  // Tests run sequentially

  test('descriptive name', async ({ page }) => {
    // numbered steps with comments
  })
})
```

All E2E describe blocks use `mode: 'serial'` — tests within a describe run sequentially and share state through the DB.

## Mocking

**Framework:** Vitest `vi.mock` + `vi.hoisted`

**Resend (email) mock — used in `tests/lib/email.test.ts` and `tests/lib/inngest/functions-export.test.ts`:**
```typescript
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
)

vi.mock('resend', () => {
  class MockResend {
    emails = { send: mockSend }
  }
  return { Resend: MockResend }
})
```

**`vi.hoisted` is required** because the mock must be created before Vitest's module hoisting runs. This pattern is correctly used wherever `resend` is mocked.

**mock-mode mock:**
```typescript
vi.mock('@/lib/mock-mode', () => ({ isBypassMode: false }))
```

**What is mocked in Vitest:**
- `resend` (Resend SDK) — always mocked in email and Inngest tests
- `@/lib/mock-mode` — mocked to control bypass behavior
- No database mocking — unit tests do not touch Prisma at all (pure function tests)
- No HTTP mocking (no `msw` or `nock`) — external API functions are not unit tested directly

**MOCK_MODE system (runtime mock, not test mock):**
`src/lib/mock-mode.ts` exports `isMockMode`, `isTestMode`, `isBypassMode`, `isBypassPayment`. When `MOCK_MODE=true`:
- `src/lib/apifull.ts` returns pre-defined mock data
- `src/lib/openai.ts` returns mock analysis
- `src/lib/google-search.ts` returns mock search results
- Mock data lives in `src/lib/mocks/` directory

**Mock scenarios:** Two CPF scenarios in mock mode:
- **"Chuva" (last digit 0-4):** CPF with issues (processos, protestos, negative mentions) — `src/lib/mocks/apifull-data.ts` exports `MOCK_APIFULL_CPF_CADASTRAL_CHUVA` etc.
- **"Sol" (last digit 5-9):** Clean CPF — `MOCK_APIFULL_CPF_CADASTRAL_SOL` etc.
- Same Chuva/Sol pattern for CNPJ

**E2E mock mode:** Playwright config sets `MOCK_MODE=true` and `BYPASS_PAYMENT=true` by default for local runs. The `TEST_CPFS` and `TEST_CNPJS` in `e2e/helpers/test-data.ts` have last digits chosen to match the correct scenario.

## Fixtures and Factories

**Test data constants (`e2e/helpers/test-data.ts`):**
```typescript
export const TEST_CPFS = {
  chuva: '52998224130',  // last digit 0 → Chuva scenario
  sol: '11144477735',    // last digit 5 → Sol scenario
} as const

export const TEST_BUYER = {
  name: 'Teste E2E',
  cellphone: '11999999999',
  taxId: '11144477735',
} as const
```

**Purchase fixture (`e2e/fixtures/purchase.fixture.ts`):** Creates a purchase and processes it via API helpers — not a Playwright fixture in the `test.extend` sense, just a helper function.

**`complete-purchase.ts` helper:**
Bypass-aware: checks if purchase is already PAID (bypass mode skips payment), then calls `POST /api/process-search/{code}` and polls until COMPLETED.

## Coverage

**Target:** 60% lines/functions/branches/statements (enforced in CI)

**What is covered:**
- `src/lib/validators.ts` — comprehensive (all functions, edge cases)
- `src/lib/report-utils.ts` — comprehensive (sorting, formatting, summaries)
- `src/lib/purchase-workflow.ts` — all state transitions tested
- `src/lib/email.ts` — all 10 email functions tested for return value; 2 test HTML content
- `src/lib/financial-summary.ts` — financial calculation logic
- `src/lib/apifull-balance.ts` — balance parsing
- `src/lib/inngest/crons.ts` — functions array integrity (count + specific members)

**What is NOT covered:**
- `src/lib/apifull.ts` — no unit tests for mapper functions (only tested via E2E)
- `src/lib/abacatepay.ts` — no unit tests
- `src/lib/openai.ts` — no unit tests (OpenAI calls not mocked in Vitest)
- `src/lib/payment.ts` — no unit tests
- `src/lib/auth.ts` — no unit tests for JWT signing/verification, session management
- `src/lib/inngest/process-search.ts` — no unit tests for pipeline logic (only tested E2E)
- `src/lib/inngest/abandonment-emails.ts` — no unit tests beyond export check
- `src/app/api/**/route.ts` — no API route unit tests (all API testing is E2E)
- `src/components/**` — no component tests (no React Testing Library, no Storybook)
- `src/lib/google-search.ts` — partially covered in `tests/lib/google-search.test.ts`

**Critical untested paths:**
- `validateWebhookSignature` in `src/lib/abacatepay.ts` — webhook security validation
- `hmacSign`/`hmacVerify` in `src/lib/auth.ts` — JWT security (a previous bug here corrupted 100% of tokens)
- `checkRateLimit` in `src/lib/rate-limit.ts`
- The `mapCpfCadastralResponse` and `mapCnpjFinancialResponse` mapper functions in `apifull.ts`

## E2E Tests — What Is Covered

**26 tests across 6 spec files:**

| Spec file | What it tests |
|---|---|
| `smoke.spec.ts` | App loads, landing page renders |
| `purchase-flow-cpf.spec.ts` | Full CPF purchase: landing → modal → confirmação → report (Sol + Chuva + API-only) |
| `purchase-flow-cnpj.spec.ts` | Full CNPJ purchase: same flow for CNPJ document |
| `auth-purchase-flow.spec.ts` | Login flow, existing user purchase, session persistence |
| `report-content.spec.ts` | Report page content (weather verdict, sections, CPF/CNPJ specific fields) |
| `error-handling.spec.ts` | Invalid documents, duplicate purchases (409), rate limits |

**E2E test run modes:**
- **Mock (fast, `test:e2e:mock`):** `MOCK_MODE=true BYPASS_PAYMENT=true`, all APIs return deterministic fixtures, no DB branching required. Default for local dev.
- **Integration (nightly, `test:e2e`):** Real Neon branch created via script `scripts/tests/test-with-branch.ts`, `TEST_MODE=true`, real external APIs called, branch deleted after test.

## Test Data Management

**Seeding (E2E):**
- `e2e/global-setup.ts` seeds one `AdminUser` via raw SQL before tests run
- Purchase/user data created on-the-fly by each test (no pre-seeded data for user tests)
- Browser tests create unique emails: `cpf-sol-${Date.now()}@eopix.test` to avoid conflicts

**Cleanup (E2E):**
- `e2e/global-teardown.ts` deletes all rows where `email LIKE '%@eopix.test'`
- Cascade: unlinks `searchResultId` → deletes `Purchase` → deletes `SearchResult` → deletes `User`
- Also deletes seeded `AdminUser`
- Teardown errors are caught and logged as non-fatal (cleanup failure doesn't fail the test suite)

**Isolation concern:** E2E tests within a `describe` block share DB state (serial mode). Parallel runs would conflict. CI runs one worker (`workers: 1`) so this is safe.

## CI/CD Integration

**GitHub Actions workflows (`.github/workflows/`):**
- `e2e-tests.yml`: Runs mock E2E on every PR, integration (real APIs) nightly — matrix strategy
- `neon-cleanup.yml`: Deletes CI Neon branches on PR close

**CI Playwright behavior:**
- `CI=true` → no `webServer` (CI starts server externally via `npm start` with pre-built app)
- `retries: 1` in CI (0 locally)
- Reporter: `html` in CI, `list` locally
- Build step runs before server start in CI (production build, not dev server)

**Pre-commit hooks:** `scripts/hooks/check-docs.sh` warns when editing API/pipeline files without updating corresponding docs. Relevant paths include `src/app/api/purchases/`, `src/lib/inngest/`, `src/lib/apifull.ts`, `prisma/schema.prisma`.

**Lint + type check:** `npm run lint && npx vitest run` is the standard pre-commit/pre-deploy check sequence described in `CLAUDE.md`.

## Gaps and Recommendations

**High priority:**
1. `src/lib/auth.ts` JWT functions (`hmacSign`, `hmacVerify`) — a prior bug here was silent for 100% of tokens. Add roundtrip tests.
2. `src/lib/abacatepay.ts` `validateWebhookSignature` — webhook security, no tests.
3. `src/lib/apifull.ts` mapper functions — the Chuva/Sol mock system doesn't test the mapping logic from real API response shapes.

**Medium priority:**
4. API route handlers — add at least happy-path + error-path Vitest tests using `fetch` mock or direct function import.
5. Consolidate duplicate `purchase-workflow.test.ts` files (in both `tests/unit/` and `tests/lib/`).

**Low priority:**
6. `tests/smoke.test.ts` (`expect(true).toBe(true)`) provides zero value — replace with an actual smoke test or delete.

---

*Testing analysis: 2026-03-25*
