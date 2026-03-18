# AbacatePay — Referência de Credenciais

> **Atualizado:** 2026-03-17
> **Valores reais:** `.env.local` (sandbox) e `.env.production.local` (produção) — ambos gitignored

---

## Env Vars Necessárias

| Variável | Descrição | Onde configurar |
|---|---|---|
| `ABACATEPAY_API_KEY` | API key com prefixo `abc_dev_*` (sandbox) ou `abc_prod_*` (produção) | `.env.local` / Vercel |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret gerado com `openssl rand -hex 32` — configurado no dashboard AbacatePay ao registrar o webhook | `.env.local` / Vercel |
| `ABACATEPAY_PRODUCT_ID` | ID do produto pré-criado no dashboard AbacatePay (sandbox: `prod_CYEPYBhZBn0YcyFJHJ0DeKTw`, produção: `prod_P56DhUkBx2RSdFSfNPTqrhue`) | `.env.local` / Vercel |
| `PAYMENT_PROVIDER` | Sempre `abacatepay` | `.env.local` / Vercel |
| `PRICE_CENTS` | Preço em centavos (`3990` = R$39,90) | `.env.local` / Vercel |

---

## Obter API Keys

1. Acessar dashboard AbacatePay
2. **Sandbox:** Settings → API Keys → Dev Key (prefixo `abc_dev_*`)
3. **Produção:** Settings → API Keys → Production Key (prefixo `abc_prod_*`)

---

## Configurar Webhook no Dashboard AbacatePay

### URL do Webhook

**Sandbox (local/preview):**
```
http://localhost:3000/api/webhooks/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>
```

**Produção:**
```
https://somoseopix.com.br/api/webhooks/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>
```

### Evento a registrar

```
checkout.completed
```

### Gerar novo secret

```bash
openssl rand -hex 32
```

---

## Verificar Assinatura HMAC

O handler em `src/app/api/webhooks/abacatepay/route.ts` valida dois layers:

1. **Layer 1:** `?webhookSecret=` na query string deve bater com `ABACATEPAY_WEBHOOK_SECRET`
2. **Layer 2:** Header `x-webhook-signature` validado com HMAC-SHA256 usando a **chave pública da AbacatePay** (hardcoded em `abacatepay.ts` como `ABACATEPAY_PUBLIC_KEY`) — NOT o webhook secret

> **Importante:** Para simular o webhook localmente, a assinatura deve usar `ABACATEPAY_PUBLIC_KEY`, não `ABACATEPAY_WEBHOOK_SECRET`.

---

## Ambientes

| Ambiente | API Key | Product ID | Arquivo |
|---|---|---|---|
| Local / Sandbox | `abc_dev_*` | `prod_CYEPYBhZBn0YcyFJHJ0DeKTw` | `.env.local` |
| Produção | `abc_prod_*` | `prod_P56DhUkBx2RSdFSfNPTqrhue` | `.env.production.local` + Vercel |

---

## Simular Webhook em Dev (v2 `checkout.completed`)

```bash
# Layer 1: webhook secret (query param)
SECRET="$(grep ABACATEPAY_WEBHOOK_SECRET .env.local | cut -d= -f2)"
PURCHASE_CODE="TROCAR_PELO_CODE"

# Payload v2 checkout.completed
BODY="{\"event\":\"checkout.completed\",\"apiVersion\":2,\"devMode\":true,\"data\":{\"checkout\":{\"id\":\"bill_test456\",\"externalId\":\"${PURCHASE_CODE}\",\"amount\":3990,\"paidAmount\":3990,\"status\":\"PAID\",\"methods\":[\"PIX\"]},\"customer\":{\"id\":\"cust_test\",\"name\":\"Test User\",\"email\":\"test@test.com\",\"taxId\":\"123.***.***-**\"},\"payerInformation\":{\"method\":\"PIX\",\"PIX\":{\"name\":\"Test User\",\"taxId\":\"123.***.***-**\",\"isSameAsCustomer\":true}}}}"

# Layer 2: HMAC-SHA256 usando ABACATEPAY_PUBLIC_KEY (hardcoded no abacatepay.ts)
ABACATE_PUBLIC_KEY="t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9"
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$ABACATE_PUBLIC_KEY" -binary | base64)

curl -X POST "http://localhost:3000/api/webhooks/abacatepay?webhookSecret=$SECRET" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

Esperado: `{"received":true}`. A purchase deve mudar para PAID e Inngest job disparado.

---

## Checklist Vercel (Produção)

- [ ] `PAYMENT_PROVIDER=abacatepay`
- [ ] `ABACATEPAY_API_KEY=abc_prod_*`
- [ ] `ABACATEPAY_WEBHOOK_SECRET=<gerado>`
- [ ] `ABACATEPAY_PRODUCT_ID=prod_P56DhUkBx2RSdFSfNPTqrhue`
- [ ] `PRICE_CENTS=3990`
- [ ] Webhook registrado no dashboard AbacatePay com URL de produção + evento `checkout.completed`
