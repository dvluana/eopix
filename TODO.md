## Concluído nesta sessão

- [x] **Teste manual CPF Chuva com APIs reais (TEST_MODE)** — pipeline completo validado
  - Purchase `UJ9HC2` → COMPLETED, SearchResult 91KB, relatório OK
  - Todas as 7 APIs responderam: cadastral, financeiro, processos, Serper, OpenAI×3
- [x] **Fix APIFull endpoints** — URLs `/api/{link}`, links e params corretos, User-Agent adicionado

## Cleanup pendente

- [ ] Deletar branch Neon `br-cold-field-aik2eumi` via MCP `delete_branch`
- [ ] Verificar relatório renderizado no browser (`http://localhost:3000/relatorio/cmmdpqcno00027cyeklmqnqiu`)
- [ ] Testar CPF Sol, CNPJ Chuva, CNPJ Sol (podem reusar o mesmo branch Neon)

## Próximo

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
