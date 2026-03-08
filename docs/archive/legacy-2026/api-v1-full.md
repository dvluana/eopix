# AbacatePay API v1

> Source: docs.abacatepay.com | Extracted: 2026-03-07 | Base URL: `https://api.abacatepay.com/v1`

## Rules

- Auth: `Authorization: Bearer <api-key>` on every request
- Dev vs prod determined by API key (same base URL)
- All responses: `{ data, error }` — check `error` is null (no `success` field in v1)
- All prices in BRL centavos (R$29.90 = 2990)
- API is idempotent — safe to retry
- v1 is legacy, maintained until 2028-03-01. Use v2 for new projects.
- Products are defined **inline** in billing (no separate product endpoints)
- Webhook event: `billing.paid` (v2 equivalent: `checkout.completed`)

## v1 → v2 Quick Mapping

| v1 | v2 |
|---|---|
| `/v1/billing/create` | `/v2/checkouts/create` |
| `/v1/billing/list` | `/v2/checkouts/list` |
| `/v1/customer/create` | `/v2/customers/create` |
| `/v1/customer/list` | `/v2/customers/list` |
| `/v1/coupon/create` | `/v2/coupons/create` |
| `/v1/coupon/list` | `/v2/coupons/list` |
| `/v1/pixQrCode/create` | `/v2/transparents/create` |
| `/v1/pixQrCode/check` | `/v2/transparents/check` |
| `/v1/pixQrCode/simulate-payment` | `/v2/transparents/simulate-payment` |
| `/v1/withdraw/create` | `/v2/payouts/create` |
| `/v1/withdraw/get` | `/v2/payouts/get` |
| `/v1/withdraw/list` | `/v2/payouts/list` |
| `billing.paid` (webhook) | `checkout.completed` (webhook) |

---

## Billing (Checkouts)

Create a payment page. Products are sent inline (no separate product creation needed).

### POST /v1/billing/create

| Field | Type | Required | Description |
|---|---|---|---|
| `frequency` | enum | yes | `ONE_TIME` or `MULTIPLE_PAYMENTS` |
| `methods` | enum[] | yes | `["PIX"]`, `["CARD"]` or `["PIX", "CARD"]` (1-2 elements) |
| `products` | object[] | yes | Inline products (min 1) |
| `products[].externalId` | string | yes | Product ID in your system |
| `products[].name` | string | yes | Product name |
| `products[].description` | string | no | Product description |
| `products[].quantity` | number | yes | Quantity |
| `products[].price` | number | yes | Price in centavos |
| `returnUrl` | string | yes | "Back" button URL |
| `completionUrl` | string | yes | Redirect after payment |
| `customerId` | string | no | Existing customer ID |
| `customer` | object | no | Create customer inline (all sub-fields required if present) |
| `customer.name` | string | yes* | Full name |
| `customer.cellphone` | string | yes* | Phone formatted `(11) 4002-8922` |
| `customer.email` | string | yes* | Email |
| `customer.taxId` | string | yes* | CPF/CNPJ formatted `123.456.789-01` |
| `allowCoupons` | boolean | no | Enable coupons (default false) |
| `coupons` | string[] | no | Available coupon codes (max 50) |
| `externalId` | string | no | Your system's order ID |
| `metadata` | object | no | Free-form data |

Response:
```json
{"data":{"id":"bill_123456","url":"https://pay.abacatepay.com/bill-5678","status":"PENDING","devMode":true,"methods":["PIX","CARD"],"products":[{"id":"prod_123456","externalId":"prod-1234","quantity":2}],"frequency":"ONE_TIME","amount":4000,"nextBilling":"null","customer":{"id":"bill_123456","metadata":{"name":"Daniel Lima","cellphone":"(11) 4002-8922","email":"daniel_lima@abacatepay.com","taxId":"123.456.789-01"}},"allowCoupons":false,"coupons":[]},"error":null}
```

Redirect customer to `data.url` to complete payment.

**Key v1 vs v2 differences:** v1 uses `methods` (array), v2 uses `method` (string). v1 products are inline, v2 references product IDs. v1 requires `returnUrl`/`completionUrl`, v2 they're optional.

### GET /v1/billing/list

Returns array of billing objects. No query parameters documented.

---

## Customers

### POST /v1/customer/create

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Full name |
| `cellphone` | string | yes | Phone formatted `(11) 4002-8922` |
| `email` | string | yes | Email |
| `taxId` | string | yes | CPF/CNPJ formatted `123.456.789-01` |

Response:
```json
{"data":{"id":"bill_123456","metadata":{"name":"Daniel Lima","cellphone":"(11) 4002-8922","email":"daniel_lima@abacatepay.com","taxId":"123.456.789-01"}},"error":null}
```

**Note:** v1 wraps customer fields in `metadata`. v2 puts them at root level.

### GET /v1/customer/list

Returns array of customer objects.

---

## Coupons

### POST /v1/coupon/create

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | Unique coupon code |
| `notes` | string | yes | Description |
| `discountKind` | enum | yes | `PERCENTAGE` or `FIXED` |
| `discount` | number | yes | Discount value (% or centavos) |
| `maxRedeems` | number | no | Usage limit (-1 = unlimited, default -1) |
| `metadata` | object | no | Free-form data |

Response:
```json
{"data":{"id":"DEYVIN_20","discountKind":"PERCENTAGE","discount":123,"status":"ACTIVE","createdAt":"2025-05-25T23:43:25.250Z","updatedAt":"2025-05-25T23:43:25.250Z","notes":"Cupom de desconto pro meu publico","maxRedeems":-1,"redeemsCount":0,"devMode":true,"metadata":{}},"error":null}
```

### GET /v1/coupon/list

Returns array of coupon objects. v2 adds `get`, `toggle`, `delete` endpoints.

---

## PIX QR Code (Transparent Checkout)

Generate PIX QR code for in-site payment (no redirect).

### POST /v1/pixQrCode/create

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | yes | Amount in centavos |
| `expiresIn` | number | no | Expiration in seconds |
| `description` | string | no | PIX message (max 37 chars) |
| `customer` | object | no | Customer data (if present, all sub-fields required) |
| `customer.name` | string | yes* | Full name |
| `customer.cellphone` | string | yes* | Phone |
| `customer.email` | string | yes* | Email |
| `customer.taxId` | string | yes* | CPF/CNPJ |
| `metadata` | object | no | Free-form |

Response:
```json
{"data":{"id":"pix_char_123456","amount":100,"status":"PENDING","devMode":true,"brCode":"00020101021226950014br.gov.bcb.pix","brCodeBase64":"data:image/png;base64,iVBORw0KGgoAAA","platformFee":80,"createdAt":"2025-03-24T21:50:20.772Z","updatedAt":"2025-03-24T21:50:20.772Z","expiresAt":"2025-03-25T21:50:20.772Z"},"error":null}
```

**v1 vs v2:** v1 has `amount` at root level. v2 wraps in `method: "PIX"` + `data.amount`.

### GET /v1/pixQrCode/check

Query: `id` (required) — returns `{ status, expiresAt }`.

### POST /v1/pixQrCode/simulate-payment

Query: `id` (required) — dev mode only, simulates PIX payment. Optional body: `{ metadata: {} }`.

---

## Withdrawals (Payouts)

### POST /v1/withdraw/create

| Field | Type | Required | Description |
|---|---|---|---|
| `externalId` | string | yes | Unique ID in your system |
| `method` | enum | yes | `PIX` |
| `amount` | number | yes | Amount in centavos (min 350 = R$3.50) |
| `pix` | object | yes | PIX key data |
| `pix.type` | string | yes | Key type: `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM` |
| `pix.key` | string | yes | PIX key value |
| `description` | string | no | Description |

Response:
```json
{"data":{"id":"tran_123456","status":"PENDING","devMode":true,"receiptUrl":"https://abacatepay.com/receipt/tran_123456","kind":"WITHDRAW","amount":5000,"platformFee":80,"createdAt":"2025-03-24T21:50:20.772Z","updatedAt":"2025-03-24T21:50:20.772Z","externalId":"withdraw-1234"},"error":null}
```

**v1 vs v2:** v1 requires `pix` object with key type/value. v2 uses account's registered PIX key. v1 includes `kind` field.

### GET /v1/withdraw/get

Query: `externalId` (required)

### GET /v1/withdraw/list

Returns array of withdrawal objects.

---

## Store

### GET /v1/store/get

Returns store/account details including balance. No equivalent in v2.

---

## MRR

### GET /v1/public-mrr/mrr

Returns `{ mrr, totalActiveSubscriptions }`. Same endpoint works in v1 and v2.

---

## Webhooks (v1)

Webhooks notify your system of events. Same security model as v2.

### Security

**Layer 1 — Secret in URL:**
```
https://yoursite.com/webhook?webhookSecret=YOUR_SECRET
```

**Layer 2 — HMAC-SHA256 signature** in `X-Webhook-Signature` header (same verification as v2).

### Events

All payloads: `{ event, devMode, data }` — **no `apiVersion` field** (v2 adds `apiVersion: 2`).

| Event | Trigger | v2 Equivalent |
|---|---|---|
| `billing.created` | Billing created | — |
| `billing.paid` | Payment confirmed | `checkout.completed` |
| `billing.refunded` | Payment refunded | `checkout.refunded` |
| `billing.failed` | Payment failed | — |
| `subscription.created` | Subscription created | `subscription.completed` |
| `subscription.canceled` | Subscription cancelled | `subscription.cancelled` |

### Payload: billing.paid

```json
{"event":"billing.paid","devMode":false,"data":{"id":"bill_abc123","externalId":"pedido-123","amount":10000,"paidAmount":10000,"status":"PAID","customer":{"id":"cust_abc123","email":"customer@example.com"},"createdAt":"2024-01-01T12:00:00.000Z","updatedAt":"2024-01-01T12:05:00.000Z"}}
```

**v1 vs v2:** v1 has `data.id` + `data.customer` flat. v2 nests under `data.checkout`, `data.customer`, `data.payerInformation`.

### Best Practices

- Validate secret + HMAC signature
- Return 200 only after processing completes
- Implement idempotency (process each event once)
- Do NOT validate entire payload with Zod (future fields may break)
- Treat body as append-only (new fields may appear)
