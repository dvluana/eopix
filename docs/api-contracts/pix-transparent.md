# PIX Transparent Checkout — AbacatePay API Contract

**Updated:** 2026-03-26
**Status:** In use (Phase 4)
**Base URL:** `https://api.abacatepay.com`
**Auth:** `Authorization: Bearer <ABACATEPAY_API_KEY>`

> **Note on versioning:** PIX QR Code endpoints use `/v1/pixQrCode/*` paths (not `/v2/transparents/*`).
> The AbacatePay changelog describes "transparent checkout" as a v2 feature, but the actual working API
> reference endpoints remain on v1. Use the paths documented here (verified against API reference).

---

## Create PIX QR Code

**Endpoint:** `POST /v1/pixQrCode/create`

### Request

```json
{
  "amount": 3990,
  "expiresIn": 3600,
  "description": "Relatório EOPIX",
  "metadata": {
    "externalId": "ABCD12"
  },
  "customer": {
    "name": "João Silva",
    "email": "joao@example.com",
    "taxId": "123.456.789-09",
    "cellphone": "(11) 99999-9999"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Price in centavos (e.g., 3990 = R$39,90) |
| `expiresIn` | number | No | TTL in seconds (default: 3600) |
| `description` | string | No | Shown in payer's banking app |
| `metadata.externalId` | string | No | Purchase code — echoed in `transparent.completed` webhook |
| `customer` | object | No | All 4 fields required if customer is included |

### Response

```json
{
  "data": {
    "id": "pix_char_abc123",
    "brCode": "00020101021226820014...",
    "brCodeBase64": "data:image/png;base64,iVBORw0KGgo...",
    "status": "PENDING",
    "expiresAt": "2026-03-26T01:00:00.000Z",
    "devMode": false
  },
  "error": null,
  "success": true
}
```

**Status values:** `PENDING | PAID | EXPIRED | CANCELLED | REFUNDED`

---

## Check PIX Status

**Endpoint:** `GET /v1/pixQrCode/check?id=<pixId>`

### Response

```json
{
  "data": {
    "id": "pix_char_abc123",
    "status": "PAID",
    "expiresAt": "2026-03-26T01:00:00.000Z"
  },
  "error": null,
  "success": true
}
```

> **Important:** The status check endpoint does NOT return `brCode` or `brCodeBase64`.
> These must be stored in DB at charge creation time for display on page refresh.
> EOPIX stores them in `Purchase.pixBrCode` and `Purchase.pixBrCodeBase64`.

---

## Simulate PIX Payment (Dev Mode Only)

**Endpoint:** `POST /v1/pixQrCode/simulate-payment?id=<pixId>`

Triggers AbacatePay to deliver a `transparent.completed` webhook to EOPIX. Only works with sandbox API keys.

### Request

Empty JSON body `{}`.

### Response

Returns the updated charge object (no specific fields required — fire-and-forget).

---

## Webhook: `transparent.completed`

Delivered by AbacatePay when a PIX payment is confirmed.

**Security:** Same as checkout webhooks — URL `?webhookSecret=<secret>` + `X-Webhook-Signature` HMAC-SHA256.

### Payload

```json
{
  "event": "transparent.completed",
  "data": {
    "transparent": {
      "id": "pix_char_abc123",
      "amount": 3990,
      "paidAmount": 3990,
      "status": "PAID",
      "methods": ["PIX"],
      "metadata": {
        "externalId": "ABCD12"
      }
    },
    "customer": {
      "id": "cust_xxx",
      "name": "João Silva",
      "email": "joao@example.com",
      "taxId": "12345678909"
    }
  }
}
```

### Purchase Code Resolution

1. **Primary:** `event.data.transparent.metadata.externalId` (purchase `code` set at charge creation)
2. **Fallback:** DB lookup `Purchase.paymentExternalId == event.data.transparent.id`

### Idempotency Key

`abacate:transparent:<pixId>` — different namespace from `abacate:payment:<checkoutId>` to prevent key collision when the same purchase uses both checkout and PIX flows.

---

## EOPIX Integration

### DB Fields Added to Purchase

| Field | Type | Purpose |
|-------|------|---------|
| `paymentExternalId` | string | PIX charge id (`pix_char_xxx`) for webhook correlation and status polling |
| `pixBrCode` | string | PIX copia-e-cola string (stored for page refresh) |
| `pixBrCodeBase64` | string | QR code as base64 PNG data URI |
| `pixExpiresAt` | datetime | Charge expiry time |

### EOPIX API Routes

| Route | Description |
|-------|-------------|
| `POST /api/purchases/pix` | Create PIX charge for a PENDING purchase, returns brCode + QR |
| `GET /api/purchases/pix/status?purchaseId=<id>` | Poll payment status (from DB or AbacatePay) |

### Flow

```
User → POST /api/purchases/pix
     → createPixCharge() → AbacatePay POST /v1/pixQrCode/create
     ← { pixId, brCode, brCodeBase64, expiresAt }
     → Store in Purchase (paymentExternalId, pixBrCode, pixBrCodeBase64, pixExpiresAt)
     ← Return to frontend

Frontend polls → GET /api/purchases/pix/status?purchaseId=xxx
              → checkPixStatus() → AbacatePay GET /v1/pixQrCode/check
              ← { status: "PENDING" | "PAID" | ... }

AbacatePay → POST /api/webhooks/abacatepay (transparent.completed)
           → handlePaymentSuccess() → Purchase PAID → Inngest triggered
```
