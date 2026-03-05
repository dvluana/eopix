## Concluído nesta sessão

- [x] **Remover estado `pending_payment` da confirmação** — PageState simplificado, PENDING→approved na UI, polling removido, auto-login para todos, E2E atualizado
- [x] **Teste AbacatePay MOCK_MODE** — fluxo completo validado
  - Purchase creation com `paymentProvider: "abacatepay"` confirmado no DB
  - Webhook `billing.paid` simulado com HMAC-SHA256 + secret — processou corretamente (PENDING → PAID)
  - Idempotency: webhook duplicado retorna `{ received: true, duplicate: true }`
  - Security: wrong secret → 401, wrong signature → 401
  - Processing via sync fallback — mock data (Chuva + Sol) → COMPLETED
  - Report pages renderizam (HTTP 200)
  - Test data cleaned up
- [x] **Teste manual CPF Chuva com APIs reais (TEST_MODE)** — pipeline completo validado
  - Purchase `UJ9HC2` → COMPLETED, SearchResult 91KB, relatório OK
  - Todas as 7 APIs responderam: cadastral, financeiro, processos, Serper, OpenAI×3
- [x] **Fix APIFull endpoints** — URLs `/api/{link}`, links e params corretos, User-Agent adicionado

## Cleanup pendente

- [ ] Deletar branch Neon `br-cold-field-aik2eumi` via MCP `delete_branch`

## Próximo

- [ ] Polling PROCESSING→COMPLETED na página de confirmação (SSE ou polling para transição automática approved→completed)
- [ ] Extrair hook use-report-data
- [ ] Criar `src/types/domain.ts`
- [ ] Configurar GitHub Secrets (`NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`)

## Referência rápida — APIFull endpoints (testados e confirmados)

| Endpoint | URL | Link | Param |
|---|---|---|---|
| CPF Cadastral | `/api/r-cpf-completo` | `r-cpf-completo` | `cpf` |
| CPF Processos | `/api/r-acoes-e-processos-judiciais` | `r-acoes-e-processos-judiciais` | `cpf` |
| CPF/CNPJ Financeiro | `/api/srs-premium` | `srs-premium` | `document` |
| CNPJ Dossiê | `/api/ic-dossie-juridico` | `ic-dossie-juridico` | `document` |

Padrão: URL = `https://api.apifull.com.br/api/{link}`, User-Agent obrigatório.

## Decisões importantes

- APIFull exige `User-Agent` header (403 sem ele)
- `srs-premium` retorna formato `dados.data.serasaPremium` (usado pelos mappers). `serasa-premium` retorna formato diferente (`dados.HEADER`) — NÃO usar.
- TEST_MODE sem Inngest: usar fluxo de 2 passos (mark-paid + process-search)
- Neon MCP cria branch do main por default — rodar `prisma migrate deploy` após criar
- Admin endpoints em `/api/admin/*` (login em `/api/admin/login`)
