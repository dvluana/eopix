# Design: Migração AbacatePay v2

**Data:** 2026-03-17
**Branch:** develop
**Escopo:** Adicionar CARD, corrigir deduplicação de produto, ajustar webhook lookup

---

## Problema

1. **Produto duplicado por compra:** `externalId` da billing usa o código único da purchase (`params.externalRef`), criando um novo produto no AbacatePay a cada compra.
2. **Só PIX:** `methods: ['PIX']` — CARD não está habilitado.
3. **Webhook lookup frágil:** caminho primário usa `products[0].externalId` para encontrar a purchase. Com externalId fixo, esse caminho deixa de funcionar.
4. **`paymentExternalId` guarda checkout URL:** dificulta lookup do billing no webhook.

---

## Solução

### Arquivos afetados (4)

#### 1. `src/lib/abacatepay.ts`
- `methods: ['PIX']` → `['PIX', 'CARD']`
- `externalId: params.externalRef` → `'relatorio-risco'` (fixo — AbacatePay deduplica por externalId)
- Sem mudança de endpoint (continua `/v1/billing/create`) nem de estrutura de resposta

#### 2. `src/app/api/purchases/route.ts`
- Ao criar billing: salva `sessionId` (billingId `bill_XXX`) em `paymentExternalId` em vez de `checkoutUrl`
- Reuso PENDING: chama `GET /v1/billing/get?id={paymentExternalId}` para recuperar a URL (1 call extra, caso raro)

#### 3. `src/app/api/webhooks/abacatepay/route.ts`
- Caminho **primário**: busca purchase por `paymentExternalId = billingId` (move o fallback atual para cima)
- Caminho **fallback**: `products[0].externalId` — mantido para purchases antigas (externalId era o purchase code)
- Sem mudança no evento (`billing.paid` continua igual)

#### 4. `docs/external/abacatepay/api-v2-condensed.md`
- Substituir pelo contrato correto da v2 (atual)

---

## O que NÃO muda

- URL base: `/v1/billing/create` (sem mudança)
- Evento webhook: `billing.paid` (sem mudança)
- Payload webhook: `data.billing.*` (sem mudança)
- Customer inline: continua funcionando (AbacatePay deduplica por taxId automaticamente)
- Schema Prisma: nenhuma migration necessária
- Modos MOCK/TEST/BYPASS: sem alteração

---

## Fluxo de teste

Usar credenciais de teste existentes no `.env.local` (`ABACATEPAY_API_KEY=abc_dev_*`).
Validar:
1. Billing criada com `methods: ["PIX", "CARD"]`
2. `paymentExternalId` da purchase = billingId (não mais a URL)
3. Reuso PENDING recupera URL via `GET /v1/billing/get`
4. Webhook `billing.paid` encontra purchase pelo billingId corretamente
5. Segundo checkout com mesmo CPF/CNPJ reutiliza produto (não cria novo)
