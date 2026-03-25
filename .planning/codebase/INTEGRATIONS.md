# External Integrations

**Analysis Date:** 2026-03-25

## APIs & External Services

### AbacatePay (Payment Gateway)

- **Purpose:** Brazilian payment gateway for PIX and card. Sole payment provider.
- **SDK/Client:** Direct `fetch` calls (SDK was replaced — `@abacatepay/sdk` was removed because it silently swallowed 422 errors)
- **Client file:** `src/lib/abacatepay.ts`
- **Auth:** `Authorization: Bearer <ABACATEPAY_API_KEY>` (`abc_dev_*` = sandbox, `abc_*` = production)
- **API version:** v2 (`https://api.abacatepay.com/v2`)
- **Endpoints used:**
  - `POST /v2/customers/create` — deduplicate customer by taxId; called in `createOrGetCustomer()`
  - `POST /v2/checkouts/create` — create payment page; items by product ID (`ABACATEPAY_PRODUCT_ID`)
  - `GET /v2/checkouts/get` — retrieve existing PENDING checkout to reuse (<30 min window)
- **Webhook:** `POST /api/webhooks/abacatepay/route.ts`
  - Event listened for: `checkout.completed`
  - Two security layers: URL query param `webhookSecret` + HMAC-SHA256 header `X-Webhook-Signature`
  - Webhook secret validated via `ABACATEPAY_WEBHOOK_SECRET` env var
  - HMAC validated against a hardcoded AbacatePay public key in `abacatepay.ts` (line 154)
  - Lookup: primary by `externalId` (purchase code), fallback by `paymentExternalId`
- **Refunds:** No API endpoint exists. Refunds are manual via AbacatePay dashboard. `processRefund()` always returns `success: false` in live mode.
- **Bypass:** `isBypassPayment` flag (`src/lib/mock-mode.ts`) skips all payment calls; returns fake `bill_bypass_*` IDs
- **Known quirks:**
  - Customer deduplication is permanent by taxId — name/email/cellphone are NOT updated on subsequent checkouts with same taxId
  - Old sandbox test data persists (same CPF will show earlier customer name on checkout page)
  - `ABACATEPAY_PRODUCT_ID` env var must be set; product must be pre-created in AbacatePay dashboard
  - Products cannot be inline in checkout body (API rejects `{ externalId, name, price }` format — must use `{ id }`)

---

### APIFull (Brazilian Data APIs)

- **Purpose:** Core data source for CPF/CNPJ reports — cadastral data, financial data (Serasa), judicial processes, and CNPJ dossier
- **Client file:** `src/lib/apifull.ts`
- **Balance check file:** `src/lib/apifull-balance.ts`
- **Auth:** `Authorization: Bearer <APIFULL_API_KEY>`, `User-Agent: EOPIX/1.0` (required — Apache returns 403 without)
- **Base URL:** `https://api.apifull.com.br/api/`
- **Timeout:** 30s per request (`fetchWithTimeout`)
- **Endpoints actually used (critical — wrong endpoint = broken reports):**

| Function | Endpoint URL | Link param | Document param | Response format |
|---|---|---|---|---|
| `consultCpfCadastral()` | `/api/ic-cpf-completo` | `ic-cpf-completo` | `cpf` | `dados.CREDCADASTRAL` (UPPERCASE) |
| `consultCpfProcessos()` | `/api/r-acoes-e-processos-judiciais` | `r-acoes-e-processos-judiciais` | `cpf` | `dados.data.acoesProcessos` (lowercase) |
| `consultCpfFinancial()` | `/api/serasa-premium` | `serasa-premium` | `document` | `dados.CREDCADASTRAL` (UPPERCASE) |
| `consultCnpjDossie()` | `/api/ic-dossie-juridico` | `ic-dossie-juridico` | `document` | `dados.CREDCADASTRAL` (UPPERCASE) |
| `consultCnpjFinancial()` | `/api/serasa-premium` | `serasa-premium` | `document` | `dados.CREDCADASTRAL` (UPPERCASE) |
| Balance check | `/api/get-balance` | — | — | `dados.Saldo` (number or string) |

- **Response parsing notes:**
  - `ic-*` and `serasa-premium` return UPPERCASE keys (`CREDCADASTRAL`, `IDENTIFICACAO_PESSOA_FISICA`, etc.)
  - `r-*` endpoints return lowercase keys (`dados.data.acoesProcessos`)
  - Financial values are strings with BR decimal format (`"868,91"`) — parsed via `parseFloat(val.replace(',', '.'))`
  - Financial fields: `PROTESTOS.OCORRENCIAS`, `RESTRICOES_FINANCEIRAS.OCORRENCIAS`, `CH_SEM_FUNDOS_BACEN`, `SCORES.OCORRENCIAS[0].SCORE`
- **Balance monitoring:** `checkApifullBalance()` fetches account balance; threshold configurable via `APIFULL_MIN_BALANCE` env var (default R$20). Admin health page (`/admin`) shows balance with color indicator.
- **Mock mode:** All 5 functions return mock data from `src/lib/mocks/apifull-data.ts` when `MOCK_MODE=true`. Mock scenario (Chuva/Sol) selected by last digit of CPF/CNPJ (0-4 = Chuva, 5-9 = Sol).
- **Critical historical note:** `r-cpf-completo` and `srs-premium` are deprecated/broken endpoints. NEVER use them. `r-cpf-completo` has separate credit pool that drains independently. `srs-premium` stopped working ~17/03/2026. Correct replacements are `ic-cpf-completo` and `serasa-premium`.
- **400 handling:** `consultCpfCadastral` 400 responses are handled gracefully at pipeline level — continue with `null` (see commit history).

---

### Serper (Google Search via API)

- **Purpose:** Web search for public mentions of CPF/CNPJ (news, Reclame Aqui, legal databases)
- **Client file:** `src/lib/google-search.ts`
- **Auth:** API key via `X-Api-Key: <SERPER_API_KEY>` header
- **Endpoint:** `POST https://google.serper.dev/search`
- **Timeout:** 8s (comment notes "stay within Vercel Hobby 10s function limit")
- **Queries executed (4 per document):**
  1. `byDocument` — search by CPF/CNPJ number directly
  2. `byName` — search by name + risk keywords ("escândalo OR investigação OR denúncia OR irregularidade OR fraude OR lavagem")
  3. `reclameAqui` — site:reclameaqui.com.br search for CNPJ entities
  4. `news` — open name search (Google returns most relevant results naturally)
- **Locale:** `gl: "br"`, `hl: "pt-br"` on all queries
- **CNPJ name simplification:** `simplifyCompanyName()` in `google-search.ts` strips legal suffixes (S/A, LTDA, ME, EIRELI, EPP) and status strings (EM LIQUIDACAO EXTRAJUDICIAL, etc.) before searching
- **Mock data:** `src/lib/mocks/google-data.ts`
- **Balance monitoring:** Admin health page checks remaining Serper credits; threshold 500 credits

---

### OpenAI (AI Synthesis)

- **Purpose:** Two-stage AI analysis — (1) classify judicial processes, (2) classify web mentions + generate final business risk summary
- **Client file:** `src/lib/openai.ts`
- **SDK:** `openai ^6.18.0`
- **Auth:** `OPENAI_API_KEY` env var
- **Model:** `gpt-4o-mini` (both calls)
- **Response format:** `json_object` (structured JSON output enforced)
- **Timeout:** 60s (large judicial process payloads need extra time)
- **Lazy initialization:** Client is NOT created at module load time. `getOpenAI()` creates instance on first call. This prevents build failures when `OPENAI_API_KEY` is absent.
- **Functions:**
  - `analyzeProcessos(processos, document)` — classifies each judicial process: relevância (alta/media/baixa/nenhuma), categoria, papel no polo. Caps at 30 most recent processes.
  - `analyzeMentionsAndSummary(input, document)` — classifies web mentions by relevance, sourceType (news/legal/complaint/government/other), polarity; extracts Reclame Aqui data; generates 2-3 sentence business decision summary.
  - `generateSummary(data, type, region, document)` — wrapper that calls both above in sequence.
- **Mock data:** `src/lib/mocks/openai-data.ts`

---

### Inngest (Async Job Orchestration)

- **Purpose:** Runs the full report pipeline asynchronously, outside Vercel's 10s function timeout limit. Each `step.run()` is memoized on retry — no wasted API credits on failure.
- **Client file:** `src/lib/inngest/client.ts`
- **Handler route:** `src/app/api/inngest/route.ts`
- **Auth:** `INNGEST_EVENT_KEY` (event signing), `INNGEST_SIGNING_KEY` (webhook verification)
- **App ID:** `eopix`
- **Registered functions (in `src/lib/inngest/crons.ts`):**

| Function | ID | Trigger | Schedule |
|---|---|---|---|
| `processSearch` | `process-search` | event: `search/process` | On demand |
| `cleanupSearchResults` | `cleanup-search-results` | cron | Daily 03:00 |
| `cleanupLeads` | `cleanup-leads` | cron | Daily 03:15 |
| `cleanupPendingPurchases` | `cleanup-pending-purchases` | cron | Every 15 min |
| `cleanupPasswordResetTokens` | `cleanup-password-reset-tokens` | cron | Daily 03:45 |
| `anonymizePurchases` | `anonymize-purchases` | cron | Monthly, 1st day (LGPD Art. 16) |
| `abandonmentEmailSequence` | (in `abandonment-emails.ts`) | event: `purchase/created` | step.sleep: R1 30min, R2 24h, R3 72h |

- **Concurrency:** `processSearch` has `{ limit: 5 }` — max 5 pipeline runs simultaneously
- **Retries:** `processSearch` retries up to 10 times with exponential backoff
- **Dev mode:** `npm run dev:live` starts Inngest dev CLI against `http://localhost:3000/api/inngest`. Without CLI, use sync fallback at `POST /api/process-search/[code]`.
- **Critical historical bug (fixed):** `processSearch` was defined but not included in the `functions[]` array passed to `serve()`. All `search/process` events were silently dropped. Fixed by adding it to the array in `crons.ts`.

---

### Resend (Transactional Email)

- **Purpose:** All transactional emails (welcome, purchase lifecycle, password reset, abandonment funnel)
- **Client file:** `src/lib/email.ts`
- **SDK:** `resend ^6.9.4`
- **Auth:** `RESEND_API_KEY` env var
- **From address:** `EOPIX <noreply@somoseopix.com.br>`
- **Idempotency:** All send calls include `idempotencyKey` to prevent duplicate delivery
- **Email functions:**
  - `sendWelcomeEmail` — on user register (`src/app/api/auth/register/route.ts`)
  - `sendPurchaseReceivedEmail` — after AbacatePay webhook confirms payment
  - `sendPurchaseApprovedEmail` — after pipeline completes successfully (cache hit or new)
  - `sendPurchaseDeniedEmail` — when pipeline fails (except `PAYMENT_EXPIRED`)
  - `sendPurchaseRefundedEmail` — after admin marks refund
  - `sendPurchaseExpiredEmail` — in `cleanupPendingPurchases` cron (batch, per user)
  - `sendAbandonmentEmail1/2/3` — R1 (30 min), R2 (24h), R3 (72h) abandonment funnel via Inngest `step.sleep`
  - `sendPasswordResetEmail` — forgot password flow
  - `sendPasswordChangedEmail` — confirmation after reset
- **Email design:** Brutalist HTML with Zilla Slab + IBM Plex Mono, table-based layout, max-width 600px
- **Unsubscribe:** `buildUnsubscribeUrl()` in `src/lib/unsubscribe.ts` included in email footers
- **Bypass:** `isBypassMode` skips all email sending in mock/test mode

---

### Neon (PostgreSQL Database)

- **Purpose:** Primary persistence — all users, purchases, reports, audit logs
- **Client file:** `src/lib/prisma.ts`
- **Driver:** `@neondatabase/serverless ^1.0.2` (WebSocket-based, required for Vercel serverless)
- **ORM:** Prisma `^7.3.0` with `@prisma/adapter-neon ^7.3.0`
- **Connection:** Singleton pattern in `prisma.ts` — reused across hot-reload in dev via `globalThis`
- **Connection string:** `DATABASE_URL` env var (Neon connection pooler URL)
- **Direct URL:** `DIRECT_URL` env var (required by Prisma for schema migrations)
- **Database models:** `User`, `Purchase`, `SearchResult`, `AdminUser`, `Blocklist`, `RateLimit`, `WebhookLog`, `LeadCapture`, `ApiRequestLog`, `LgpdRequest`, `PasswordResetToken`
- **Branch policy:**
  - `develop` Neon branch = development/test environment
  - `main` Neon branch = production-only; NEVER run migrations against it directly
  - CI creates ephemeral branches (TTL 1h) for E2E integration tests via `scripts/tests/test-with-branch.ts`
- **SearchResult TTL:** 7 days (`expiresAt` column); cleaned by `cleanupSearchResults` cron
- **Schema location:** `prisma/schema.prisma`
- **Migration command:** `npx prisma migrate dev` (dev), `npx prisma migrate deploy` (CI/prod)

---

### Sentry (Error Monitoring)

- **Purpose:** Error tracking and session replay in production
- **SDK:** `@sentry/nextjs ^10.38.0`
- **Config files:**
  - `sentry.client.config.ts` — browser-side init
  - `sentry.server.config.ts` — server-side init
- **Auth:** `NEXT_PUBLIC_SENTRY_DSN` env var
- **Conditional init:** Both client and server configs check for DSN before initializing. Sentry is a no-op when DSN is absent (safe for local dev without Sentry account).
- **Sample rates (production):** `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`, `replaysSessionSampleRate: 0.1`
- **Privacy:** `maskAllText: true`, `blockAllMedia: true` on session replay

---

### Sanity (CMS — Blog)

- **Purpose:** Blog/content management (optional feature, conditionally loaded)
- **SDK:** `sanity ^3.99.0`, `next-sanity ^9.12.3`
- **Auth:** `NEXT_PUBLIC_SANITY_PROJECT_ID` env var (when absent, Sanity client returns `null`)
- **Client file:** `src/lib/sanity/` (directory)
- **Image CDN:** `cdn.sanity.io` (whitelisted in `next.config.mjs`)
- **Conditional guard:** `sitemap.ts`, `app/page.tsx`, `blog/page.tsx`, `blog/[slug]/page.tsx` all have null guards for missing Sanity config to allow Vercel builds without Sanity credentials

---

## Data Storage

**Databases:**
- Neon PostgreSQL (serverless)
  - Connection: `DATABASE_URL` env var
  - Client: Prisma with `@prisma/adapter-neon`

**File Storage:**
- None — reports stored as JSON in `SearchResult.data` column (PostgreSQL JSON field)

**Caching:**
- Database-level: `SearchResult` has 7-day TTL (`expiresAt`). Inngest `check-cache` step queries for unexpired results before calling external APIs.
- No Redis or in-memory cache layer.

---

## Authentication & Identity

**User Auth:**
- Email + password (bcrypt via `bcryptjs`)
- Implementation: `src/lib/auth.ts`, `src/app/api/auth/`
- Session cookie: `eopix_session` (HMAC-SHA256 JWT, `sameSite: 'strict'`, 30-day TTL)
- JWT signing/verification: `src/lib/server-auth.ts` (`hmacSign`, `hmacVerify` using `crypto.subtle` for constant-time comparison)
- Password reset: `PasswordResetToken` model, 1h expiry, single-use, rate-limited 3/15min

**Admin Auth:**
- Separate `AdminUser` model with bcrypt
- Rate-limited login: 5 attempts/15 min per IP
- Session: 8h TTL (shorter than user sessions)
- Admin routes: `src/app/api/admin/`

---

## CI/CD & Deployment

**Hosting:**
- Vercel (production and preview deployments)

**CI Pipeline:**
- GitHub Actions: `.github/workflows/e2e-tests.yml`
  - matrix: mock tests (every PR), integration tests (nightly with real Neon branch)
  - Neon branch cleanup: `.github/workflows/neon-cleanup.yml` (deletes CI branches on PR close)
- Required GitHub Secrets: `NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`

---

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/abacatepay` — receives `checkout.completed` from AbacatePay
  - Security: URL query param secret + HMAC-SHA256 header signature
  - On success: marks Purchase as PAID, dispatches Inngest `search/process` event

**Outgoing:**
- Inngest sends events to `https://api.inngest.com` (cloud) or `http://localhost:8288` (dev CLI)

---

## Environment Configuration

**Required env vars (app will fail without these in production):**
- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — throws at runtime if missing (no fallback since security audit)
- `ABACATEPAY_API_KEY` — required for live checkout (bypassed in mock mode)
- `ABACATEPAY_PRODUCT_ID` — required for live checkout
- `ABACATEPAY_WEBHOOK_SECRET` — required for webhook validation
- `APIFULL_API_KEY` — required for CPF/CNPJ data
- `SERPER_API_KEY` — required for web search
- `OPENAI_API_KEY` — required for AI analysis
- `RESEND_API_KEY` — required for transactional email
- `INNGEST_EVENT_KEY` — required for Inngest events in production
- `INNGEST_SIGNING_KEY` — required for Inngest webhook verification

**Optional env vars:**
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry (skipped if absent)
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — Sanity CMS (blog disabled if absent)
- `APIFULL_MIN_BALANCE` — Balance alert threshold in BRL (default: 20)
- `MOCK_MODE=true` — Bypass all external APIs
- `TEST_MODE=true` — Real APIs, bypass payment
- `BYPASS_PAYMENT=true/false` — Override payment bypass independently
- `ADMIN_EMAILS` — Comma-separated admin email addresses
- `NEXT_PUBLIC_APP_URL` — App base URL (defaults to `http://localhost:3000`)

---

*Integration audit: 2026-03-25*
