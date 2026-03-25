# Production Hardening v2

**Date:** 2026-03-25
**Context:** Multiple bugs found in production affecting paying customer (Kevin). Root cause: DB wipe left valid JWT cookies pointing to deleted users, plus pipeline fragility in APIFull error handling.

## What's Already Applied (wip commits on develop)

- `purchases/route.ts`: 401 without session in live mode
- `purchases/route.ts`: removed `pendingPasswordHash` logic
- `webhook/route.ts`: removed `pendingPasswordHash` activation
- `forgot-password/route.ts`: removed `!user.passwordHash` check
- `prisma/schema.prisma`: removed `pendingPasswordHash` field (**migration NOT created**)

## Remaining Work

### Batch 1: Pipeline Resilience (CRITICAL — affects revenue)

**Problem:** `consultCpfFinancial`, `consultCnpjDossie`, `consultCnpjFinancial` throw on any error inside `Promise.all` — kills entire pipeline. Inngest retries 10x with exponential backoff even for 400 errors (permanent, unrecoverable).

**Fix:**
1. `process-search.ts` (Inngest): add `.catch(() => null)` to `consultCpfFinancial` (L157), `consultCnpjDossie` (L181), `consultCnpjFinancial` (L188)
2. `process-search/[code]/route.ts` (sync fallback): same `.catch(() => null)` pattern
3. `apifull.ts`: add `consultCpfBasico()` using `pf-dadosbasicos` endpoint. Update `consultCpfCadastral()` to try completo → fallback basico → null. Add `_source: 'completo' | 'basico'` field.
4. `apifull.ts`: use Inngest `NonRetriableError` for HTTP 400 responses (stop retrying permanent errors). Other errors (503, timeout) continue normal retry.
5. Pipeline: if cadastral is null, use name from financial data or fallback to `CPF {term}` / `CNPJ {term}`

### Batch 2: Auth Hardening (defensive)

**Problem:** `getSession()` only validates JWT signature — never checks if user exists in DB. After DB wipe, valid JWTs create "ghost sessions" that cause purchase route to create users without password/name.

**Fix:**
1. `auth.ts`: add `getSessionWithUser()` that calls `getSession()` + `prisma.user.findUnique()`. If user not found → clear cookie, return null.
2. `purchases/route.ts`: use `getSessionWithUser()` instead of `getSession()` — if user deleted, treat as unauthenticated (401 in live mode)
3. `/api/auth/me`: verify user exists in DB, return 401 if not (clears stale cookie)

**NOT changing:** `getSession()` itself stays JWT-only for internal use. New function is opt-in.

### Batch 3: UX Fix (RegisterModal forgot-password)

**Problem:** `setForgotSuccess(true)` runs outside `res.ok` check — shows "Email enviado!" even on failure.

**Fix:**
1. `RegisterModal.tsx`: move `setForgotSuccess(true)` inside `if (res.ok)` block

### Batch 4: Migration + Cleanup

1. Create Prisma migration `remove_pending_password_hash`
2. Verify: `npx tsc --noEmit && npm run lint && npx vitest run`

## Out of Scope (future)

- FAILED visible to user (product decision, not bug)
- SSE heartbeat optimization
- Granular failureReason categories
- Confirmação page race conditions (A1, A2 from previous design — low impact)
- RegisterModal 409 auto-switch to login (nice-to-have)
