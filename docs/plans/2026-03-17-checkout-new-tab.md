# Checkout em Nova Aba — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Abrir o checkout AbacatePay em nova aba em vez de redirecionar, para que o usuário volte automaticamente ao EOPIX após pagar.

**Architecture:** `window.open()` abre o checkout em nova aba (pré-aberto no contexto do click para evitar popup blocker). A aba original navega para `/compra/confirmacao?code=XXX` que já tem polling para `confirming_payment` → `approved` → `completed`. Fallback: se popup bloqueado, redireciona na mesma aba (comportamento atual).

**Tech Stack:** Next.js 14, React, AbacatePay v2

---

## Contexto

- **Problema:** AbacatePay v2 `completionUrl` não executa redirect pós-pagamento (limitação beta). O usuário paga mas fica preso na página "Você pode fechar essa página".
- **Solução:** Abrir checkout em nova aba. A aba original vai para a confirmação, que já faz polling 2s e detecta quando o pagamento é confirmado via webhook.
- **A confirmação page (`src/app/compra/confirmacao/page.tsx`) já trata `PENDING` → `confirming_payment`** com spinner, código, timeout >60s. Nenhuma mudança necessária lá.

## Popup Blocker Strategy

`window.open()` é bloqueado se chamado assincronamente (depois de um `fetch`). Solução: abrir a aba **antes** da API call (no contexto síncrono do click), depois setar a URL quando a resposta chegar.

```typescript
// 1. Abre aba vazia NO CONTEXTO DO CLICK (não é bloqueado)
const checkoutTab = window.open('about:blank', '_blank')

// 2. Chama API
const res = await fetch('/api/purchases', { ... })
const data = await res.json()

// 3. Redireciona a aba para o checkout
if (checkoutTab && data.checkoutUrl) {
  checkoutTab.location.href = data.checkoutUrl
  router.push(`/compra/confirmacao?code=${data.code}`)
} else {
  // Popup bloqueado ou bypass mode — fallback mesma aba
  window.location.href = data.checkoutUrl || `/compra/confirmacao?code=${data.code}`
}
```

---

### Task 1: Alterar redirect do checkout para nova aba

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx:175-215` (função `createPurchase`)

**Step 1: Localizar a função `createPurchase` e alterar o fluxo de redirect**

Na função `createPurchase()`, o bloco atual (linhas ~210-214) faz:
```typescript
if (data.checkoutUrl) {
  window.location.href = data.checkoutUrl;
} else {
  router.push(`/compra/confirmacao?code=${data.code}`);
}
```

Alterar **toda** a função `createPurchase` para:

1. Aceitar um parâmetro opcional `checkoutTab` (a aba pré-aberta)
2. Usar `checkoutTab.location.href` em vez de `window.location.href`
3. Navegar a aba original para confirmação
4. Fallback se popup bloqueado

O código final do bloco de redirect fica:
```typescript
if (data.checkoutUrl && checkoutTab) {
  // Nova aba aberta com sucesso — redireciona para checkout
  checkoutTab.location.href = data.checkoutUrl
  router.push(`/compra/confirmacao?code=${data.code}`)
} else if (data.checkoutUrl) {
  // Popup bloqueado — fallback para mesma aba
  window.location.href = data.checkoutUrl
} else {
  // Bypass mode — sem checkout externo
  router.push(`/compra/confirmacao?code=${data.code}`)
}
```

**Step 2: Alterar `handleModalSubmit` para pré-abrir a aba**

No `handleModalSubmit()` (linhas ~230-266), pré-abrir a aba antes da API call:

```typescript
const handleModalSubmit = async (data: RegisterData) => {
  setIsLoading(true)
  // Pré-abrir aba no contexto síncrono do click (evita popup blocker)
  const checkoutTab = window.open('about:blank', '_blank')
  try {
    // ... login/register logic igual ...
    await createPurchase({ ... }, checkoutTab)
  } catch (err) {
    // Fechar aba vazia se deu erro
    checkoutTab?.close()
    throw err
  } finally {
    setIsLoading(false)
  }
}
```

**Step 3: Alterar o CTA de usuário logado para também pré-abrir aba**

O botão de compra para usuário logado (que chama `createPurchase` diretamente sem modal) também precisa pré-abrir a aba. Localizar o handler do botão "DESBLOQUEAR" para logados e aplicar a mesma estratégia.

**Step 4: TypeScript — atualizar assinatura de `createPurchase`**

```typescript
async function createPurchase(
  params: { email?: string; name?: string; cellphone?: string; buyerTaxId?: string; password?: string },
  checkoutTab?: Window | null
)
```

**Step 5: Verificar TypeScript compila**

```bash
cd "/Users/luana/Documents/Code Projects/eopix" && npx tsc --noEmit 2>&1 | head -30
```

Esperado: sem erros.

**Step 6: Verificar lint**

```bash
npm run lint
```

Esperado: sem novos warnings.

**Step 7: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "feat: open AbacatePay checkout in new tab — user stays on EOPIX confirmation page"
```

---

### Task 2: Teste manual via Chrome MCP

**Step 1: Reiniciar dev server** (se necessário)

```bash
# Garantir MOCK_MODE=true, BYPASS_PAYMENT=false no .env.local
lsof -ti:3000 | xargs kill -9 2>/dev/null
npm run dev
```

**Step 2: Navegar para `/consulta/52998224725`**

Via Chrome MCP: navegar para `http://localhost:3000/consulta/52998224725`

**Step 3: Clicar "DESBLOQUEAR" e preencher modal**

Preencher nome, email, celular, CPF, senha. Submeter.

**Step 4: Verificar comportamento**

Esperado:
- Nova aba abre com checkout AbacatePay
- Aba original navega para `/compra/confirmacao?code=XXX`
- Confirmação mostra "Confirmando seu pagamento..." (estado `confirming_payment`)
- Polling roda a cada 2s

**Step 5: Pagar na aba do AbacatePay (sandbox)**

Usar cartão de teste `4242 4242 4242 4242`.

**Step 6: Verificar transição na aba EOPIX**

Esperado:
- Webhook `checkout.completed` dispara
- Confirmação transiciona: `confirming_payment` → `approved`
- Mostra "Compra aprovada!" com progresso

---

### Task 3: Vitest + E2E

**Step 1: Rodar vitest**

```bash
npx vitest run
```

Esperado: 100/100 (sem mudança em unit tests — a alteração é só UI).

**Step 2: Rodar E2E mock**

```bash
# Setar BYPASS_PAYMENT=true antes de rodar E2E
npm run test:e2e:mock
```

Nota: E2E tests usam BYPASS_PAYMENT=true, então o `window.open` não é chamado (entra no fallback `router.push`). Os testes devem continuar passando sem alteração.

**Step 3: Commit de fixes se necessário**

---

### Task 4: Atualizar docs

**Files:**
- Modify: `docs/status.md`

**Step 1: Adicionar entrada em status.md**

```
- **Checkout em nova aba** (2026-03-17): AbacatePay checkout abre em nova aba (`window.open`) em vez de redirecionar na mesma aba. Aba original navega para `/compra/confirmacao` que faz polling 2s para detectar pagamento via webhook. Fallback para redirect na mesma aba se popup bloqueado. Resolve limitação do `completionUrl` no v2 beta (não executa redirect pós-pagamento).
```

**Step 2: Commit**

```bash
git add docs/status.md
git commit -m "docs: checkout in new tab — completionUrl v2 beta workaround"
```
