# Phase 3: Alertas de Falha - Research

**Researched:** 2026-03-26
**Domain:** Callmebot WhatsApp API + Inngest pipeline instrumentation
**Confidence:** HIGH

## Summary

Phase 3 adiciona alertas WhatsApp operacionais para dois eventos do pipeline: transição para FAILED (primeira vez) e transição para COMPLETED. A integração é via Callmebot — um serviço gratuito de mensagens WhatsApp por GET request com phone + apikey + text encoded na URL.

O scope é estreito e cirúrgico: um novo módulo `src/lib/callmebot.ts`, duas chamadas fire-and-forget inseridas no catch block (FAILED) e logo após o update COMPLETED em `process-search.ts`. Sem migrations de banco, sem novos modelos. A deduplicação do alerta FAILED é feita via leitura do campo `status` antes do update — já está parcialmente no código (o `findUnique` do catch block), apenas precisando expandir o `select`.

São 3 destinatários em paralelo via `Promise.all`. Cada par phone+apikey vem de variáveis de ambiente separadas. Se uma variável estiver ausente, aquele destinatário é pulado silenciosamente.

**Primary recommendation:** Criar `src/lib/callmebot.ts` seguindo o padrão de `src/lib/email.ts`, expandir o `select` do `findUnique` existente no catch block, e inserir as chamadas fire-and-forget em dois pontos de `process-search.ts`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Alertar na primeira transição para FAILED — não esperar todos os retries se esgotarem.

**D-02:** Deduplicação via status check antes do update:
```
wasAlreadyFailed = currentPurchase.status === 'FAILED'
await prisma.purchase.update({ status: 'FAILED', ... })
if (!wasAlreadyFailed) { sendCallmebotAlert(...) }
```

**D-03:** NÃO usar `onFailure` do Inngest. NÃO usar campo `alertSent` no banco.

**D-04:** Formato da mensagem FAILED (com emojis, code, data, nome, email, paymentProvider, step/6, erro truncado 100 chars, link admin).

**D-05:** CPF/CNPJ NÃO aparece na mensagem FAILED.

**D-06:** `failureReason` / `error.message` truncado em 100 chars.

**D-07 (falha Callmebot):** Fire-and-forget — logar no console + Sentry.captureException, NÃO relançar.

**D-08 (COMPLETED):** Alerta COMPLETED disparado após `prisma.purchase.update({ status: 'COMPLETED' })` em `process-search.ts`. Formato definido (sem CPF/CNPJ).

**D-09 (ponto de disparo COMPLETED):** Após `prisma.purchase.update({ status: 'COMPLETED' })`. Fire-and-forget.

**D-10 (deduplicação COMPLETED):** NÃO deduplicar — só transiciona para COMPLETED uma vez.

**D-09 (módulo):** Criar `src/lib/callmebot.ts` — módulo isolado, padrão de `src/lib/email.ts`.

**D-10 (ponto FAILED):** Catch block em `src/lib/inngest/process-search.ts`, após `prisma.purchase.update` que marca FAILED.

**D-11 (destinatários):** 3 destinatários em paralelo via `Promise.all`:
- Luana: `CALLMEBOT_PHONE` + `CALLMEBOT_API_KEY`
- Kevin: `CALLMEBOT_PHONE_2` + `CALLMEBOT_API_KEY_2`
- Carolina: `CALLMEBOT_PHONE_3` + `CALLMEBOT_API_KEY_3`
Se um par phone+key estiver ausente, pular aquele destinatário silenciosamente.

**D-11 (exclusão):** NÃO alertar para `PAYMENT_EXPIRED`.

**D-12:** NÃO incluir CPF/CNPJ nas mensagens.

**D-13:** NÃO cobrir webhook AbacatePay nem outros pontos de falha.

### Claude's Discretion

- URL exata da API Callmebot (formato do request, encoding da mensagem)
- Mapeamento completo de `failureReason` → texto legível
- Tratamento de edge case: purchase não encontrada no `findUnique` antes do update

### Deferred Ideas (OUT OF SCOPE)

- Alertas para falha do webhook AbacatePay (purchase fica presa em PAID)
- Alertas Sentry (email/Slack rules) — cobertos pela Fase 2
- Rate limiting do Callmebot (muitas falhas simultâneas)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OBS-03 | Quando uma compra falha no pipeline (FAILED), operador recebe notificação WhatsApp via Callmebot com: código da compra, erro, CPF/CNPJ | Callmebot API verificada: GET request com phone+apikey+text URL-encoded. CPF/CNPJ excluído por D-05/D-12. Deduplicação via status check (D-02). 3 destinatários em paralelo (D-11). |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fetch (built-in) | Node 18+ (Next.js 14) | HTTP GET para Callmebot API | Sem dependência extra; Callmebot é um GET simples |
| encodeURIComponent | built-in | Encoding da mensagem na URL | Standard; mais correto que `+` para caracteres especiais |

### Supporting

Nenhuma biblioteca adicional necessária. A integração é um fetch GET simples.

**Installation:** Nenhuma instalação necessária.

---

## Architecture Patterns

### Módulo callmebot.ts — padrão de email.ts

O padrão estabelecido em `src/lib/email.ts`:

1. Import estático de env vars no topo (sem lazy init)
2. Guard: se variável ausente, `console.warn` e `return` (não throw)
3. Função exportada com tipagem TypeScript
4. Retorna resultado (ou void) — caller decide se fire-and-forget
5. Erros do serviço externo propagam para o caller tratar (`.catch()`)

### Callmebot API

**Endpoint verificado (HIGH confidence):**
```
GET https://api.callmebot.com/whatsapp.php?phone={phone}&text={text}&apikey={apikey}
```

- `phone`: número com código do país (ex: `+5511999999999`)
- `text`: mensagem URL-encoded via `encodeURIComponent()`
- `apikey`: chave recebida após ativação
- Emojis funcionam (suportados pelo WhatsApp e pela URL encoding)
- Quebras de linha: `\n` no texto, `encodeURIComponent` converte para `%0A`
- Resposta: texto plano (não JSON). HTTP 200 = aceito pelo serviço (não garante entrega)

### Estrutura do módulo

```
src/lib/callmebot.ts          — módulo isolado (novo)
src/lib/inngest/process-search.ts — 2 pontos de chamada (expandir select + inserir calls)
```

### Padrão de deduplicação FAILED

```typescript
// No catch block de process-search.ts:
// 1. findUnique JÁ EXISTE — apenas expandir o select:
const failedPurchase = await prisma.purchase.findUnique({
  where: { id: purchaseId },
  select: {
    status: true,         // NOVO — para deduplicação
    processingStep: true,
    code: true,
    userId: true,
    createdAt: true,      // NOVO — para formatar data na mensagem
    paymentProvider: true, // NOVO — para mapear provider
    failureReason: true,  // NOVO — para excluir PAYMENT_EXPIRED
    user: { select: { name: true, email: true } }, // NOVO
  },
})

const wasAlreadyFailed = failedPurchase?.status === 'FAILED'

// 2. update existente (sem mudança)
await prisma.purchase.update({ where: { id: purchaseId }, data: { status: 'FAILED', ... } })

// 3. Alerta fire-and-forget (novo)
if (!wasAlreadyFailed && failedPurchase?.failureReason !== 'PAYMENT_EXPIRED') {
  sendFailureAlert(failedPurchase, error).catch(err =>
    console.error('[Callmebot] Failure alert failed:', err)
  )
}
```

### Padrão de alerta COMPLETED

```typescript
// Após prisma.purchase.update({ status: 'COMPLETED', ... }):
// Reutilizar dados já disponíveis no escopo (purchase foi carregada antes)
sendCompletedAlert({ code, createdAt, paymentProvider, user }).catch(err =>
  console.error('[Callmebot] Completed alert failed:', err)
)
```

### Formato de mensagem FAILED

```
⚠️ EOPIX — FALHA NO PIPELINE

📦 Compra: {code}
📅 Data: {DD/MM/YYYY às HHhMM}
👤 {user.name || 'Sem nome'}
📧 {user.email}
💳 {paymentProvider mapeado}
🔢 Step: {processingStep}/6 — {stepLabel}

❌ Erro:
{error.message truncado 100 chars}

🔗 eopix.com.br/admin/compras?search={code}
```

### Mapeamento paymentProvider → texto legível

| Valor no DB | Exibição |
|-------------|----------|
| `abacatepay` | `PIX (AbacatePay)` |
| `stripe` | `Cartão (Stripe)` |
| `null` | `Pagamento` |

### Mapeamento processingStep → label

Já existe em `src/types/domain.ts` como `PROCESSING_STEPS`:

| step | label |
|------|-------|
| 1 | Consultando Receita Federal |
| 2 | Verificando situacao financeira |
| 3 | Buscando processos judiciais |
| 4 | Analisando noticias e reputacao |
| 5 | Gerando analise inteligente |
| 6 | Montando seu relatorio |
| 0 | (antes de qualquer step) |

### Formato de mensagem COMPLETED

```
✅ EOPIX — RELATÓRIO ENTREGUE

📦 Compra: {code}
📅 Data: {DD/MM/YYYY às HHhMM}
👤 {user.name || 'Sem nome'}
📧 {user.email}
💳 {paymentProvider mapeado}

🔗 eopix.com.br/admin/compras?search={code}
```

### Envio para múltiplos destinatários

```typescript
const recipients = [
  { phone: process.env.CALLMEBOT_PHONE, apiKey: process.env.CALLMEBOT_API_KEY },
  { phone: process.env.CALLMEBOT_PHONE_2, apiKey: process.env.CALLMEBOT_API_KEY_2 },
  { phone: process.env.CALLMEBOT_PHONE_3, apiKey: process.env.CALLMEBOT_API_KEY_3 },
].filter(r => r.phone && r.apiKey) // pula pares ausentes

await Promise.all(recipients.map(r => sendToRecipient(r.phone!, r.apiKey!, message)))
```

### Anti-Patterns to Avoid

- **Throw no fire-and-forget:** Nunca relançar erro do Callmebot — quebraria o flow do pipeline ou o status de outras operações.
- **Fetch síncrono bloqueando pipeline:** Sempre fire-and-forget (`.catch()`), nunca `await` no caminho crítico.
- **Concatenar URL sem encoding:** Mensagens com `&`, `=`, `#`, emojis ou acentos corrompem a query string. Usar `encodeURIComponent(message)`.
- **Duplicar query ao DB para o alerta COMPLETED:** O select de `failedPurchase` / dados da purchase já estão disponíveis no escopo — não fazer novo `findUnique`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL encoding | Custom encoder | `encodeURIComponent()` | Built-in, correto para todos os chars especiais |
| Multi-recipient delivery | Sequential loop com retry | `Promise.all` + filter | Paralelo, simples, falha isolada por destinatário |
| Step label lookup | if/else chain | `PROCESSING_STEPS.find()` em `domain.ts` | Fonte de verdade já existe |

---

## Common Pitfalls

### Pitfall 1: URL encoding incompleto
**What goes wrong:** Usar `+` para espaços ou não encodar a mensagem — emojis e acentos quebram a URL, Callmebot recebe mensagem corrompida ou retorna erro 400.
**Why it happens:** Tentação de usar `.replace(/ /g, '+')` como visto em exemplos antigos.
**How to avoid:** `encodeURIComponent(message)` — converte tudo, incluindo emojis, acentos, `&`, `?`, `#`.
**Warning signs:** Mensagem recebida com `?` no lugar de emojis, ou palavras cortadas.

### Pitfall 2: Deduplicação race condition
**What goes wrong:** Dois retries do Inngest executam o catch block simultaneamente, ambos leem `status !== 'FAILED'`, ambos enviam o alerta.
**Why it happens:** O `findUnique` e o `update` não são atômicos.
**How to avoid:** Race condition é improvável na prática — Inngest executa retries sequencialmente com backoff. Se tornar problema, adicionar campo `alertSent` (mas D-03 decide contra por ora).
**Warning signs:** Operador recebe 2+ alertas idênticos em milissegundos.

### Pitfall 3: Alerta COMPLETED para guest users
**What goes wrong:** Purchase de guest (`@guest.eopix.app`) dispara alerta COMPLETED com email sem sentido.
**Why it happens:** Sem guard de email.
**How to avoid:** O alerta COMPLETED é para o operador (WhatsApp), não para o cliente — não há guard de guest necessário aqui. O alerta vai para os operadores independente de quem comprou. Guest é OK.

### Pitfall 4: `failedPurchase` null no catch block
**What goes wrong:** `findUnique` retorna null (purchase deletada?), crash no acesso a `.status`.
**Why it happens:** Edge case improvável mas possível.
**How to avoid:** Guard `failedPurchase?.status === 'FAILED'` (optional chaining já usado no código existente). Se null, `wasAlreadyFailed` fica `undefined` (falsy) → alerta é enviado. Comportamento seguro: melhor enviar alerta a mais do que perder.

### Pitfall 5: PAYMENT_EXPIRED gera alerta
**What goes wrong:** Purchases que expiraram (abandono de checkout) geram alerta de FAILED desnecessário para o operador.
**Why it happens:** Sem guard de `failureReason`.
**How to avoid:** Guard `failedPurchase?.failureReason !== 'PAYMENT_EXPIRED'` antes de enviar o alerta (D-11).

---

## Code Examples

### callmebot.ts — estrutura completa sugerida

```typescript
// src/lib/callmebot.ts
// Source: Callmebot API docs https://www.callmebot.com/blog/free-api-whatsapp-messages/

import * as Sentry from '@sentry/nextjs'
import { PROCESSING_STEPS } from '@/types/domain'

const BASE_URL = 'https://api.callmebot.com/whatsapp.php'

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).replace(',', ' às').replace(':', 'h')
}

function mapPaymentProvider(provider: string | null): string {
  if (provider === 'abacatepay') return 'PIX (AbacatePay)'
  if (provider === 'stripe') return 'Cartão (Stripe)'
  return 'Pagamento'
}

function getStepLabel(step: number): string {
  return PROCESSING_STEPS.find(s => s.step === step)?.label ?? 'Iniciando'
}

async function sendToOne(phone: string, apiKey: string, message: string): Promise<void> {
  const url = `${BASE_URL}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Callmebot HTTP ${res.status} for phone ${phone}`)
  }
}

interface AlertRecipient {
  phone: string | undefined
  apiKey: string | undefined
}

async function broadcastAlert(message: string): Promise<void> {
  const recipients: AlertRecipient[] = [
    { phone: process.env.CALLMEBOT_PHONE,   apiKey: process.env.CALLMEBOT_API_KEY },
    { phone: process.env.CALLMEBOT_PHONE_2, apiKey: process.env.CALLMEBOT_API_KEY_2 },
    { phone: process.env.CALLMEBOT_PHONE_3, apiKey: process.env.CALLMEBOT_API_KEY_3 },
  ]

  const active = recipients.filter(r => r.phone && r.apiKey) as Array<{ phone: string; apiKey: string }>

  if (active.length === 0) {
    console.warn('[Callmebot] No recipients configured — skipping alert')
    return
  }

  await Promise.all(
    active.map(r =>
      sendToOne(r.phone, r.apiKey, message).catch(err => {
        console.error(`[Callmebot] Failed for ${r.phone}:`, err)
        Sentry.captureException(err)
      })
    )
  )
}

export interface FailureAlertPayload {
  code: string
  createdAt: Date
  userName: string | null
  userEmail: string
  paymentProvider: string | null
  processingStep: number
  errorMessage: string
}

export async function sendFailureAlert(payload: FailureAlertPayload): Promise<void> {
  const truncatedError = payload.errorMessage.length > 100
    ? payload.errorMessage.slice(0, 100) + '...'
    : payload.errorMessage

  const message = [
    '⚠️ EOPIX — FALHA NO PIPELINE',
    '',
    `📦 Compra: ${payload.code}`,
    `📅 Data: ${formatDate(payload.createdAt)}`,
    `👤 ${payload.userName || 'Sem nome'}`,
    `📧 ${payload.userEmail}`,
    `💳 ${mapPaymentProvider(payload.paymentProvider)}`,
    `🔢 Step: ${payload.processingStep}/6 — ${getStepLabel(payload.processingStep)}`,
    '',
    '❌ Erro:',
    truncatedError,
    '',
    `🔗 eopix.com.br/admin/compras?search=${payload.code}`,
  ].join('\n')

  await broadcastAlert(message)
}

export interface CompletedAlertPayload {
  code: string
  createdAt: Date
  userName: string | null
  userEmail: string
  paymentProvider: string | null
}

export async function sendCompletedAlert(payload: CompletedAlertPayload): Promise<void> {
  const message = [
    '✅ EOPIX — RELATÓRIO ENTREGUE',
    '',
    `📦 Compra: ${payload.code}`,
    `📅 Data: ${formatDate(payload.createdAt)}`,
    `👤 ${payload.userName || 'Sem nome'}`,
    `📧 ${payload.userEmail}`,
    `💳 ${mapPaymentProvider(payload.paymentProvider)}`,
    '',
    `🔗 eopix.com.br/admin/compras?search=${payload.code}`,
  ].join('\n')

  await broadcastAlert(message)
}
```

### Integração no catch block (FAILED)

```typescript
// Em process-search.ts — catch block
// Expandir select do findUnique existente (já na linha ~371):
const failedPurchase = await prisma.purchase.findUnique({
  where: { id: purchaseId },
  select: {
    status: true,           // NOVO
    processingStep: true,
    code: true,
    userId: true,
    createdAt: true,        // NOVO
    paymentProvider: true,  // NOVO
    failureReason: true,    // NOVO
    user: { select: { name: true, email: true } }, // NOVO
  },
})

const wasAlreadyFailed = failedPurchase?.status === 'FAILED'

// ... update existente (sem mudança) ...

// NOVO — após o update, antes do email de denied:
if (!wasAlreadyFailed && failedPurchase?.failureReason !== 'PAYMENT_EXPIRED') {
  sendFailureAlert({
    code: failedPurchase?.code ?? purchaseCode ?? 'UNKNOWN',
    createdAt: failedPurchase?.createdAt ?? new Date(),
    userName: failedPurchase?.user?.name ?? null,
    userEmail: failedPurchase?.user?.email ?? 'desconhecido',
    paymentProvider: failedPurchase?.paymentProvider ?? null,
    processingStep: failedPurchase?.processingStep ?? 0,
    errorMessage: error instanceof Error ? error.message : String(error),
  }).catch(err => {
    console.error('[Callmebot] Failure alert failed:', err)
    Sentry.captureException(err)
  })
}
```

### Integração após COMPLETED

```typescript
// Em process-search.ts — após prisma.purchase.update({ status: 'COMPLETED' })
// Dados da purchase já disponíveis no escopo (buscar ou reutilizar):
sendCompletedAlert({
  code: purchaseCode,
  createdAt: /* purchase.createdAt já no escopo */,
  userName: /* user.name já no escopo */,
  userEmail: /* user.email já no escopo */,
  paymentProvider: /* purchase.paymentProvider já no escopo */,
}).catch(err => {
  console.error('[Callmebot] Completed alert failed:', err)
  Sentry.captureException(err)
})
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| fetch (Node) | callmebot.ts HTTP call | ✓ | Node 18+ (Next.js 14) | — |
| CALLMEBOT_PHONE + CALLMEBOT_API_KEY | broadcastAlert() | Requer config manual | — | Pula destinatário silenciosamente |
| CALLMEBOT_PHONE_2 + CALLMEBOT_API_KEY_2 | broadcastAlert() | Requer config manual | — | Pula destinatário silenciosamente |
| CALLMEBOT_PHONE_3 + CALLMEBOT_API_KEY_3 | broadcastAlert() | Requer config manual | — | Pula destinatário silenciosamente |

**Missing dependencies com no fallback:** Nenhum — código funciona sem env vars (apenas não envia alertas).

**Pre-requisito manual (fora do código):** Cada destinatário deve enviar "I allow callmebot to send me messages" para o número do bot Callmebot (+34 611 04 87 48) no WhatsApp e configurar o par phone+apikey no Vercel. Sem essa ativação, a API retorna erro mesmo com a key correta.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (raiz do projeto) |
| Quick run command | `npx vitest run tests/lib/callmebot.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-03 | `sendFailureAlert` constrói mensagem correta com code, step, erro truncado | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | `sendCompletedAlert` constrói mensagem correta | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | Deduplicação: `wasAlreadyFailed=true` → sem chamada fetch | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | PAYMENT_EXPIRED → sem alerta | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | Destinatário sem env var é pulado silenciosamente | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | `Promise.all` — falha de um destinatário não bloqueia outros | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |
| OBS-03 | Erro 100+ chars é truncado | unit | `npx vitest run tests/lib/callmebot.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/lib/callmebot.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green antes do `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/lib/callmebot.test.ts` — cobre todos os 7 requisitos acima. Seguir padrão de `tests/lib/email.test.ts` (vi.mock de fetch, vi.hoisted).

---

## Project Constraints (from CLAUDE.md)

- Trabalhar em `develop`. Nunca commit em `main`.
- Tipos centrais: `src/types/report.ts` e `src/types/domain.ts` — `PROCESSING_STEPS` já está em `domain.ts`, usar diretamente.
- Após qualquer edição: atualizar `docs/status.md`.
- Preferir Server Components; "use client" só para interatividade — não aplicável (módulo server-side apenas).
- Validações server-side com Zod — não aplicável para este módulo (sem input de usuário).
- Nunca abrir `node_modules/`, `.next/`, etc.
- Source of truth de APIs: `docs/api-contracts/` — Callmebot não tem contrato existente; usar docs oficiais.
- `src/lib/callmebot.ts` é um novo módulo em `src/lib/` → criar rule correspondente em `.claude/rules/` (conforme CLAUDE.md: "Se criar novo modulo em `src/lib/` ou `src/app/api/`: criar rule correspondente em `.claude/rules/`").

---

## Open Questions

1. **Dados da purchase disponíveis no ponto COMPLETED**
   - What we know: Após `prisma.purchase.update({ status: 'COMPLETED' })` há um `findUnique` fire-and-forget para o email de approved (linha ~357). Esse select inclui `code`, `user.email`, `user.name` mas não `createdAt` nem `paymentProvider`.
   - What's unclear: Se `createdAt` e `paymentProvider` já estão no escopo antes do try block (evento Inngest ou query anterior).
   - Recommendation: Verificar escopo de `process-search.ts` ao planejar. Solução mais simples: incluir `createdAt` e `paymentProvider` no `select` do findUnique existente do email approved, ou fazer query separada (aceitável pois é fire-and-forget).

2. **Formato exato do número de telefone para Callmebot**
   - What we know: Callmebot aceita `+5511999999999` (código do país sem espaços).
   - What's unclear: Se aceita `5511999999999` (sem `+`).
   - Recommendation: Documentar que o env var `CALLMEBOT_PHONE` deve incluir o `+`. Verificar na ativação manual.

---

## Sources

### Primary (HIGH confidence)

- Callmebot API official page: https://www.callmebot.com/blog/free-api-whatsapp-messages/ — URL format, parameters, encoding
- `src/lib/inngest/process-search.ts` (código local) — catch block existente, pontos de integração, select atual
- `src/lib/email.ts` (código local) — padrão de módulo a seguir
- `src/types/domain.ts` (código local) — PROCESSING_STEPS, tipos de domínio

### Secondary (MEDIUM confidence)

- WebSearch Callmebot (2026) — confirmado URL format: `https://api.callmebot.com/whatsapp.php?phone=...&text=...&apikey=...`

### Tertiary (LOW confidence)

- Rate limits do Callmebot: não documentados publicamente. Assumido como adequado para baixo volume (< 10 alertas/dia).

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — fetch nativo, sem dependências
- Architecture: HIGH — padrão de email.ts bem estabelecido no projeto
- Callmebot API format: HIGH — verificado em fonte oficial
- Pitfalls: HIGH — baseados em análise do código existente e comportamento da API
- Rate limits Callmebot: LOW — não documentado

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (Callmebot API estável, sem histórico de mudanças)
