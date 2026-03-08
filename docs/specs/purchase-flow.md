---
title: "Purchase Flow"
---

## Estados

```
PENDING → PAID → PROCESSING → COMPLETED
                            → FAILED → REFUNDED
```

## Fluxo Principal (LIVE)

1. User submete CPF/CNPJ em `/consulta/[term]`
2. Frontend POST `/api/purchases` com document + metadata
3. Backend valida rate limit, blocklist, duplicata (409 se já existe relatório)
4. Cria Purchase(PENDING) + User (ou reutiliza)
5. Cria billing no AbacatePay (produto inline com externalId fixo)
6. Retorna checkout URL → frontend redireciona
7. User paga (PIX/cartão)
8. AbacatePay envia webhook `billing.paid` → `/api/webhooks/abacatepay`
9. Webhook marca Purchase PAID + dispara Inngest `search/process`
10. Pipeline processa → Purchase COMPLETED
11. User vê relatório em `/relatorio/[id]`

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

## Docs Relacionados

<CardGroup cols={2}>
  <Card title="Arquitetura" icon="sitemap" href="/architecture">
    State machine e bounded contexts
  </Card>
  <Card title="API Contracts" icon="file-contract" href="/api-contracts/cpf-cadastral">
    Contratos APIFull
  </Card>
</CardGroup>
