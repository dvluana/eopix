# AbacatePay API v2

> Brazilian payment gateway. REST API with PIX and CARD support. Base URL: `https://api.abacatepay.com/v2`. Auth via Bearer token. All prices in BRL centavos. Responses: `{ data, error, success }`. Idempotent. v1 legacy, deprecated 2028-03-01.

- Auth: `Authorization: Bearer <api-key>` — dev vs prod determined by key prefix
- Pagination: cursor-based (`after`, `before`, `limit` 1-100)
- Webhook security: secret in URL query + HMAC-SHA256 in `X-Webhook-Signature` header
- Products must be created first, then referenced by `id` in checkouts
- Test card: `4242 4242 4242 4242`

## Core API

- [Products](https://docs.abacatepay.com/pages/products/reference): Create catalog items (name, price, cycle). `POST /v2/products/create`, `GET /v2/products/list`, `GET /v2/products/get`
- [Checkouts](https://docs.abacatepay.com/pages/payment/reference): Create payment pages from product items. `POST /v2/checkouts/create`, `GET /v2/checkouts/list`, `GET /v2/checkouts/get`. Returns `url` to redirect customer.
- [Customers](https://docs.abacatepay.com/pages/client/create): Manage customers (name, email, taxId). `POST /v2/customers/create`, `GET /v2/customers/list`, `POST /v2/customers/delete`. Deduplicates by taxId.
- [Webhooks](https://docs.abacatepay.com/pages/webhooks): 13 events (checkout.completed, payment.completed, subscription.*, transfer.*, payout.*). Two security layers: URL secret + HMAC-SHA256.

## Payment Methods

- [Transparent Checkout (PIX QR Code)](https://docs.abacatepay.com/pages/pix-qrcode/reference): In-site PIX payment. `POST /v2/transparents/create` returns `brCode` + `brCodeBase64`. `GET /v2/transparents/check` for status polling.
- [Payment Links](https://docs.abacatepay.com/pages/payment-links/reference): Reusable checkout with `frequency: "MULTIPLE_PAYMENTS"`. `POST /v2/payment-links/create`, `GET /v2/payment-links/list`

## Extras

- [Coupons](https://docs.abacatepay.com/pages/coupon/reference): Percentage or fixed discount. `POST /v2/coupons/create`, `GET /v2/coupons/list`, `POST /v2/coupons/toggle`, `POST /v2/coupons/delete`
- [Payouts](https://docs.abacatepay.com/pages/withdraw/reference): Withdraw to PIX key. Min R$3.50, fee R$0.80. `POST /v2/payouts/create`, `GET /v2/payouts/list`
- [Authentication](https://docs.abacatepay.com/pages/authentication): API key management, permissions per resource (CHECKOUT, CUSTOMER, PRODUCT, COUPON, WITHDRAW)
- [Dev Mode](https://docs.abacatepay.com/pages/devmode): Sandbox environment, test cards, simulate PIX payments
- [SDKs](https://docs.abacatepay.com/pages/sdks): `@abacatepay/sdk` (Node.js), `@abacatepay/rest` (typed client), `@abacatepay/zod`, `@abacatepay/types`

## Optional

- [Glossary](https://docs.abacatepay.com/pages/glossario): Terms and definitions
- [Changelog](https://docs.abacatepay.com/pages/changelog): v2 beta since 2026-03-06, v1 maintained until 2028-03-01
- [Ecosystem](https://docs.abacatepay.com/pages/ecosystem/ecosystem): ESLint plugin, TypeBox schemas, Go types, VS Code theme
- [AI Skills](https://github.com/AbacatePay/skills): Structured context for AI agents
- [Full API Reference (llms-full.txt)](./abacatepay-v2-llms-full.txt): Complete endpoint specs with request/response schemas, webhook payloads, and code examples
