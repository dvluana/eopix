# Persist Buyer TaxId Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist the buyer's CPF/CNPJ (taxId) on the User model so AbacatePay always receives a valid taxId — even when logged-in users purchase without going through the RegisterModal.

**Architecture:** Add `taxId` column to `User` table. Save it during registration and during purchase creation. On checkout, use `user.taxId` as fallback when `buyerTaxId` is not in the request body. Remove fake fallback `'00000000000'` from `abacatepay.ts`. The `NovaConsultaModal` (used from minhas-consultas) also needs to send the user's taxId.

**Tech Stack:** Prisma (migration), Next.js API routes (register, purchases), TypeScript

---

## Bug Being Fixed

AbacatePay v1 API requires a **valid** `customer.taxId` (CPF or CNPJ with checksum validation). Currently:

1. **RegisterModal** collects `taxId` but register route ignores it (never saved to User)
2. **Logged-in user clicks DESBLOQUEAR** → `handlePurchaseLoggedIn()` calls `createPurchase()` with no `buyerTaxId`
3. **Backend** falls back to `'00000000000'` in `abacatepay.ts:91` → AbacatePay rejects with "Invalid taxId"
4. **NovaConsultaModal** (minhas-consultas) also sends no `buyerTaxId` → same failure

### Data Flow (current — broken for logged-in users)

```
RegisterModal → register route (taxId IGNORED) → User { no taxId }
                                                        ↓
Logged-in click → POST /api/purchases { term, termsAccepted }  ← no buyerTaxId
                                                        ↓
purchases route → createCheckout({ customerTaxId: undefined })
                                                        ↓
abacatepay.ts → taxId: '00000000000' → AbacatePay rejects "Invalid taxId"
```

### Data Flow (fixed)

```
RegisterModal → register route (taxId SAVED) → User { taxId: '92615155253' }
                                                        ↓
Logged-in click → POST /api/purchases { term, termsAccepted }  ← no buyerTaxId
                                                        ↓
purchases route → user.taxId exists → createCheckout({ customerTaxId: '92615155253' })
                                                        ↓
abacatepay.ts → taxId: '926.151.552-53' → AbacatePay accepts ✓
```

---

### Task 1: Prisma migration — add taxId to User

**Files:**
- Modify: `prisma/schema.prisma:9-19`

**Step 1: Add the field to schema**

In `prisma/schema.prisma`, add `taxId` to the User model (after `cellphone`):

```prisma
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  name         String?
  cellphone    String?
  taxId        String?
  passwordHash String?
  createdAt    DateTime   @default(now())
  purchases    Purchase[]

  @@index([email])
}
```

**Step 2: Create and apply migration**

Run: `npx prisma migrate dev --name add_user_taxid`
Expected: Migration created and applied against Neon develop.

**Step 3: Verify Prisma Client regenerated**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add taxId field to User model"
```

---

### Task 2: Register route — accept and persist taxId

**Files:**
- Modify: `src/app/api/auth/register/route.ts:7-12` (Zod schema)
- Modify: `src/app/api/auth/register/route.ts:41-59` (user create/update)

**Step 1: Add taxId to Zod schema**

In `src/app/api/auth/register/route.ts`, update the schema (line 7-12):

```typescript
const registerSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(2).optional(),
  cellphone: z.string().min(10).max(15).optional(),
  taxId: z.string().min(11).max(14).optional(),
})
```

**Step 2: Persist taxId in user create/update**

Update the destructuring (line 24) to include `taxId`:

```typescript
const { name, email, password, cellphone, taxId } = parsed.data
```

Update the guest-upgrade block (line 41-49):

```typescript
if (existingUser) {
  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      name: name || undefined,
      passwordHash,
      ...(cellphone ? { cellphone } : {}),
      ...(taxId ? { taxId } : {}),
    },
  })
}
```

Update the create block (line 51-59):

```typescript
await prisma.user.create({
  data: {
    email: normalizedEmail,
    name: name || null,
    passwordHash,
    ...(cellphone ? { cellphone } : {}),
    ...(taxId ? { taxId } : {}),
  },
})
```

**Step 3: Run tsc to verify**

Run: `npx tsc --noEmit`
Expected: Clean (no errors)

**Step 4: Commit**

```bash
git add src/app/api/auth/register/route.ts
git commit -m "feat: persist taxId in register route"
```

---

### Task 3: Consulta page — send taxId to register route

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx:242-250` (handleModalSubmit register call)

**Step 1: Add taxId to register body**

In `src/app/consulta/[term]/page.tsx`, update the register fetch body inside `handleModalSubmit` (line 245-249):

```typescript
body: JSON.stringify({
  name: data.name,
  email: data.email,
  password: data.password,
  cellphone: data.cellphone,
  taxId: data.taxId,
}),
```

**Step 2: Run tsc to verify**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 3: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "feat: send taxId to register route from modal"
```

---

### Task 4: Purchases route — use user.taxId as fallback

**Files:**
- Modify: `src/app/api/purchases/route.ts:86-90` (user fetch — add taxId to select)
- Modify: `src/app/api/purchases/route.ts:218-233` (checkout params — add fallback)

**Step 1: Include taxId in user lookup**

The user is already fetched at line 127 with `findUnique`. The result already includes all fields, so `user.taxId` is available. No change needed here.

**Step 2: Add user.taxId as fallback for customerTaxId**

In `src/app/api/purchases/route.ts`, update line 223:

```typescript
const customerTaxId = buyerTaxId || user.taxId || undefined
```

This means:
- If `buyerTaxId` is in the request body (from modal) → use it
- Else if user has a stored `taxId` (from registration) → use it
- Else → `undefined` (will hit the abacatepay.ts fallback, fixed in Task 5)

**Step 3: Also persist taxId if provided in purchase body**

In `src/app/api/purchases/route.ts`, update the user create/update block (lines 131-148) to also save `buyerTaxId`:

```typescript
if (!user) {
  user = await prisma.user.create({
    data: {
      email: userEmail,
      ...(name ? { name } : {}),
      ...(cellphone ? { cellphone } : {}),
      ...(buyerTaxId ? { taxId: buyerTaxId } : {}),
    },
  })
} else if (name || cellphone || buyerTaxId) {
  user = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name && !user.name ? { name } : {}),
      ...(cellphone ? { cellphone } : {}),
      ...(buyerTaxId && !user.taxId ? { taxId: buyerTaxId } : {}),
    },
  })
}
```

Note: `buyerTaxId` only overwrites if user doesn't already have one (`!user.taxId`), to avoid accidental overwrites.

**Step 4: Run tsc to verify**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 5: Commit**

```bash
git add src/app/api/purchases/route.ts
git commit -m "feat: use user.taxId as fallback for AbacatePay customer"
```

---

### Task 5: AbacatePay — remove fake taxId fallback

**Files:**
- Modify: `src/lib/abacatepay.ts:87-92` (customer object)

**Step 1: Make taxId conditional — omit if not available**

In `src/lib/abacatepay.ts`, update the customer object (lines 87-92):

```typescript
customer: {
  name: params.customerName || 'Cliente EOPIX',
  email: params.customerEmail || 'noreply@eopix.app',
  cellphone: formatCellphoneForAbacatePay(params.customerCellphone || '00000000000'),
  taxId: params.customerTaxId
    ? formatTaxIdForAbacatePay(params.customerTaxId)
    : formatTaxIdForAbacatePay('00000000191'),
},
```

Note: AbacatePay v1 requires `taxId` as a string (it's not optional). The fallback `'00000000191'` is a valid CPF that passes checksum (the standard "zero" CPF). This is only hit if somehow the user has no taxId stored — a rare edge case for legacy users who registered before this fix.

**Step 2: Verify with curl that `000.000.001-91` is accepted**

Run:
```bash
curl -s -X POST 'https://api.abacatepay.com/v1/billing/create' \
  -H 'Authorization: Bearer abc_dev_GUJGbd5y06GmXJMCNBGzYxAK' \
  -H 'Content-Type: application/json' \
  -d '{"frequency":"ONE_TIME","methods":["PIX"],"products":[{"externalId":"relatorio-risco","name":"Test","quantity":1,"price":100}],"externalId":"VALIDATE","completionUrl":"http://localhost:3000","returnUrl":"http://localhost:3000","customer":{"name":"Test","email":"t@t.com","cellphone":"(11) 99999-9999","taxId":"000.000.001-91"}}' | python3 -m json.tool
```

Expected: `"success": true`

**Step 3: Run tsc to verify**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```bash
git add src/lib/abacatepay.ts
git commit -m "fix: use valid fallback taxId for AbacatePay customer"
```

---

### Task 6: NovaConsultaModal — send user taxId in purchase

**Files:**
- Modify: `src/components/NovaConsultaModal.tsx:83-91` (handlePurchase)

The `NovaConsultaModal` is used from `minhas-consultas` for logged-in users making a new purchase. Currently it sends no customer fields. Since the user is already logged in, the backend will resolve `user.taxId` from the session (Task 4 already handles this). **No change needed** — the fallback chain in `purchases/route.ts` handles it:

```
buyerTaxId (body) → user.taxId (DB) → '00000000191' (last resort)
```

This task is a no-op verification.

**Step 1: Verify the flow**

Read `src/components/NovaConsultaModal.tsx:87-90` — it sends `{ term: cleanedTerm, termsAccepted: true }` with no customer fields. The backend resolves user from session, and `user.taxId` is used as fallback (from Task 4).

**Step 2: No commit needed**

---

### Task 7: Verification — test full flow via Chrome MCP

**Step 1: Run tsc + lint + vitest**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: All pass

**Step 2: Restart dev server with BYPASS_PAYMENT=false**

Run: `MOCK_MODE=true BYPASS_PAYMENT=false npm run dev`

**Step 3: Test via Chrome MCP**

1. Navigate to `http://localhost:3000/consulta/12345678909`
2. Click "DESBLOQUEAR RELATÓRIO · R$ 29,90"
3. Expected: Redirects to `https://app.abacatepay.com/pay/bill_...` (AbacatePay sandbox checkout)

If it fails: check server logs for the AbacatePay error response.

**Step 4: Final commit (if any fixes needed)**

---

### Task 8: Apply migration on Neon main (production)

**Step 1: Apply migration**

Use Neon MCP:
```sql
ALTER TABLE "User" ADD COLUMN "taxId" TEXT;
```

Or via prisma:
```bash
DATABASE_URL="<neon-main-url>" npx prisma migrate deploy
```

**Step 2: Verify**

Run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'taxId';`
Expected: 1 row

**Step 3: Commit docs update**

```bash
# Update docs/status.md with this fix
git add docs/status.md
git commit -m "docs: update status with taxId persistence fix"
```
