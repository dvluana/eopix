# Contexto: Migração AbacatePay v1 → v2

> **Data:** 2026-03-12
> **Status:** Investigação em andamento, nenhum código alterado ainda
> **Branch:** develop

---

## Problema

O código atual (`src/lib/abacatepay.ts`) usa a **API v1** (`POST /v1/billing/create`) e cria um **produto inline a cada compra**:

```ts
// abacatepay.ts linhas 96-116 — FLUXO ATUAL (ERRADO)
const body = {
  frequency: 'ONE_TIME',
  methods: ['PIX'],
  products: [
    {
      externalId: 'relatorio-risco',
      name: 'Relatório de Risco CPF/CNPJ',
      quantity: 1,
      price: priceCents,  // 2990
    },
  ],
  externalId: params.externalRef,  // purchase code
  returnUrl: params.cancelUrl,
  completionUrl: params.successUrl,
  customer: { name, cellphone, email, taxId },
}

const res = await fetch('https://api.abacatepay.com/v1/billing/create', ...)
```

Isso cria um produto novo no dashboard AbacatePay a cada compra. EOPIX tem **um único produto** (Relatório de Risco, R$29,90). Não faz sentido criar duplicatas.

### Histórico do problema

1. Claude anterior tentou passar `{ id: "prod_xxx" }` no endpoint **v1** (`/v1/billing/create`)
2. A v1 **não aceita referenciar produto existente** — retornou erro 500
3. A "solução" foi reverter para produto inline (criar novo a cada vez)
4. Registrado no status.md como: "Hotfix AbacatePay produto inline — API não aceita `{ id }` no request"
5. Claude declarou que "a API é assim mesmo" — **ERRADO**, o problema era usar v1 em vez de v2

### O que a Luana já fez

- Criou o produto **manualmente no dashboard** da AbacatePay (via browser)
- Produto já existe na conta AbacatePay com nome, preço, etc.
- Precisa apenas referenciar esse produto no checkout, não criar toda vez

---

## API v2 — Fluxo correto (confirmado via docs oficiais)

A AbacatePay tem **API v2** com endpoints separados para produtos e checkouts.

### 1. Produtos (`/v2/products/*`)

Produto é criado **uma vez** (via API ou dashboard) e reutilizado em checkouts.

**Criar produto** (`POST /v2/products/create`):
```json
{
  "externalId": "relatorio-risco",    // ID no seu sistema (obrigatório, único)
  "name": "Relatório de Risco CPF/CNPJ",
  "price": 2990,                      // centavos (obrigatório)
  "currency": "BRL",                  // obrigatório
  "description": "...",               // opcional
  "imageUrl": null,                   // opcional
  "cycle": null                       // null = avulso (pagamento único)
}
```

**Resposta:**
```json
{
  "data": {
    "id": "prod_abc123xyz",           // ← ESTE é o ID para usar no checkout
    "externalId": "relatorio-risco",
    "name": "Relatório de Risco CPF/CNPJ",
    "price": 2990,
    "currency": "BRL",
    "status": "ACTIVE",
    "cycle": null,
    "devMode": false,
    "imageUrl": null,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "success": true,
  "error": null
}
```

**Listar produtos** (`GET /v2/products/list`):
- Query params: `after`, `before`, `limit` (1-100), `id`, `externalId`, `status` (ACTIVE/INACTIVE)
- Retorna array `data[]` com paginação cursor-based

**Buscar produto** (`GET /v2/products/get`):
- Query params: `id` ou `externalId`

### 2. Checkouts (`/v2/checkouts/create`)

Checkout referencia produtos existentes pelo `id`.

**Criar checkout** (`POST /v2/checkouts/create`):
```json
{
  "items": [                          // obrigatório — ÚNICO campo obrigatório
    {
      "id": "prod_abc123xyz",         // ID do produto (de /v2/products/create ou dashboard)
      "quantity": 1
    }
  ],
  "method": "PIX",                    // opcional: PIX ou CARD
  "externalId": "PURCHASE_CODE",      // opcional: ID no seu sistema
  "completionUrl": "https://...",     // opcional: redirect após pagamento
  "returnUrl": "https://...",         // opcional: botão "Voltar"
  "customerId": "cust_xxx",          // opcional: pré-preencher dados do cliente
  "coupons": ["ABKT10"],             // opcional: cupons permitidos
  "metadata": { "key": "value" }     // opcional: dados livres
}
```

**Resposta:**
```json
{
  "data": {
    "id": "bill_abc123xyz",
    "externalId": "PURCHASE_CODE",
    "url": "https://app.abacatepay.com/pay/bill_abc123xyz",  // ← redirecionar cliente
    "amount": 2990,
    "paidAmount": null,
    "items": [{ "id": "prod_456", "quantity": 1 }],
    "status": "PENDING",
    "devMode": false,
    "customerId": null,
    "returnUrl": null,
    "completionUrl": null,
    "receiptUrl": null,
    "metadata": {},
    "coupons": [],
    "createdAt": "...",
    "updatedAt": "..."
  },
  "success": true,
  "error": null
}
```

### 3. Clientes (`/v2/client/*` ou `/v1/customer/*`)

**Criar cliente** (`POST /v1/customer/create` ou `/v2` equivalente):
- Campos: `name` (obrigatório), `cellphone` (obrigatório), `email` (obrigatório), `taxId` (obrigatório)
- Se `taxId` já existe, retorna o cliente existente (não duplica)
- Retorna `id` tipo `cust_xxx` — usar como `customerId` no checkout

### 4. Webhooks

Webhooks funcionam **igual em v1 e v2**:
- Evento: `billing.paid`
- Validação: Secret na URL + HMAC-SHA256 no header `X-Webhook-Signature`
- Payload contém `data.billing.id`, `data.billing.products`, `data.billing.customer`
- **Não precisa mudar o webhook handler** na migração v1→v2

---

## O que precisa mudar no código

### Arquivo: `src/lib/abacatepay.ts`

1. **Trocar endpoint**: `/v1/billing/create` → `/v2/checkouts/create`
2. **Trocar body**: produto inline → `items: [{ id: PRODUCT_ID, quantity: 1 }]`
3. **Product ID**: Buscar via `GET /v2/products/get?externalId=relatorio-risco` ou usar env var `ABACATEPAY_PRODUCT_ID`
4. **Customer**: Opcionalmente criar via `/v1/customer/create` e passar `customerId`

### Arquivo: `docs/abacatepay-api.md`

- Completamente desatualizado (documenta apenas v1)
- Precisa ser reescrito com API v2
- Base URL v2: `https://api.abacatepay.com/v2`
- Manter referência v1 apenas para webhooks (se necessário)

### Webhook handler: `src/app/api/webhooks/abacatepay/route.ts`

- **Provavelmente não precisa mudar** — payload do webhook é o mesmo
- Verificar se o campo `billing.externalId` continua sendo usado para encontrar a Purchase

---

## Documentação oficial (URLs para referência)

| Seção | URL | Versão |
|---|---|---|
| Intro v2 | https://docs.abacatepay.com/pages/start/introduction | v2 |
| Quickstart | https://docs.abacatepay.com/pages/start/quickstart | v2 |
| Produtos ref | https://docs.abacatepay.com/pages/products/reference | v2 |
| Criar produto | https://docs.abacatepay.com/pages/products/create | v2 |
| Checkout ref | https://docs.abacatepay.com/pages/payment/reference | v2 |
| Criar checkout | https://docs.abacatepay.com/pages/payment/create | v2 |
| Criar cliente | https://docs.abacatepay.com/pages/client/create | v2 |
| Listar clientes | https://docs.abacatepay.com/pages/client/list | v2 |
| Webhooks v2 | https://docs.abacatepay.com/pages/webhooks | v2 |
| Webhooks v1 | https://docs.abacatepay.com/pages/v1/webhooks | v1 |
| Intro v1 (legacy) | https://docs.abacatepay.com/pages/v1/introduction | v1 |
| Dev mode | https://docs.abacatepay.com/pages/devmode | - |

**Nota:** `/api-reference/*` = endpoints v1 (legacy). `/pages/*` = endpoints v2 (atuais).

---

## Próximos passos

1. **Scrape completo da API v2** — Páginas de webhooks v2, clientes v2, quickstart ainda não foram lidas
2. **Confirmar product ID** — Listar produtos no dashboard ou via `GET /v2/products/list` para pegar o `id` do produto já criado pela Luana
3. **Verificar compatibilidade do webhook** — O payload de `billing.paid` na v2 pode ter mudanças vs v1
4. **Reescrever `abacatepay.ts`** — v1 → v2, produto inline → referência por ID
5. **Reescrever `docs/abacatepay-api.md`** — Documentar API v2 completa
6. **Testar em sandbox** — `npm run dev:live` com credenciais dev (`abc_dev_*`)

---

## Decisões pendentes

- Buscar product ID na inicialização via API (`GET /v2/products/get?externalId=relatorio-risco`) ou usar env var `ABACATEPAY_PRODUCT_ID`?
- Criar customer antes do checkout via API ou deixar o checkout coletar os dados?
- SDK (`abacatepay-nodejs-sdk`) suporta v2 ou continuar com fetch direto?
