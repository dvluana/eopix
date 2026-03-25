# Technology Stack

**Analysis Date:** 2026-03-25

## Languages

**Primary:**
- TypeScript 5.x (strict mode) - All source files under `src/`
- TSX - React components and page files

**Secondary:**
- JavaScript - Config files (`next.config.mjs`, scripts, `scripts/dev-banner.js`)

## Runtime

**Environment:**
- Node.js 20.x (confirmed via active runtime: v20.19.5)
- No `.nvmrc` present; Node version managed by host environment (Vercel, dev machine)

**Package Manager:**
- npm (lockfile: `package-lock.json` — present)

## Frameworks

**Core:**
- Next.js `^14.2.35` (App Router) - Full-stack framework; all pages under `src/app/`
- React `^18` - UI rendering

**Styling:**
- Tailwind CSS `^3.4.1` - Utility-first CSS
- `tailwind-merge ^3.4.0` - Merge Tailwind classes without conflicts
- `tailwindcss-animate ^1.0.7` - Animation utilities
- `class-variance-authority ^0.7.1` - Component variant composition
- `styled-components ^6.3.11` - Present in deps but primary styling is Tailwind

**UI Components (Radix UI — minimal set, post-cleanup):**
- `@radix-ui/react-dialog ^1.1.15` - Modal dialogs (`RegisterModal`, admin dialogs)
- `@radix-ui/react-label ^2.1.8` - Form labels
- `@radix-ui/react-select ^2.2.6` - Select dropdowns
- `@radix-ui/react-slot ^1.2.4` - Polymorphic slot pattern
- `@radix-ui/react-toast ^1.2.15` - Toast notifications in admin panel

**Custom UI Components (kept from shadcn/ui):**
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/utils.ts`

**Animation:**
- `motion ^12.33.0` (Framer Motion v12) - Page/component animations
- `embla-carousel-react ^8.6.0` - Carousel component

**Forms:**
- `react-hook-form ^7.71.1` - Form state management
- `zod ^4.3.6` - Schema validation (server-side and client-side)

**Testing:**
- `vitest ^4.0.18` - Unit/integration test runner; config at `vitest.config.ts`
- `@vitest/coverage-v8 ^4.0.18` - Code coverage (threshold: 60% lines/functions/branches)
- `@vitest/ui ^4.0.18` - Browser UI for test runs
- `@playwright/test ^1.58.2` - E2E tests; config at `e2e/playwright.config.ts`

**Build/Dev:**
- Turbopack (via `next dev --turbo`) - Fast local dev compilation
- `concurrently ^9.2.1` - Runs Next.js + Inngest dev server in parallel via `npm run dev:live`
- PostCSS `^8` - Required for Tailwind
- ESLint `^8` with `eslint-config-next 14.2.35` - Linting

## Key Dependencies

**Critical:**
- `inngest ^3.51.0` - Async job orchestration; all report pipeline work runs through Inngest
- `@prisma/client ^7.3.0` + `prisma ^7.3.0` - ORM for PostgreSQL (Neon)
- `@prisma/adapter-neon ^7.3.0` - Neon serverless adapter for Prisma
- `@neondatabase/serverless ^1.0.2` - WebSocket-based Neon connection driver
- `openai ^6.18.0` - OpenAI SDK (gpt-4o-mini); lazy-initialized to avoid build failure
- `resend ^6.9.4` - Transactional email
- `bcryptjs ^3.0.3` - Password hashing for user auth and admin auth
- `@sentry/nextjs ^10.38.0` - Error monitoring; conditionally initialized via `NEXT_PUBLIC_SENTRY_DSN`

**Infrastructure:**
- `date-fns ^4.1.0` - Date manipulation
- `lucide-react ^0.563.0` - Icon library
- `clsx ^2.1.1` - Conditional className utility
- `dotenv ^17.2.4` - Env var loading in scripts

**Present but Legacy/Unused:**
- `stripe ^20.4.0` - Listed in `package.json` but removed from all active code paths. AbacatePay is the sole payment provider. Prisma schema retains `stripePaymentIntentId` field as nullable legacy column.
- `@google/genai ^1.46.0` - Listed in deps but not found in active source; Google Gemini unused.
- `sanity ^3.99.0`, `next-sanity ^9.12.3`, `@sanity/image-url ^2.0.3`, `@portabletext/react ^6.0.3` - Blog/CMS integration present (conditionally initialized when `NEXT_PUBLIC_SANITY_PROJECT_ID` set)

## Configuration

**Environment:**
- Configuration via `.env.local` (development) and Vercel environment variables (production)
- `.env.local` is not committed; example files at `.env.*.example` (not confirmed in this repo)
- Key env vars:
  - `DATABASE_URL` - Neon PostgreSQL connection string
  - `DIRECT_URL` - Neon direct connection (used by Prisma migrations)
  - `ABACATEPAY_API_KEY` - Payment gateway key (`abc_dev_*` = sandbox, `abc_*` = production)
  - `ABACATEPAY_PRODUCT_ID` - Product ID for checkout items
  - `ABACATEPAY_WEBHOOK_SECRET` - Webhook URL secret (second security layer)
  - `APIFULL_API_KEY` - APIFull Bearer token
  - `SERPER_API_KEY` - Serper.dev API key
  - `OPENAI_API_KEY` - OpenAI API key
  - `RESEND_API_KEY` - Resend transactional email key
  - `INNGEST_EVENT_KEY` - Inngest event signing key
  - `INNGEST_SIGNING_KEY` - Inngest webhook signature verification
  - `JWT_SECRET` - HMAC-SHA256 key for session tokens (throws at runtime if missing)
  - `NEXT_PUBLIC_APP_URL` - App base URL (defaults to `http://localhost:3000`)
  - `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (optional; Sentry skipped if absent)
  - `MOCK_MODE` - Set to `true` to bypass all external APIs
  - `TEST_MODE` - Set to `true` for real APIs without payment
  - `BYPASS_PAYMENT` - Override payment bypass independently of MOCK_MODE

**TypeScript:**
- Config: `tsconfig.json`
- `strict: true`, `noEmit: true`, `moduleResolution: "bundler"`
- Path alias: `@/*` maps to `./src/*`
- Scripts directory excluded from compilation (`"scripts"` in `exclude`)

**Build:**
- `next.config.mjs` — React strict mode, Turbopack in dev
- `prisma generate` runs before `next build` (via `build` script) and on `postinstall`
- Security headers added for all routes: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- Image domains: `cdn.sanity.io` (Sanity CMS)

## Platform Requirements

**Development:**
- Node.js 20.x
- PostgreSQL via Neon (requires `DATABASE_URL`)
- Optional: Inngest dev CLI (`npx inngest-cli@latest dev`) for local async job testing

**Dev Modes:**
- `npm run dev` — Next.js only, `MOCK_MODE=true` (no external API calls, no Inngest needed)
- `npm run dev:live` — Next.js + Inngest dev server in parallel (requires real API keys)
- `npm run inngest` — Inngest dev server alone (connect to running Next.js)

**Production:**
- Vercel (Hobby or Pro) — Next.js deployment
- Neon PostgreSQL — serverless PostgreSQL
- Inngest Cloud — async job execution (events routed via `/api/inngest`)

**Test Commands:**
```bash
npx vitest run              # Unit tests (all files in tests/)
npm run test:ui             # Vitest browser UI
npm run test:coverage       # Coverage with v8 provider
npm run test:e2e            # E2E with real Neon branch (requires NEON_API_KEY)
npm run test:e2e:mock       # E2E with MOCK_MODE=true (fast, no real DB)
```

---

*Stack analysis: 2026-03-25*
