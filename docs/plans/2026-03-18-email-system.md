# Email System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wiring all transactional emails + recovery funnel de 3 emails para abandonos de checkout.

**Architecture:** Resend SDK já instalado e configurado em `src/lib/email.ts`. Emails transacionais são disparados diretamente nas rotas/Inngest. O funil de recuperação usa um Inngest function com `step.sleep` — sem cron adicional, sem campo novo no DB.

**Tech Stack:** Resend SDK, Inngest (`step.sleep`, `step.run`), Prisma, Next.js App Router.

---

## ⚠️ Correção crítica já aplicada ao email.ts

`sendEmail()` agora aceita `idempotencyKey?: string` e repassa ao Resend SDK como segundo parâmetro `{ idempotencyKey }`. **Todas as funções de email devem passar uma chave.** Formato: `<tipo-email>/<id-unico>`. A chave expira em 24h — suficiente para evitar duplicatas em retries do Inngest.

| Função | idempotencyKey |
|---|---|
| sendWelcomeEmail | `welcome-email/{userId}` |
| sendPurchaseReceivedEmail | `purchase-received/{purchaseId}` |
| sendPurchaseApprovedEmail | `purchase-approved/{purchaseId}` |
| sendPurchaseDeniedEmail | `purchase-denied/{purchaseId}` |
| sendPurchaseRefundedEmail | `purchase-refunded/{purchaseId}` |
| sendAbandonmentEmail1 | `abandonment-r1/{purchaseId}` |
| sendAbandonmentEmail2 | `abandonment-r2/{purchaseId}` |
| sendAbandonmentEmail3 | `abandonment-r3/{purchaseId}` |
| sendMagicCode | `magic-code/{userId}-{code}` |

**Impacto no código:** cada função precisa receber o `id` relevante e passá-lo via `sendEmail({ ..., idempotencyKey: '...' })`.

---

## Contexto crítico — ler antes de implementar

### Status de purchase e failureReason
- `status` é String (não enum Prisma). Valores válidos: `PENDING`, `PAID`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`.
- Abandono de checkout: cron `cleanupPendingPurchases` (a cada 15 min) marca PENDING > 30min como `FAILED` com `failureReason: 'PAYMENT_EXPIRED'`.
- Falha técnica de pipeline: `FAILED` com `failureReason !== 'PAYMENT_EXPIRED'`.

### Recovery funnel — lógica de verificação
A cada step de sleep, verificar se compra está "abandonada":
```typescript
const isAbandoned = (p: Purchase | null) =>
  p !== null &&
  (p.status === 'PENDING' ||
   (p.status === 'FAILED' && p.failureReason === 'PAYMENT_EXPIRED'))
```
Se `isAbandoned` for false em qualquer ponto → abortar (usuário pagou ou foi reembolsado).

### Bypass mode
- Em `isBypassPayment === true` ou `MOCK_MODE=true`: **não** disparar evento de abandono.
- Checar `isBypassPayment` antes de `inngest.send('purchase/created', ...)`.

### Onde adicionar chamadas de email
| Evento | Arquivo | Linha aprox. |
|---|---|---|
| Registro | `src/app/api/auth/register/route.ts` | após `prisma.user.create` |
| PAID (webhook) | `src/app/api/webhooks/abacatepay/route.ts` | após `purchase.status = 'PAID'` (linha ~230) |
| COMPLETED | `src/lib/inngest/process-search.ts` | linha 94 e 329 (dois pontos de COMPLETED) |
| FAILED (pipeline) | `src/lib/inngest/process-search.ts` | linha 352 (bloco FAILED) |
| REFUNDED | `src/app/api/admin/purchases/[id]/refund/route.ts` | após update status |
| Abandono trigger | `src/app/api/purchases/route.ts` | após `prisma.purchase.create`, só se `!effectiveBypass` |

### email.ts — o que já existe
- `sendWelcomeEmail(email, name)` ✓
- `sendPurchaseReceivedEmail(email, name, code, document)` ✓ — **falta botão minhas-consultas**
- `sendPurchaseApprovedEmail(email, name, code, reportUrl)` ✓ — **CTA deve ir para minhas-consultas, não reportUrl**
- `sendPurchaseDeniedEmail(email, name, code)` ✓
- `sendMagicCode` e `sendCompletionEmail` (legado) ✓

### O que falta no email.ts
- `sendPurchaseRefundedEmail(email, name, code)`
- `sendAbandonmentEmail1(email, name, term)` — R1, 30 min
- `sendAbandonmentEmail2(email, name, term)` — R2, 24h
- `sendAbandonmentEmail3(email, name, term)` — R3, 72h

---

## Task 1: Corrigir CTAs dos emails já existentes

**Files:**
- Modify: `src/lib/email.ts`

### Copy das correções

**sendPurchaseReceivedEmail** — adicionar botão abaixo do bloco de steps:
```html
<!-- depois do <p> "Isso leva em torno de 1 a 3 minutos" -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tr>
    <td style="text-align:center;padding-top:28px;">
      ${ctaButton(`${appUrl}/minhas-consultas`, 'ACOMPANHAR EM MINHAS CONSULTAS', '#1A1A1A', '#FFD600')}
    </td>
  </tr>
</table>
```

**sendPurchaseApprovedEmail** — trocar `reportUrl` pelo link de minhas-consultas:
```typescript
// Mudar CTA de:
ctaButton(reportUrl, 'VER RELATÓRIO COMPLETO')
// Para:
ctaButton(`${process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'}/minhas-consultas`, 'VER RELATÓRIO EM MINHAS CONSULTAS')
```
Remover também o parâmetro `reportUrl` do tipo da função (não é mais usado).

**Step 1:** Editar `sendPurchaseReceivedEmail` — adicionar bloco CTA com botão preto/amarelo após o `<p>` de "1 a 3 minutos".

**Step 2:** Editar `sendPurchaseApprovedEmail` — trocar CTA para minhas-consultas, remover `reportUrl` do parâmetro (ou manter como optional se `sendCompletionEmail` legado usar).

> ⚠️ `sendCompletionEmail` é legado e chama `sendPurchaseApprovedEmail`. Manter `reportUrl` como parâmetro ignorado para não quebrar callers.

**Step 3:** Rodar `npx tsc --noEmit` — deve passar sem erros.

**Step 4:** Commit:
```bash
git add src/lib/email.ts
git commit -m "fix(email): CTAs de received e approved apontam para minhas-consultas"
```

---

## Task 2: Adicionar emails faltantes no email.ts

**Files:**
- Modify: `src/lib/email.ts`

### sendPurchaseRefundedEmail

```typescript
export async function sendPurchaseRefundedEmail(
  email: string,
  name: string,
  code: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
      ${emailHeader('REEMBOLSO PROCESSADO', '#66CC66', '#FFFFFF')}
      <tr><td style="padding:40px 40px 32px;">
        <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
          Seu dinheiro voltou.
        </h2>
        <p style="margin:0 0 28px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
          Olá, ${firstName}. O reembolso referente ao pedido abaixo foi processado. O valor será estornado em até <strong style="color:#1A1A1A;">5 dias úteis</strong>, conforme sua operadora.
        </p>
        <p style="margin:0 0 10px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#888888;">Código do pedido</p>
        ${codeBox(code)}
        <p style="margin:24px 0 0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;line-height:1.7;color:#666666;">
          Se tiver alguma dúvida, responda este email.
        </p>
      </td></tr>
      ${emailDivider()}
      ${emailFooter(['Pedimos desculpas pelo inconveniente.'])}
    </table>
  `)

  return sendEmail({
    to: email,
    subject: `Reembolso confirmado — pedido ${code}`,
    html,
  })
}
```

### sendAbandonmentEmail1 (R1 — 30 min)

Copy: tom levemente irônico, "você estava tão perto".

```typescript
export async function sendAbandonmentEmail1(
  email: string,
  name: string,
  term: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const formattedTerm = term.length === 11
    ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
      ${emailHeader('CONSULTA PENDENTE', '#1A1A1A', '#FFD600')}
      <tr><td style="padding:40px 40px 32px;">
        <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
          Você quase se protegeu.
        </h2>
        <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
          Olá, ${firstName}. Você foi lá, iniciou uma consulta para <strong style="color:#1A1A1A;">${formattedTerm}</strong> e parou no pagamento.
        </p>
        <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
          O documento ainda pode ser verificado agora, por R$&nbsp;39,90.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td style="text-align:center;">
            ${ctaButton(`${appUrl}/consulta/${term}`, 'COMPLETAR CONSULTA — R$ 39,90')}
          </td></tr>
        </table>
      </td></tr>
      ${emailDivider()}
      ${emailFooter([
        'Você recebeu este email porque iniciou uma consulta no EOPIX.',
        'Para não receber mais emails de lembrete, responda com PARAR.',
      ])}
    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Você quase se protegeu.',
    html,
  })
}
```

### sendAbandonmentEmail2 (R2 — 24h)

Copy: FOMO — consequência de não saber.

```typescript
export async function sendAbandonmentEmail2(
  email: string,
  name: string,
  term: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'
  const formattedTerm = term.length === 11
    ? term.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : term.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
      ${emailHeader('AINDA DÁ TEMPO', '#FFD600', '#1A1A1A')}
      <tr><td style="padding:40px 40px 32px;">
        <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#1A1A1A;line-height:1.1;">
          A consulta que você não fez.
        </h2>
        <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#666666;">
          Olá, ${firstName}. Todo dia alguém fecha um contrato sem checar quem está do outro lado. Você já sabe que <strong style="color:#1A1A1A;">${formattedTerm}</strong> precisava ser verificado.
        </p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
          style="background-color:#F0EFEB;border-radius:6px;border:1px solid #E8E7E3;margin-bottom:32px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 6px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#888888;">Você vai descobrir</p>
            ${['Processos judiciais ativos','Dívidas e negativações','Reclamações no Reclame Aqui','Notícias comprometedoras'].map(item => `
              <p style="margin:0 0 4px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:13px;color:#1A1A1A;">→ ${item}</p>
            `).join('')}
          </td></tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td style="text-align:center;">
            ${ctaButton(`${appUrl}/consulta/${term}`, 'VERIFICAR AGORA — R$ 39,90')}
          </td></tr>
        </table>
      </td></tr>
      ${emailDivider()}
      ${emailFooter([
        'Você recebeu este email porque iniciou uma consulta no EOPIX.',
        'Para não receber mais emails de lembrete, responda com PARAR.',
      ])}
    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Enquanto você esperava...',
    html,
  })
}
```

### sendAbandonmentEmail3 (R3 — 72h)

Copy: direto, urgência real, voz da marca na máxima potência.

```typescript
export async function sendAbandonmentEmail3(
  email: string,
  name: string,
  term: string
): Promise<SendEmailResponse> {
  const firstName = name?.split(' ')[0] || 'você'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://somoseopix.com.br'

  const html = emailShell(`
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
      style="max-width:600px;margin:0 auto;background-color:#1A1A1A;border:2px solid #1A1A1A;border-radius:8px;overflow:hidden;">
      <!-- Header invertido — impacto máximo -->
      <tr>
        <td style="background-color:#FFD600;padding:28px 40px 24px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td>
                <span style="font-family:'Zilla Slab',Georgia,serif;font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-0.3px;">
                  E o Pix<span style="color:#1A1A1A;">?</span>
                </span>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <span style="display:inline-block;background-color:#1A1A1A;color:#FFD600;font-family:'IBM Plex Mono','Courier New',monospace;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;border-radius:2px;">
                  ÚLTIMO AVISO
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:40px 40px 32px;background-color:#1A1A1A;">
          <h2 style="margin:0 0 8px;font-family:'Zilla Slab',Georgia,serif;font-size:30px;font-weight:700;color:#FFFFFF;line-height:1.1;">
            Antes ou depois?
          </h2>
          <p style="margin:0 0 20px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#BBBBBB;">
            Olá, ${firstName}. Calote acontece. Processo acontece. A pergunta não é "se vai acontecer". É "com quem".
          </p>
          <p style="margin:0 0 32px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;line-height:1.7;color:#FFFFFF;">
            R$&nbsp;39,90 é quanto custa saber.<br>
            <span style="color:#888888;">Processo trabalhista custa quanto mesmo?</span>
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="text-align:center;">
              ${ctaButton(`${appUrl}/consulta/${term}`, 'CONSULTAR AGORA — R$ 39,90')}
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px 24px;background-color:#1A1A1A;border-top:1px solid rgba(255,255,255,0.08);">
          <p style="margin:0 0 4px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;color:#444444;">
            Você recebeu este email porque iniciou uma consulta no EOPIX. Este é o último lembrete.
          </p>
          <p style="margin:0;font-family:'IBM Plex Mono','Courier New',monospace;font-size:11px;color:#444444;">
            Para cancelar recebimento de lembretes, responda com PARAR.
          </p>
        </td>
      </tr>
    </table>
  `)

  return sendEmail({
    to: email,
    subject: 'Antes ou depois?',
    html,
  })
}
```

**Step 1:** Adicionar `sendPurchaseRefundedEmail` ao `src/lib/email.ts`.

**Step 2:** Adicionar `sendAbandonmentEmail1`, `sendAbandonmentEmail2`, `sendAbandonmentEmail3`.

**Step 3:** Rodar `npx tsc --noEmit` — deve passar.

**Step 4:** Commit:
```bash
git add src/lib/email.ts
git commit -m "feat(email): adiciona refunded + 3 abandonment emails (R1/R2/R3)"
```

---

## Task 3: Inngest — abandonment email function

**Files:**
- Create: `src/lib/inngest/abandonment-emails.ts`
- Modify: `src/lib/inngest/crons.ts` — registrar no array `functions`
- Modify: `src/lib/inngest/client.ts` — adicionar tipo de evento `purchase/created`

### Step 1: Adicionar tipo de evento em client.ts

Abrir `src/lib/inngest/client.ts`. Localizar o type `Events` (ou onde os event types são definidos). Adicionar:

```typescript
'purchase/created': {
  data: {
    purchaseId: string
    email: string
    name: string
    term: string  // CPF/CNPJ limpo (só dígitos)
  }
}
```

### Step 2: Criar `src/lib/inngest/abandonment-emails.ts`

```typescript
import { inngest } from './client'
import { prisma } from '@/lib/prisma'
import {
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
} from '@/lib/email'

// Determina se a purchase ainda está em estado de abandono
// (nunca foi paga ou expirou por falta de pagamento)
function isAbandoned(status: string, failureReason: string | null): boolean {
  return (
    status === 'PENDING' ||
    (status === 'FAILED' && failureReason === 'PAYMENT_EXPIRED')
  )
}

export const abandonmentEmailSequence = inngest.createFunction(
  {
    id: 'abandonment-email-sequence',
    retries: 2,
    // Previne múltiplas execuções para o mesmo purchase
    idempotency: 'event.data.purchaseId',
  },
  { event: 'purchase/created' },
  async ({ event, step }) => {
    const { purchaseId, email, name, term } = event.data

    // ── R1: espera 30 minutos ──────────────────────────────
    await step.sleep('wait-r1', '30 minutes')

    const p1 = await step.run('check-for-r1', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p1 || !isAbandoned(p1.status, p1.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r1' }
    }

    await step.run('send-r1', async () => {
      await sendAbandonmentEmail1(email, name, term)
    })

    // ── R2: espera mais ~23.5h (total ~24h desde criação) ──
    await step.sleep('wait-r2', '23 hours 30 minutes')

    const p2 = await step.run('check-for-r2', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p2 || !isAbandoned(p2.status, p2.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r2' }
    }

    await step.run('send-r2', async () => {
      await sendAbandonmentEmail2(email, name, term)
    })

    // ── R3: espera mais 48h (total ~72h desde criação) ─────
    await step.sleep('wait-r3', '48 hours')

    const p3 = await step.run('check-for-r3', async () => {
      return prisma.purchase.findUnique({
        where: { id: purchaseId },
        select: { status: true, failureReason: true },
      })
    })

    if (!p3 || !isAbandoned(p3.status, p3.failureReason)) {
      return { aborted: 'paid_or_not_found', step: 'r3' }
    }

    await step.run('send-r3', async () => {
      await sendAbandonmentEmail3(email, name, term)
    })

    return { completed: true, emailsSent: 3 }
  }
)
```

### Step 3: Registrar no crons.ts

Em `src/lib/inngest/crons.ts`, adicionar ao array `functions`:

```typescript
import { abandonmentEmailSequence } from './abandonment-emails'

// No array functions (linha ~170):
export const functions = [
  processSearch,
  cleanupSearchResults,
  cleanupLeads,
  cleanupMagicCodes,
  cleanupPendingPurchases,
  anonymizePurchases,
  abandonmentEmailSequence,  // ← adicionar
]
```

**Step 4:** Rodar `npx tsc --noEmit` — deve passar.

**Step 5:** Commit:
```bash
git add src/lib/inngest/abandonment-emails.ts src/lib/inngest/crons.ts src/lib/inngest/client.ts
git commit -m "feat(inngest): abandonment email sequence (R1 30min / R2 24h / R3 72h)"
```

---

## Task 4: Wiring — purchase created → trigger abandonment

**Files:**
- Modify: `src/app/api/purchases/route.ts`

### Onde adicionar

Localizar o bloco onde a purchase é criada em live mode (quando `!effectiveBypass`). Após `prisma.purchase.create(...)`, antes do return com `checkout_url`:

```typescript
// Disparar funil de recuperação apenas em live mode (pagamento real)
// Não disparar em bypass/mock pois purchase já vai direto para PAID
if (!effectiveBypass) {
  try {
    await inngest.send({
      name: 'purchase/created',
      data: {
        purchaseId: purchase.id,
        email: user.email,
        name: user.name || '',
        term: cleanedTerm,  // CPF/CNPJ sem formatação
      },
    })
  } catch (err) {
    // Não falhar o request se Inngest estiver indisponível
    console.warn('[Purchases] Abandonment event send failed:', err)
  }
}
```

**Step 1:** Localizar exatamente onde `purchase` é criada em live mode no arquivo.

**Step 2:** Adicionar o bloco acima após a criação da purchase.

**Step 3:** Verificar que `user` está disponível nesse escopo (já deve estar — o route autentica o usuário antes).

**Step 4:** Rodar `npx tsc --noEmit`.

**Step 5:** Commit:
```bash
git add src/app/api/purchases/route.ts
git commit -m "feat(purchases): dispara evento purchase/created para funil de abandono"
```

---

## Task 5: Wiring — emails transacionais

**Files:**
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/webhooks/abacatepay/route.ts`
- Modify: `src/lib/inngest/process-search.ts`
- Modify: `src/app/api/admin/purchases/[id]/refund/route.ts`

### 5a — Register → welcome email

Em `src/app/api/auth/register/route.ts`, após `prisma.user.create(...)`:

```typescript
import { sendWelcomeEmail } from '@/lib/email'

// Após criar o user — fire-and-forget (não bloquear o response)
sendWelcomeEmail(user.email, user.name || '', user.id).catch(err =>
  console.error('[Register] Welcome email failed:', err)
)
```

### 5b — Webhook PAID → purchase received email

Em `src/app/api/webhooks/abacatepay/route.ts`, após o bloco que atualiza `purchase.status = 'PAID'` (por volta da linha 230 onde faz o `prisma.purchase.update`):

```typescript
import { sendPurchaseReceivedEmail } from '@/lib/email'

// Após confirmar PAID — fire-and-forget
const userEmail = purchase.user?.email
const userName = purchase.user?.name || ''
const purchaseCode = purchase.code
const purchaseTerm = purchase.term

if (userEmail && !userEmail.includes('@guest.eopix.app')) {
  sendPurchaseReceivedEmail(userEmail, userName, purchaseCode, purchaseTerm)
    .catch(err => console.error('[Webhook] Purchase received email failed:', err))
}
```

> ⚠️ Checar se o `include: { user: true }` já está na query da purchase no webhook (linha ~170 do arquivo). Se não estiver, adicionar.

### 5c — Pipeline COMPLETED → approved email

Em `src/lib/inngest/process-search.ts`, nos dois pontos onde `status: 'COMPLETED'` é escrito (linhas ~94 e ~329). Adicionar após cada update:

```typescript
import { sendPurchaseApprovedEmail } from '@/lib/email'

// Após prisma.purchase.update({ data: { status: 'COMPLETED' } })
const userForEmail = await prisma.user.findUnique({
  where: { id: purchase.userId },
  select: { email: true, name: true },
})
if (userForEmail && !userForEmail.email.includes('@guest.eopix.app')) {
  sendPurchaseApprovedEmail(userForEmail.email, userForEmail.name || '', purchase.code, '')
    .catch(err => console.error('[Pipeline] Approved email failed:', err))
}
```

> Nota: `reportUrl` agora é ignorado na função (CTA vai para minhas-consultas), mas o parâmetro ainda existe — passar string vazia.

### 5d — Pipeline FAILED → denied email

Em `src/lib/inngest/process-search.ts`, no bloco onde `status: 'FAILED'` é escrito (linha ~352). **Só enviar se `failureReason !== 'PAYMENT_EXPIRED'`** (i.e., falha técnica real, não abandono):

```typescript
import { sendPurchaseDeniedEmail } from '@/lib/email'

// Após prisma.purchase.update({ data: { status: 'FAILED' } })
// Não enviar email para PAYMENT_EXPIRED (já tratado pelo funil de abandono)
if (failureReason !== 'PAYMENT_EXPIRED') {
  const userForEmail = await prisma.user.findUnique({
    where: { id: purchase.userId },
    select: { email: true, name: true },
  })
  if (userForEmail && !userForEmail.email.includes('@guest.eopix.app')) {
    sendPurchaseDeniedEmail(userForEmail.email, userForEmail.name || '', purchase.code)
      .catch(err => console.error('[Pipeline] Denied email failed:', err))
  }
}
```

### 5e — Admin refund → refunded email

Em `src/app/api/admin/purchases/[id]/refund/route.ts`, após atualizar status para REFUNDED:

```typescript
import { sendPurchaseRefundedEmail } from '@/lib/email'

// Após update status → REFUNDED — incluir user na query antes
// A query existente provavelmente já faz findUnique com include user
// Se não: adicionar include: { user: true }

sendPurchaseRefundedEmail(purchase.user.email, purchase.user.name || '', purchase.code)
  .catch(err => console.error('[Refund] Refunded email failed:', err))
```

**Step 1:** Implementar 5a (register).
**Step 2:** Implementar 5b (webhook).
**Step 3:** Implementar 5c (COMPLETED — os 2 pontos).
**Step 4:** Implementar 5d (FAILED).
**Step 5:** Implementar 5e (refund).
**Step 6:** Rodar `npx tsc --noEmit` — deve passar.
**Step 7:** Rodar `npm run lint` — deve passar.
**Step 8:** Commit:
```bash
git add src/app/api/auth/register/route.ts \
        src/app/api/webhooks/abacatepay/route.ts \
        src/lib/inngest/process-search.ts \
        src/app/api/admin/purchases/[id]/refund/route.ts
git commit -m "feat(email): wiring de todos os emails transacionais"
```

---

## Task 6: Testes

**Files:**
- Create: `tests/lib/email.test.ts`

### Testes mínimos

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do Resend e isBypassMode
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }),
    },
  })),
}))
vi.mock('@/lib/mock-mode', () => ({ isBypassMode: false }))

import {
  sendWelcomeEmail,
  sendPurchaseReceivedEmail,
  sendPurchaseApprovedEmail,
  sendPurchaseDeniedEmail,
  sendPurchaseRefundedEmail,
  sendAbandonmentEmail1,
  sendAbandonmentEmail2,
  sendAbandonmentEmail3,
} from '@/lib/email'

describe('email functions', () => {
  it('sendWelcomeEmail — retorna id', async () => {
    const res = await sendWelcomeEmail('ana@test.com', 'Ana Silva')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseReceivedEmail — retorna id', async () => {
    const res = await sendPurchaseReceivedEmail('ana@test.com', 'Ana', 'XKPQ2R', '12345678900')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseApprovedEmail — retorna id', async () => {
    const res = await sendPurchaseApprovedEmail('ana@test.com', 'Ana', 'XKPQ2R', '')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseDeniedEmail — retorna id', async () => {
    const res = await sendPurchaseDeniedEmail('ana@test.com', 'Ana', 'XKPQ2R')
    expect(res.id).toBe('mock-id')
  })

  it('sendPurchaseRefundedEmail — retorna id', async () => {
    const res = await sendPurchaseRefundedEmail('ana@test.com', 'Ana', 'XKPQ2R')
    expect(res.id).toBe('mock-id')
  })

  it('sendAbandonmentEmail1 — CPF formatado no HTML', async () => {
    const { Resend } = await import('resend')
    const mockSend = vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null })
    vi.mocked(Resend).mockImplementation(() => ({ emails: { send: mockSend } } as never))

    await sendAbandonmentEmail1('ana@test.com', 'Ana', '12345678900')
    const callArgs = mockSend.mock.calls[0][0]
    expect(callArgs.html).toContain('123.456.789-00')
  })

  it('sendAbandonmentEmail2 — retorna id', async () => {
    const res = await sendAbandonmentEmail2('ana@test.com', 'Ana', '12345678900')
    expect(res.id).toBe('mock-id')
  })

  it('sendAbandonmentEmail3 — retorna id', async () => {
    const res = await sendAbandonmentEmail3('ana@test.com', 'Ana', '12345678900')
    expect(res.id).toBe('mock-id')
  })
})
```

**Step 1:** Criar `tests/lib/email.test.ts` com os testes acima.

**Step 2:** Rodar `npx vitest run tests/lib/email.test.ts` — devem passar.

**Step 3:** Rodar `npx vitest run` — todos os testes devem continuar passando.

**Step 4:** Commit:
```bash
git add tests/lib/email.test.ts
git commit -m "test(email): testes unitários para todas as funções de email"
```

---

## Task 7: Atualizar docs/status.md

Adicionar na seção "O que está funcionando":

```markdown
- **Sistema de emails Resend** — 8 funções implementadas: welcome, purchase received, approved, denied, refunded + funil de abandono R1/R2/R3 (Inngest step.sleep). MOCK_MODE bypassa envio. LGPD: opt-out por resposta PARAR nos emails de abandono.
```

Commit:
```bash
git add docs/status.md
git commit -m "docs: atualiza status com sistema de emails"
```

---

## Nota sobre testes com email real

Nunca usar emails de domínios reais (gmail, outlook) em testes. O Resend tem endereços de teste:
- `delivered@resend.dev` → simula entrega OK
- `bounced@resend.dev` → simula bounce (hard bounce, entra na suppression list)
- `complained@resend.dev` → simula spam complaint

---

## Checklist de verificação final

Antes de considerar completo:

- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npm run lint` passa
- [ ] `npx vitest run` — todos os testes passam
- [ ] `isBypassMode: true` → nenhum email é enviado (apenas log no console)
- [ ] Abandonment function só dispara quando `!effectiveBypass`
- [ ] Emails de FAILED com `failureReason === 'PAYMENT_EXPIRED'` NÃO enviam denied email (só R1 do funil)
- [ ] Guest users (`@guest.eopix.app`) não recebem emails transacionais
