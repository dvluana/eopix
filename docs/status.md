# Status Vivo — EOPIX

**Atualizado em:** 2026-03-05
**Branch atual:** develop
**Modo de execução:** MOCK_MODE=true (local) / TEST_MODE validado com APIs reais

## O que está funcionando ✓

- Payment provider abstraction (Stripe + AbacatePay dual-mode via `PAYMENT_PROVIDER`)
- Stripe checkout + webhook
- AbacatePay checkout + webhook (`billing.paid`)
- Pipeline Inngest básico (cache + APIFull)
- Relatório display (page.tsx)
- Modos MOCK/TEST/LIVE
- **lib/inngest.ts refatorado** (3 módulos + barrel export)
- **E2E tests com Playwright** — 25/25 passando (smoke, purchase flows CPF/CNPJ, report content, error handling)
- **GitHub Actions CI** (mock obrigatório em PRs, integration nightly, Neon branching)
- **Migration paymentProvider/paymentExternalId** aplicada no Neon develop
- **Docs dual-mode completos** (architecture, custos, modos — todos referenciam Stripe + AbacatePay)
- **Pipeline TEST_MODE validado com APIs reais** — CPF Chuva (`006.780.809-33`), todas as 7 etapas OK (cadastral, financeiro, processos, Serper, OpenAI×2, summary). SearchResult 91KB.

## Débitos técnicos / Próximos passos

- Extrair hook use-report-data
- Criar `src/types/domain.ts` (Purchase, User, entidades DB) — planejado, ainda não existe
- Implementar use-report-polling hook para SSE
- Configurar GitHub Secrets (`NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`)

## Últimas mudanças

- **Fix APIFull endpoints (final)** (2026-03-05): URLs corrigidas (`/consulta` → `/api/{link}`), links mantidos originais (`r-cpf-completo`, `srs-premium`, `r-acoes-e-processos-judiciais`, `ic-dossie-juridico`), params corrigidos por endpoint (`cpf` vs `document`), `User-Agent: EOPIX/1.0` adicionado (obrigatório, Apache retorna 403 sem). Testado com curl em cada endpoint + pipeline completo CPF Chuva com sucesso.
- **Teste manual CPF Chuva com APIs reais** (2026-03-05): Neon branch isolado `test/manual-cpf-chuva`, purchase `UJ9HC2` processada com sucesso. Todas as APIs responderam: APIFull (cadastral 1.3KB, financeiro 1.2KB, processos 74.9KB), Serper (3.3KB), OpenAI (análise 10.6KB, resumo financeiro 239B, summary 271B). Purchase COMPLETED, relatório renderizável.
- **Fix 9 falhas E2E** (2026-03-05): race condition auto-login em `confirmacao/page.tsx` (auto-login agora executa ANTES de setPageState), título regex em smoke test (`/E o Pix/i`), selector ambíguo CPF em report-content (`getByRole('heading')`). Resultado: 25/25 passando.
- **E2E global-setup/teardown reescritos com raw SQL** (2026-03-05): substituídos PrismaClient por pg direto para evitar conflito de schema, seed de admin via INSERT raw, cleanup via DELETE raw. 14/25 passaram imediatamente.
- **Finalização migração AbacatePay** (2026-03-05): migration `paymentProvider`/`paymentExternalId` aplicada no Neon develop + backfill, docs atualizados (architecture.md dual-mode sequence diagram, custos-e-fluxo-processamento.md com ambos providers, modos-de-execucao.md com credenciais de teste), `fluxo-sistema.md` arquivado (Stripe-only, superseded por architecture.md), README.md atualizado.
- **E2E Testing + CI/CD** (2026-03-04): Playwright E2E tests (smoke, purchase-flow-cpf, purchase-flow-cnpj, report-content, error-handling), GitHub Actions workflows (e2e-tests.yml com matrix mock/integration + Neon branching, neon-cleanup.yml), helpers (api-client, admin-auth, test-data, wait-for-status), purchase fixture. Comando: `npm run test:e2e`.
- **Migração Stripe → AbacatePay (dual-mode)** (2026-03-05): abstraction layer `src/lib/payment.ts`, SDK wrapper `src/lib/abacatepay.ts`, webhook handler `/api/webhooks/abacatepay`, Prisma fields `paymentProvider`/`paymentExternalId`, cron `autoRefundFailedPurchases` removido (refund agora manual-only via admin). Rollback: `PAYMENT_PROVIDER=stripe`.
- **docs/modos-de-execucao.md reescrito** (2026-03-04): tabela expandida com todos os serviços por modo, pipeline por modo (LIVE/TEST/MOCK), seção de mocks com cenários Chuva/Sol e localização de arquivos, seção de Sentry com pontos de captura e configuração, checklist atualizado
- **2026-03-04** — Auditoria de documentação: AGENTS.md removido, referências legacy corrigidas em 6 docs, CLAUDE.md expandido com MCPs/Branch/Neon policy
- **2026-03-04** — lib/inngest.ts refatorado em 3 módulos (client.ts, process-search.ts, crons.ts) com barrel export zero-break
- 2026-03-04 — Arquivos legacy arquivados + api-contracts divididos
- 2026-03-04 — architecture.md com Mermaid criado

**Regra para IA:** Após qualquer edição significativa, atualize esta seção automaticamente.
