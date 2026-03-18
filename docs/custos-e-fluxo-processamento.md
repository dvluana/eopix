---
title: "Custos e Pipeline"
---

Referencia tecnica de custo aproximado por consulta e pipeline atual.

## 1. Preco De Venda

- `PRICE_CENTS=3990`
- Preco final: R$ 39,90

## 2. Custo Estimado Por Consulta (CPF)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `r-cpf-completo` | R$ 0,80 |
| APIFull | `r-acoes-e-processos-judiciais` | R$ 4,14 |
| APIFull | `srs-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,01 |
| AbacatePay | taxa transacao | varia por meio/provider |

## 3. Custo Estimado Por Consulta (CNPJ)

| Servico | Endpoint/uso | Custo aproximado |
|---|---|---:|
| APIFull | `ic-dossie-juridico` | R$ 11,76 |
| APIFull | `srs-premium` | R$ 6,96 |
| Serper | busca web | R$ 0,00 (faixa free) |
| OpenAI | `gpt-4o-mini` | ~R$ 0,005 |
| AbacatePay | taxa transacao | varia por meio/provider |

## 4. Pipeline Atual

Entrada live:
- `POST /api/purchases` → AbacatePay billing create
- `POST /api/webhooks/abacatepay` → confirma e dispara job

Evento relevante:
- `billing.paid`

### Pipeline Inngest

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
- Pagamento em bypass
- processamento pode ser disparado manualmente via admin
- fallback sincrono em `/api/process-search/[code]`

## 6. Reembolsos

- Refund via dashboard AbacatePay (sem API de refund)
- Reembolsos são manuais — gerenciados pelo admin via painel

## 7. Alertas E Limites

- Evitar usar modo `TEST_MODE` sem necessidade (consome credito real)
- Monitorar custo APIFull por tipo (CPF x CNPJ)
- Revisar periodicamente taxa AbacatePay por metodo de pagamento
