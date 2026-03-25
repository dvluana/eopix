# Codebase Concerns

**Analysis Date:** 2026-03-25

---

## 1. CRITICAL BUGS / PRODUCTION RISKS

### Cache-hit pipeline burns 60 seconds of sleep in a single Inngest step

**Issue:** In `src/lib/inngest/process-search.ts` lines 74–113, when a cache hit occurs the code enters a single `step.run('cache-progress')` that calls `delay(10000)` six times (one per fake progress step) — a total of **60 seconds of synchronous sleep inside one step**. Inngest steps that sleep this long on a Vercel Serverless function can hit the platform's function execution timeout.

- Files: `src/lib/inngest/process-search.ts` lines 75–100
- Impact: Cache-hit purchases for popular CPFs could silently timeout, leaving the purchase stuck in PROCESSING forever. The step is not retried because the error happens inside the delay, not a real failure.
- Fix approach: Replace the artificial delay with `step.sleep('cache-delay-N', '10 seconds')` calls between individual status updates, or remove the fake progress entirely on cache hits.

### Webhook handler logs payment success before writing WebhookLog (race condition)

**Issue:** In `src/app/api/webhooks/abacatepay/route.ts` lines 147–152, `handlePaymentSuccess()` is called first, then `prisma.webhookLog.create()` is called. If the server crashes or times out after `handlePaymentSuccess()` but before the log write, the webhook will be retried by AbacatePay and the purchase will be double-processed (two Inngest `search/process` events fired for the same purchase).

- Files: `src/app/api/webhooks/abacatepay/route.ts` lines 147–152
- Impact: Duplicate pipeline executions, double API credits consumed, potential double emails sent to user.
- Fix approach: Write the `WebhookLog` row **before** calling `handlePaymentSuccess()`, or wrap both in a single `$transaction`. At minimum, move the log write to the top of the try block.

### `handlePaymentSuccess` not inside the try/catch — silent failure of Inngest send does not return 500

**Issue:** The function `handlePaymentSuccess()` is called at line 147, and the function internally calls `inngest.send()` with `await` (no catch). If `inngest.send()` throws, the exception propagates to the outer `catch` at line 154, which returns a 500. However, the webhook log is created at line 149 **after** `handlePaymentSuccess()` — so on a retry, the idempotency check would mark it as a duplicate and skip the Inngest dispatch. The purchase would be stuck in PAID with no Inngest job.

- Files: `src/app/api/webhooks/abacatepay/route.ts` lines 147–153
- Impact: Rare but possible: a failed first attempt creates the log, Inngest never fires, subsequent webhooks ignored as duplicates, purchase stuck in PAID.
- Fix approach: Only write `WebhookLog` after Inngest fires successfully.

### Refund route allows COMPLETED purchases to be refunded without revoking access

**Issue:** `src/app/api/admin/purchases/[id]/refund/route.ts` marks the purchase REFUNDED but does not invalidate or soft-delete the linked `SearchResult`. The user's `searchResult` relation remains active and the report page `/relatorio/[id]` still loads.

- Files: `src/app/api/admin/purchases/[id]/refund/route.ts`, `src/app/relatorio/[id]/page.tsx`
- Impact: Refunded customers retain full access to the paid report. This is a business logic gap — users can view content they were refunded for.
- Fix approach: Set `searchResult.expiresAt = new Date()` on refund, or add a `Purchase.revokedAt` guard in the report page.

### `generateCode()` uses a loop with no guaranteed uniqueness guarantee

**Issue:** `src/app/api/purchases/route.ts` lines 157–165 generate a 6-char code and retry up to 10 times if a collision occurs. There is no transaction or lock — two concurrent requests could both read "no collision" for the same code and attempt to insert, causing a Prisma unique constraint error that bubbles up as an unhandled 500.

- Files: `src/app/api/purchases/route.ts` lines 156–165
- Impact: Under concurrent load (unlikely but possible), two users get a 500 on purchase creation.
- Fix approach: Catch the unique constraint error specifically and retry, or use a `nanoid`-style library with sufficient entropy (6 chars from a 32-char alphabet = ~1 billion combinations, collision risk is low but the race window exists).

### FAILED purchases triggered by `PAYMENT_EXPIRED` still show as "PROCESSANDO" to the user

**Issue:** Documented as intentional in `docs/status.md`, but the state machine in `docs/architecture.md` shows FAILED as a distinct state. Users who never paid are shown "PROCESSANDO" indefinitely on `/minhas-consultas`, which is misleading and prevents them from retrying.

- Files: `src/app/(user)/minhas-consultas/page.tsx` (maps FAILED → "PROCESSANDO"), `docs/architecture.md`
- Impact: UX lie to user; abandoned/expired purchases occupy visible slots in their dashboard with no CTA to buy again.

---

## 2. DATABASE CONCERNS

### `stripePaymentIntentId` column still in schema (dead column)

**Issue:** `prisma/schema.prisma` line 44 still has `stripePaymentIntentId String? @unique`. Stripe was removed as a payment provider months ago. This unique nullable column has an index maintained by Postgres for every row insert/update, and every `Purchase` row carries it as `null`.

- Files: `prisma/schema.prisma` line 44, `src/types/domain.ts` line 39
- Impact: Wasted index, misleading schema, future developers confused about payment providers. The `@unique` constraint on a nullable field in Postgres creates an index that allows multiple NULLs but still consumes space.
- Fix approach: Migration to `DROP COLUMN stripePaymentIntentId`, update `domain.ts`.

### `SearchResult` cache query has no 24-hour window — uses full TTL (up to 7 days)

**Issue:** Architecture doc says "Cache check: If CPF/CNPJ already consulted in 24h, reuse result" but the actual cache check in `src/lib/inngest/process-search.ts` lines 56–63 uses `expiresAt: { gt: new Date() }` — meaning any non-expired `SearchResult` is reused, which could be up to 7 days old. The 24h window mentioned in the architecture diagram does not exist in code.

- Files: `src/lib/inngest/process-search.ts` lines 55–70
- Impact: Customer B pays for a report on CPF X. Customer A had already queried CPF X 6 days ago. Customer B gets a 6-day-old result. For financial/legal data this may be materially stale. Also, the "fake progress" animation runs 60 seconds for a cache hit.
- Fix approach: Add a `createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }` clause to the cache check, OR document that the full TTL reuse is intentional and remove the misleading "24h" from the architecture doc.

### Rate limiting stored in the database — inefficient and not atomic

**Issue:** `src/lib/rate-limit.ts` implements rate limiting with a read-then-update pattern against the `RateLimit` Postgres table. There is no transaction or row-level lock. Under concurrent requests from the same IP, two requests could both read `count < max`, both increment, and both be allowed through.

- Files: `src/lib/rate-limit.ts` lines 39–101
- Impact: Rate limits can be bypassed under concurrency. For purchase creation, two concurrent requests from same IP could both pass.
- Fix approach: Use `prisma.$queryRaw` with `UPDATE ... SET count = count + 1 WHERE ... RETURNING count` (atomic increment), or use Redis. Alternatively, accept the minor race given the low concurrency of this app.

### `LeadCapture` has no unique constraint — leads duplicate on every purchase attempt

**Issue:** `prisma/schema.prisma` lines 76–85 define `LeadCapture` with `email`, `term`, `reason` fields but no unique index. In `src/app/api/purchases/route.ts` line 272, a `LeadCapture` is created on every purchase attempt. If the same user retries (e.g., payment cancelled and restarted), duplicate lead rows accumulate.

- Files: `prisma/schema.prisma` lines 76–85, `src/app/api/purchases/route.ts` lines 272–284
- Impact: Table bloat, skewed lead analytics, abandoned checkout funnel emails triggered multiple times per user.
- Fix approach: Add `@@unique([email, term, reason])` and use `upsert`, or filter duplicates before sending abandonment emails.

### `ApiRequestLog` stores full `responseRaw: Json` — unbounded column growth

**Issue:** `prisma/schema.prisma` lines 136–155 store `responseRaw Json` for every API call. APIFull responses for processos can be 70–90KB (documented as 74.9KB in `docs/status.md`). Every CPF/CNPJ lookup creates 3–4 rows. At scale, this table will grow very large very fast.

- Files: `prisma/schema.prisma` line 146
- Impact: Neon storage costs, slow queries against the table, backup size. There is no cleanup cron for `ApiRequestLog`.
- Fix approach: Truncate `responseRaw` to summary only (status, metadata), or set a cleanup cron to delete rows older than 30 days.

### No cleanup cron for `ApiRequestLog`, `WebhookLog`, or `RateLimit`

**Issue:** `src/lib/inngest/crons.ts` has cleanup for `SearchResult`, `LeadCapture`, `PasswordResetToken`, and `Purchase` (LGPD anonymize). There is no cleanup for `ApiRequestLog`, `WebhookLog`, or `RateLimit` records.

- Files: `src/lib/inngest/crons.ts`
- Impact: These tables grow unboundedly. `WebhookLog` is fine (low volume). `ApiRequestLog` will grow significantly over time. `RateLimit` rows from expired windows persist forever.
- Fix approach: Add cleanup steps to `cleanupSearchResults` cron or create a separate cron.

### N+1 query pattern in `GET /api/purchases`

**Issue:** `src/app/api/purchases/route.ts` lines 373–391 use `include: { purchases: { ... include: { searchResult: ... } } }` — this fetches the user with all purchases and nested search results in one query. This is fine for small N but if a power user has 100+ purchases the included array is large. More importantly, `isAdminEmail()` at line 439 triggers **an additional database query** (AdminUser lookup) for every list request.

- Files: `src/app/api/purchases/route.ts` lines 373–445
- Impact: Admin email check adds an extra DB round-trip on every page load of `/minhas-consultas`.
- Fix approach: Cache `isAdminEmail` result in the session payload or a short-lived in-memory cache.

---

## 3. SECURITY CONCERNS

### `ABACATEPAY_PUBLIC_KEY` is hardcoded in source code

**Issue:** `src/lib/abacatepay.ts` lines 154–156 hardcode the HMAC-SHA256 verification key used by AbacatePay webhooks as a plain string constant in the codebase. This key is committed to git history.

- Files: `src/lib/abacatepay.ts` lines 153–156
- Impact: Anyone with access to the repo (collaborators, leaked source) knows the public verification key. While this is documented as a "public key" and AbacatePay may intentionally publish it, it should still be sourced from an env var for flexibility (key rotation, different sandbox/production values).
- Fix approach: Move to `process.env.ABACATEPAY_HMAC_KEY` with the current value as documented default.

### Session cookie is `sameSite: 'strict'` — may break OAuth-style redirect flows

**Issue:** `src/lib/auth.ts` line 99 sets `sameSite: 'strict'`. This is good for CSRF but will cause the session cookie to be dropped on any top-level cross-site navigation that includes a redirect (e.g., coming back from AbacatePay checkout page). After paying, the user returns to `/compra/confirmacao?code=X`, but the browser may not send the session cookie because the request originated from the AbacatePay domain.

- Files: `src/lib/auth.ts` line 99
- Impact: After payment at AbacatePay, users arrive at the confirmation page in a logged-out state. The page may show a login form flash or fail to auto-resolve the purchase to the user session.
- Fix approach: Change to `sameSite: 'lax'` (standard for apps with external payment redirects), or implement a server-side state token for the confirmation page that doesn't rely on cookie session.

### `isAdminEmail()` falls back to `false` on DB error — silently degrades access control

**Issue:** `src/lib/auth.ts` lines 201–209 catch any error from the AdminUser DB lookup and return `false`. If the database is briefly unreachable, legitimate admins are silently locked out. However, the ADMIN_EMAILS env var still works as fallback.

- Files: `src/lib/auth.ts` lines 200–209
- Impact: Not critical given the env var fallback, but the silent swallow of DB errors is invisible to monitoring.

### `ApiRequestLog` stores full CPF/CNPJ in `term` column without encryption

**Issue:** `prisma/schema.prisma` line 141 stores `term String` in `ApiRequestLog`. The `term` is the raw CPF or CNPJ number. Combined with `responseRaw Json` containing full personal data, this table is a LGPD risk — it is not anonymized, has no TTL, and is not included in the LGPD anonymization cron.

- Files: `prisma/schema.prisma` lines 136–155, `src/lib/inngest/crons.ts` (absent from anonymization)
- Impact: Full personal data persists indefinitely. Under LGPD Art. 16, data should be deleted or anonymized after the processing purpose ends.
- Fix approach: Add `ApiRequestLog` to LGPD cleanup / anonymization cron with a configurable retention period (e.g., 90 days). Consider hashing `term` instead of storing plaintext CPF/CNPJ.

### Webhook secret only validated for presence, not format

**Issue:** `src/lib/abacatepay.ts` lines 157–161 compare `secret === process.env.ABACATEPAY_WEBHOOK_SECRET`. If `ABACATEPAY_WEBHOOK_SECRET` is not set, the comparison is `'somevalue' === undefined` which is `false`, causing all webhooks to be rejected with 401. If it IS set to an empty string, all requests with `?webhookSecret=` pass.

- Files: `src/lib/abacatepay.ts` lines 157–161
- Impact: Misconfiguration (empty env var) silently accepts any webhook. Should throw on missing env var at startup rather than silently returning false.

---

## 4. OVER-ENGINEERING / COMPLEXITY

### `email.ts` is 979 lines of inline HTML string templates

**Issue:** `src/lib/email.ts` is 979 lines containing 9 email functions, each building HTML via string interpolation. All HTML, CSS, and content is hardcoded. The `emailShell()` and `emailHeader()` helpers reduce some duplication, but each email still contains hundreds of lines of table-based HTML.

- Files: `src/lib/email.ts` (979 lines)
- Impact: Impossible to maintain design consistency across templates. Any brand change (colors, font, logo) requires 9 edits in 9 places. Inline HTML strings are not syntax-highlighted or linted as HTML. Risk of broken HTML on edge cases (special characters in names not escaped with `htmlspecialchars`-equivalent).
- Fix approach: Use React Email (`@react-email/components`) or at minimum extract to `.html` template files with a small templating function. The current approach is a maintenance liability for a system with ~9 transactional emails.

### `apifull.ts` is 592 lines with near-duplicate CPF and CNPJ financial mappers

**Issue:** `src/lib/apifull.ts` contains `mapCpfFinancialResponse()` (lines 275–340) and `mapCnpjFinancialResponse()` (lines 526–592). Both functions are ~65 lines each and are structurally identical — they parse the same `CREDCADASTRAL` UPPERCASE format, extract the same field paths, and return the same shape. Only the returned type differs.

- Files: `src/lib/apifull.ts` lines 275–340 and 526–592
- Impact: Bug in the CPF parser will not be automatically fixed in CNPJ. Already happened once (the `srs-premium` → `serasa-premium` migration required duplicate changes).
- Fix approach: Extract a shared `mapFinancialResponse()` helper with a generic return type.

### Three execution modes (`MOCK_MODE`, `TEST_MODE`, `BYPASS_PAYMENT`) + `isDev` check = complex branching

**Issue:** `src/lib/mock-mode.ts` exports `isMockMode`, `isTestMode`, `isBypassMode`, `isBypassPayment`. In `src/app/api/purchases/route.ts`, additional branching on `isDev = process.env.NODE_ENV === 'development'` (line 62) creates a 4-dimensional matrix. The same check at line 88 also reads `!isBypassMode && !isDev` for auth bypass.

- Files: `src/lib/mock-mode.ts`, `src/app/api/purchases/route.ts` lines 62–93, `src/app/api/webhooks/abacatepay/route.ts`
- Impact: New developers cannot reason about which code path runs in which environment. Tests may silently run in an unintended mode. Rate limit and auth are both bypassed in `NODE_ENV=development` by default, which is fine locally but dangerous if `NODE_ENV` is accidentally set to `development` in a production-like environment.
- Fix approach: Consolidate the mode logic into a single `getExecutionMode(): 'mock' | 'test' | 'live'` function. Document explicitly which guards apply in which mode.

### `src/lib/hooks` directory has a duplicate `hooks 2` directory

**Issue:** `ls src/lib/` shows both `hooks` and `hooks 2` directories. The `hooks 2` directory name suggests an accidental copy or leftover from a refactor.

- Files: `src/lib/hooks 2/` (exact contents unknown but the name indicates duplication)
- Impact: Build tools may pick up both directories. Confusing for any developer opening the project.
- Fix approach: Inspect and delete `hooks 2/`.

### `src/app/api/admin/health/incidents/route.ts` uses in-memory array for incidents

**Issue:** `src/app/api/admin/health/incidents/route.ts` lines 15–37 store incidents in a module-level `const incidents: Incident[] = []`. In Vercel's serverless model, each function invocation is a fresh process — the array is always empty in production (except mock data in MOCK_MODE). There is no UI to create incidents, no persistence, and no clear purpose for this endpoint in production.

- Files: `src/app/api/admin/health/incidents/route.ts`
- Impact: The entire incidents feature is non-functional in production. It's dead code that takes up space and could mislead admins into thinking there's an incident tracking system.
- Fix approach: Either implement real persistence (a DB table) or remove the endpoint entirely and strip the UI component that calls it.

---

## 5. ABACATEPAY V2 REDIRECT ISSUE

### The core problem: AbacatePay v2 checkout is an external page — no webhook-triggered redirect exists

**How the current flow works:**

1. User submits CPF/CNPJ on `/consulta/[term]`
2. `POST /api/purchases` creates a `Purchase` (PENDING) and calls AbacatePay v2 `POST /v2/checkouts/create`
3. Response includes `data.url` — an external AbacatePay-hosted payment page
4. Frontend redirects user to that external URL (the user leaves the EOPIX domain)
5. User completes payment on AbacatePay's page
6. AbacatePay fires a webhook to `POST /api/webhooks/abacatepay` (server-side, no user involved)
7. AbacatePay redirects the user to the `completionUrl` — which is set to `${appUrl}/compra/confirmacao?code=${code}`

**The redirect problem:**
- The `completionUrl` / `successUrl` is set at checkout creation time in `src/lib/abacatepay.ts` line 100 (`completionUrl: params.successUrl`)
- AbacatePay v2 docs confirm this is the `completionUrl` field, which redirects the user's browser after payment
- Files: `src/lib/abacatepay.ts` lines 97–103, `src/app/api/purchases/route.ts` lines 304–310

**Documented owner concern — "user has to manually close browser":**
This symptom suggests the `completionUrl` redirect is either:
  - Not being triggered by AbacatePay (some payment methods, e.g. PIX, may complete asynchronously after the user has already left the checkout page), OR
  - Redirecting correctly but the `/compra/confirmacao` page loses the user session (see `sameSite: 'strict'` concern above), OR
  - The user pays via PIX QR code shown on AbacatePay's page, scans with their phone, and the browser tab with the AbacatePay checkout is still open — the tab never automatically closes or redirects until the payment is confirmed (which can take seconds to minutes)

**Root cause assessment:**
PIX is the primary payment method for Brazilian users. PIX payment on AbacatePay v2 is asynchronous: the user sees a QR code, switches to their bank app, completes payment, then returns manually to the browser. AbacatePay's `completionUrl` redirect may only fire for card payments (synchronous). For PIX, there is no automatic redirect. The user must manually go back to the tab or be told "return to the site."

**Options to fix:**
1. **Polling on confirmation page**: The `/compra/confirmacao?code=X` page could poll `GET /api/purchases/stream?code=X` (SSE) and, when purchase transitions from PENDING to PAID, auto-display "payment confirmed" without needing a redirect. The user would need to manually navigate to this URL though (or it could be shown as a link on the AbacatePay checkout page via the `completionUrl` which they click after PIX).
2. **Transparent checkout (PIX QR Code API)**: AbacatePay v2 has `POST /v2/transparents/create` which returns a `brCode` + `brCodeBase64` for in-page PIX display. This keeps the user on the EOPIX site throughout the entire flow — no redirect. Polling `GET /v2/transparents/check` confirms payment. This is the correct fix for the redirect problem.
3. **WhatsApp/email "your report is ready"**: Send the user an email with a direct link when the Inngest pipeline completes (already implemented via `sendPurchaseApprovedEmail`), so the redirect is not load-bearing.

**Current mitigation:** `sendPurchaseApprovedEmail` is sent when the pipeline completes, so the user will eventually get a link. But they have no way to find their report without the email.

---

## 6. PIPELINE RELIABILITY

### `consultCpfCadastral` failure is swallowed — pipeline continues with `null` data

**Issue:** `src/lib/inngest/process-search.ts` lines 145–148 catch any error from `consultCpfCadastral()` and return `null`. The pipeline then proceeds with `cadastralData: null`. The report's name field becomes `CPF ${term}` (line 172) instead of the person's actual name.

- Files: `src/lib/inngest/process-search.ts` lines 145–148
- Impact: A report is generated with no cadastral data (no name, no address, no phone, no companies). The user paid R$39,90 for a degraded product. The purchase completes as COMPLETED with no indication of the missing data. No alert to admin.
- Fix approach: Either throw and retry (making it a hard failure), or track partial failure in the `SearchResult.data` and show a warning on the report page.

### `consultCpfFinancial` failure is NOT swallowed — inconsistent error handling

**Issue:** Unlike `consultCpfCadastral`, `consultCpfFinancial()` (line 157) is called without `.catch()`. If it throws, the entire pipeline fails to FAILED and Inngest retries. The inconsistency is confusing — sometimes missing data is acceptable (cadastral), sometimes not (financial).

- Files: `src/lib/inngest/process-search.ts` lines 156–162
- Impact: Inconsistent user experience. A temporary APIFull financial endpoint failure causes a full pipeline FAILED, whereas a permanent cadastral endpoint failure produces a silent partial report.

### `step.run('cache-progress')` contains all progress simulation in one step — no retry granularity

**Issue:** The 60-second cache-hit simulation is a single Inngest step. If it fails (e.g., DB connection dropped mid-step), Inngest retries the **entire 60-second loop** from the start, resetting `processingStep` back to 1.

- Files: `src/lib/inngest/process-search.ts` lines 75–100

### Inngest concurrency limit of 5 with 10 retries = backpressure under load

**Issue:** `processSearch` has `concurrency: { limit: 5 }` and `retries: 10`. With exponential backoff, a batch of FAILED purchases being reprocessed (e.g., after APIFull goes down) will create a queue that holds up new purchases. New paying customers would wait behind retry attempts from earlier failures.

- Files: `src/lib/inngest/process-search.ts` lines 44–48
- Impact: Under APIFull outage, all retries pile up (10 retries × exponential backoff), blocking concurrency slots for new purchases.
- Fix approach: Use a separate concurrency key for retries vs new purchases, or set `retries: 3` for the balance check step that causes most outage-related failures.

### No timeout configured for OpenAI steps

**Issue:** The OpenAI calls in `src/lib/openai.ts` use the OpenAI SDK default timeout (600 seconds). There is no `AbortController` or custom timeout. An OpenAI API slowdown would cause the Inngest step to hang for up to 10 minutes.

- Files: `src/lib/openai.ts`, `src/lib/inngest/process-search.ts` lines 228–268
- Impact: Pipeline stuck waiting for OpenAI. The Inngest function would eventually timeout, mark FAILED, and retry — but 10 minutes per attempt × 10 retries = 100 minutes of potential block time.
- Fix approach: Wrap OpenAI calls in `fetchWithTimeout` equivalent or set `timeout` in the OpenAI client constructor.

---

## 7. DOCUMENTATION DRIFT

### `docs/api-contracts/cpf-financeiro.md` documents the WRONG endpoint

**Critical mismatch:** `docs/api-contracts/cpf-financeiro.md` documents the old `srs-premium` endpoint with path `dados.data.serasaPremium.consultaCredito.*` (lowercase camelCase format). The code uses `serasa-premium` endpoint which returns `dados.CREDCADASTRAL.*` (UPPERCASE). The contract doc has not been updated since the `srs-premium` → `serasa-premium` migration.

- Files: `docs/api-contracts/cpf-financeiro.md`, `src/lib/apifull.ts` lines 277–340
- Impact: Any developer reading the contract will implement against the wrong response structure. This is the exact type of bug that caused the financial data outage documented in `docs/status.md` on 2026-03-19. HIGH RISK.

### `docs/architecture.md` states "24h cache" but code uses full TTL (up to 7 days)

**Issue:** `docs/architecture.md` lines 105 and the sequence diagram note "Cache check: If CPF/CNPJ already consulted in 24h, reuse result." The cache check in code (`process-search.ts` lines 56–63) uses `expiresAt: { gt: new Date() }` — there is no 24h window. Any non-expired result (up to 7 days old) is reused.

- Files: `docs/architecture.md`, `src/lib/inngest/process-search.ts`
- Impact: Product behavior differs from documented behavior. Users who buy a report on a CPF that was queried 5 days ago get stale data — the 24h doc implies they'd get fresh data.

### TTL is 7 days in all docs and code — this matches

**Confirmed:** `src/lib/report-ttl.ts` line 1 sets `DEFAULT_REPORT_TTL_HOURS = 168` (7 × 24 = 168 hours = 7 days). All documentation correctly states 7-day TTL. This concern from the owner is **not an actual bug** in the current code.

### `docs/api-contracts/cpf-cadastral.md` (not read — may also be stale)

The CPF cadastral endpoint was also changed from `r-cpf-completo` to `ic-cpf-completo`. If the contract doc still references `r-cpf-completo` or the old `dados.data.cadastralPF` path structure, it is incorrect.

- Files: `docs/api-contracts/cpf-cadastral.md` — needs verification
- Fix approach: Review all 5 contract docs against current `src/lib/apifull.ts` mapper functions.

### `src/types/domain.ts` still lists `'stripe'` as a valid `PaymentProvider`

**Issue:** `src/types/domain.ts` line 9: `export type PaymentProvider = 'stripe' | 'abacatepay'`. Stripe was removed. The type accepts `'stripe'` as valid. The Prisma schema field `paymentProvider` is `String?` (not an enum), so this is the only type guard.

- Files: `src/types/domain.ts` line 9
- Fix approach: Remove `'stripe'` from the union type.

---

## 8. TECHNICAL DEBT PRIORITY LIST

| # | Issue | Impact | Effort | Priority |
|---|-------|--------|--------|----------|
| 1 | `docs/api-contracts/cpf-financeiro.md` documents wrong endpoint (srs-premium vs serasa-premium) | HIGH — developers implement against wrong API structure | Low (update doc) | **HIGH** |
| 2 | Webhook log written after Inngest send — race condition causes missed pipeline on retry | HIGH — purchases stuck in PAID silently | Medium (reorder + transaction) | **HIGH** |
| 3 | AbacatePay PIX redirect issue — user gets no automatic redirect after PIX payment | HIGH — primary payment method (PIX) results in confusing UX | High (implement transparent PIX checkout) | **HIGH** |
| 4 | Cache-hit sleeps 60s in one Inngest step — timeout risk on Vercel | HIGH — cache-hit purchases can get stuck in PROCESSING | Low (split step.sleep calls) | **HIGH** |
| 5 | `ApiRequestLog` stores full response JSON with no cleanup — unbounded table growth | MEDIUM — storage and performance degradation over time | Low (add cron + truncate responseRaw) | **MEDIUM** |
| 6 | `stripePaymentIntentId` dead column in schema | LOW — schema confusion, minor storage waste | Low (migration) | **MEDIUM** |
| 7 | `consultCpfCadastral` swallows errors — produces silent partial reports | MEDIUM — user pays full price for degraded report with no notice | Medium (add error tracking, report-level partial flag) | **MEDIUM** |
| 8 | `LeadCapture` has no unique constraint — duplicate rows accumulate | MEDIUM — inflated analytics, duplicate abandonment emails | Low (add unique constraint + upsert) | **MEDIUM** |
| 9 | Rate limit implementation is non-atomic — can be bypassed under concurrency | LOW (low traffic volume) | Medium (atomic DB increment or Redis) | **MEDIUM** |
| 10 | `email.ts` is 979 lines of inline HTML strings — unmaintainable | MEDIUM — any design change requires 9 manual edits | High (migrate to React Email) | **LOW** |

### Other items not prioritized above but worth tracking

- `hooks 2/` directory in `src/lib/` — likely accidental copy, needs investigation
- Incidents endpoint uses in-memory array — completely non-functional in production
- Session `sameSite: 'strict'` may drop cookie on post-payment redirect
- LGPD gap: `ApiRequestLog` contains raw CPF/CNPJ with no retention policy or anonymization
- `src/types/domain.ts` still lists `'stripe'` as valid PaymentProvider
- Architecture doc claims 24h cache window but code uses full TTL
- No OpenAI call timeout — risk of 10-minute pipeline hang
- `ABACATEPAY_PUBLIC_KEY` hardcoded in source instead of env var

---

*Concerns audit: 2026-03-25*
