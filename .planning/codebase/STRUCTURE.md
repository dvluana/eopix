# Codebase Structure

**Analysis Date:** 2026-03-25

## Directory Layout

```
eopix/
├── src/
│   ├── app/                    # Next.js 14 App Router — pages + API routes
│   │   ├── api/                # API route handlers
│   │   │   ├── admin/          # Admin-only endpoints (auth required)
│   │   │   ├── auth/           # User auth (register, login, logout, reset)
│   │   │   ├── inngest/        # Inngest serve handler
│   │   │   ├── purchases/      # Purchase CRUD + SSE stream
│   │   │   ├── webhooks/       # AbacatePay webhook receiver
│   │   │   ├── process-search/ # Sync fallback for MOCK/TEST mode
│   │   │   ├── report/         # SearchResult fetch for display
│   │   │   ├── leads/          # Lead capture
│   │   │   ├── lgpd-requests/  # LGPD Art. 18 requests
│   │   │   ├── search/         # CPF/CNPJ validation
│   │   │   ├── health/         # Basic health check
│   │   │   └── unsubscribe/    # Email opt-out
│   │   ├── admin/              # Admin panel pages
│   │   │   ├── (protected)/    # Route group: layout requires admin session
│   │   │   │   ├── compras/    # Purchase management
│   │   │   │   ├── blocklist/  # Blocked terms management
│   │   │   │   ├── health/     # API balance monitor
│   │   │   │   ├── leads/      # Lead capture viewer
│   │   │   │   ├── monitor/    # Real-time pipeline monitor (SSE)
│   │   │   │   └── page.tsx    # Admin dashboard (revenue stats)
│   │   │   ├── _components/    # Admin-only UI components
│   │   │   ├── login/          # Admin login page
│   │   │   └── layout.tsx      # Admin layout (no session check — handled by protected group)
│   │   ├── compra/
│   │   │   └── confirmacao/    # Post-payment confirmation page + progress UX
│   │   ├── consulta/[term]/    # Purchase page: validates doc + opens checkout
│   │   ├── minhas-consultas/   # User's purchase list (SSE-powered)
│   │   ├── relatorio/[id]/     # Report display (Server Component)
│   │   ├── redefinir-senha/    # Password reset page
│   │   ├── blog/               # Blog pages (Sanity CMS)
│   │   ├── privacidade/        # Privacy policy + LGPD titular requests
│   │   ├── termos/             # Terms of service
│   │   ├── contato/            # Contact page
│   │   ├── manutencao/         # Maintenance mode page
│   │   ├── erro/               # Error pages (500, expirado, invalido)
│   │   ├── studio/             # Sanity Studio embedded
│   │   ├── fonts/              # Local font files (Geist, IBM Plex Mono, Zilla Slab)
│   │   ├── globals.css         # Global styles import
│   │   ├── layout.tsx          # Root layout (Sentry, fonts, providers)
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── landing/            # Landing page sections (Hero, Pricing, FAQ, etc.)
│   │   ├── relatorio/          # Report display components
│   │   ├── blog/               # Blog card + portable text renderer
│   │   ├── ui/                 # Minimal Radix-based UI primitives (6 components)
│   │   ├── RegisterModal.tsx   # Auth modal (register/login) — used on consulta page
│   │   ├── AuthForm.tsx        # Reusable email+password form component
│   │   ├── TopBar.tsx          # Site-wide navigation bar
│   │   ├── UserNav.tsx         # User nav dropdown
│   │   ├── ProcessingTracker.tsx # Pipeline progress display
│   │   ├── NovaConsultaModal.tsx # Modal to start a new consultation
│   │   ├── LeadCaptureForm.tsx # Lead capture form
│   │   ├── EopixLoader.tsx     # Loading spinner
│   │   ├── Footer.tsx          # Site footer
│   │   └── MaintenanceCallout.tsx
│   ├── lib/
│   │   ├── inngest/            # Inngest function modules
│   │   │   ├── client.ts       # Inngest client instance + event type definitions
│   │   │   ├── process-search.ts # Main pipeline function (processSearch)
│   │   │   ├── crons.ts        # All cron jobs + functions[] export array
│   │   │   └── abandonment-emails.ts # Abandonment email sequence
│   │   ├── mocks/              # Mock data for MOCK_MODE
│   │   │   ├── apifull-data.ts
│   │   │   ├── google-data.ts
│   │   │   ├── openai-data.ts
│   │   │   └── purchases-data.ts
│   │   ├── sanity/             # Sanity CMS client + queries + schemas
│   │   ├── hooks/              # React hooks for client components
│   │   │   ├── use-purchase-polling.ts  # SSE + fallback polling
│   │   │   ├── use-report-data.ts       # Report fetch + transform
│   │   │   └── use-mobile.ts
│   │   ├── abacatepay.ts       # AbacatePay API client (checkout, customer, webhook validation)
│   │   ├── payment.ts          # Payment abstraction layer (createCheckout, processRefund)
│   │   ├── auth.ts             # JWT session management (user auth)
│   │   ├── admin-auth.ts       # Admin bcrypt credential verification
│   │   ├── server-auth.ts      # Server-side auth helpers
│   │   ├── apifull.ts          # APIFull API client (cadastral, financial, processos, dossie)
│   │   ├── apifull-balance.ts  # APIFull balance check (circuit breaker)
│   │   ├── openai.ts           # OpenAI client (analyzeProcessos, analyzeMentionsAndSummary)
│   │   ├── ai-analysis.ts      # AI analysis helpers
│   │   ├── google-search.ts    # Serper web search (4 queries)
│   │   ├── financial-summary.ts # Pure calculation: FinancialSummary from API data
│   │   ├── email.ts            # Resend email functions (9 email types)
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── rate-limit.ts       # DB-backed rate limiting
│   │   ├── report-ttl.ts       # Report TTL calculation (default 168h / 7 days)
│   │   ├── report-utils.ts     # Report data transformation utilities
│   │   ├── mock-mode.ts        # MOCK_MODE/TEST_MODE/isBypassMode flags
│   │   ├── validators.ts       # CPF/CNPJ validation + formatting
│   │   ├── unsubscribe.ts      # Email opt-out helpers
│   │   ├── analytics.ts        # Analytics helpers
│   │   └── utils.ts            # General utilities
│   ├── inngest/
│   │   └── index.ts            # Re-export barrel for all inngest modules
│   ├── styles/
│   │   ├── index.css           # Main styles entry
│   │   ├── admin.css           # Admin panel styles
│   │   ├── components.css      # Component styles
│   │   ├── fonts.css           # Font face declarations
│   │   ├── tailwind.css        # Tailwind directives
│   │   ├── theme.css           # Theme variables
│   │   └── tokens.css          # Design tokens
│   └── types/
│       ├── report.ts           # Central report types (ProcessAnalysis, FinancialSummary, etc.)
│       └── domain.ts           # Domain types (Purchase, User, AdminPurchase, PROCESSING_STEPS)
├── prisma/
│   ├── schema.prisma           # DB schema (11 models)
│   └── migrations/             # Prisma migration history
├── tests/
│   ├── lib/                    # Unit tests for lib modules
│   └── unit/                   # Unit + E2E specs (mixed — see note below)
├── e2e/
│   ├── tests/                  # Playwright E2E test files
│   ├── fixtures/               # Purchase fixtures
│   └── helpers/                # Test helpers (api-client, admin-auth, etc.)
├── docs/                       # Documentation (wiki, specs, api-contracts, etc.)
├── public/                     # Static assets
├── scripts/                    # Dev/test/blog scripts
│   └── tests/                  # test-with-branch.ts (Neon branch test runner)
├── .planning/                  # GSD planning documents
├── .claude/                    # Claude rules + hooks + skills
├── postman/                    # Postman collections for API testing
├── package.json
├── tsconfig.json
└── next.config.js
```

## Directory Purposes

**`src/app/api/`:**
- Purpose: All backend logic — API routes only, no shared business logic
- Key files: `purchases/route.ts` (main purchase flow), `webhooks/abacatepay/route.ts` (payment events), `inngest/route.ts` (job handler)
- Pattern: Each route file exports named HTTP method handlers (`GET`, `POST`, etc.)

**`src/lib/`:**
- Purpose: Business logic, external API clients, utilities — shared across routes and Inngest jobs
- Strictly server-side (no `use client` in this directory)
- Contains both "pure" modules (validators, financial-summary, report-ttl) and "effectful" modules (apifull, openai, email)

**`src/lib/inngest/`:**
- Purpose: All Inngest function definitions
- `client.ts` defines the Inngest client and event type unions
- `crons.ts` is the authoritative registry — its exported `functions[]` array is passed to `serve()` in `src/app/api/inngest/route.ts`
- Adding a new function requires: define it, export it, add it to `functions[]` in `crons.ts`

**`src/components/`:**
- Purpose: React UI components
- `relatorio/` — display-only, receives data as props from server component
- `landing/` — landing page sections, mostly static with thin client interactivity
- `ui/` — 6 minimal Radix-based primitives (button, input, dialog, select, label, badge)
- Root-level components (TopBar, RegisterModal, AuthForm) — site-wide or page-level

**`src/app/admin/(protected)/`:**
- Purpose: Admin panel pages gated by admin session
- Uses Next.js route group `(protected)` for shared layout without URL segment
- `_components/` — admin-specific reusable UI (not shared with non-admin)

**`src/types/`:**
- `report.ts` — source of truth for data shapes returned by APIFull, Serper, OpenAI, and stored in `SearchResult.data`
- `domain.ts` — Purchase, User, AdminPurchase, DocumentType, PaymentProvider, PROCESSING_STEPS constant

---

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` — root layout, Sentry init, font loading
- `src/app/page.tsx` — landing page
- `src/app/api/inngest/route.ts` — Inngest serve handler (registers all 7 functions)

**Core Business Logic:**
- `src/lib/inngest/process-search.ts` — main async pipeline (594 lines)
- `src/app/api/purchases/route.ts` — purchase creation + payment flow (453 lines)
- `src/app/api/webhooks/abacatepay/route.ts` — payment confirmation + pipeline trigger

**External API Clients:**
- `src/lib/apifull.ts` — APIFull client (cadastral, financeiro, processos, dossie) — 592 lines
- `src/lib/abacatepay.ts` — AbacatePay checkout + customer + webhook validation
- `src/lib/google-search.ts` — Serper 4-query search
- `src/lib/openai.ts` — OpenAI process analysis + summary
- `src/lib/email.ts` — Resend 9-function email module — 979 lines

**Authentication:**
- `src/lib/auth.ts` — JWT + session management (user auth)
- `src/lib/admin-auth.ts` — admin bcrypt verification

**Data Schema:**
- `prisma/schema.prisma` — 11 models: User, Purchase, SearchResult, Blocklist, LeadCapture, PasswordResetToken, RateLimit, WebhookLog, LgpdRequest, ApiRequestLog, AdminUser

**Configuration:**
- `src/lib/mock-mode.ts` — MOCK_MODE/TEST_MODE/isBypassPayment flags
- `src/lib/report-ttl.ts` — TTL calculation (default 168h, overridden by `REPORT_TTL_HOURS` env)

**Testing:**
- `tests/lib/` — unit tests for lib modules (email, apifull-balance, financial-summary, google-search, purchase-workflow)
- `e2e/tests/` — Playwright E2E (smoke, purchase flows, auth flow, report content, error handling)
- `scripts/tests/test-with-branch.ts` — creates isolated Neon branch, runs migrations, runs E2E, auto-cleanup

---

## Naming Conventions

**Files:**
- API routes: `route.ts` (App Router convention)
- Pages: `page.tsx`
- Layouts: `layout.tsx`
- Lib modules: `kebab-case.ts` (e.g., `mock-mode.ts`, `rate-limit.ts`)
- Components: `PascalCase.tsx` (e.g., `RegisterModal.tsx`)
- Hooks: `use-kebab-case.ts` (e.g., `use-purchase-polling.ts`)
- Tests: `kebab-case.test.ts` or `kebab-case.spec.ts`

**Directories:**
- App Router segments: `kebab-case` (e.g., `minhas-consultas`, `relatorio`)
- Dynamic segments: `[param]` (e.g., `[id]`, `[term]`, `[code]`)
- Route groups: `(name)` (e.g., `(protected)`)
- Private folders: `_components` (not treated as routes)

---

## Where to Add New Code

**New API route:**
- Location: `src/app/api/{feature}/route.ts`
- Auth: call `getSession()` / `requireAuth()` / `requireAdmin()` from `src/lib/auth.ts`
- Validation: use Zod schema inline

**New admin API route:**
- Location: `src/app/api/admin/{feature}/route.ts`
- Auth: `requireAdmin(request)` from `src/lib/auth.ts`

**New admin page:**
- Location: `src/app/admin/(protected)/{feature}/page.tsx`
- Add sidebar link in `src/app/admin/_components/AdminSidebar.tsx`

**New Inngest function:**
- Define in `src/lib/inngest/crons.ts` (or new file imported there)
- Add to `functions[]` array in `crons.ts`
- Export from `src/lib/inngest.ts` barrel if needed elsewhere

**New external API integration:**
- Client module: `src/lib/{service-name}.ts`
- Mock data: `src/lib/mocks/{service-name}-data.ts`
- API contract doc: `docs/api-contracts/{service-name}.md`

**New report section:**
- Type: `src/types/report.ts`
- Component: `src/components/relatorio/{FeatureName}Card.tsx`
- Export from `src/components/relatorio/index.ts`

**New email:**
- Add function to `src/lib/email.ts`
- Use Resend with idempotencyKey pattern matching existing functions

**New page (public):**
- Location: `src/app/{slug}/page.tsx`
- Use Server Component by default; add `'use client'` only for interactive parts

---

## Structural Inconsistencies

**Dual test directories:**
- `tests/unit/` contains both unit tests (`purchase-workflow.test.ts`, `report-ttl.test.ts`) AND Playwright E2E spec files (`smoke.spec.ts`, `purchase-flow-cpf.spec.ts`, etc.)
- E2E specs in `tests/unit/` appear to be duplicates or misplaced relative to `e2e/tests/`
- True E2E tests belong in `e2e/tests/` and run via Playwright; `tests/unit/` should be Vitest only

**Two inngest directories:**
- `src/inngest/index.ts` — a re-export barrel (`export * from '@/lib/inngest/...'`)
- `src/lib/inngest/` — actual implementations
- The `src/inngest/` directory exists only for historical reasons. All imports should use `@/lib/inngest` directly.

**`stripePaymentIntentId` column in Purchase:**
- `prisma/schema.prisma` still has `stripePaymentIntentId String? @unique` on Purchase model
- Stripe was fully removed in production. This column is dead weight and a potential confusion source.
- Safe to remove: create migration to drop the column (verify no code references it first)

**`Projects/eopix/` nested directory:**
- `/Projects/eopix/` exists at project root — appears to be a stale duplicate or leftover artifact
- Also `claude-seo/` directory at project root — unrelated project nested inside this repo

---

## File Size Outliers

Files that are candidates for splitting:

| File | Lines | Issue |
|------|-------|-------|
| `src/app/consulta/[term]/page.tsx` | ~1393 | Checkout page: form state, modal logic, auth, purchase creation all in one file |
| `src/lib/email.ts` | ~979 | 9 email functions + HTML templates inline; templates could be extracted |
| `src/components/RegisterModal.tsx` | ~777 | Registration + login flows + form state + AbacatePay customer formatting |
| `src/lib/apifull.ts` | ~592 | 5 API clients + response mappers; could split into `apifull/cpf.ts` and `apifull/cnpj.ts` |
| `src/lib/inngest/process-search.ts` | ~394 | Acceptable but dense — all pipeline steps in one function |
| `src/app/admin/(protected)/compras/page.tsx` | ~463 | Purchase table + detail dialog + batch actions |

---

## Dead Code / Unused Items

**`stripePaymentIntentId`:** Dead DB column (Stripe removed). Migration needed to drop.

**`src/app/api/admin/health/incidents/route.ts`:** Exists but not wired to any admin UI page. Status unclear.

**`src/lib/ai-analysis.ts`:** Separate file alongside `src/lib/openai.ts`. Purpose overlap should be verified — may be helper utilities used by openai.ts.

**`src/lib/analytics.ts`:** Exists but usage across codebase is minimal/unclear without deeper grep.

**`src/lib/unsubscribe.ts`:** Helpers for email opt-out; wired to `POST /api/unsubscribe` — appears active.

---

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents (codebase maps, phase plans)
- Generated: No
- Committed: Yes

**`.claude/rules/`:**
- Purpose: Path-specific rules auto-loaded when editing files in matching paths
- Covers: admin, auth, inngest, payment, pipeline, purchases, relatorio
- Committed: Yes

**`docs/archive/legacy-2026/`:**
- Purpose: Deprecated docs moved here instead of deleted
- Generated: No
- Committed: Yes

**`prisma/migrations/`:**
- Purpose: Prisma migration history
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes (required for Neon branch deploys)

**`postman/`:**
- Purpose: Postman collection for manual API testing
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-25*
