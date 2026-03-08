# AbacatePay API v1 -- Documentacao Completa

> Extraido de docs.abacatepay.com via Firecrawl em 2026-03-07.
> Limpo e reorganizado para referencia rapida.
> Base URL: `https://api.abacatepay.com/v1`

---

## Sumario

- [1. Introducao](#1-introducao)
  - [1.1 O que e a API v1?](#11-o-que-e-a-api-v1)
  - [1.2 Diferencas em relacao a v2](#12-diferencas-em-relacao-a-v2)
  - [1.3 Estrutura de resposta padrao](#13-estrutura-de-resposta-padrao)
- [2. Autenticacao](#2-autenticacao)
- [3. Clientes](#3-clientes)
  - [3.1 Criar cliente](#31-criar-cliente)
  - [3.2 Listar clientes](#32-listar-clientes)
- [4. Cupons](#4-cupons)
  - [4.1 Criar cupom](#41-criar-cupom)
  - [4.2 Listar cupons](#42-listar-cupons)
- [5. Cobrancas (Billing)](#5-cobrancas-billing)
  - [5.1 Criar cobranca](#51-criar-cobranca)
  - [5.2 Listar cobrancas](#52-listar-cobrancas)
- [6. PIX QR Code (Checkout Transparente)](#6-pix-qr-code-checkout-transparente)
  - [6.1 Criar QRCode PIX](#61-criar-qrcode-pix)
  - [6.2 Checar status](#62-checar-status)
  - [6.3 Simular pagamento (dev mode)](#63-simular-pagamento-dev-mode)
- [7. Saques (Withdraw)](#7-saques-withdraw)
  - [7.1 Criar saque](#71-criar-saque)
  - [7.2 Buscar saque](#72-buscar-saque)
  - [7.3 Listar saques](#73-listar-saques)
- [8. Loja (Store)](#8-loja-store)
  - [8.1 Obter detalhes da loja](#81-obter-detalhes-da-loja)
- [9. MRR](#9-mrr)
  - [9.1 Obter MRR](#91-obter-mrr)
- [10. Webhooks (v1)](#10-webhooks-v1)
  - [10.1 Estrutura geral do payload](#101-estrutura-geral-do-payload)
  - [10.2 Seguranca](#102-seguranca)
  - [10.3 Eventos suportados](#103-eventos-suportados)
  - [10.4 Exemplo billing.paid](#104-exemplo-billingpaid)
  - [10.5 Boas praticas](#105-boas-praticas)
- [11. Mapeamento v1 → v2](#11-mapeamento-v1--v2)

---

## 1. Introducao

### 1.1 O que e a API v1?

A API v1 foi a primeira versao publica da AbacatePay. Ela continua disponivel para projetos legados, mas **toda a evolucao da plataforma acontece na v2**.

Principios (compartilhados com v2):
- Cobrancas baseadas em **intencao**
- Checkout de pagamento via URL compartilhavel
- Suporte a **PIX** (e, em alguns casos, cartao)
- Webhooks para manter seu sistema sincronizado

### 1.2 Diferencas em relacao a v2

| Aspecto | v1 | v2 |
|---|---|---|
| Base URL | `https://api.abacatepay.com/v1` | `https://api.abacatepay.com/v2` |
| Cobranca (billing) | `/billing/create`, `/billing/list` | `/checkouts/create`, `/checkouts/list`, `/checkouts/get` |
| Produtos | Inline no billing (`products[]` com `externalId`, `name`, `price`) | Criados separadamente (`/products/create`), referenciados por `id` |
| Clientes | `/customer/create`, `/customer/list` | `/customers/create`, `/customers/list`, `/customers/delete` |
| Cupons | `/coupon/create`, `/coupon/list` | `/coupons/create`, `/coupons/list`, `/coupons/get`, `/coupons/toggle`, `/coupons/delete` |
| PIX QR Code | `/pixQrCode/create`, `/pixQrCode/check` | `/transparents/create`, `/transparents/check` |
| Saques | `/withdraw/create`, `/withdraw/get`, `/withdraw/list` | `/payouts/create`, `/payouts/get`, `/payouts/list` |
| Webhook evento | `billing.paid` | `checkout.completed` |
| Webhook payload | Sem `apiVersion` | Inclui `apiVersion: 2` |
| Resposta | `{ data, error }` | `{ data, error, success }` |
| Deprecacao | Mantida ate 2028-03-01 | Padrao atual |

### 1.3 Estrutura de resposta padrao

```json
{
  "data": { ... },
  "error": null
}
```

- `error: null` = operacao OK, dados em `data`
- `error: "mensagem"` = falha

**Nota:** A v1 nao inclui o campo `success` presente na v2.

---

## 2. Autenticacao

Todas as requisicoes devem incluir a chave de API no header `Authorization`:

```
Authorization: Bearer <abacatepay-api-key>
```

O mesmo endpoint `api.abacatepay.com` e usado para dev e producao. O ambiente e determinado pela chave:
- Chaves de **Dev mode** = transacoes simuladas
- Chaves de **Producao** = transacoes reais

Erro 401 quando chave ausente, incorreta ou revogada.

---

## 3. Clientes

### 3.1 Criar cliente

`POST https://api.abacatepay.com/v1/customer/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `name` | string | sim | Nome completo do cliente |
| `cellphone` | string | sim | Celular do cliente |
| `email` | string | sim | E-mail do cliente |
| `taxId` | string | sim | CPF ou CNPJ valido (formatado: `123.456.789-01`) |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v1/customer/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "name": "Daniel Lima",
  "cellphone": "(11) 4002-8922",
  "email": "daniel_lima@abacatepay.com",
  "taxId": "123.456.789-01"
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "bill_123456",
    "metadata": {
      "name": "Daniel Lima",
      "cellphone": "(11) 4002-8922",
      "email": "daniel_lima@abacatepay.com",
      "taxId": "123.456.789-01"
    }
  },
  "error": null
}
```

**Nota:** Na v1, os dados do cliente ficam dentro de `metadata`. Na v2, ficam no nivel raiz.

### 3.2 Listar clientes

`GET https://api.abacatepay.com/v1/customer/list`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/customer/list \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "bill_123456",
      "metadata": {
        "name": "Daniel Lima",
        "cellphone": "(11) 4002-8922",
        "email": "daniel_lima@abacatepay.com",
        "taxId": "123.456.789-01"
      }
    }
  ],
  "error": null
}
```

---

## 4. Cupons

### 4.1 Criar cupom

`POST https://api.abacatepay.com/v1/coupon/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `code` | string | sim | Identificador unico do cupom |
| `notes` | string | sim | Descricao do cupom |
| `discountKind` | enum | sim | `PERCENTAGE` ou `FIXED` |
| `discount` | number | sim | Valor de desconto |
| `maxRedeems` | number | nao | Limite de uso (-1 = ilimitado, default -1) |
| `metadata` | object | nao | Metadados livres |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v1/coupon/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "code": "DEYVIN_20",
  "notes": "Cupom de desconto pro meu publico",
  "discountKind": "PERCENTAGE",
  "discount": 123,
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
  "error": null
}
```

### 4.2 Listar cupons

`GET https://api.abacatepay.com/v1/coupon/list`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/coupon/list \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": [
    {
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
    }
  ],
  "error": null
}
```

---

## 5. Cobrancas (Billing)

Na v1, cobrancas sao chamadas de "billing". Na v2, foram renomeadas para "checkouts".

### 5.1 Criar cobranca

`POST https://api.abacatepay.com/v1/billing/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `frequency` | enum | sim | `ONE_TIME` ou `MULTIPLE_PAYMENTS` |
| `methods` | enum[] | sim | `["PIX"]`, `["CARD"]` ou `["PIX", "CARD"]` (1-2 elementos) |
| `products` | object[] | sim | Lista de produtos inline (min 1) |
| `products[].externalId` | string | sim | ID do produto no seu sistema |
| `products[].name` | string | sim | Nome do produto |
| `products[].description` | string | nao | Descricao do produto |
| `products[].quantity` | number | sim | Quantidade |
| `products[].price` | number | sim | Preco em centavos |
| `returnUrl` | string (URI) | sim | URL para redirecionar ao clicar "Voltar" |
| `completionUrl` | string (URI) | sim | URL apos pagamento concluido |
| `customerId` | string | nao | ID de cliente ja cadastrado |
| `customer` | object | nao | Dados do cliente (cria se nao existir) |
| `customer.name` | string | sim* | Nome completo |
| `customer.cellphone` | string | sim* | Celular |
| `customer.email` | string | sim* | E-mail |
| `customer.taxId` | string | sim* | CPF/CNPJ |
| `allowCoupons` | boolean | nao | Se cupons podem ser usados (default false) |
| `coupons` | string[] | nao | Lista de cupons disponiveis (max 50) |
| `externalId` | string | nao | ID da cobranca no seu sistema |
| `metadata` | object | nao | Metadados livres |

*Obrigatorios quando `customer` e informado.

```bash
curl --request POST \
  --url https://api.abacatepay.com/v1/billing/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "frequency": "ONE_TIME",
  "methods": ["PIX", "CARD"],
  "products": [
    {
      "externalId": "prod-1234",
      "name": "Assinatura de Programa Fitness",
      "description": "Acesso ao programa fitness premium por 1 mes.",
      "quantity": 2,
      "price": 2000
    }
  ],
  "returnUrl": "https://example.com/billing",
  "completionUrl": "https://example.com/completion",
  "customer": {
    "name": "Daniel Lima",
    "cellphone": "(11) 4002-8922",
    "email": "daniel_lima@abacatepay.com",
    "taxId": "123.456.789-01"
  }
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "bill_123456",
    "url": "https://pay.abacatepay.com/bill-5678",
    "status": "PENDING",
    "devMode": true,
    "methods": ["PIX", "CARD"],
    "products": [
      {
        "id": "prod_123456",
        "externalId": "prod-1234",
        "quantity": 2
      }
    ],
    "frequency": "ONE_TIME",
    "amount": 4000,
    "nextBilling": "null",
    "customer": {
      "id": "bill_123456",
      "metadata": {
        "name": "Daniel Lima",
        "cellphone": "(11) 4002-8922",
        "email": "daniel_lima@abacatepay.com",
        "taxId": "123.456.789-01"
      }
    },
    "allowCoupons": false,
    "coupons": []
  },
  "error": null
}
```

Use a `url` retornada para redirecionar o cliente ao checkout.

**Diferencas importantes da v2:**
- v1: produtos sao enviados **inline** no body (com `externalId`, `name`, `price`)
- v2: produtos sao criados **separadamente** e referenciados por `id`
- v1: `methods` e array (ex: `["PIX", "CARD"]`)
- v2: `method` e string unica (ex: `"PIX"`)
- v1: `returnUrl` e `completionUrl` sao obrigatorios
- v2: ambos sao opcionais

### 5.2 Listar cobrancas

`GET https://api.abacatepay.com/v1/billing/list`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/billing/list \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "bill_123456",
      "url": "https://pay.abacatepay.com/bill-5678",
      "status": "PENDING",
      "devMode": true,
      "methods": ["PIX", "CARD"],
      "products": [
        {
          "id": "prod_123456",
          "externalId": "prod-1234",
          "quantity": 2
        }
      ],
      "frequency": "ONE_TIME",
      "amount": 4000,
      "nextBilling": "null",
      "customer": {
        "id": "bill_123456",
        "metadata": {
          "name": "Daniel Lima",
          "cellphone": "(11) 4002-8922",
          "email": "daniel_lima@abacatepay.com",
          "taxId": "123.456.789-01"
        }
      },
      "allowCoupons": false,
      "coupons": []
    }
  ],
  "error": null
}
```

---

## 6. PIX QR Code (Checkout Transparente)

O checkout transparente gera um PIX que o cliente paga sem sair do seu site ou app.

### 6.1 Criar QRCode PIX

`POST https://api.abacatepay.com/v1/pixQrCode/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `amount` | number | sim | Valor da cobranca em centavos |
| `expiresIn` | number | nao | Tempo de expiracao em segundos |
| `description` | string | nao | Mensagem no pagamento PIX (max 37 chars) |
| `customer` | object | nao | Dados do cliente (se informar, todos os campos sao obrigatorios) |
| `customer.name` | string | sim* | Nome completo |
| `customer.cellphone` | string | sim* | Celular |
| `customer.email` | string | sim* | E-mail |
| `customer.taxId` | string | sim* | CPF/CNPJ |
| `metadata` | object | nao | Metadados livres |

*Obrigatorios quando `customer` e informado.

```bash
curl --request POST \
  --url https://api.abacatepay.com/v1/pixQrCode/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "amount": 10000,
  "expiresIn": 3600,
  "description": "Cobranca PIX",
  "customer": {
    "name": "Daniel Lima",
    "cellphone": "(11) 4002-8922",
    "email": "daniel_lima@abacatepay.com",
    "taxId": "123.456.789-01"
  },
  "metadata": {
    "externalId": "123"
  }
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "pix_char_123456",
    "amount": 100,
    "status": "PENDING",
    "devMode": true,
    "brCode": "00020101021226950014br.gov.bcb.pix",
    "brCodeBase64": "data:image/png;base64,iVBORw0KGgoAAA",
    "platformFee": 80,
    "createdAt": "2025-03-24T21:50:20.772Z",
    "updatedAt": "2025-03-24T21:50:20.772Z",
    "expiresAt": "2025-03-25T21:50:20.772Z"
  },
  "error": null
}
```

**Diferencas da v2:**
- v1: `POST /v1/pixQrCode/create` com `amount` no nivel raiz
- v2: `POST /v2/transparents/create` com `method: "PIX"` e `data.amount`

### 6.2 Checar status

`GET https://api.abacatepay.com/v1/pixQrCode/check?id=<pix_char_id>`

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `id` | string | sim | ID do QRCode PIX |

```bash
curl --request GET \
  --url 'https://api.abacatepay.com/v1/pixQrCode/check?id=pix_char_123456' \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": {
    "status": "PENDING",
    "expiresAt": "2025-03-25T21:50:20.772Z"
  },
  "error": null
}
```

### 6.3 Simular pagamento (dev mode)

`POST https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=<pix_char_id>`

Disponivel apenas em dev mode. Simula o pagamento do PIX QR Code.

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `id` | string | sim | ID do QRCode PIX |

**Body (opcional):**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `metadata` | object | nao | Metadados opcionais |

```bash
curl --request POST \
  --url 'https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=pix_char_123456' \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{ "metadata": {} }'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "pix_char_123456",
    "amount": 100,
    "status": "PENDING",
    "devMode": true,
    "brCode": "00020101021226950014br.gov.bcb.pix",
    "brCodeBase64": "data:image/png;base64,iVBORw0KGgoAAA",
    "platformFee": 80,
    "createdAt": "2025-03-24T21:50:20.772Z",
    "updatedAt": "2025-03-24T21:50:20.772Z",
    "expiresAt": "2025-03-25T21:50:20.772Z"
  },
  "error": null
}
```

---

## 7. Saques (Withdraw)

### 7.1 Criar saque

`POST https://api.abacatepay.com/v1/withdraw/create`

**Request body:**

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `externalId` | string | sim | Identificador unico no seu sistema |
| `method` | enum | sim | Metodo de saque (`PIX`) |
| `amount` | number | sim | Valor em centavos (min 350 = R$3,50) |
| `pix` | object | sim | Dados da chave PIX |
| `pix.type` | string | sim | Tipo da chave PIX (`CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM`) |
| `pix.key` | string | sim | Chave PIX |
| `description` | string | nao | Descricao do saque |

```bash
curl --request POST \
  --url https://api.abacatepay.com/v1/withdraw/create \
  --header 'Authorization: Bearer <token>' \
  --header 'Content-Type: application/json' \
  --data '{
  "externalId": "withdraw-1234",
  "method": "PIX",
  "amount": 5000,
  "pix": {
    "type": "CPF",
    "key": "123.456.789-01"
  },
  "description": "Saque para conta principal"
}'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "tran_123456",
    "status": "PENDING",
    "devMode": true,
    "receiptUrl": "https://abacatepay.com/receipt/tran_123456",
    "kind": "WITHDRAW",
    "amount": 5000,
    "platformFee": 80,
    "createdAt": "2025-03-24T21:50:20.772Z",
    "updatedAt": "2025-03-24T21:50:20.772Z",
    "externalId": "withdraw-1234"
  },
  "error": null
}
```

**Diferencas da v2:**
- v1: inclui campos `kind` e `pix` (tipo + chave)
- v2: `pix` removido do body (usa chave cadastrada na conta)

### 7.2 Buscar saque

`GET https://api.abacatepay.com/v1/withdraw/get?externalId=<external_id>`

**Query Parameters:**

| Param | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `externalId` | string | sim | ID do saque no seu sistema |

```bash
curl --request GET \
  --url 'https://api.abacatepay.com/v1/withdraw/get?externalId=withdraw-1234' \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": {
    "id": "tran_123456",
    "status": "PENDING",
    "devMode": true,
    "receiptUrl": "https://abacatepay.com/receipt/tran_123456",
    "kind": "WITHDRAW",
    "amount": 5000,
    "platformFee": 80,
    "createdAt": "2025-03-24T21:50:20.772Z",
    "updatedAt": "2025-03-24T21:50:20.772Z",
    "externalId": "withdraw-1234"
  },
  "error": null
}
```

### 7.3 Listar saques

`GET https://api.abacatepay.com/v1/withdraw/list`

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/withdraw/list \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": [
    {
      "id": "tran_123456",
      "status": "PENDING",
      "devMode": true,
      "receiptUrl": "https://abacatepay.com/receipt/tran_123456",
      "kind": "WITHDRAW",
      "amount": 5000,
      "platformFee": 80,
      "createdAt": "2025-03-24T21:50:20.772Z",
      "updatedAt": "2025-03-24T21:50:20.772Z",
      "externalId": "withdraw-1234"
    }
  ],
  "error": null
}
```

---

## 8. Loja (Store)

### 8.1 Obter detalhes da loja

`GET https://api.abacatepay.com/v1/store/get`

Recupera detalhes da conta/loja, incluindo informacoes de saldo.

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/store/get \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200 (sucesso):**

```json
{
  "data": { ... },
  "error": null
}
```

**Resposta 200 (erro):**

```json
{
  "error": "Erro ao recuperar dados da loja.",
  "data": null
}
```

---

## 9. MRR

### 9.1 Obter MRR

`GET https://api.abacatepay.com/v1/public-mrr/mrr`

Retorna o MRR (receita recorrente mensal) e o total de assinaturas ativas da loja.

**Nota:** Este endpoint e publico na v2, mas na v1 requer autenticacao.

```bash
curl --request GET \
  --url https://api.abacatepay.com/v1/public-mrr/mrr \
  --header 'Authorization: Bearer <token>'
```

**Resposta 200:**

```json
{
  "data": {
    "mrr": 0,
    "totalActiveSubscriptions": 0
  },
  "error": null
}
```

---

## 10. Webhooks (v1)

Webhooks sao notificacoes enviadas pela AbacatePay para o seu sistema quando algo importante acontece.

### 10.1 Estrutura geral do payload

Na v1, o formato geral do payload e similar a v2 mas **sem o campo `apiVersion`**:

```json
{
  "event": "billing.paid",
  "devMode": false,
  "data": {
    "id": "bill_123456",
    "amount": 10000,
    "status": "PAID",
    "customer": {
      "id": "cust_123",
      "email": "customer@example.com"
    }
  }
}
```

Campos:
- **`event`**: nome do evento disparado
- **`devMode`**: indica se o evento veio de ambiente de testes
- **`data`**: detalhes do recurso afetado

### 10.2 Seguranca

Mesmas recomendacoes da v2:

1. Usar um **secret** na URL do webhook:
   ```
   https://meusite.com/webhooks/abacatepay?webhookSecret=SEU_SECRET
   ```
2. Validar o `webhookSecret` da query string
3. Validar assinatura **HMAC** no header (quando disponivel)
4. Processar cada evento de forma **idempotente**
5. Responder `200 OK` somente apos processamento completo

### 10.3 Eventos suportados

| Evento | Quando e disparado |
|---|---|
| `billing.created` | Cobranca/checkout criada |
| `billing.paid` | Pagamento concluido com sucesso |
| `billing.refunded` | Pagamento totalmente reembolsado |
| `billing.failed` | Tentativa de pagamento falhou |
| `subscription.created` | Assinatura criada |
| `subscription.canceled` | Assinatura cancelada |

**Mapeamento para v2:**

| v1 | v2 |
|---|---|
| `billing.paid` | `checkout.completed` |
| `billing.refunded` | `checkout.refunded` |
| `subscription.created` | `subscription.completed` |
| `subscription.canceled` | `subscription.cancelled` |

> A lista exata de eventos pode variar conforme a epoca da integracao.

### 10.4 Exemplo billing.paid

```json
{
  "event": "billing.paid",
  "devMode": false,
  "data": {
    "id": "bill_abc123",
    "externalId": "pedido-123",
    "amount": 10000,
    "paidAmount": 10000,
    "status": "PAID",
    "customer": {
      "id": "cust_abc123",
      "email": "customer@example.com"
    },
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:05:00.000Z"
  }
}
```

**Diferencas do v2 `checkout.completed`:**
- v1: `data.id`, `data.customer` diretamente
- v2: `data.checkout`, `data.customer`, `data.payerInformation` separados
- v1: sem `apiVersion`
- v2: inclui `apiVersion: 2`
- v1: `customer` tem `id` + `email`
- v2: `customer` tem `id`, `name`, `email`, `taxId` (mascarado)

### 10.5 Boas praticas

- **Nao dependa** de validacao rigida de schema — novos campos podem ser adicionados
- Use o campo `event` como chave principal de roteamento
- Trate o corpo como **append-only**
- Registre logs dos payloads para facilitar migracoes futuras
- Responda 200 OK somente apos concluir o processamento

---

## 11. Mapeamento v1 → v2

Tabela rapida de endpoints para migracao:

| Recurso | v1 | v2 |
|---|---|---|
| **Clientes** | | |
| Criar | `POST /v1/customer/create` | `POST /v2/customers/create` |
| Listar | `GET /v1/customer/list` | `GET /v2/customers/list` |
| Deletar | — | `POST /v2/customers/delete` |
| **Cupons** | | |
| Criar | `POST /v1/coupon/create` | `POST /v2/coupons/create` |
| Listar | `GET /v1/coupon/list` | `GET /v2/coupons/list` |
| Buscar | — | `GET /v2/coupons/get` |
| Toggle | — | `POST /v2/coupons/toggle` |
| Deletar | — | `POST /v2/coupons/delete` |
| **Cobrancas** | | |
| Criar | `POST /v1/billing/create` | `POST /v2/checkouts/create` |
| Listar | `GET /v1/billing/list` | `GET /v2/checkouts/list` |
| Buscar | — | `GET /v2/checkouts/get` |
| **Produtos** | | |
| Criar | — (inline no billing) | `POST /v2/products/create` |
| Listar | — | `GET /v2/products/list` |
| Buscar | — | `GET /v2/products/get` |
| **PIX QR Code** | | |
| Criar | `POST /v1/pixQrCode/create` | `POST /v2/transparents/create` |
| Status | `GET /v1/pixQrCode/check` | `GET /v2/transparents/check` |
| Simular | `POST /v1/pixQrCode/simulate-payment` | `POST /v2/transparents/simulate-payment` |
| **Saques** | | |
| Criar | `POST /v1/withdraw/create` | `POST /v2/payouts/create` |
| Buscar | `GET /v1/withdraw/get` | `GET /v2/payouts/get` |
| Listar | `GET /v1/withdraw/list` | `GET /v2/payouts/list` |
| **Loja** | | |
| Detalhes | `GET /v1/store/get` | — |
| **MRR** | | |
| Obter | `GET /v1/public-mrr/mrr` | `GET /v1/public-mrr/mrr` (mesmo endpoint) |
| **Links de Pagamento** | | |
| Criar | — (usar billing com `MULTIPLE_PAYMENTS`) | `POST /v2/payment-links/create` |
| Listar | — | `GET /v2/payment-links/list` |
| Buscar | — | `GET /v2/payment-links/get` |

---

**Contato:** ajuda@abacatepay.com
