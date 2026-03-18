# AbacatePay — Referência de Credenciais

> **Atualizado:** 2026-03-17
> **Valores reais:** `.env.local` (sandbox) e `.env.production.local` (produção) — ambos gitignored

---

## Env Vars Necessárias

| Variável | Descrição | Onde configurar |
|---|---|---|
| `ABACATEPAY_API_KEY` | API key com prefixo `abc_dev_*` (sandbox) ou `abc_prod_*` (produção) | `.env.local` / Vercel |
| `ABACATEPAY_WEBHOOK_SECRET` | Secret gerado com `openssl rand -hex 32` — configurado no dashboard AbacatePay ao registrar o webhook | `.env.local` / Vercel |
| `PAYMENT_PROVIDER` | Sempre `abacatepay` | `.env.local` / Vercel |

> `ABACATEPAY_PRODUCT_ID` foi removido — produto criado inline na billing com `externalId: 'relatorio-risco'` (fixo, deduplicado automaticamente).

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
billing.paid
```

### Gerar novo secret

```bash
openssl rand -hex 32
```

---

## Verificar Assinatura HMAC

O handler em `src/app/api/webhooks/abacatepay/route.ts` valida dois layers:

1. **Layer 1:** `?webhookSecret=` na query string deve bater com `ABACATEPAY_WEBHOOK_SECRET`
2. **Layer 2:** Header `x-webhook-signature` validado com HMAC-SHA256 usando a chave pública da AbacatePay (hardcoded em `abacatepay.ts`)

---

## Ambientes

| Ambiente | API Key | Webhook Secret | Arquivo |
|---|---|---|---|
| Local / Sandbox | `abc_dev_*` | gerado com openssl | `.env.local` |
| Produção | `abc_prod_*` | gerado com openssl | `.env.production.local` + Vercel |

---

## Simular Webhook em Dev

```bash
SECRET="$(grep ABACATEPAY_WEBHOOK_SECRET .env.local | cut -d= -f2)"
BODY='{"event":"billing.paid","data":{"billing":{"id":"bill_TEST123","status":"PAID","products":[{"externalId":"relatorio-risco","quantity":1}],"customer":{"id":"cust_TEST","metadata":{"email":"test@test.com","name":"Test User"}}}}}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64)

curl -X POST "http://localhost:3000/api/webhooks/abacatepay?webhookSecret=$SECRET" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

---

## Checklist Vercel (Produção)

- [ ] `PAYMENT_PROVIDER=abacatepay`
- [ ] `ABACATEPAY_API_KEY=abc_prod_*`
- [ ] `ABACATEPAY_WEBHOOK_SECRET=<gerado>`
- [ ] Webhook registrado no dashboard AbacatePay com URL de produção + evento `billing.paid`
