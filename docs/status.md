# Status Vivo — EOPIX

**Atualizado em:** 2026-03-05
**Branch atual:** develop
**Modo de execução:** MOCK_MODE=true (local)

## O que está funcionando ✓

- Payment provider abstraction (Stripe + AbacatePay dual-mode via `PAYMENT_PROVIDER`)
- Stripe checkout + webhook
- AbacatePay checkout + webhook (`billing.paid`)
- Pipeline Inngest básico (cache + APIFull)
- Relatório display (page.tsx)
- Modos MOCK/TEST/LIVE
- **lib/inngest.ts refatorado** (3 módulos + barrel export)
- **E2E tests com Playwright** (smoke, purchase flows CPF/CNPJ, report content, error handling)
- **GitHub Actions CI** (mock obrigatório em PRs, integration nightly, Neon branching)
- **Migration paymentProvider/paymentExternalId** aplicada no Neon develop
- **Docs dual-mode completos** (architecture, custos, modos — todos referenciam Stripe + AbacatePay)

## Débitos técnicos / Próximos passos

- Extrair hook use-report-data
- Criar `src/types/domain.ts` (Purchase, User, entidades DB) — planejado, ainda não existe
- Implementar use-report-polling hook para SSE
- Configurar GitHub Secrets (`NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`)

## Últimas mudanças

- **Finalização migração AbacatePay** (2026-03-05): migration `paymentProvider`/`paymentExternalId` aplicada no Neon develop + backfill, docs atualizados (architecture.md dual-mode sequence diagram, custos-e-fluxo-processamento.md com ambos providers, modos-de-execucao.md com credenciais de teste), `fluxo-sistema.md` arquivado (Stripe-only, superseded por architecture.md), README.md atualizado.
- **E2E Testing + CI/CD** (2026-03-04): Playwright E2E tests (smoke, purchase-flow-cpf, purchase-flow-cnpj, report-content, error-handling), GitHub Actions workflows (e2e-tests.yml com matrix mock/integration + Neon branching, neon-cleanup.yml), helpers (api-client, admin-auth, test-data, wait-for-status), purchase fixture. Comando: `npm run test:e2e`.
- **Migração Stripe → AbacatePay (dual-mode)** (2026-03-05): abstraction layer `src/lib/payment.ts`, SDK wrapper `src/lib/abacatepay.ts`, webhook handler `/api/webhooks/abacatepay`, Prisma fields `paymentProvider`/`paymentExternalId`, cron `autoRefundFailedPurchases` removido (refund agora manual-only via admin). Rollback: `PAYMENT_PROVIDER=stripe`.
- **docs/modos-de-execucao.md reescrito** (2026-03-04): tabela expandida com todos os serviços por modo, pipeline por modo (LIVE/TEST/MOCK), seção de mocks com cenários Chuva/Sol e localização de arquivos, seção de Sentry com pontos de captura e configuração, checklist atualizado
- **2026-03-04** — Auditoria de documentação: AGENTS.md removido, referências legacy corrigidas em 6 docs, CLAUDE.md expandido com MCPs/Branch/Neon policy
- **2026-03-04** — lib/inngest.ts refatorado em 3 módulos (client.ts, process-search.ts, crons.ts) com barrel export zero-break
- 2026-03-04 — Arquivos legacy arquivados + api-contracts divididos
- 2026-03-04 — architecture.md com Mermaid criado

**Regra para IA:** Após qualquer edição significativa, atualize esta seção automaticamente.
