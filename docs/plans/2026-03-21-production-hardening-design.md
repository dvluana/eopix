# Production Hardening v1

**Date:** 2026-03-21
**Context:** Multiple bugs found in production affecting paying customers.

## Problems Found

### Critical
- **C1**: APIFull `ic-cpf-completo` returns 400 for valid CPFs → entire pipeline fails, Inngest retries 10x, purchase stuck FAILED. **Fix deployed (partial):** `.catch()` returns null.
- **C2**: No fallback to `pf-dadosbasicos` when completo fails. Report missing cadastral data.
- **C3**: `POST /api/purchases` accepts unauthenticated requests → creates user without password/name.
- **C4**: `createPurchase()` in frontend never passes `password` field → `pendingPasswordHash` always null.
- **C5**: `forgot-password` silently ignores users without `passwordHash` → returns 200 but never sends email.

### High
- **A1**: Confirmation page shows "ACOMPANHAR" button even when auto-login failed.
- **A2**: `isLoggedIn` state not updated after successful auto-login in confirmation page.
- **A3**: Forgot password in RegisterModal always shows "Email enviado!" even if API failed.
- **A4**: `minhas-consultas` doesn't return null after `router.push('/')` → flash of content.
- **A5**: RegisterModal doesn't auto-switch to login mode on 409 (email already registered).

### Medium
- **M1**: `consultCnpjDossie` throws on 400 → kills CNPJ pipeline (same pattern as C1).
- **M2**: `consultCnpjFinancial` throws on error → kills CNPJ pipeline.
- **M3**: SSE fallback polling continues indefinitely for COMPLETED purchases.

## Implementation Plan

### Task 1: Protect purchase route (C3, C4, C5)
1. `purchases/route.ts`: require session in live mode, return 401 if missing
2. Remove `pendingPasswordHash` logic from purchases route (dead code)
3. Remove `pendingPasswordHash` field from Prisma schema + create migration
4. Clean webhook handler (remove pendingPasswordHash activation code)
5. `forgot-password/route.ts`: remove `!user.passwordHash` check (already done locally)
6. Verify: `npx tsc --noEmit && npm run lint`

### Task 2: APIFull resilience (C1, C2, M1, M2)
1. `apifull.ts`: add `consultCpfBasico()` function with `pf-dadosbasicos` mapper
2. `apifull.ts`: update `consultCpfCadastral()` — try completo, fallback to basico, return null on both fail. Add `_source` field.
3. `process-search.ts`: handle null cadastral for CPF (name fallback from financial, hide empty sections)
4. `process-search.ts`: add `.catch()` to `consultCnpjDossie` and `consultCnpjFinancial`
5. Verify: `npx tsc --noEmit && npm run lint && npx vitest run`

### Task 3: UX fixes (A1-A5)
1. `confirmacao/page.tsx`: set `isLoggedIn = true` after successful auto-login
2. `confirmacao/page.tsx`: hide/disable button when auto-login failed and not logged in
3. `RegisterModal.tsx`: check `res.ok` before `setForgotSuccess(true)`
4. `RegisterModal.tsx`: auto-switch to login mode on 409 error
5. `minhas-consultas/page.tsx`: add `return null` after `router.push('/')`
6. Verify: `npx tsc --noEmit && npm run lint`

### Task 4: Cleanup (M3)
1. `use-purchase-polling.ts`: stop polling when purchase reaches terminal state
2. Verify: `npx tsc --noEmit && npm run lint && npx vitest run`
