# AbacatePay API v2

> Source: docs.abacatepay.com | Extracted: 2026-03-12 | Base URL: `https://api.abacatepay.com/v2`

## Rules

- Auth: `Authorization: Bearer <api-key>` on every request
- Dev vs prod determined by API key (same base URL)
- All responses: `{ data, error, success }` — check `success` boolean
- All prices in BRL centavos (R$29.90 = 2990)
- Pagination: cursor-based with `after`, `before`, `limit` (1-100)
- API is idempotent — safe to retry
- v1 endpoints (`/v1/*`) are legacy, deprecated 2028-03-01
- Webhook `taxId` is masked in payloads (`123.***.***-**`)

## Permissions

Key permissions control access. Missing permission = 403.

| Resource | Permissions |
|---|---|
| Checkout | `CHECKOUT:CREATE`, `CHECKOUT:READ`, `CHECKOUT:DELETE` |
| Customer | `CUSTOMER:CREATE`, `CUSTOMER:READ`, `CUSTOMER:DELETE` |
| Product | `PRODUCT:CREATE`, `PRODUCT:READ`, `PRODUCT:DELETE` |
| Coupon | `COUPON:CREATE`, `COUPON:READ`, `COUPON:UPDATE`, `COUPON:DELETE` |
| Withdraw | `WITHDRAW:CREATE`, `WITHDRAW:READ` |

## Dev Mode

- New accounts start in dev mode (all operations simulated)
- Test card (approved): `4242 4242 4242 4242`, any future expiry, any CVV
- Test cards (rejected): `4000000000000002`, `4000000000009995`, `4000000000000127`, `4000000000000069`, `4000000000000101`
- Simulate PIX payment: `POST /v2/transparents/simulate-payment?id=<pix_id>`

---

## Products

Products are catalog items referenced by checkouts. Create once, reuse in checkouts.

### POST /v2/products/create

| Field | Type | Required | Description |
|---|---|---|---|
| `externalId` | string | yes | Unique ID in your system |
| `name` | string | yes | Product name |
| `price` | number | yes | Price in centavos (min 1) |
| `currency` | string | yes | Always `"BRL"` |
| `description` | string | no | Product description |
| `imageUrl` | string\|null | no | Image URL |
| `cycle` | enum\|null | no | `WEEKLY`, `MONTHLY`, `SEMIANNUALLY`, `ANNUALLY` or null (one-time) |

Response:
```json
{"data":{"id":"prod_abc123xyz","externalId":"prod-123","name":"Produto","price":10000,"currency":"BRL","status":"ACTIVE","cycle":null,"devMode":false,"imageUrl":null,"createdAt":"...","updatedAt":"..."},"error":null,"success":true}
```

### GET /v2/products/list

Query: `after`, `before`, `limit`, `id`, `externalId`, `status` (ACTIVE|INACTIVE)

### GET /v2/products/get

Query: `id` or `externalId` (one required)

---

## Checkouts

Checkout is the payment page. Send product items, get a URL to redirect the customer.

### POST /v2/checkouts/create

| Field | Type | Required | Description |
|---|---|---|---|
| `items` | object[] | yes | `[{ id: "prod_xxx", quantity: 1 }]` — min 1 item |
| `method` | enum | no | `PIX` or `CARD` |
| `returnUrl` | string | no | "Back" button URL |
| `completionUrl` | string | no | Redirect after payment |
| `customerId` | string | no | Pre-fill customer data |
| `coupons` | string[] | no | Coupon codes (max 50) |
| `externalId` | string | no | Your system's order ID |
| `metadata` | object | no | Free-form data |
| `frequency` | enum | no | `ONE_TIME` (default), `MULTIPLE_PAYMENTS`, `SUBSCRIPTION` |

Response:
```json
{"data":{"id":"bill_abc123xyz","url":"https://app.abacatepay.com/pay/bill_abc123xyz","amount":10000,"paidAmount":null,"status":"PENDING","items":[{"id":"prod_456","quantity":1}],"externalId":"pedido-123","coupons":[],"devMode":false,"customerId":null,"returnUrl":null,"completionUrl":null,"receiptUrl":null,"metadata":{},"createdAt":"...","updatedAt":"..."},"error":null,"success":true}
```

Redirect customer to `data.url` to complete payment.

### GET /v2/checkouts/list

Query: `after`, `before`, `limit`, `id`, `externalId`, `status` (PENDING|EXPIRED|CANCELLED|PAID|REFUNDED), `email`, `taxId`

Response includes `pagination: { hasMore, next, before }`.

### GET /v2/checkouts/get

Query: `id` (required) — returns single checkout object.

---

## Customers

### POST /v2/customers/create

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Customer name |
| `email` | string | yes | Email |
| `taxId` | string | yes | CPF or CNPJ (formatted: `123.456.789-01`) |
| `cellphone` | string | no | Phone (formatted: `(11) 4002-8922`) |
| `metadata` | object | no | Free-form data |

If `taxId` already exists, returns existing customer (no duplicates).

### GET /v2/customers/list

Query: `after`, `before`, `limit`

### POST /v2/customers/delete

Query: `id` (required)

---

## Webhooks

Webhooks notify your system of events. Two security layers.

### Security

**Layer 1 — Secret in URL:**
```
https://yoursite.com/webhook?webhookSecret=YOUR_SECRET
```

**Layer 2 — HMAC-SHA256 signature** in `X-Webhook-Signature` header:

```ts
import crypto from "node:crypto";

const ABACATEPAY_PUBLIC_KEY = "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

function verifySignature(rawBody: string, sig: string): boolean {
  const expected = crypto.createHmac("sha256", ABACATEPAY_PUBLIC_KEY).update(Buffer.from(rawBody, "utf8")).digest("base64");
  const A = Buffer.from(expected), B = Buffer.from(sig);
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}
```

### Events

All payloads: `{ event, apiVersion: 2, devMode, data }`.

| Event | Trigger |
|---|---|
| `checkout.completed` | Checkout payment confirmed |
| `checkout.refunded` | Checkout refunded |
| `checkout.disputed` | Chargeback opened |
| `payment.completed` | Payment confirmed (checkout or transparent) |
| `payment.refunded` | Payment refunded |
| `payment.disputed` | Chargeback on payment |
| `subscription.completed` | Subscription created and active |
| `subscription.cancelled` | Subscription cancelled |
| `subscription.renewed` | Recurring payment collected |
| `transfer.completed` | Transfer completed |
| `transfer.failed` | Transfer failed |
| `payout.completed` | Payout completed |
| `payout.failed` | Payout failed |

### Payload: checkout.completed (PIX)

```json
{"event":"checkout.completed","apiVersion":2,"devMode":false,"data":{"checkout":{"id":"bill_abc123xyz","externalId":"pedido-123","amount":10000,"paidAmount":10000,"platformFee":80,"frequency":"ONE_TIME","items":[{"id":"prod_xyz","quantity":1}],"status":"PAID","methods":["PIX"],"customerId":"cust_abc123","receiptUrl":"https://app.abacatepay.com/receipt/..."},"customer":{"id":"cust_abc123","name":"Joao Silva","email":"joao@exemplo.com","taxId":"123.***.***-**"},"payerInformation":{"method":"PIX","PIX":{"name":"Joao Silva","taxId":"123.***.***-**","isSameAsCustomer":true}}}}
```

### Payload: checkout.completed (CARD)

Same structure but `payerInformation.method: "CARD"` with `CARD: { number: "1234", brand: "VISA" }`.

### Payload: payment.completed

Same as checkout but `data.payment` instead of `data.checkout`.

### Payload: subscription.completed

```json
{"event":"subscription.completed","apiVersion":2,"data":{"subscription":{"id":"sub_abc123","amount":2990,"currency":"BRL","method":"CARD","status":"ACTIVE","frequency":"MONTHLY","canceledAt":null},"payment":{...},"customer":{...},"payerInformation":{...}}}
```

### Payload: transfer/payout

```json
{"event":"transfer.completed","apiVersion":2,"data":{"transfer":{"id":"tran_xxx","amount":1000,"status":"COMPLETE","method":"PIX","platformFee":80,"endToEndIdentifier":"E123..."}}}
```

Payout uses `data.withdraw` instead of `data.transfer`.

### Best Practices

- Always validate secret + HMAC signature
- Return 200 only after processing completes
- Implement idempotency (process each event once)
- Do NOT validate entire payload with Zod (future fields may break)

---

## Transparent Checkout (PIX QR Code)

Generate PIX QR code for in-site payment (no redirect).

### POST /v2/transparents/create

| Field | Type | Required | Description |
|---|---|---|---|
| `method` | string | yes | Always `"PIX"` |
| `data.amount` | number | yes | Amount in centavos |
| `data.description` | string | no | Description |
| `data.expiresIn` | number | no | Expiration in seconds |
| `data.customer.name` | string | no | Customer name |
| `data.customer.email` | string | no | Email |
| `data.customer.taxId` | string | no | CPF/CNPJ formatted |
| `data.customer.cellphone` | string | no | Phone formatted |
| `data.metadata` | object | no | Free-form |

Response:
```json
{"data":{"id":"pix_char_abc123","amount":10000,"status":"PENDING","brCode":"00020160014BR.GOV.BCB.PIX...","brCodeBase64":"data:image/png;base64,...","platformFee":100,"expiresAt":"..."},"success":true,"error":null}
```

### GET /v2/transparents/check

Query: `id` — returns `{ id, status, expiresAt }`.

### POST /v2/transparents/simulate-payment

Query: `id` — dev mode only, simulates PIX payment.

---

## Coupons

### POST /v2/coupons/create

| Field | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | Unique coupon code |
| `discountKind` | enum | yes | `PERCENTAGE` or `FIXED` |
| `discount` | number | yes | Discount value (% or centavos) |
| `notes` | string | no | Description |
| `maxRedeems` | number | no | Usage limit (-1 = unlimited, default -1) |
| `metadata` | object | no | Free-form |

### GET /v2/coupons/list

Query: `after`, `before`, `limit`, `id`, `status` (ACTIVE|INACTIVE|EXPIRED)

### GET /v2/coupons/get

Query: `id`

### POST /v2/coupons/toggle

Query: `id` — toggles ACTIVE <-> INACTIVE.

### POST /v2/coupons/delete

Query: `id`

---

## Payment Links

A payment link is a checkout with `frequency: "MULTIPLE_PAYMENTS"` (can be paid multiple times).

### POST /v2/payment-links/create

Same body as checkouts/create but `frequency: "MULTIPLE_PAYMENTS"` is required.

### GET /v2/payment-links/list

Query: `after`, `before`, `limit`, `id`, `externalId`, `status`

### GET /v2/payment-links/get

Query: `id`

---

## Payouts

Withdraw balance to your PIX key. Min R$3.50, fee R$0.80/payout, rate limit 1/min.

### POST /v2/payouts/create

| Field | Type | Required | Description |
|---|---|---|---|
| `amount` | number | yes | Amount in centavos (min 350) |
| `externalId` | string | yes | Unique ID in your system |
| `description` | string | no | Description |

### GET /v2/payouts/get

Query: `externalId`

### GET /v2/payouts/list

Query: `after`, `before`, `limit`, `id`, `externalId`, `status` (PENDING|EXPIRED|CANCELLED|COMPLETE|REFUNDED)

---

## SDKs

| Package | Description |
|---|---|
| `@abacatepay/sdk` | Official high-level Node.js SDK |
| `@abacatepay/rest` | Typed REST client, zero deps, retry + backoff |
| `@abacatepay/types` | TypeScript types |
| `@abacatepay/zod` | Zod schemas for runtime validation |
| `@abacatepay/typebox` | TypeBox schemas |
| `@abacatepay/eslint-plugin` | Prevents hardcoded API keys |

```ts
import { REST } from '@abacatepay/rest';
const client = new REST({ secret: process.env.ABACATEPAY_API_KEY! });
const result = await client.post('/checkouts/create', { body: { items: [{ id: "prod_xxx", quantity: 1 }] } });
```

## Type Naming Conventions

- `API*` — General structures, returned objects
- `REST<Method>*` — Body, QueryParams, Data for REST endpoints
- `Webhook*` — Webhook event payloads
