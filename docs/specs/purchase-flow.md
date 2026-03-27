---
title: "Purchase Flow"
---

## Estados

```
PENDING → PAID → PROCESSING → COMPLETED
                            → FAILED → REFUNDED
```

## Fluxo Principal (LIVE)

### PIX Inline (padrão atual)

1. User submete CPF/CNPJ em `/consulta/[term]`
2. Frontend POST `/api/purchases` com document + metadata — retorna `purchaseId` (UUID)
3. Backend valida rate limit, blocklist, duplicata (409 se já existe relatório)
4. Cria Purchase(PENDING) + User (ou reutiliza)
5. Retorna `purchaseId` → frontend redireciona para `/compra/pix?purchaseId=<uuid>`
6. Página `/compra/pix` chama `POST /api/purchases/pix` para criar cobrança PIX inline
7. AbacatePay retorna brCode + brCodeBase64 → QR exibido na própria página EOPIX
8. User escaneia QR code e paga
9. AbacatePay envia webhook `transparent.completed` → Purchase PAID → Inngest `search/process`
10. Pipeline processa → Purchase COMPLETED
11. Polling 3s detecta PAID/COMPLETED → redireciona para `/minhas-consultas`
12. User vê relatório em `/relatorio/[id]`

### Checkout Hosted (legado / fallback)

1-4 igual ao fluxo PIX Inline
5. Cria billing no AbacatePay (produto inline com externalId fixo)
6. Retorna `checkoutUrl` → frontend redireciona para página hosted AbacatePay
7. User paga (PIX/cartão)
8. AbacatePay envia webhook `checkout.completed` → `/api/webhooks/abacatepay`
9-12 igual ao fluxo PIX Inline

## Fluxo Bypass (MOCK/TEST)

1-4 igual ao LIVE
5. Retorna fake URL (bypass payment)
6. Admin marca PAID via `/api/admin/purchases/:id/mark-paid`
7. `POST /api/process-search/{code}` (fallback síncrono)
8-11 igual ao LIVE

## Validações

- **Rate limit:** Por IP (bypassed em dev)
- **Blocklist:** CPF/CNPJ banidos
- **Duplicata:** 409 se user logado já tem relatório ativo pro mesmo documento
- **AbacatePay:** Produto inline (`externalId: 'relatorio-risco'`), customer com email real

## Cancelamento

- `cancelUrl` redireciona para `/` (home)
- Se user chega em confirmação com `?cancelled=true` + Purchase PENDING → mostra "pagamento não concluído"
- Se Purchase já PAID/COMPLETED → ignora cancelled (race condition protection)

## Arquivos

- Rota de compra: `src/app/api/purchases/route.ts`
- Webhook: `src/app/api/webhooks/abacatepay/route.ts`
- Payment lib: `src/lib/payment.ts`, `src/lib/abacatepay.ts`
- Confirmação: `src/app/confirmacao/page.tsx`
- Minhas consultas: `src/app/minhas-consultas/page.tsx`
- PIX checkout page: `src/app/compra/pix/page.tsx`
- PIX checkout component: `src/components/PixCheckout.tsx`

## PIX Transparent Checkout

Caminho alternativo ao redirect para AbacatePay — usuário paga diretamente na página EOPIX via QR Code PIX.

### Fluxo PIX (Paralelo ao checkout redirect)

1. User submete CPF/CNPJ → Purchase(PENDING) criada normalmente via `POST /api/purchases`
2. Frontend chama `POST /api/purchases/pix` com `{ purchaseId }` para criar a cobrança PIX
3. Backend chama `createPixCharge()` → AbacatePay `/v1/pixQrCode/create`
4. `brCode` (copia-e-cola) e `brCodeBase64` (QR code PNG) armazenados em `Purchase.pixBrCode` / `pixBrCodeBase64`
5. Frontend exibe QR code inline e inicia polling a cada 3s via `GET /api/purchases/pix/status?purchaseId=...`
6. AbacatePay entrega webhook `transparent.completed` quando pagamento confirmado
7. Webhook → `handlePaymentSuccess()` → Purchase PAID → Inngest `search/process` disparado
8. Pipeline idêntico ao fluxo de checkout redirect: PROCESSING → COMPLETED

### Reutilização de Cobrança (Anti-dupla-criação)

Se user atualiza a página, `POST /api/purchases/pix` verifica se `paymentExternalId` já começa com `pix_` e `pixBrCode` existe. Nesse caso, retorna os dados existentes sem chamar AbacatePay novamente.

### Idempotência do Webhook

O webhook `transparent.completed` usa chave `abacate:transparent:<pixId>` no `WebhookLog` — namespace separado de `abacate:payment:<checkoutId>` para evitar colisão de chaves.

### Arquivos PIX

- Criação de cobrança: `src/app/api/purchases/pix/route.ts`
- Status polling: `src/app/api/purchases/pix/status/route.ts`
- Lib functions: `src/lib/abacatepay.ts` (`createPixCharge`, `checkPixStatus`, `simulatePixPayment`)
- Webhook: `src/app/api/webhooks/abacatepay/route.ts` (branch `transparent.completed`)
- Contrato API: `docs/api-contracts/pix-transparent.md`

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Arquitetura" icon="sitemap" href="/architecture">
    State machine e bounded contexts
  </Card>
  <Card title="API Contracts" icon="file-contract" href="/api-contracts/cpf-cadastral">
    Contratos APIFull
  </Card>
</CardGroup>
