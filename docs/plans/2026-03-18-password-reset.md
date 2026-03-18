# Password Reset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a complete "forgot password" flow — email with reset link → dedicated reset page → confirmation email.

**Architecture:** New `PasswordResetToken` Prisma model stores 1h-expiry tokens. Two new API routes handle sending the reset link and validating + applying the new password. Frontend pieces (RegisterModal forgot mode, `/redefinir-senha` page, two new email functions) are **already implemented** — this plan covers only the backend wiring.

**Tech Stack:** Next.js 14 App Router, Prisma/Neon, bcryptjs, crypto (Node built-in), Resend (via existing `src/lib/email.ts`), Vitest.

---

## Context: What's already done

| File | Status |
|---|---|
| `src/components/RegisterModal.tsx` | ✅ `'forgot'` mode + `onForgotPassword` prop added |
| `src/app/redefinir-senha/page.tsx` | ✅ Created — reads `?token=`, calls `POST /api/auth/reset-password` |
| `src/lib/email.ts` — `sendPasswordResetEmail` | ✅ Added |
| `src/lib/email.ts` — `sendPasswordChangedEmail` | ✅ Added |
| `prisma/schema.prisma` — `MagicCode` removed | ✅ Migration `remove_magic_code` applied |

**What this plan builds:** backend routes + Prisma model + rate limit config + cleanup cron + tests + wiring the prop.

---

## Task 1: Prisma model `PasswordResetToken`

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add the model**

In `prisma/schema.prisma`, add after the `RateLimit` model:

```prisma
model PasswordResetToken {
  id        String    @id @default(cuid())
  email     String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([email])
  @@index([token])
}
```

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add_password_reset_token
```

Expected output: `Your database is now in sync with your schema.`

**Step 3: Verify generated client**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add PasswordResetToken model"
```

---

## Task 2: Rate limit config for password reset

**Files:**
- Modify: `src/lib/rate-limit.ts:8-13`

**Step 1: Add rate limit action**

In `RATE_LIMITS` record, add a new entry:

```typescript
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  search: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  purchase: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  'magic-link': { maxRequests: 20, windowMs: 60 * 60 * 1000 },
  'admin_login': { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  'password-reset': { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 min per email
}
```

**Step 2: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add password-reset rate limit (3/15min)"
```

---

## Task 3: `POST /api/auth/forgot-password` route (TDD)

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`

**Security rules:**
- Always return `{ success: true }` with HTTP 200 regardless of whether the email exists (prevents user enumeration)
- Rate limit: 3 requests per 15 min per email (silently absorbed — still returns 200)
- Invalidate previous active tokens for same email before creating new one

**Step 1: Create the file**

```typescript
// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendPasswordResetEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    // Always 200 — never reveal if email exists or not
    if (!parsed.success) {
      return NextResponse.json({ success: true })
    }

    const email = parsed.data.email.toLowerCase().trim()

    // Rate limit per email (absorb silently — still 200)
    const rl = await checkRateLimit(email, 'password-reset')
    if (!rl.allowed) {
      return NextResponse.json({ success: true })
    }

    // Only proceed if user exists and has a password
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ success: true })
    }

    // Invalidate all previous active tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    // Create new token (1 hour expiry)
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // Fire-and-forget email
    sendPasswordResetEmail(email, user.name || '', token).catch(err =>
      console.error('[ForgotPassword] Email failed:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ForgotPassword] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

**Step 2: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/api/auth/forgot-password/route.ts
git commit -m "feat: POST /api/auth/forgot-password — creates token, sends reset email"
```

---

## Task 4: `POST /api/auth/reset-password` route (TDD)

**Files:**
- Create: `src/app/api/auth/reset-password/route.ts`

**Validation rules:**
- `token`: required string
- `password`: min 8 chars
- Token must exist, not be used (`usedAt` must be null), and not be expired
- Use a `$transaction` to atomically update the password and mark the token used

**Step 1: Create the file**

```typescript
// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendPasswordChangedEmail } from '@/lib/email'

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Dados inválidos'
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { token, password } = parsed.data

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado.' },
        { status: 400 }
      )
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { error: 'Este link já foi utilizado.' },
        { status: 410 }
      )
    }

    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link expirado. Solicite um novo.' },
        { status: 410 }
      )
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Atomically: update password + mark token used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ])

    // Fire-and-forget confirmation email
    sendPasswordChangedEmail(user.email, user.name || '').catch(err =>
      console.error('[ResetPassword] Confirmation email failed:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ResetPassword] Error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
```

**Step 2: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/api/auth/reset-password/route.ts
git commit -m "feat: POST /api/auth/reset-password — validates token, updates password, sends confirmation"
```

---

## Task 5: Email tests

**Files:**
- Modify: `tests/lib/email.test.ts`

**Step 1: Add imports**

In the import block at the top of `tests/lib/email.test.ts`, add the two new functions:

```typescript
import {
  sendWelcomeEmail,
  sendPurchaseReceivedEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendPurchaseRefundedEmail,
  sendPurchaseExpiredEmail,
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
  sendPasswordResetEmail,      // add
  sendPasswordChangedEmail,    // add
} from '@/lib/email'
```

**Step 2: Add two tests at the end of the `describe` block** (before the closing `})`):

```typescript
  it('sendPasswordResetEmail — retorna id e inclui token na URL', async () => {
    const token = 'abc123deadbeef'
    const res = await sendPasswordResetEmail('ana@test.com', 'Ana Silva', token)
    expect(res.id).toBe('mock-id')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain(token)
    expect(callArgs.subject).toContain('Redefinir')
  })

  it('sendPasswordChangedEmail — retorna id e badge vermelho no HTML', async () => {
    const res = await sendPasswordChangedEmail('ana@test.com', 'Ana Silva')
    expect(res.id).toBe('mock-id')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain('SENHA ALTERADA')
    expect(callArgs.html).toContain('#CC3333')
  })
```

**Step 3: Run tests**

```bash
npx vitest run tests/lib/email.test.ts
```

Expected: all tests pass (was 9, now 11).

**Step 4: Run all tests**

```bash
npx vitest run
```

Expected: all pass.

**Step 5: Commit**

```bash
git add tests/lib/email.test.ts
git commit -m "test: add sendPasswordResetEmail and sendPasswordChangedEmail tests"
```

---

## Task 6: Wire `onForgotPassword` prop in RegisterModal usages

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx`
- Modify: `src/app/page.tsx`

### 6a — `src/app/consulta/[term]/page.tsx`

**Step 1: Find the `handleModalSubmit` function** (around line 236) and add a new handler right after it:

```typescript
const handleForgotPassword = async (email: string) => {
  await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  // No error handling needed — route always returns 200
}
```

**Step 2: Find the `<RegisterModal` JSX** (around line 686) and add the prop:

```tsx
<RegisterModal
  open={modalOpen}
  onOpenChange={setModalOpen}
  onSubmit={handleModalSubmit}
  isLoading={isLoading}
  onForgotPassword={handleForgotPassword}   // add this line
  // ... other existing props
/>
```

### 6b — `src/app/page.tsx`

**Step 1: Find the RegisterModal usage** (around line 249). Add the same handler function near the existing handlers, and add the prop to `<RegisterModal>`:

```typescript
const handleForgotPassword = async (email: string) => {
  await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
}
```

```tsx
<RegisterModal
  // ... existing props
  onForgotPassword={handleForgotPassword}   // add this line
/>
```

**Step 2: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add src/app/consulta/[term]/page.tsx src/app/page.tsx
git commit -m "feat: wire onForgotPassword prop in RegisterModal usages"
```

---

## Task 7: Cleanup cron for expired reset tokens

**Files:**
- Modify: `src/lib/inngest/crons.ts`

**Step 1: Add the cleanup function** before the `functions` export array (around line 175):

```typescript
// Cleanup expired password reset tokens (daily at 03:45)
export const cleanupPasswordResetTokens = inngest.createFunction(
  { id: 'cleanup-password-reset-tokens' },
  { cron: '45 3 * * *' },
  async ({ step }) => {
    const result = await step.run('delete-expired', async () => {
      return prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { usedAt: { not: null } },
          ],
        },
      })
    })

    console.log(`Cleaned up ${result.count} expired/used password reset tokens`)
    return { deleted: result.count }
  }
)
```

**Step 2: Add to the `functions` array**:

```typescript
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupPendingPurchases,
  anonymizePurchases,
  abandonmentEmailSequence,
  cleanupPasswordResetTokens,  // add
]
```

**Step 3: Verify tsc**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add src/lib/inngest/crons.ts
git commit -m "feat: add cleanup cron for expired password reset tokens (daily 03:45)"
```

---

## Task 8: Manual smoke test

With `npm run dev` running (MOCK_MODE=true):

1. Open the app (`localhost:3000`)
2. Click a CTA button to open the RegisterModal
3. Switch to login mode — confirm "Esqueci minha senha" link appears
4. Click the link — confirm modal transitions to `'forgot'` mode
5. Enter any email → submit — confirm success state shows (bypass mode: email logged in console, not sent)
6. Navigate to `localhost:3000/redefinir-senha?token=testtoken123` — confirm the reset form renders correctly
7. Enter mismatched passwords — confirm validation error shows
8. Enter matching passwords (min 8 chars) — confirm it hits `/api/auth/reset-password` (will return 400 because token doesn't exist — that's correct)
9. Navigate to `localhost:3000/redefinir-senha` (no token) — confirm form renders (validation happens on submit)

**Verify tsc + lint + tests:**

```bash
npx tsc --noEmit && npm run lint && npx vitest run
```

Expected: all pass.

---

## Task 9: Update docs

**Files:**
- Modify: `docs/status.md`

**Step 1: Add to "O que está funcionando ✓" section:**

```markdown
- **Recuperação de senha** — fluxo completo: "Esqueci minha senha" no RegisterModal (modo login) → email com link HMAC-safe token (1h) via Resend → página `/redefinir-senha?token=xxx` → reset + email de confirmação disparado. Rate limit 3/15min por email. Token invalidado após uso. Cron diário limpa tokens expirados/usados.
```

**Step 2: Update "Últimas mudanças" section with a brief entry.**

**Step 3: Commit**

```bash
git add docs/status.md
git commit -m "docs: update status.md with password reset feature"
```

---

## Summary

| Task | What | Files |
|---|---|---|
| 1 | Prisma model + migration | `prisma/schema.prisma` |
| 2 | Rate limit config | `src/lib/rate-limit.ts` |
| 3 | `POST /api/auth/forgot-password` | `src/app/api/auth/forgot-password/route.ts` |
| 4 | `POST /api/auth/reset-password` | `src/app/api/auth/reset-password/route.ts` |
| 5 | Email tests (2 new) | `tests/lib/email.test.ts` |
| 6 | Wire `onForgotPassword` prop | `consulta/[term]/page.tsx`, `app/page.tsx` |
| 7 | Cleanup cron | `src/lib/inngest/crons.ts` |
| 8 | Manual smoke test | — |
| 9 | Docs | `docs/status.md` |
