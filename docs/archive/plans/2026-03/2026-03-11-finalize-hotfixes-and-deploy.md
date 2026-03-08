# Finalize Production Hotfixes & Deploy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the wip commit with proper atomic commits, run E2E validation, apply migration to production, update docs, and deploy. Then recover the stuck purchase RUVW8B.

**Architecture:** All code changes are already implemented in a single wip commit (`17d4aed`). We need to soft-reset, re-commit atomically, validate, deploy, and recover the stuck purchase.

**Tech Stack:** Next.js 14, Inngest v3, AbacatePay, Prisma/Neon, Playwright

---

## Pre-conditions

All code changes from the original hotfix plan are DONE and in the wip commit:
- `src/lib/inngest/crons.ts` — processSearch added to functions array
- `src/app/api/webhooks/abacatepay/route.ts` — request logging, PAID retry fix, Inngest error propagation
- `src/app/api/purchases/route.ts` — save cellphone on User, resolve checkout data for logged-in users
- `src/app/consulta/[term]/page.tsx` — remove logged-in form fields, conditional body in createPurchase
- `prisma/schema.prisma` — cellphone added to User model
- `prisma/migrations/20260306000000_add_user_cellphone/migration.sql` — migration file
- `tests/lib/inngest/functions-export.test.ts` — new test

Migration already applied to Neon develop (`br-jolly-union-aiu70ein`). NOT yet applied to Neon main.

---

### Task 1: Replace wip commit with proper atomic commits

**Files:** All files in wip commit

**Step 1: Soft-reset the wip commit**

```bash
git reset --soft HEAD~1
```

This unstages the wip commit but keeps all changes staged.

**Step 2: Create atomic commits**

Commit 1 — Critical Inngest fix:
```bash
git add src/lib/inngest/crons.ts tests/lib/inngest/functions-export.test.ts
git commit -m "fix(critical): register processSearch with Inngest serve

processSearch was defined and exported but never included in the
functions array passed to serve(). All search/process events were
silently dropped — paid purchases stuck at PAID/PROCESSING forever."
```

Commit 2 — Webhook handler fix:
```bash
git add src/app/api/webhooks/abacatepay/route.ts
git commit -m "fix: webhook returns 500 when Inngest fails + request logging

Previously the webhook handler silently caught Inngest errors and
returned 200. Now re-throws so AbacatePay retries delivery. Also
added request logging and PAID retry support (allows Inngest
re-trigger on webhook retry)."
```

Commit 3 — Logged-in UX + cellphone on User:
```bash
git add prisma/schema.prisma prisma/migrations/20260306000000_add_user_cellphone/migration.sql src/app/api/purchases/route.ts src/app/consulta/[term]/page.tsx
git commit -m "fix: skip cellphone/taxId fields for logged-in users

Logged-in users now see only the purchase button. Backend resolves
cellphone from User profile and buyerTaxId from last completed
purchase. Added cellphone field to User model. createPurchase only
sends fields with actual values (no empty strings)."
```

Commit 4 — Docs/backup (non-code):
```bash
git add docs/plans/2026-03-06-production-hotfixes.md docs/backup-neon-main-2026-03-11.json
git commit -m "docs: add production hotfix plan and neon backup"
```

**Step 3: Verify git log**

```bash
git log --oneline -6
```

Expected: 4 new commits replacing the 1 wip commit.

---

### Task 2: Run vitest + tsc + lint validation

**Step 1: Run vitest**

```bash
npx vitest run
```

Expected: All tests pass including the new `functions-export.test.ts`.

**Step 2: Run tsc**

```bash
npx tsc --noEmit
```

Expected: Clean (already verified).

**Step 3: Run lint**

```bash
npm run lint
```

Expected: Clean (already verified).

---

### Task 3: Run E2E tests in mock mode

**Step 1: Ensure no dev server is running on port 3000**

```bash
lsof -ti :3000 | xargs kill 2>/dev/null || true
```

**Step 2: Run E2E mock tests**

```bash
npm run test:e2e:mock
```

The previous 9 failures ("Erro ao criar pagamento") were caused by an existing non-mock dev server on port 3000 being reused (playwright config has `reuseExistingServer: true`). With no pre-existing server, playwright will start a fresh one with `MOCK_MODE=true`.

Expected: 26/26 pass. If failures persist, investigate root cause.

---

### Task 4: Apply migration to Neon main (production)

**Step 1: Apply the migration SQL via Neon MCP**

```sql
ALTER TABLE "User" ADD COLUMN "cellphone" TEXT;
```

Against the main branch of the Neon project.

**Step 2: Register in _prisma_migrations**

```sql
INSERT INTO "_prisma_migrations" (id, checksum, migration_name, finished_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid()::text,
  'e5f2a3b1c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4',
  '20260306000000_add_user_cellphone',
  NOW(),
  NOW(),
  1
);
```

**Step 3: Verify migration applied**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'cellphone';
```

Expected: Returns 1 row.

---

### Task 5: Update docs/status.md

**Step 1: Add entry to "O que está funcionando" section**

Add:
- **Fix Inngest processSearch registration** — processSearch was missing from functions array passed to serve(). All paid purchases were stuck. Fixed by adding to crons.ts functions export.
- **Fix webhook handler** — Inngest failures now return 500 (AbacatePay retries). Request logging added. PAID purchases allow Inngest retry on webhook re-delivery.
- **Logged-in UX simplified** — Logged-in users see only the purchase button (no cellphone/taxId fields). Backend resolves data from User profile and last purchase. cellphone field added to User model.

**Step 2: Add entry to "Últimas mudanças" section**

Add entry dated 2026-03-11 summarizing all 3 fixes.

**Step 3: Commit**

```bash
git add docs/status.md
git commit -m "docs: update status.md with production hotfixes"
```

---

### Task 6: Deploy to production (merge develop → main)

**Step 1: Verify develop is ahead of main**

```bash
git log main..develop --oneline
```

**Step 2: Merge develop into main (fast-forward)**

```bash
git checkout main
git merge develop --ff-only
git checkout develop
```

**Step 3: Push both branches**

```bash
git push origin main develop
```

This triggers Vercel auto-deploy.

**Step 4: Verify deployment**

Check Vercel dashboard or `curl https://{DOMAIN}/api/health`.

---

### Task 7: Recover purchase RUVW8B (post-deploy)

**This is a manual task after deployment is confirmed.**

**Step 1: Reset purchase to PAID via Neon SQL (main branch)**

```sql
UPDATE "Purchase"
SET status = 'PAID', "processingStep" = 0
WHERE code = 'RUVW8B' AND status = 'PROCESSING';
```

**Step 2: Trigger processing via admin panel**

```bash
# Admin login
curl -X POST https://{DOMAIN}/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"...","password":"..."}'

# Get purchase ID
curl https://{DOMAIN}/api/admin/purchases?search=RUVW8B \
  -H "Cookie: eopix_session=..."

# Trigger process
curl -X POST https://{DOMAIN}/api/admin/purchases/{ID}/process \
  -H "Cookie: eopix_session=..."
```

**Step 3: Verify purchase completes**

```sql
SELECT code, status, "processingStep", "searchResultId"
FROM "Purchase" WHERE code = 'RUVW8B';
```

Expected: status=COMPLETED, searchResultId not null.

---

## Checklist for Luana (Manual Steps — before/after deploy)

- [ ] Verify AbacatePay webhook URL: `https://{DOMAIN}/api/webhooks/abacatepay?webhookSecret={SECRET}`
- [ ] Verify `ABACATEPAY_WEBHOOK_SECRET` env var on Vercel matches webhook URL secret
- [ ] Verify `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set on Vercel
- [ ] After deploy: check Inngest dashboard that `process-search` function appears
- [ ] After deploy: recover RUVW8B (Task 7)
- [ ] After deploy: make a test purchase to verify full flow end-to-end
