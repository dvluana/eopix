# Custos E Fluxo De Processamento

Referencia tecnica de custo aproximado por consulta e pipeline atual.

## 1. Preco De Venda

- `PRICE_CENTS=2990`
- Preco final: R$ 29,90

## 2. Custo Estimado Por Consulta (CPF)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `ic-cpf-completo` | R$ 0,80 |
| APIFull | `r-acoes-e-processos-judiciais` | R$ 4,14 |
| APIFull | `serasa-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,01 |
| Payment provider (Stripe ou AbacatePay) | taxa transacao | varia por meio/provider |

## 3. Custo Estimado Por Consulta (CNPJ)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `ic-dossie-juridico` | R$ 11,76 |
| APIFull | `serasa-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,005 |
| Payment provider (Stripe ou AbacatePay) | taxa transacao | varia por meio/provider |

## 4. Pipeline Atual

O provider de pagamento é determinado pela env var `PAYMENT_PROVIDER` (default: `stripe`).

### PAYMENT_PROVIDER=stripe

Entrada live:
- `POST /api/purchases` → checkout Stripe
- `POST /api/webhooks/stripe` → confirma e dispara job

Eventos Stripe relevantes:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

### PAYMENT_PROVIDER=abacatepay

Entrada live:
- `POST /api/purchases` → AbacatePay billing create
- `POST /api/webhooks/abacatepay` → confirma e dispara job

Eventos AbacatePay relevantes:
- `billing.paid`

### Pipeline Inngest (igual para ambos providers)

- `check-cache`
- `process-all`

`process-all` executa:
- APIFull (cadastral/financeiro/processos)
- Serper
- OpenAI
- persistencia de `SearchResult`
- `Purchase -> COMPLETED`

## 5. Bypass/Teste

Quando `MOCK_MODE` ou `TEST_MODE`:
- Pagamento em bypass (ambos providers igualmente)
- processamento pode ser disparado manualmente via admin
- fallback sincrono em `/api/process-search/[code]`

## 6. Reembolsos

- **Stripe:** refund via API (`processRefund` em `src/lib/payment.ts`) ou dashboard Stripe
- **AbacatePay:** refund apenas via dashboard AbacatePay (sem API de refund)
- Reembolsos são manuais — gerenciados pelo admin via painel

## 7. Alertas E Limites

- Evitar usar modo `TEST_MODE` sem necessidade (consome credito real)
- Monitorar custo APIFull por tipo (CPF x CNPJ)
- Revisar periodicamente custo do payment provider por metodo de pagamento
