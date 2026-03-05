# AbacatePay API — Referencia para Migracao EOPIX

> **Fonte:** https://docs.abacatepay.com (scraped 2026-03-04)
> **Base URL:** `https://api.abacatepay.com/v1`
> **Auth:** `Authorization: Bearer <API_KEY>`
> **Valores:** sempre em **centavos** (ex: 2990 = R$ 29,90)
> **Resposta padrao:** `{ "data": {...}, "error": null }` ou `{ "data": null, "error": "..." }`

---

## 1. Autenticacao

- Header: `Authorization: Bearer <abacatepay-api-key>`
- Mesmo endpoint para dev e producao — o **ambiente e determinado pela chave**
- Chave de dev mode = sandbox; chave de producao = live
- Erro `401` se chave ausente, invalida ou revogada
- Criar/gerenciar chaves no dashboard AbacatePay

```ts
const headers = {
  'Authorization': `Bearer ${process.env.ABACATEPAY_API_KEY}`,
  'Content-Type': 'application/json',
};
```

---

## 2. Dev Mode (Sandbox)

- Conta nova ja vem em dev mode
- Transacoes simuladas, dados isolados de producao
- Webhooks de dev so recebem eventos de dev
- PIX QR Code: usar endpoint `simulate-payment` para testar
- Cartao de teste aceito: `4242 4242 4242 4242` (qualquer data futura, CVV 3-4 digitos)
- Cartoes rejeitados: `4000000000000002`, `4000000000009995`, `4000000000000127`, `4000000000000069`, `4000000000000101`

---

## 3. Billing (Cobranca)

### 3.1 Criar Cobranca

```
POST /v1/billing/create
```

**Request body:**

```ts
interface CreateBillingRequest {
  frequency: 'ONE_TIME' | 'MULTIPLE_PAYMENTS'; // ONE_TIME para compra unica
  methods: ('PIX' | 'CARD')[];                 // aceita 1 ou 2 metodos
  products: {
    externalId: string;     // seu ID interno do produto
    name: string;           // nome exibido ao cliente
    description?: string;   // descricao do produto
    quantity: number;
    price: number;          // preco unitario em centavos
  }[];
  returnUrl: string;        // URL do botao "Voltar"
  completionUrl: string;    // URL redirect apos pagamento
  customerId?: string;      // ID de cliente existente (cust_xxx)
  customer?: {              // OU criar cliente inline
    name?: string;
    cellphone?: string;
    email: string;          // obrigatorio
    taxId?: string;         // CPF ou CNPJ
  };
  allowCoupons?: boolean;   // default false
  coupons?: string[];       // codigos de cupom permitidos
  externalId?: string;      // seu ID interno da cobranca
  metadata?: Record<string, unknown>;
}
```

**Response 200:**

```ts
interface CreateBillingResponse {
  data: {
    id: string;                // "bill_123456"
    url: string;               // "https://pay.abacatepay.com/bill-5678" — redirect do cliente
    status: 'PENDING';
    devMode: boolean;
    methods: ('PIX' | 'CARD')[];
    products: { id: string; externalId: string; quantity: number }[];
    frequency: 'ONE_TIME' | 'MULTIPLE_PAYMENTS';
    amount: number;            // total em centavos
    nextBilling: string | null;
    customer: {
      id: string;
      metadata: { name: string; cellphone: string; email: string; taxId: string };
    };
    allowCoupons: boolean;
    coupons: string[];
  };
  error: null;
}
```

**Exemplo TS (Node.js SDK):**

```ts
import AbacatePay from 'abacatepay-nodejs-sdk';

const abacate = AbacatePay(process.env.ABACATEPAY_API_KEY!);

const billing = await abacate.billing.create({
  frequency: 'ONE_TIME',
  methods: ['PIX'],
  products: [{
    externalId: 'relatorio-risco',
    name: 'Relatorio de Risco CPF/CNPJ',
    quantity: 1,
    price: 2990, // R$ 29,90
  }],
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/`,
  completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/relatorio/sucesso`,
  customer: { email: customerEmail },
});

// billing.data.url → redirecionar cliente para pagamento
// billing.data.id → salvar como referencia
```

### 3.2 Listar Cobrancas

```
GET /v1/billing/list
```

Retorna array de billings. Sem parametros de query documentados (lista todas).

### 3.3 Status da Cobranca

| Status | Descricao |
|---|---|
| `PENDING` | Pagamento pendente |
| `EXPIRED` | Tempo limite excedido |
| `CANCELLED` | Cancelada pelo merchant |
| `PAID` | Paga com sucesso |
| `REFUNDED` | Valor devolvido |

### 3.4 Frequencias

| Frequencia | Uso |
|---|---|
| `ONE_TIME` | Pagamento unico (nosso caso EOPIX) |
| `MULTIPLE_PAYMENTS` | Link de pagamento reutilizavel |

---

## 4. PIX QR Code (API direta, sem checkout page)

Alternativa mais "raw" — voce gera o QR Code e exibe na sua propria UI.

### 4.1 Criar QR Code PIX

```
POST /v1/pixQrCode/create
```

```ts
interface CreatePixQrCodeRequest {
  amount: number;            // centavos
  expiresIn?: number;        // segundos ate expirar
  description?: string;      // max 37 chars
  customer?: {               // opcional, mas se informar, todos os campos obrigatorios
    name: string;
    cellphone: string;
    email: string;
    taxId: string;
  };
  metadata?: Record<string, unknown>;
}
```

**Response:**

```ts
interface PixQrCodeResponse {
  data: {
    id: string;              // "pix_char_123456"
    amount: number;
    status: 'PENDING' | 'EXPIRED' | 'CANCELLED' | 'PAID' | 'REFUNDED';
    devMode: boolean;
    brCode: string;          // codigo copia-e-cola
    brCodeBase64: string;    // QR code como imagem base64
    platformFee: number;     // taxa em centavos
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };
  error: null;
}
```

### 4.2 Checar Status

```
GET /v1/pixQrCode/check?id=pix_char_xxx
```

### 4.3 Simular Pagamento (dev mode only)

```
POST /v1/pixQrCode/simulate-payment?id=pix_char_xxx
```

Body: `{ "metadata": {} }`

---

## 5. Customer (Cliente)

### 5.1 Criar Cliente

```
POST /v1/customer/create
```

```ts
interface CreateCustomerRequest {
  name: string;       // obrigatorio
  cellphone: string;  // obrigatorio
  email: string;      // obrigatorio
  taxId: string;      // CPF ou CNPJ valido — obrigatorio
}
```

**Response:**

```ts
interface CustomerResponse {
  data: {
    id: string;       // "cust_aebxkhDZNa..."
    metadata: { name: string; cellphone: string; taxId: string; email: string };
  };
  error: null;
}
```

- Se `taxId` ja existe, retorna o cliente existente (nao duplica)
- taxId invalido = erro

### 5.2 Listar Clientes

```
GET /v1/customer/list
```

---

## 6. Webhooks

### 6.1 Configuracao

- Criados via dashboard (nao via API)
- Especificos por ambiente (dev mode vs producao)
- Campos: Nome, URL (HTTPS), Secret

### 6.2 Verificacao de Seguranca

**Camada 1 — Secret na URL (query string):**

```
https://seusite.com/webhook/abacatepay?webhookSecret=seu_secret_aqui
```

```ts
// Next.js App Router example
export async function POST(request: Request) {
  const url = new URL(request.url);
  const webhookSecret = url.searchParams.get('webhookSecret');

  if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const event = await request.json();
  // processar evento...
  return Response.json({ received: true });
}
```

**Camada 2 — HMAC-SHA256 (header `X-Webhook-Signature`):**

```ts
import crypto from 'node:crypto';

// Chave publica HMAC da AbacatePay (fixa)
const ABACATEPAY_PUBLIC_KEY =
  't9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9';

function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
  const expectedSig = crypto
    .createHmac('sha256', ABACATEPAY_PUBLIC_KEY)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64');

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
```

### 6.3 Eventos

#### `billing.paid` — Pagamento confirmado

**Payload (cobranca via billing):**

```json
{
  "id": "log_12345abcdef",
  "data": {
    "payment": {
      "amount": 1000,
      "fee": 80,
      "method": "PIX"
    },
    "billing": {
      "amount": 1000,
      "couponsUsed": [],
      "customer": {
        "id": "cust_xxx",
        "metadata": {
          "cellphone": "11111111111",
          "email": "user@example.com",
          "name": "Nome Completo",
          "taxId": "12345678901"
        }
      },
      "frequency": "ONE_TIME",
      "id": "bill_xxx",
      "kind": ["PIX"],
      "paidAmount": 1000,
      "products": [
        { "externalId": "123", "id": "prod_xxx", "quantity": 1 }
      ],
      "status": "PAID"
    }
  },
  "devMode": false,
  "event": "billing.paid"
}
```

**Payload (pagamento via PIX QR Code):**

```json
{
  "id": "log_12345abcdef",
  "data": {
    "payment": {
      "amount": 1000,
      "fee": 80,
      "method": "PIX"
    },
    "pixQrCode": {
      "amount": 1000,
      "id": "pix_char_xxx",
      "kind": "PIX",
      "status": "PAID"
    }
  },
  "devMode": false,
  "event": "billing.paid"
}
```

#### `withdraw.done` — Saque concluido

```json
{
  "id": "log_12345abcdef",
  "data": {
    "transaction": {
      "id": "tran_123456",
      "status": "COMPLETE",
      "kind": "WITHDRAW",
      "amount": 5000,
      "platformFee": 80,
      "externalId": "withdraw-1234"
    }
  },
  "devMode": false,
  "event": "withdraw.done"
}
```

#### `withdraw.failed` — Saque falhou

Mesmo formato de `withdraw.done` com `"status": "CANCELLED"`.

### 6.4 Boas Praticas

- `devMode` no payload indica ambiente de teste
- Valores em centavos
- `fee` = taxa AbacatePay
- Processar cada `id` de evento **uma unica vez** (idempotencia)
- Responder `4xx/5xx` em caso de erro de verificacao

---

## 7. SDK Node.js

```bash
npm install abacatepay-nodejs-sdk
```

```ts
import AbacatePay from 'abacatepay-nodejs-sdk';

const abacate = AbacatePay('sua_chave_api');

// Billing
const billing = await abacate.billing.create({...});
const billings = await abacate.billing.list();

// Customer
const customer = await abacate.customer.create({...});
const customers = await abacate.customer.list();
```

GitHub: https://github.com/AbacatePay/abacatepay-nodejs-sdk

