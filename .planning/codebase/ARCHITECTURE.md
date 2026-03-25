# Architecture

**Analysis Date:** 2026-03-25

## Pattern Overview

**Overall:** Event-driven async pipeline with server-rendered display

**Key Characteristics:**
- Payment-gated async processing: user pays → webhook → Inngest job → data APIs → report stored
- Stateful purchase lifecycle: PENDING → PAID → PROCESSING → COMPLETED | FAILED → REFUNDED
- Three execution modes: MOCK_MODE (all mocked), TEST_MODE (real APIs, no payment), LIVE
- SSE polling bridges async job progress to real-time UI feedback
- SearchResult is a cached artifact shared across purchases for the same CPF/CNPJ

## Main Request/Data Flow

**1. Purchase Creation (`POST /api/purchases`):**

1. Validate input (CPF/CNPJ format, rate limit, blocklist, auth)
2. Deduplicate: if user has active COMPLETED report for same doc → 409 with `existingReportId`
3. Reuse PENDING purchase (<30 min) if it exists
4. Create/find User record (or guest with `guest-{code}@guest.eopix.app`)
5. Create `LeadCapture` record for abandonment funnel
6. Call AbacatePay `/v2/checkouts/create` → get `checkoutUrl`
7. Store `paymentExternalId` (checkout id) on Purchase
8. Send `purchase/created` event to Inngest (triggers abandonment email sequence)
9. Return `{ code, checkoutUrl }` → frontend redirects user to AbacatePay

**Bypass path (MOCK/TEST):** Creates Purchase as PAID immediately, fires `search/process` Inngest event, falls back to `POST /api/process-search/{code}` if Inngest unavailable.

**2. Payment Confirmation (`POST /api/webhooks/abacatepay`):**

1. Validate webhook secret from query string + HMAC-SHA256 signature
2. Idempotency check via `WebhookLog` (key: `abacate:payment:{checkoutId}`)
3. Find Purchase by `externalId` (from v2 payload) or `paymentExternalId` (fallback)
4. Update Purchase PENDING → PAID, set `paidAt`, update guest user email if real email provided
5. Send `purchase/received` email (fire-and-forget)
6. Send `search/process` Inngest event — re-throws on failure so AbacatePay retries (→ 500)

**3. Async Processing (Inngest `search/process` job):**

See Inngest Architecture section below.

**4. Status Polling (`GET /api/purchases/stream`):**

SSE stream polled every 1 second by `/minhas-consultas`. Returns purchase list filtered to PROCESSING/PAID/COMPLETED/FAILED. Client navigates to `/relatorio/{id}` when status is COMPLETED.

**5. Report Display (`/relatorio/[id]/page.tsx`):**

Server Component. Fetches `SearchResult` from DB via `GET /api/report/{id}`. Renders using component tree at `src/components/relatorio/`.

---

## Inngest Job Architecture

**File:** `src/lib/inngest/process-search.ts`

**Function config:**
- id: `process-search`
- event trigger: `search/process`
- retries: 10 (exponential backoff)
- concurrency: 5 simultaneous jobs

**Steps (each step is memoized — safe to replay on retry):**

| Step | Name | What It Does |
|------|------|-------------|
| 1 | `check-cache` | Query `SearchResult` for same term+type not expired. Cache hit → jump to `cache-progress` |
| cache path | `cache-progress` | Simulates 6 processing steps over ~60s for UX, then marks COMPLETED with existing SearchResult |
| 1.5 | `check-balance` | Check APIFull balance via `/api/saldo`. Insufficient → throw (triggers Inngest retry in ~5 min) |
| 2 | `fetch-data` | Call APIFull: CPF path calls `ic-cpf-completo` + `serasa-premium` + `r-acoes-e-processos-judiciais` in parallel. CNPJ path calls `ic-dossie-juridico` + `serasa-premium` |
| 3 | `fetch-web` | Call Serper with 4 queries: byDocument, byName, reclameAqui, news |
| 4a | `analyze-processos` | OpenAI: classify judicial processes (CPF only). Compute `FinancialSummary` (pure math) |
| 4b | `analyze-summary` | OpenAI: classify web mentions + generate final summary |
| 5 | `save-result` | Create `SearchResult` record. Update Purchase → COMPLETED. Link Purchase.searchResultId |

**Error handling in process-search:**
- On any throw: updates Purchase to FAILED with `failureReason: PROCESSING_ERROR` and JSON `failureDetails` (message + stack + currentStep)
- Re-throws to trigger Inngest retry (up to 10 times)
- On final failure: sends `purchase/denied` email (fire-and-forget, skips PAYMENT_EXPIRED)

**Other Inngest events:**
- `purchase/created` → `abandonment-email-sequence` (triggered on LIVE purchase creation, not bypass)

---

## Inngest Functions Registry

**File:** `src/lib/inngest/crons.ts` (exports `functions[]` array)

All 7 functions registered in `functions[]`:

| Function | Trigger | Schedule | Purpose |
|----------|---------|----------|---------|
| `processSearch` | `search/process` event | On demand | Main pipeline |
| `abandonmentEmailSequence` | `purchase/created` event | On demand | R1/R2/R3 email funnel |
| `cleanupSearchResults` | cron | `0 3 * * *` (daily 03:00) | Delete expired SearchResults |
| `cleanupLeads` | cron | `15 3 * * *` (daily 03:15) | Delete LeadCapture >90 days |
| `cleanupPendingPurchases` | cron | `*/15 * * * *` (every 15 min) | Expire PENDING purchases >30 min → FAILED+PAYMENT_EXPIRED |
| `anonymizePurchases` | cron | `0 0 1 * *` (monthly 1st) | LGPD: anonymize COMPLETED/REFUNDED purchases >2 years |
| `cleanupPasswordResetTokens` | cron | `45 3 * * *` (daily 03:45) | Delete expired/used password reset tokens |

**Inngest serve handler:** `src/app/api/inngest/route.ts`

---

## Abandonment Email Funnel

**File:** `src/lib/inngest/abandonment-emails.ts`

Triggered by `purchase/created` event. Uses `step.sleep` for delays:

- R1: wait 30 minutes → check if still abandoned → send `sendAbandonmentEmail1`
- R2: wait 24 hours from R1 → check again → send `sendAbandonmentEmail2`
- R3: wait 72 hours from R2 → check again → send `sendAbandonmentEmail3`

At each step: checks if purchase is PAID (abort), checks `user.emailOptOut` (abort if true). "Abandoned" = PENDING or FAILED+PAYMENT_EXPIRED.

---

## API Route Patterns

**Public routes (no auth):**

| Route | Method | Purpose |
|-------|--------|---------|
| `POST /api/purchases` | POST | Create purchase + checkout (auth required in LIVE) |
| `GET /api/purchases` | GET | List user purchases (auth required) |
| `GET /api/purchases/stream` | GET | SSE purchase status stream (auth required) |
| `GET /api/purchases/[code]` | GET | Single purchase by code |
| `POST /api/webhooks/abacatepay` | POST | Payment webhook (no session, HMAC validated) |
| `POST /api/process-search/[code]` | POST | Sync fallback (MOCK/TEST only) |
| `GET /api/report/[id]` | GET | Fetch SearchResult for display |
| `POST /api/auth/register` | POST | Email+password registration |
| `POST /api/auth/login` | POST | Email+password login |
| `POST /api/auth/logout` | POST | Clear session cookie |
| `GET /api/auth/me` | GET | Get current session |
| `POST /api/auth/auto-login` | POST | Magic code auto-login (post-payment) |
| `POST /api/auth/forgot-password` | POST | Send password reset email |
| `POST /api/auth/reset-password` | POST | Consume reset token, set new password |
| `POST /api/leads` | POST | Lead capture |
| `POST /api/lgpd-requests` | POST | LGPD data requests |
| `GET /api/search/validate` | GET | Validate CPF/CNPJ format |
| `GET /api/health` | GET | Basic health check |

**Admin routes (admin JWT required):**

| Route | Purpose |
|-------|---------|
| `POST /api/admin/login` | Admin password login → 8h session |
| `GET /api/admin/purchases` | List purchases with search |
| `GET /api/admin/purchases/[id]/details` | Purchase details |
| `POST /api/admin/purchases/[id]/mark-paid` | Mark PENDING → PAID |
| `POST /api/admin/purchases/[id]/mark-paid-and-process` | Mark PAID + trigger Inngest |
| `POST /api/admin/purchases/[id]/process` | Trigger processing (PAID/FAILED) |
| `POST /api/admin/purchases/[id]/refund` | Mark as refunded |
| `POST /api/admin/purchases/batch-process` | Batch reprocess all FAILED |
| `GET /api/admin/dashboard` | Revenue stats (COMPLETED only) |
| `GET /api/admin/health` | APIFull balance, Serper credits, OpenAI connectivity |
| `GET/POST /api/admin/blocklist` | Manage blocked terms |
| `DELETE /api/admin/blocklist/[id]` | Remove from blocklist |
| `GET /api/admin/leads` | View LeadCapture records |
| `GET /api/admin/monitor/stream` | SSE real-time pipeline monitor (3s polling) |
| `GET /api/admin/health/incidents` | Health incidents |

---

## Authentication Flow

**User auth (`src/lib/auth.ts`):**

- Custom JWT implementation using Web Crypto API (`crypto.subtle`)
- Algorithm: HMAC-SHA256, stored as `eopix_session` httpOnly cookie
- Session duration: 30 days (user), 8 hours (admin)
- Cookie flags: `httpOnly`, `secure` (production), `sameSite: strict`
- `createSession(email)` → signs JWT → sets cookie
- `getSession(request?)` → reads cookie → verifies HMAC (constant-time) → checks `exp`
- `isAdminEmail(email)` → checks `ADMIN_EMAILS` env var OR `AdminUser` table
- No middleware: auth checked per-route via `getSession()` / `requireAuth()` / `requireAdmin()`

**Admin auth (`src/lib/admin-auth.ts`):**

- Separate `AdminUser` table with bcrypt password hash
- `verifyAdminCredentials()` → bcrypt.compare → returns boolean
- Admin login rate-limited: 5 attempts / 15 min per IP via `checkRateLimit()`
- Same JWT/cookie mechanism as user auth (shared `eopix_session` cookie)

**User registration/login (`src/app/api/auth/register/route.ts`, `src/app/api/auth/login/route.ts`):**

- Register: validate email+password (Zod), bcrypt hash (10 rounds), create User, createSession
- Login: find User by email, bcrypt.compare, createSession
- Password reset: `PasswordResetToken` table (64-char token, 1h TTL, single-use via `usedAt`)

---

## SSE Usage

**User-facing SSE (`GET /api/purchases/stream`):**
- Auth: `getSession()` required
- Poll interval: 1 second (DB query each tick)
- Returns: array of purchases with status PROCESSING/PAID/COMPLETED/FAILED
- Client: `src/lib/hooks/use-purchase-polling.ts` — EventSource with fallback polling
- Disconnect: `request.signal.abort` listener clears interval

**Admin monitor SSE (`GET /api/admin/monitor/stream`):**
- Auth: `requireAdmin()` required
- Poll interval: 3 seconds
- Returns: `{ active, queued, failed, completed }` — 4 parallel Prisma queries
- Client: `/admin/monitor/page.tsx` — EventSource with 5s auto-reconnect

---

## Caching Strategy

**SearchResult reuse:**
- TTL: default 168 hours (7 days), configurable via `REPORT_TTL_HOURS` env var
- `src/lib/report-ttl.ts` → `getReportExpiresAt()` computes `expiresAt` at creation time
- Cache check: step 1 of `processSearch` queries `SearchResult` where `term + type + expiresAt > now`
- Cache hit: no API calls made; simulates 6-step progress over ~60s for UX, then links existing result
- Cache miss: full pipeline (APIFull + Serper + OpenAI), new SearchResult created
- Deduplication at purchase level: `POST /api/purchases` returns 409 if user already has active COMPLETED purchase for same document

**Note:** The `check-cache` step in process-search is a 24-hour cache check based on documentation comments in the code (`// Cache check (24h window)` in architecture.md). The actual code checks `expiresAt > now`, which uses the full TTL (7 days by default). The 24h comment in architecture.md is outdated — real TTL is 7 days.

---

## Error Handling Strategy

**API routes:**
- Try/catch wrapping entire handler body
- Sentry.captureException on checkout errors with context tags
- Specific HTTP status codes: 400 (validation), 401 (unauth), 403 (blocked), 409 (duplicate), 429 (rate limit), 500 (server error)

**Inngest pipeline:**
- Step-level: APIFull cadastral is `.catch(() => null)` (non-fatal, pipeline continues)
- Step-level: Serper is `.catch(() => { return empty })` (non-fatal)
- Pipeline-level: any uncaught throw → Purchase FAILED with `failureDetails` JSON → re-throws for Inngest retry
- Balance check: insufficient balance throws `INSUFFICIENT_API_BALANCE` → Inngest retries after backoff
- Max 10 retries with exponential backoff

**Webhook:**
- Errors in `handlePaymentSuccess` propagate to handler → returns 500 → AbacatePay retries delivery
- Idempotency prevents double-processing

**Frontend:**
- FAILED purchases displayed as "Processando" to users (admin sees real status)
- Stuck detection: PurchaseDetailsDialog shows "Possivelmente travado" banner for purchases stuck >5 min

---

## Cross-Cutting Concerns

**Logging:** `console.log/warn/error` throughout. Structured log entries with `[ServiceName]` prefix (e.g., `[AbacatePay Webhook]`, `[Pipeline]`, `[BYPASS]`). No centralized logging service.

**Validation:** Zod used in auth routes and admin routes. Custom validators in `src/lib/validators.ts` (CPF/CNPJ checksum, email format, document formatting).

**Rate limiting:** `src/lib/rate-limit.ts` — Prisma-backed `RateLimit` table. Used on `POST /api/purchases` (bypassed in dev/MOCK/TEST) and admin login. Configurable window and count.

**Email:** `src/lib/email.ts` — Resend provider, 9 email functions. All calls are fire-and-forget (`.catch` logged). Idempotency keys passed to Resend. Guest users (`@guest.eopix.app`) always skipped.

**LGPD Compliance:**
- `LgpdRequest` table for Art. 18 requests via `POST /api/lgpd-requests`
- Monthly `anonymizePurchases` cron: overwrites `buyerName`/`buyerCpfCnpj` with `'ANONIMIZADO'` for COMPLETED/REFUNDED purchases >2 years
- `emailOptOut` flag on User; respected in abandonment email funnel
- `POST /api/unsubscribe` to set opt-out flag

---

*Architecture analysis: 2026-03-25*
