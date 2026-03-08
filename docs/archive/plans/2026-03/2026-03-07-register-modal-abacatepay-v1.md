# Modal de Cadastro + AbacatePay v1 Customer Fix

**Data:** 2026-03-07
**Branch:** develop
**Status:** Aprovado pela Luana

---

## Contexto

A AbacatePay v1 (`/v1/billing/create`) exige `customer` ou `customerId` no body — a doc oficial marca como opcional mas a API retorna `"Customer not found"` sem. Confirmado via curl.

O form atual tem só email + senha. Precisamos coletar os dados que a AbacatePay exige (name, cellphone, email, taxId) de forma bonita, sem poluir a página de consulta.

**Decisão:** Manter a página de consulta como está. Quando o usuário clica em "DESBLOQUEAR RELATÓRIO", abre um modal de cadastro estilo Airbnb com todos os campos necessários.

---

## O que será implementado

### 1. Modal de cadastro (RegisterModal)

**Componente:** `src/components/RegisterModal.tsx`

Modal Radix Dialog, fullscreen em mobile, centered em desktop. Design seguindo tokens do projeto (Zilla Slab headings, IBM Plex Mono body, cores --primitive-black/yellow/paper).

**Header:**
- "Crie sua conta em 30 segundos"
- Subtexto: "Seus dados ficam salvos para próximas consultas"
- Botão X para fechar

**Campos (nesta ordem):**
1. **Nome completo** — `text`, placeholder "João da Silva"
2. **E-mail** — `email`, autoComplete="email"
3. **Celular** — `tel`, máscara `(11) 99999-9999`
4. **CPF/CNPJ do pagante** — `text`, máscara automática (11 chars → CPF, 14 → CNPJ)
5. **Senha** — `password`, "Mínimo 8 caracteres", eye toggle
6. **Confirmar senha** — `password`, eye toggle

**Footer:**
- Botão: "CONTINUAR PARA PAGAMENTO · R$ 29,90"
- Link: "Já possui conta? Faça login" → troca para modo login (só email + senha)
- Texto legal: "Ao continuar, você aceita os Termos de Uso"

**Validação client-side:**
- Todos campos obrigatórios
- Email válido
- CPF/CNPJ válido (usando `isValidCPF`/`isValidCNPJ` de `lib/validators`)
- Senhas iguais
- Senha 8+ caracteres
- Celular 10-11 dígitos

### 2. Consulta page — trocar form inline por modal

**Arquivo:** `src/app/consulta/[term]/page.tsx`

- Remover form inline de email + senha para usuários não-logados
- Botão "DESBLOQUEAR RELATÓRIO · R$ 29,90" abre o RegisterModal
- Para usuários logados: manter botão direto (sem modal), mas precisa ter os customer fields salvos — puxar do User model
- O segundo CTA no bottom ("DESBLOQUEAR AGORA POR R$ 29,90") também abre o modal

### 3. Backend — aceitar e repassar customer fields

**Arquivo:** `src/app/api/auth/register/route.ts`
- Aceitar `name` (já aceita), `cellphone` (novo)
- Salvar `cellphone` no User model (campo já existe)

**Arquivo:** `src/app/api/purchases/route.ts`
- Aceitar novos campos no body: `name`, `cellphone`, `buyerTaxId`
- Repassar para `createCheckout()`

**Arquivo:** `src/lib/payment.ts`
- Atualizar `CreateCheckoutParams` com customer fields opcionais
- Repassar para abacatepay.ts

**Arquivo:** `src/lib/abacatepay.ts`
- Adicionar customer fields ao `CreateCheckoutParams`: `customerName`, `customerEmail`, `customerCellphone`, `customerTaxId`
- Montar `customer` inline no body v1:
  ```ts
  customer: {
    name: params.customerName || 'Cliente EOPIX',
    email: params.customerEmail || 'noreply@eopix.app',
    cellphone: params.customerCellphone || '(00) 00000-0000',
    taxId: params.customerTaxId || '000.000.000-00',
  }
  ```
- Formatar cellphone como `(XX) XXXXX-XXXX` e taxId como `XXX.XXX.XXX-XX` (v1 exige formatação)

### 4. Fluxo completo

```
Usuário não-logado:
  1. Clica "DESBLOQUEAR RELATÓRIO"
  2. Modal abre com campos de cadastro
  3. Preenche e clica "CONTINUAR PARA PAGAMENTO"
  4. Frontend: POST /api/auth/register (name, email, cellphone, password)
  5. Frontend: POST /api/purchases (term, email, name, cellphone, buyerTaxId, termsAccepted)
  6. Backend: createCheckout() com customer fields → AbacatePay v1
  7. Redirect para AbacatePay checkout URL
  8. Pagamento confirmado → webhook → Inngest → relatório

Usuário logado:
  1. Clica "DESBLOQUEAR RELATÓRIO"
  2. Se user tem cellphone salvo → POST /api/purchases direto
  3. Se user NÃO tem cellphone → abre modal simplificado (só cellphone + taxId)
  4. Backend resolve name/email do User, cellphone do form/User
```

---

## Arquivos a criar/modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/RegisterModal.tsx` | **CRIAR** | Modal Radix Dialog com form de cadastro |
| `src/app/consulta/[term]/page.tsx` | EDITAR | Trocar form inline por botão que abre modal |
| `src/lib/abacatepay.ts` | EDITAR | Adicionar customer no body v1 |
| `src/lib/payment.ts` | EDITAR | Repassar customer params |
| `src/app/api/purchases/route.ts` | EDITAR | Aceitar e repassar name, cellphone, buyerTaxId |
| `src/app/api/auth/register/route.ts` | EDITAR | Aceitar cellphone |

---

## Não fazer

- NÃO alterar design/layout da página de consulta
- NÃO migrar para AbacatePay v2 (ficar na v1)
- NÃO criar endpoint separado de customer (usar inline no billing)
- NÃO alterar webhook handler

---

## Verificação

- [ ] tsc clean
- [ ] lint clean
- [ ] vitest pass
- [ ] E2E pass (26/26)
- [ ] Teste manual: modal abre, campos validam, checkout AbacatePay recebe customer correto
- [ ] Teste curl: billing v1 com customer → sucesso
