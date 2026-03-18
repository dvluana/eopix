# Email Opt-Out / Unsubscribe Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implementar sistema de opt-out para emails de abandono (R1/R2/R3) com token HMAC determinístico, endpoint de confirmação HTML, `List-Unsubscribe` header, e guard no Inngest.

**Architecture:** Token HMAC-SHA256 determinístico (email + JWT_SECRET), sem expiração, sem estado extra além do flag `User.emailOptOut`. Opt-out afeta apenas emails de abandono — transacionais sempre enviados.

**Tech Stack:** Prisma migration, Next.js API route, Web Crypto (já em uso no projeto), Resend SDK `headers`.

---

### Task 1: Prisma migration — adicionar `emailOptOut` ao User

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration via `prisma migrate dev`

**Step 1: Adicionar campo ao schema**

Em `prisma/schema.prisma`, no model `User`, adicionar após `passwordHash`:
```prisma
emailOptOut  Boolean    @default(false)
```

**Step 2: Rodar migration**

```bash
npx prisma migrate dev --name add_user_email_opt_out
```

Expected: migration criada em `prisma/migrations/`, Prisma client regenerado.

**Step 3: Verificar**

```bash
npx prisma studio
```

Confirmar que campo `emailOptOut` aparece no model User.

---

### Task 2: Utilitário de token HMAC (`src/lib/unsubscribe.ts`)

**Files:**
- Create: `src/lib/unsubscribe.ts`

**Step 1: Criar o arquivo**

```typescript
// src/lib/unsubscribe.ts
// Token HMAC-SHA256 determinístico para links de unsubscribe.
// Usa Web Crypto API (Edge Runtime compatible) — mesmo padrão de auth.ts.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is required')
  return secret
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const bytes = new Uint8Array(signature)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmacVerify(data: string, token: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(data, secret)
  return expected === token
}

export async function generateUnsubscribeToken(email: string): Promise<string> {
  return hmacSign(email.toLowerCase(), getSecret())
}

export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  return hmacVerify(email.toLowerCase(), token, getSecret())
}

export async function buildUnsubscribeUrl(email: string): Promise<string> {
  const token = await generateUnsubscribeToken(email)
  const params = new URLSearchParams({ token, email })
  return `${APP_URL}/api/unsubscribe?${params.toString()}`
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros.

---

### Task 3: Endpoint `GET /api/unsubscribe`

**Files:**
- Create: `src/app/api/unsubscribe/route.ts`

**Step 1: Criar o route handler**

```typescript
// src/app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/unsubscribe'
import { prisma } from '@/lib/prisma'

function htmlPage(title: string, heading: string, message: string, isError = false): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — EOPIX</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Zilla+Slab:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F0EFEB;font-family:'IBM Plex Mono','Courier New',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center;">
  <div style="max-width:480px;width:100%;margin:40px 20px;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
    <div style="background-color:#1A1A1A;padding:24px 32px;">
      <span style="font-family:'Zilla Slab',Georgia,serif;font-size:20px;font-weight:700;color:#FFFFFF;">E o Pix<span style="color:#FFD600;">?</span></span>
    </div>
    <div style="height:3px;background-color:#FFD600;"></div>
    <div style="padding:40px 32px;">
      <h1 style="margin:0 0 16px;font-family:'Zilla Slab',Georgia,serif;font-size:26px;font-weight:700;color:#1A1A1A;line-height:1.2;">${heading}</h1>
      <p style="margin:0 0 32px;font-size:14px;line-height:1.7;color:#666666;">${message}</p>
      <a href="/" style="display:inline-block;background-color:${isError ? '#F0EFEB' : '#FFD600'};color:#1A1A1A;text-decoration:none;padding:12px 24px;border:2px solid #1A1A1A;border-radius:4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
        Voltar ao início
      </a>
    </div>
  </div>
</body>
</html>`
  return new NextResponse(html, {
    status: isError ? 400 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return htmlPage(
      'Link inválido',
      'Link inválido.',
      'Este link de cancelamento está incompleto. Se o problema persistir, entre em contato.',
      true
    )
  }

  const isValid = await verifyUnsubscribeToken(email, token)
  if (!isValid) {
    return htmlPage(
      'Link inválido',
      'Link inválido.',
      'Este link de cancelamento não é válido. Se o problema persistir, entre em contato.',
      true
    )
  }

  await prisma.user.updateMany({
    where: { email: email.toLowerCase() },
    data: { emailOptOut: true },
  })

  return htmlPage(
    'Descadastrado',
    'Pronto. Sem mais lembretes.',
    'Você não vai mais receber emails de lembrete do EOPIX. Emails relacionados a compras e relatórios continuam sendo enviados normalmente.'
  )
}
```

**Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros.

---

### Task 4: Guard no Inngest + update footer copy + `List-Unsubscribe` header

**Files:**
- Modify: `src/lib/inngest/abandonment-emails.ts`
- Modify: `src/lib/email.ts`

**Step 1: Atualizar `abandonment-emails.ts` — guard de opt-out**

Adicionar import do prisma (já está) e checar `emailOptOut` antes de cada send. Substituir os 3 blocos `step.run('send-r1/r2/r3')` pela sequência check + send:

```typescript
// Antes de send-r1:
const optOut1 = await step.run('check-optout-r1', async () => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailOptOut: true },
  })
  return user?.emailOptOut ?? false
})
if (optOut1) return { aborted: 'opted_out', step: 'r1' }

await step.run('send-r1', async () => {
  await sendAbandonmentEmail1(email, name, term, purchaseId)
})
```

Repetir o mesmo padrão para r2 e r3 (com `check-optout-r2`, `check-optout-r3`).

**Step 2: Atualizar `email.ts` — `buildUnsubscribeUrl` + `List-Unsubscribe` header**

Adicionar import:
```typescript
import { buildUnsubscribeUrl } from './unsubscribe'
```

Atualizar `sendAbandonmentEmail1`, `sendAbandonmentEmail2`, `sendAbandonmentEmail3`:
1. Gerar URL de unsubscribe: `const unsubUrl = await buildUnsubscribeUrl(email)`
2. Passar `headers` no `sendEmail()`:
   ```typescript
   headers: {
     'List-Unsubscribe': `<${unsubUrl}>`,
     'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
   }
   ```
3. Adicionar `headers` ao `SendEmailParams` interface e ao `resend.emails.send()` call.

**Step 3: Atualizar footer copy R1, R2, R3**

Substituir em cada um:
```
'Para não receber mais emails de lembrete, responda com PARAR.'
```
Por:
```typescript
`Você recebeu este email porque iniciou uma consulta no EOPIX. <a href="${unsubUrl}" style="color:#888888;">Cancelar lembretes</a>`
```

**Step 4: Verificar TypeScript e lint**

```bash
npx tsc --noEmit && npm run lint
```

Expected: sem erros.

---

### Task 5: Testes + commit

**Step 1: Rodar testes unitários**

```bash
npx vitest run
```

Expected: todos passando (nenhum teste existente quebrado).

**Step 2: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/ src/lib/unsubscribe.ts src/app/api/unsubscribe/route.ts src/lib/inngest/abandonment-emails.ts src/lib/email.ts
git commit -m "feat: email opt-out system — HMAC token, unsubscribe endpoint, List-Unsubscribe header"
```
