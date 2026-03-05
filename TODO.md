## Concluído nesta sessão

- [x] **Remover estado `pending_payment` da confirmação** — PageState simplificado, PENDING→approved na UI, polling removido, auto-login para todos, E2E atualizado
- [x] **Limpar tela de confirmação** — removidos "Buscando dados..." e "Enviamos para {email}", botão unificado "ACOMPANHAR MEU RELATORIO"
- [x] **Teste AbacatePay MOCK_MODE** — fluxo completo validado
- [x] **Teste manual CPF Chuva com APIs reais (TEST_MODE)** — pipeline completo validado
- [x] **Fix APIFull endpoints** — URLs `/api/{link}`, links e params corretos, User-Agent adicionado

## Pendências consolidadas

### Auth & vínculo purchase→usuário
- [ ] Verificar se Google OAuth funciona em produção (localhost OK, testar com domínio real)
- [ ] Tratar falha silenciosa de auto-login na confirmação (ex: botão "Fazer login com Google" como fallback)
- [ ] Considerar verificação de email (hoje email é trusted sem confirmação)

### UX de processamento
- [x] Polling PROCESSING→COMPLETED na confirmação — progresso visual (spinner + barra + dots) + transição automática
- [x] Fix SSE/polling minhas-consultas — dependency array + fallback interval leak

### AbacatePay
- [ ] Deletar branch Neon `br-cold-field-aik2eumi` via MCP `delete_branch`

### Infra
- [ ] Configurar GitHub Secrets (`NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`)

### Débitos técnicos
- [ ] Extrair hook use-report-data
- [ ] Criar `src/types/domain.ts`

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
