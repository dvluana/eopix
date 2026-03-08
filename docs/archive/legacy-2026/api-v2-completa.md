# AbacatePay API v2 -- Documentacao Completa

> Extraido de docs.abacatepay.com via Firecrawl em 2026-03-12.
> Limpo e reorganizado para referencia rapida.
> Base URL: `https://api.abacatepay.com/v2`

---

## Sumario

- [1. Introducao / Getting Started](#1-introducao--getting-started)
  - [1.1 O que e a AbacatePay?](#11-o-que-e-a-abacatepay)
  - [1.2 Primeira requisicao](#12-primeira-requisicao)
  - [1.3 Estrutura de resposta padrao](#13-estrutura-de-resposta-padrao)
- [2. Autenticacao (Chaves de API)](#2-autenticacao-chaves-de-api)
  - [2.1 Permissoes](#21-permissoes)
- [3. Dev Mode](#3-dev-mode)
  - [3.1 Cartoes de teste](#31-cartoes-de-teste)
- [4. Producao](#4-producao)
- [5. Produtos](#5-produtos)
  - [5.1 Referencia](#51-referencia)
  - [5.2 Criar produto](#52-criar-produto)
  - [5.3 Listar produtos](#53-listar-produtos)
  - [5.4 Buscar produto](#54-buscar-produto)
- [6. Checkouts (Pagamentos)](#6-checkouts-pagamentos)
  - [6.1 Referencia](#61-referencia)
  - [6.2 Criar checkout](#62-criar-checkout)
  - [6.3 Listar checkouts](#63-listar-checkouts)
  - [6.4 Buscar um checkout](#64-buscar-um-checkout)
- [7. Clientes](#7-clientes)
  - [7.1 Criar cliente](#71-criar-cliente)
  - [7.2 Listar clientes](#72-listar-clientes)
  - [7.3 Deletar cliente](#73-deletar-cliente)
- [8. Webhooks](#8-webhooks)
  - [8.1 Seguranca (Secret + HMAC)](#81-seguranca-secret--hmac)
  - [8.2 Eventos suportados](#82-eventos-suportados)
  - [8.3 Payloads por evento](#83-payloads-por-evento)
  - [8.4 Boas praticas](#84-boas-praticas)
- [9. Checkout Transparente (PIX QR Code)](#9-checkout-transparente-pix-qr-code)
  - [9.1 Referencia](#91-referencia)
  - [9.2 Criar QR Code PIX](#92-criar-qr-code-pix)
  - [9.3 Checar status](#93-checar-status)
  - [9.4 Simular pagamento (dev mode)](#94-simular-pagamento-dev-mode)
- [10. Cupons](#10-cupons)
  - [10.1 Referencia](#101-referencia)
  - [10.2 Criar cupom](#102-criar-cupom)
  - [10.3 Listar cupons](#103-listar-cupons)
  - [10.4 Buscar cupom](#104-buscar-cupom)
  - [10.5 Alternar status (toggle)](#105-alternar-status-toggle)
  - [10.6 Deletar cupom](#106-deletar-cupom)
- [11. Links de Pagamento](#11-links-de-pagamento)
  - [11.1 Referencia](#111-referencia)
  - [11.2 Criar link de pagamento](#112-criar-link-de-pagamento)
  - [11.3 Listar links de pagamento](#113-listar-links-de-pagamento)
  - [11.4 Buscar link de pagamento](#114-buscar-link-de-pagamento)
- [12. Saques (Payouts)](#12-saques-payouts)
  - [12.1 Referencia](#121-referencia)
  - [12.2 Criar saque](#122-criar-saque)
  - [12.3 Buscar saque](#123-buscar-saque)
  - [12.4 Listar saques](#124-listar-saques)
- [13. Glossario](#13-glossario)
- [14. Changelog](#14-changelog)
- [15. Ecossistema (resumo)](#15-ecossistema-resumo)
- [16. AI Skills](#16-ai-skills)

---

## 1. Introducao / Getting Started

### 1.1 O que e a AbacatePay?

A AbacatePay e um gateway de pagamento simples e intuitivo. API baseada em intencao, idempotente e consistente.

Principios:
- **Baseada em intencao**: cada endpoint representa exatamente o que voce le (`POST /checkouts/create`, `GET /checkouts/get`)
- **Idempotente**: execute a mesma requisicao quantas vezes precisar, sem efeitos colaterais
- **Consistente**: respostas sempre no formato `{data, error, success}`

Metodos de pagamento suportados: `PIX` e `CARD`.

### 1.2 Primeira requisicao

Pre-requisitos:
- Conta na AbacatePay
- Chave de API (criada no dashboard)

Exemplo -- criar um Checkout Transparente (PIX):

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/transparents/create \
  --header 'Authorization: Bearer {{API_KEY}}' \
  --header 'Content-Type: application/json' \
  --data '{
    "amount": 1000,
    "method": "PIX_QRCODE"
  }'
```

Resposta:

```json
{
  "error": null,
  "data": {
    "id": "pix_char_cY2F1nwmknGfg2jdRxrkgmgN",
    "amount": 1000,
    "status": "PENDING",
    "devMode": true,
    "method": "PIX_QRCODE",
    "brCode": "0002010121126580014BR.GOV.BCB...",
    "brCodeBase64": "data:image/png;base64...",
    "platformFee": 80,
    "createdAt": "2025-12-08T17:01:48.857Z",
    "updatedAt": "2025-12-08T17:01:48.857Z",
    "expiresAt": "2025-12-09T17:01:48.857Z"
  }
}
```

### 1.3 Estrutura de resposta padrao

Todas as respostas seguem:

```json
{
  "data": { ... },
  "error": null,
  "success": true
}
```

- `success: true` = operacao OK, dados em `data`
- `success: false` = falha, ver `error`

---

## 2. Autenticacao (Chaves de API)

Todas as requisicoes devem incluir a chave de API no header `Authorization`:

```
Authorization: Bearer <abacatepay-api-key>
```

O mesmo endpoint `api.abacatepay.com` e usado para dev e producao. O ambiente e determinado pela chave:
- Chaves de **Dev mode** = transacoes simuladas
- Chaves de **Producao** = transacoes reais

Erro 401 quando:
- Chave nao enviada no header
- Chave incorreta
- Chave revogada

Boas praticas:
- Armazene chaves em variaveis de ambiente
- Nunca publique em repositorios
- Revogue imediatamente chaves vazadas

### 2.1 Permissoes

Cada chave define quais recursos pode acessar. Sem permissao adequada = 403 Forbidden.

| Recurso | Permissoes |
|---|---|
| Checkout | `CHECKOUT:CREATE`, `CHECKOUT:READ`, `CHECKOUT:DELETE` |
| Coupon | `COUPON:CREATE`, `COUPON:READ`, `COUPON:UPDATE`, `COUPON:DELETE` |
| Customer | `CUSTOMER:CREATE`, `CUSTOMER:READ`, `CUSTOMER:DELETE` |
| Product | `PRODUCT:CREATE`, `PRODUCT:READ`, `PRODUCT:DELETE` |
| Store | `STORE:READ`, `STORE:CREATE`, `STORE:DELETE` |
| Withdraw | `WITHDRAW:CREATE`, `WITHDRAW:READ` |
| Connect | `CONNECT:READ`, `CONNECT:CREATE`, `CONNECT:DELETE` |

Excecao: o endpoint de MRR (`/public-mrr/mrr`) e publico.

---

## 3. Dev Mode

Quando voce cria sua conta, ela vem em Dev mode automaticamente:
- Todas as operacoes sao simuladas
- Nenhuma transacao real e processada
- Dados isolados do ambiente de producao

### 3.1 Cartoes de teste

**Cartao aceito (aprovado):**

| Campo | Valor |
|---|---|
| Numero | `4242 4242 4242 4242` |
| Validade | Qualquer data futura (ex: 12/30) |
| CVV | Qualquer 3 ou 4 digitos (ex: 123) |

**Cartoes rejeitados (teste de falha):**
- `4000000000000002`
- `4000000000009995`
- `4000000000000127`
- `4000000000000069`
- `4000000000000101`

Para ir para producao: desative o Dev mode, complete a verificacao da conta, aguarde aprovacao.

---

## 4. Producao

Para realizar vendas reais: complete a verificacao da conta no dashboard e use chaves de producao.

---

## 5. Produtos

Produtos sao itens do catalogo usados nas cobrancas: nome, preco, descricao e opcionalmente ciclo de assinatura.

- **Avulso** = pagamento unico (`cycle` omitido ou `null`)
- **Assinatura** = `cycle`: `WEEKLY`, `MONTHLY`, `SEMIANNUALLY` ou `ANNUALLY`

### 5.1 Referencia

Moeda e sempre `BRL`. Campos obrigatorios: `externalId`, `name`, `price`, `currency`. Opcionais: `description`, `imageUrl`, `cycle`.

### 5.2 Criar produto

`POST https://api.abacatepay.com/v2/products/create`

Permissao: `PRODUCT:CREATE`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `externalId` | string | sim | Identificador unico no seu sistema |
| `name` | string | sim | Nome do produto |
| `price` | number | sim | Preco em centavos (min: 1) |
| `currency` | string | sim | Moeda (sempre `"BRL"`) |
| `description` | string | nao | Descricao do produto |
| `imageUrl` | string\|null | nao | URL da imagem |
| `cycle` | enum\|null | nao | `WEEKLY`, `MONTHLY`, `SEMIANNUALLY`, `ANNUALLY` ou null (avulso) |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/products/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "externalId": "prod-123",
  "name": "Produto Exemplo",
  "price": 10000,
  "currency": "BRL"
}'
```

**Resposta 200:**

```json
{
  "data": {
    "externalId": "prod-123",
    "name": "Produto Exemplo",
    "description": "Descricao do produto",
    "price": 10000,
    "devMode": false,
    "currency": "BRL",
    "createdAt": "2024-11-04T18:38:28.573Z",
    "updatedAt": "2024-11-04T18:38:28.573Z",
    "status": "ACTIVE",
    "id": "prod_abc123xyz",
    "imageUrl": null,
    "cycle": null
  },
  "error": null,
  "success": true
}
```

### 5.3 Listar produtos

`GET https://api.abacatepay.com/v2/products/list`

Permissao: `PRODUCT:READ`

### 5.4 Buscar produto

`GET https://api.abacatepay.com/v2/products/get?id=<product_id>`

Permissao: `PRODUCT:READ`

---

## 6. Checkouts (Pagamentos)

O Checkout e a pagina segura onde o cliente finaliza o pagamento. Voce envia os itens; a API devolve uma URL para redirecionar.

### 6.1 Referencia

O parametro `frequency` define o tipo de cobranca:

| Valor | Descricao |
|---|---|
| `ONE_TIME` | Pagamento unico (padrao). Nao precisa enviar. |
| `MULTIPLE_PAYMENTS` | Link de pagamento (pode ser pago mais de uma vez) |
| `SUBSCRIPTION` | Assinatura recorrente |

### 6.2 Criar checkout

`POST https://api.abacatepay.com/v2/checkouts/create`

Permissao: `CHECKOUT:CREATE`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `items` | object[] | sim | Lista de itens (`id` do produto + `quantity`). Min 1 item. |
| `method` | enum | nao | `PIX` ou `CARD` |
| `returnUrl` | string (URI) | nao | URL de "Voltar" no checkout |
| `completionUrl` | string (URI) | nao | URL apos pagamento concluido |
| `customerId` | string | nao | ID de cliente ja cadastrado (pre-preenche dados) |
| `coupons` | string[] | nao | Lista de cupons aplicaveis (max 50) |
| `externalId` | string | nao | ID da cobranca no seu sistema |
| `metadata` | object | nao | Metadados livres |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/checkouts/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "items": [
    {
      "id": "prod-1234",
      "quantity": 2
    }
  ]
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "bill_abc123xyz",
    "externalId": "pedido-123",
    "url": "https://app.abacatepay.com/pay/bill_abc123xyz",
    "amount": 10000,
    "paidAmount": null,
    "items": [
      { "id": "prod_456", "quantity": 2 }
    ],
    "status": "PENDING",
    "coupons": [],
    "devMode": false,
    "customerId": null,
    "returnUrl": null,
    "completionUrl": null,
    "receiptUrl": null,
    "metadata": {},
    "createdAt": "2024-11-04T18:38:28.573Z",
    "updatedAt": "2024-11-04T18:38:28.573Z"
  },
  "error": null,
  "success": true
}
```

Use a `url` retornada para redirecionar o cliente ao checkout.

### 6.3 Listar checkouts

`GET https://api.abacatepay.com/v2/checkouts/list`

Permissao: `CHECKOUT:READ`

**Query Parameters:**

| Param | Tipo | Descricao |
|---|---|---|
| `after` | string | Cursor para paginas seguintes |
| `before` | string | Cursor para paginas anteriores |
| `limit` | integer | Itens por pagina (1-100, default 100) |
| `id` | string | Filtrar por ID do checkout |
| `externalId` | string | Filtrar por ID no seu sistema |
| `status` | enum | `PENDING`, `EXPIRED`, `CANCELLED`, `PAID`, `REFUNDED` |
| `email` | string | Filtrar por e-mail do cliente |
| `taxId` | string | Filtrar por CPF/CNPJ |

```bash
curl --request GET \
  --url 'https://api.abacatepay.com/v2/checkouts/list?limit=100' \
  --header 'Authorization: Bearer <token>'
```

Resposta inclui `pagination: { hasMore, next, before }`.

### 6.4 Buscar um checkout

`GET https://api.abacatepay.com/v2/checkouts/get?id=<bill_id>`

Permissao: `CHECKOUT:READ`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v2/checkouts/get \
  --header 'Authorization: Bearer <token>'
```

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `id` | string | sim | ID unico do checkout (ex: `"bill_abc123xyz"`) |

---

## 7. Clientes

### 7.1 Criar cliente

`POST https://api.abacatepay.com/v2/customers/create`

Permissao: `CUSTOMER:CREATE`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `name` | string | sim | Nome do cliente |
| `email` | string | sim | E-mail |
| `taxId` | string | sim | CPF ou CNPJ (formatado: `123.456.789-01`) |
| `cellphone` | string | nao | Telefone (formatado: `(11) 4002-8922`) |
| `metadata` | object | nao | Metadados livres |

### 7.2 Listar clientes

`GET https://api.abacatepay.com/v2/customers/list`

Permissao: `CUSTOMER:READ`

### 7.3 Deletar cliente

`POST https://api.abacatepay.com/v2/customers/delete?id=<customer_id>`

Permissao: `CUSTOMER:DELETE`

---

## 8. Webhooks

Webhooks sao notificacoes enviadas pela AbacatePay para o seu sistema quando algo importante acontece (ex: pagamento confirmado).

### 8.1 Seguranca (Secret + HMAC)

**Camada 1 -- Secret na URL:**

Cada webhook tem um secret unico enviado na query string:
```
https://meusite.com/webhook/abacatepay?webhookSecret=SEU_SECRET
```

```js
if (req.query.webhookSecret !== process.env.WEBHOOK_SECRET) {
  return res.status(401).json({ error: "Unauthorized" });
}
```

**Camada 2 -- Assinatura HMAC-SHA256:**

Cada webhook inclui assinatura no header `X-Webhook-Signature`. Verificacao:

```ts
import crypto from "node:crypto";

const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export function verifyAbacateSignature(rawBody: string, signatureFromHeader: string) {
  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");
  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
```

### 8.2 Eventos suportados

Formato geral do payload (v2):

```json
{
  "event": "checkout.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": { ... }
}
```

**Dados sensiveis:** O campo `taxId` (CPF/CNPJ) e mascarado nos payloads (ex: `123.***.***-**`). Para cartao, apenas ultimos 4 digitos e bandeira.

| Evento | Quando e disparado |
|---|---|
| `checkout.completed` | Pagamento de um checkout confirmado |
| `checkout.refunded` | Reembolso de um checkout concluido |
| `checkout.disputed` | Disputa/chargeback aberta em um checkout |
| `payment.completed` | Pagamento confirmado (checkout ou transparente) |
| `payment.refunded` | Reembolso de um pagamento concluido |
| `payment.disputed` | Disputa/chargeback aberta em um pagamento |
| `subscription.completed` | Assinatura criada e ativada |
| `subscription.cancelled` | Assinatura cancelada |
| `subscription.renewed` | Cobranca recorrente paga |
| `transfer.completed` | Transferencia concluida |
| `transfer.failed` | Transferencia falhou |
| `payout.completed` | Saque concluido |
| `payout.failed` | Saque falhou |

### 8.3 Payloads por evento

#### checkout.completed (PIX)

```json
{
  "event": "checkout.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "checkout": {
      "id": "bill_abc123xyz",
      "externalId": "pedido-123",
      "url": "https://app.abacatepay.com/pay/bill_abc123xyz",
      "amount": 10000,
      "paidAmount": 10000,
      "platformFee": 80,
      "frequency": "ONE_TIME",
      "items": [{ "id": "prod_xyz", "quantity": 1 }],
      "status": "PAID",
      "methods": ["PIX"],
      "customerId": "cust_abc123",
      "receiptUrl": "https://app.abacatepay.com/receipt/...",
      "createdAt": "2024-12-06T18:56:15.538Z",
      "updatedAt": "2024-12-06T18:56:20.000Z"
    },
    "customer": {
      "id": "cust_abc123",
      "name": "Joao Silva",
      "email": "joao@exemplo.com",
      "taxId": "123.***.***-**"
    },
    "payerInformation": {
      "method": "PIX",
      "PIX": {
        "name": "Joao Silva",
        "taxId": "123.***.***-**",
        "isSameAsCustomer": true
      }
    }
  }
}
```

#### checkout.refunded / checkout.disputed

Mesmo formato acima, com `"event": "checkout.refunded"` ou `"checkout.disputed"` e campo `"reason"` adicional (ex: `"requested_by_customer"`).

#### payment.completed (PIX)

```json
{
  "event": "payment.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "payment": {
      "id": "char_xyz789",
      "externalId": "pedido-456",
      "amount": 5000,
      "paidAmount": 5000,
      "platformFee": 50,
      "status": "PAID",
      "methods": ["PIX"],
      "receiptUrl": "https://app.abacatepay.com/receipt/...",
      "createdAt": "2024-12-06T19:00:00.000Z",
      "updatedAt": "2024-12-06T19:00:05.000Z"
    },
    "customer": {
      "id": "cust_def456",
      "name": "Maria Santos",
      "email": "maria@exemplo.com",
      "taxId": "12.***.***/0001-**"
    },
    "payerInformation": {
      "method": "PIX",
      "PIX": {
        "name": "Maria Santos",
        "taxId": "12.***.***/0001-**",
        "isSameAsCustomer": true
      }
    }
  }
}
```

#### payment.completed (Cartao)

```json
{
  "event": "payment.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "payment": {
      "id": "char_xyz789",
      "externalId": "pedido-456",
      "amount": 5000,
      "paidAmount": 5000,
      "platformFee": 78,
      "status": "PAID",
      "methods": ["CARD"],
      "receiptUrl": "https://app.abacatepay.com/receipt/...",
      "createdAt": "2024-12-06T19:00:00.000Z",
      "updatedAt": "2024-12-06T19:00:05.000Z"
    },
    "customer": { ... },
    "payerInformation": {
      "method": "CARD",
      "CARD": {
        "number": "1234",
        "brand": "VISA"
      }
    }
  }
}
```

#### subscription.completed

```json
{
  "event": "subscription.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "subscription": {
      "id": "sub_abc123",
      "amount": 2990,
      "currency": "BRL",
      "method": "CARD",
      "status": "ACTIVE",
      "frequency": "MONTHLY",
      "createdAt": "2024-12-06T20:00:00.000Z",
      "updatedAt": "2024-12-06T20:00:05.000Z",
      "canceledAt": null,
      "cancelPolicy": null,
      "cancelledDueTo": null
    },
    "payment": { ... },
    "customer": { ... },
    "payerInformation": { ... }
  }
}
```

#### subscription.cancelled

Mesmo formato, com `status: "CANCELLED"`.

#### transfer.completed / transfer.failed

```json
{
  "event": "transfer.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "transfer": {
      "id": "tran_xxx",
      "externalId": "payout-ext-123",
      "amount": 1000,
      "status": "COMPLETE",
      "method": "PIX",
      "platformFee": 80,
      "receiptUrl": "https://...",
      "createdAt": "...",
      "updatedAt": "...",
      "endToEndIdentifier": "E123..."
    }
  }
}
```

#### payout.completed / payout.failed

```json
{
  "event": "payout.completed",
  "apiVersion": 2,
  "devMode": false,
  "data": {
    "withdraw": {
      "id": "tran_xxx",
      "amount": 1000,
      "status": "COMPLETE",
      "method": "PIX",
      "platformFee": 80,
      "receiptUrl": "https://...",
      "externalId": null,
      "createdAt": "...",
      "updatedAt": "...",
      "endToEndIdentifier": "E123..."
    }
  }
}
```

Nota: `endToEndIdentifier` so aparece em saques concluidos.

#### Quando `customer` esta vazio

Se nao houver cliente vinculado, o objeto `customer` sera `null`.

### 8.4 Boas praticas

- Use HTTPS em todos os webhooks
- Valide o secret e a assinatura HMAC
- Registre cada evento -- processe cada um uma unica vez
- Responda 200 OK somente apos concluir o processamento
- Implemente retentativas com idempotencia
- Nao valide o payload inteiro com Zod (mudancas futuras podem quebrar seu endpoint)

---

## 9. Checkout Transparente (PIX QR Code)

O checkout transparente gera um PIX que o cliente paga sem sair do seu site ou app.

### 9.1 Referencia

Use `/transparents/create`. A API devolve o QR Code em imagem (`brCodeBase64`) e o codigo copia-e-cola (`brCode`).

So `data.amount` e obrigatorio (valor em centavos). O campo `method` hoje e sempre `"PIX"`.

Ideias de uso:
- WhatsApp/Telegram: envie o QR Code ou codigo copia-e-cola
- Checkout proprio: exiba o PIX na sua pagina

### 9.2 Criar QR Code PIX

`POST https://api.abacatepay.com/v2/transparents/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `method` | string | sim | Sempre `"PIX"` |
| `data.amount` | number | sim | Valor em centavos |
| `data.description` | string | nao | Descricao |
| `data.expiresIn` | number | nao | Tempo de expiracao em segundos |
| `data.customer.name` | string | nao | Nome do cliente |
| `data.customer.email` | string | nao | Email |
| `data.customer.taxId` | string | nao | CPF/CNPJ formatado |
| `data.customer.cellphone` | string | nao | Telefone formatado |
| `data.metadata` | object | nao | Metadados livres |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/transparents/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "method": "PIX",
  "data": {
    "amount": 10000,
    "description": "Cobranca PIX no checkout transparente",
    "expiresIn": 3600,
    "customer": {
      "name": "Daniel Lima",
      "email": "daniel_lima@abacatepay.com",
      "taxId": "123.456.789-01",
      "cellphone": "(11) 4002-8922"
    },
    "metadata": {
      "pedidoId": "pedido-123"
    }
  }
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "pix_char_abc123xyz",
    "amount": 10000,
    "status": "PENDING",
    "devMode": false,
    "brCode": "00020160014BR.GOV.BCB.PIX070503***6304ABCD",
    "brCodeBase64": "data:image/png;base64,iVBORw0KG...",
    "platformFee": 100,
    "createdAt": "2024-11-04T18:38:28.573Z",
    "updatedAt": "2024-11-04T18:38:28.573Z",
    "expiresAt": "2024-11-04T19:38:28.573Z",
    "metadata": {
      "pedidoId": "pedido-123"
    }
  },
  "success": true,
  "error": null
}
```

### 9.3 Checar status

`GET https://api.abacatepay.com/v2/transparents/check?id=<pix_char_id>`

Permissao: `CHECKOUT:READ`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v2/transparents/check \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "pix_char_z2rSk6042t1mCKgGgeBpJe1u",
    "status": "PENDING",
    "expiresAt": "2026-03-04T15:48:59.876Z"
  },
  "error": null,
  "success": true
}
```

### 9.4 Simular pagamento (dev mode)

`POST https://api.abacatepay.com/v2/transparents/simulate-payment?id=<pix_char_id>`

Disponivel apenas em dev mode. Simula o pagamento do PIX QR Code.

---

## 10. Cupons

Cupons oferecem desconto percentual ou valor fixo, com limite de uso e contagem de resgates.

### 10.1 Referencia

Campos obrigatorios: `code` (unico), `discount`, `discountKind` (`PERCENTAGE` ou `FIXED`).
Opcionais: `maxRedeems` (-1 = ilimitado), `notes`, `metadata`.

### 10.2 Criar cupom

`POST https://api.abacatepay.com/v2/coupons/create`

Permissao: `COUPON:CREATE`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `code` | string | sim | Identificador unico do cupom |
| `discountKind` | enum | sim | `PERCENTAGE` ou `FIXED` |
| `discount` | number | sim | Valor do desconto |
| `notes` | string | nao | Descricao do cupom |
| `maxRedeems` | number | nao | Limite de uso (-1 = ilimitado, default -1) |
| `metadata` | object | nao | Metadados livres |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/coupons/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "code": "DEYVIN_20",
  "discountKind": "PERCENTAGE",
  "discount": 123,
  "notes": "Cupom de desconto pro meu publico",
  "maxRedeems": -1,
  "metadata": {}
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "DEYVIN_20",
    "discountKind": "PERCENTAGE",
    "discount": 123,
    "status": "ACTIVE",
    "createdAt": "2025-05-25T23:43:25.250Z",
    "updatedAt": "2025-05-25T23:43:25.250Z",
    "notes": "Cupom de desconto pro meu publico",
    "maxRedeems": -1,
    "redeemsCount": 0,
    "devMode": true,
    "metadata": {}
  },
  "error": null,
  "success": true
}
```

### 10.3 Listar cupons

`GET https://api.abacatepay.com/v2/coupons/list`

Permissao: `COUPON:READ`

**Query Parameters:**

| Param | Tipo | Descricao |
|---|---|---|
| `after` | string | Cursor para paginas seguintes |
| `before` | string | Cursor para paginas anteriores |
| `limit` | integer | Itens por pagina (1-100, default 100) |
| `id` | string | Filtrar por ID do cupom |
| `status` | enum | `ACTIVE`, `INACTIVE`, `EXPIRED` |

```bash
curl --request GET \
  --url 'https://api.abacatepay.com/v2/coupons/list?limit=100' \
  --header 'Authorization: Bearer <token>'
```

Resposta inclui `pagination: { hasMore, next, before }`.

### 10.4 Buscar cupom

`GET https://api.abacatepay.com/v2/coupons/get?id=<coupon_id>`

Permissao: `COUPON:READ`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v2/coupons/get \
  --header 'Authorization: Bearer <token>'
```

### 10.5 Alternar status (toggle)

`POST https://api.abacatepay.com/v2/coupons/toggle?id=<coupon_id>`

Permissao: `COUPON:UPDATE`

Alterna o status do cupom (ACTIVE <-> INACTIVE).

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/coupons/toggle \
  --header 'Authorization: Bearer <token>'
```

### 10.6 Deletar cupom

`POST https://api.abacatepay.com/v2/coupons/delete?id=<coupon_id>`

Permissao: `COUPON:DELETE`

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/coupons/delete \
  --header 'Authorization: Bearer <token>'
```

---

## 11. Links de Pagamento

Um link de pagamento e um Checkout que pode ser pago mais de uma vez. Usa `frequency: "MULTIPLE_PAYMENTS"`.

### 11.1 Referencia

Links de pagamento sao cobrancas como qualquer outra. Use `GET /checkouts/get` (por ID) e `GET /checkouts/list` para buscar e listar.

### 11.2 Criar link de pagamento

`POST https://api.abacatepay.com/v2/payment-links/create`

Permissao: `CHECKOUT:CREATE`

Body identico ao de criar checkout, mas com `"frequency": "MULTIPLE_PAYMENTS"` obrigatorio.

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `items` | object[] | sim | Lista de itens (min 1) |
| `frequency` | enum | sim | Deve ser `"MULTIPLE_PAYMENTS"` |
| `method` | enum | nao | `PIX` ou `CARD` |
| `returnUrl` | string (URI) | nao | URL de retorno |
| `completionUrl` | string (URI) | nao | URL apos pagamento |
| `coupons` | string[] | nao | Cupons aplicaveis (max 50) |
| `externalId` | string | nao | ID no seu sistema |
| `metadata` | object | nao | Metadados livres |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/payment-links/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "frequency": "MULTIPLE_PAYMENTS",
  "items": [
    { "id": "prod-1234", "quantity": 2 }
  ]
}'
```

### 11.3 Listar links de pagamento

`GET https://api.abacatepay.com/v2/payment-links/list`

Permissao: `CHECKOUT:READ`

**Query Parameters:**

| Param | Tipo | Descricao |
|---|---|---|
| `after` | string | Cursor para paginas seguintes |
| `before` | string | Cursor para paginas anteriores |
| `limit` | integer | Itens por pagina (1-100, default 100) |
| `id` | string | Filtrar por ID |
| `externalId` | string | Filtrar por ID no seu sistema |
| `status` | enum | `PENDING`, `EXPIRED`, `CANCELLED`, `PAID`, `REFUNDED` |

### 11.4 Buscar link de pagamento

`GET https://api.abacatepay.com/v2/payment-links/get?id=<bill_id>`

Permissao: `CHECKOUT:READ`

Para links de pagamento, o campo `frequency` vira como `MULTIPLE_PAYMENTS`.

---

## 12. Saques (Payouts)

Com payouts voce saca o saldo da conta de forma automatizada para uma chave PIX de sua titularidade.

### 12.1 Referencia

**Modelo Payout:**

| Atributo | Tipo | Descricao |
|---|---|---|
| `id` | string | ID unico da transacao |
| `status` | string | `PENDING`, `EXPIRED`, `CANCELLED`, `COMPLETE`, `REFUNDED` |
| `devMode` | boolean | `true` se criado em sandbox |
| `receiptUrl` | string\|null | URL do comprovante (disponivel quando `COMPLETE`) |
| `amount` | number | Valor em centavos |
| `platformFee` | number | Taxa da plataforma em centavos |
| `externalId` | string | ID no seu sistema |
| `createdAt` | string | ISO 8601 |
| `updatedAt` | string | ISO 8601 |

**Limites e taxas:**
- Minimo: R$ 3,50 (350 centavos)
- Taxa: R$ 0,80 por saque
- Processamento: instantaneo, 24/7
- Limite: 1 saque por minuto (excesso = HTTP 429)

### 12.2 Criar saque

`POST https://api.abacatepay.com/v2/payouts/create`

Permissao: `WITHDRAW:CREATE`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `amount` | number | sim | Valor em centavos (min 350) |
| `externalId` | string | sim | ID unico no seu sistema |
| `description` | string | nao | Descricao do saque |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v2/payouts/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "amount": 10000,
  "externalId": "saque-123"
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "txn_abc123xyz",
    "status": "PENDING",
    "devMode": false,
    "receiptUrl": null,
    "amount": 10000,
    "platformFee": 100,
    "externalId": "saque-123",
    "createdAt": "2024-11-04T18:38:28.573Z",
    "updatedAt": "2024-11-04T18:38:28.573Z"
  },
  "error": null,
  "success": true
}
```

### 12.3 Buscar saque

`GET https://api.abacatepay.com/v2/payouts/get?externalId=<external_id>`

Permissao: `WITHDRAW:READ`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v2/payouts/get \
  --header 'Authorization: Bearer <token>'
```

### 12.4 Listar saques

`GET https://api.abacatepay.com/v2/payouts/list`

Permissao: `WITHDRAW:READ`

**Query Parameters:**

| Param | Tipo | Descricao |
|---|---|---|
| `after` | string | Cursor para paginas seguintes |
| `before` | string | Cursor para paginas anteriores |
| `limit` | integer | Itens por pagina (1-100, default 100) |
| `id` | string | Filtrar por ID da transacao |
| `externalId` | string | Filtrar por ID no seu sistema |
| `status` | enum | `PENDING`, `EXPIRED`, `CANCELLED`, `COMPLETE`, `REFUNDED` |

```bash
curl --request GET \
  --url 'https://api.abacatepay.com/v2/payouts/list?limit=100' \
  --header 'Authorization: Bearer <token>'
```

---

## 13. Glossario

### Autenticacao e Seguranca

- **Bearer Token**: Chave de API enviada no header `Authorization: Bearer {{API_KEY}}`
- **Webhook Secret**: String unica na query string do webhook para validacao

### Ambientes

- **Dev Mode**: Transacoes simuladas, sem cobranca real
- **Sandbox**: Sinonimo de Dev Mode (determinado pela chave de API)
- **Producao**: Transacoes reais, requer conta verificada

### Pagamentos e Cobrancas

- **Checkout**: Pagina segura para pagamento. Integrado (URL da AbacatePay) ou Transparente (QR Code PIX no seu site)
- **Gateway de Pagamento**: Plataforma intermediaria de pagamentos
- **Payout**: Saque/transferencia da conta AbacatePay para conta externa

### Estrutura de Dados

- **External ID**: Identificador no seu sistema (ex: `"pedido-12345"`)
- **Metadata**: Objeto JSON livre para dados adicionais

### Assinaturas

- **Subscription**: Cobranca recorrente automatica
- **Cycle**: Frequencia -- `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`
- **Retry Policy**: `maxRetry` (1-10 tentativas), `retryEvery` (1-30 dias entre tentativas)

### Cupons

- **Discount Kind**: `PERCENTAGE` (%) ou `FIXED` (valor fixo em centavos)
- **Max Redeems**: Limite de uso (-1 = ilimitado)

### Status

**Cobranca:** `PENDING` | `PAID` | `CANCELLED` | `EXPIRED`

**Assinatura:** `PENDING` | `ACTIVE` | `CANCELLED` | `EXPIRED` | `FAILED`

### PIX

- **QRCode PIX**: Retornado como imagem Base64 (`brCodeBase64`) ou codigo copia-e-cola (`brCode`)
- **BR Code**: String alfanumerica do padrao PIX

### URLs

- **Return URL**: Redirecionamento ao clicar "Voltar" no checkout
- **Completion URL**: Redirecionamento apos pagamento concluido
- **Receipt URL**: Comprovante de pagamento (gerado pela AbacatePay)

### Estrutura de Resposta

```json
{ "data": { ... }, "error": null, "success": true }
```

---

## 14. Changelog

### 6 de Mar, 2026 -- Nova versao da API

A API v2 esta em beta e passa a ser o novo padrao oficial. Todas as features novas (Checkout Transparente, Cartao de credito, Assinatura) estarao disponiveis somente na API v2.

- v2 disponivel para clientes selecionados durante beta
- v1 e v2 podem coexistir em paralelo
- v1 sera mantida ate 1 de marco de 2028

Para consultar documentacao v1 durante migracao: selecione versao v1 no seletor de versoes.

---

## 15. Ecossistema (resumo)

Projetos oficiais e da comunidade que expandem a integracao com AbacatePay.

### Projetos Oficiais

| Pacote | Descricao |
|---|---|
| `@abacatepay/sdk` | SDK Node.js oficial de alto nivel |
| `@abacatepay/rest` | Cliente REST tipado, leve, zero dependencias |
| `@abacatepay/types` | Tipagens TypeScript oficiais |
| `@abacatepay/typebox` | Schemas TypeBox para validacao runtime + OpenAPI |
| `@abacatepay/zod` | Schemas Zod para validacao runtime + OpenAPI |
| `@abacatepay/eslint-plugin` | ESLint plugin para prevenir vazamento de API keys |
| `abacatepay/go-types` | Structs Go oficiais |
| AbacatePay CLI | Ferramenta de linha de comando |
| AbacatePay Theme | Tema para VS Code, JetBrains, Neovim |
| AbacatePay Skills | Contexto para agentes de IA |

### Convencoes de nomenclatura (tipos/schemas)

- Prefixo `API*`: Estruturas gerais, objetos retornados, modelos publicos
- Prefixo `REST<HTTPMethod>*`: Body, QueryParams, Data de endpoints REST
- Prefixo `Webhook*`: Payloads de eventos de webhook

### @abacatepay/rest -- uso basico

```ts
import { REST } from '@abacatepay/rest';

const client = new REST({
  secret: process.env.ABACATEPAY_API_KEY!,
});

const pix = await client.post('/transparents/simulate-payment', {
  query: { id: 'pix_char_123456' },
});
```

Suporta: retry (3 tentativas padrao), backoff exponencial com jitter, custom fetch, rate limit hooks, versionamento (`version: 1` ou `version: 2`).

### @abacatepay/eslint-plugin

Regra `abacatepay/no-secret-key` -- impede chaves hardcoded no codigo:

```js
import abacatepay from '@abacatepay/eslint-plugin';

export default [
  {
    plugins: { abacatepay },
    rules: { 'abacatepay/no-secret-key': 'error' },
  },
];
```

---

## 16. AI Skills

A AbacatePay Skills e um conjunto de conhecimentos estruturados para agentes de IA integrarem com o ecossistema AbacatePay.

Instalacao: `git clone https://github.com/abacatepay/skills` e adicione ao contexto da IA.

Estrutura do repositorio:
- `tests/` -- suites de teste
- `tools/` -- documentacao de SDKs e clientes
- `examples/` -- implementacoes prontas
- `rules/` -- regras por linguagem (TypeScript / Go) e modulo

Referencia completa: [SKILL.md](https://github.com/AbacatePay/skills/blob/main/SKILL.md)

---

**Contato:** ajuda@abacatepay.com
