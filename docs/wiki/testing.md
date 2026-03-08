---
title: "Testing"
---

## Modos de Execução

| Aspecto | MOCK_MODE | TEST_MODE | LIVE |
|---|---|---|---|
| APIFull | Mock | Real | Real |
| Serper | Mock | Real | Real |
| OpenAI | Mock | Real | Real |
| Pagamento | Bypass | Bypass | Real (AbacatePay) |
| Inngest | Fallback síncrono | Fallback síncrono | Async real |
| Custo | Zero | Real (APIs) | Real (tudo) |

## Cenários Chuva/Sol (Mock)

Último dígito do documento determina cenário:
- **0-4 (Chuva):** Processos, protestos, pendências
- **5-9 (Sol):** Histórico limpo

Arquivos: `src/lib/mocks/apifull-data.ts`, `google-data.ts`, `openai-data.ts`

## Credenciais de Teste

- **AbacatePay sandbox:** Key com prefixo `abc_dev_*`
- **Cartão teste:** `4242 4242 4242 4242`
- **Admin E2E:** `e2e-admin@eopix.test` / `E2eAdminPass!2026`
- **CPF teste (Chuva):** `006.780.809-33`

## E2E com Playwright

```bash
# Mock (rápido, zero custo)
npm run test:e2e:mock

# Real (Neon branch isolado, TTL 1h)
npm run test:e2e
```

Estrutura: `e2e/tests/` (smoke, purchase-flow-cpf, purchase-flow-cnpj, report-content, error-handling)

## CI/CD (GitHub Actions)

| Job | Modo | Trigger | Custo |
|---|---|---|---|
| mock | MOCK_MODE=true | PR + push develop | Zero |
| integration | TEST_MODE=true | Nightly 03:00 UTC | Real |

Neon branching: CI cria `ci/{name}-{run_id}`, deleta automaticamente.

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Setup" icon="gear" href="/wiki/setup">
    Configuracao do ambiente
  </Card>
  <Card title="Modos de Execucao" icon="sliders" href="/modos-de-execucao">
    MOCK, TEST, LIVE detalhado
  </Card>
</CardGroup>
