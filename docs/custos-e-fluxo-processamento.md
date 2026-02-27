# Custos E Fluxo De Processamento

Referencia tecnica de custo aproximado por consulta e pipeline atual.

## 1. Preco De Venda

- `PRICE_CENTS=2990`
- Preco final: R$ 29,90

## 2. Custo Estimado Por Consulta (CPF)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `r-cpf-completo` | R$ 0,80 |
| APIFull | `r-acoes-e-processos-judiciais` | R$ 4,14 |
| APIFull | `srs-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,01 |
| Stripe | taxa transacao | varia por meio |

## 3. Custo Estimado Por Consulta (CNPJ)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `ic-dossie-juridico` | R$ 11,76 |
| APIFull | `srs-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,005 |
| Stripe | taxa transacao | varia por meio |

## 4. Pipeline Atual

Entrada live:
- `POST /api/purchases` -> checkout Stripe
- `POST /api/webhooks/stripe` -> confirma e dispara job

Eventos Stripe relevantes:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

Pipeline Inngest:
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
- Stripe em bypass
- processamento pode ser disparado manualmente via admin
- fallback sincrono em `/api/process-search/[code]`

## 6. Alertas E Limites

- Evitar usar modo `TEST_MODE` sem necessidade (consome credito real)
- Monitorar custo APIFull por tipo (CPF x CNPJ)
- Revisar periodicamente custo Stripe por metodo de pagamento
