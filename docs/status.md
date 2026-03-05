# Status Vivo — EOPIX

**Atualizado em:** 2026-03-05
**Branch atual:** develop
**Modo de execução:** MOCK_MODE=true (local) / TEST_MODE validado com APIs reais

## O que está funcionando ✓

- AbacatePay checkout + webhook (`billing.paid`)
- Pipeline Inngest básico (cache + APIFull)
- Relatório display (page.tsx)
- Modos MOCK/TEST/LIVE
- **lib/inngest.ts refatorado** (3 módulos + barrel export)
- **E2E tests com Playwright** — 25/25 passando (smoke, purchase flows CPF/CNPJ, report content, error handling)
- **GitHub Actions CI** (mock obrigatório em PRs, integration nightly, Neon branching)
- **Migration paymentProvider/paymentExternalId** aplicada no Neon develop
- **Docs atualizados** (architecture, custos, modos — AbacatePay only)
- **Pipeline TEST_MODE validado com APIs reais** — CPF Chuva (`006.780.809-33`), todas as 7 etapas OK (cadastral, financeiro, processos, Serper, OpenAI×2, summary). SearchResult 91KB.
- **AbacatePay webhook testado em MOCK_MODE** — `billing.paid` simulado com HMAC + secret, idempotency OK, security validation OK (wrong secret/signature → 401). Fluxo completo: purchase creation → webhook → mark-paid → process → COMPLETED.

- **Confirmação limpa** — removidos "Buscando dados..." e "Enviamos para {email}", botão unificado "ACOMPANHAR MEU RELATORIO", handoff limpo para `/minhas-consultas`
- **Progresso visual na confirmação** — estado `approved` mostra spinner + barra de progresso + dots (6 etapas), polling 2s atualiza progresso, transição automática para `completed`
- **SSE/polling minhas-consultas corrigido** — dependency array fix (hasProcessing como variável derivada), fallback polling leak corrigido
- **Validação pós-commit** — tsc, lint e E2E 25/25 passando após progresso confirmação + fix SSE
- **GoogleLoginButton componente reutilizável** — extraído de minhas-consultas, usado como fallback na confirmação quando auto-login falha
- **Monitoramento de saldos API no admin health** — APIFull (balance real, threshold R$30), Serper (credits, threshold 500), OpenAI (conectividade). Mock mode com valores simulados. Frontend mostra saldo verde/vermelho com ícone de alerta.
- **Branch Neon orphan deletado** — `br-cold-field-aik2eumi` removido via MCP
- **Hooks extraídos** — `use-report-data` (fetch + transform do relatório), `use-purchase-polling` (SSE + fallback polling), `PROCESSING_STEPS` centralizado
- **`src/types/domain.ts` criado** — Purchase, User, AdminPurchase, DocumentType, PaymentProvider, PROCESSING_STEPS
- **Go-live fixes aplicados** — OpenAI lazy init (build blocker fix), 5 DEBUG console.logs removidos (LGPD), AbacatePay customer cleanup (cellphone/name removidos), default payment provider → `abacatepay`, migration aplicada no Neon main
- **`isBypassPayment` flag** — Bypass de pagamento separado do `isBypassMode`. Permite `MOCK_MODE=true` + `BYPASS_PAYMENT=false` para testar checkout real (sandbox) com APIs mockadas.
- **Email removido da consulta** — Campo de email removido de `/consulta/[term]`. Email agora capturado do webhook AbacatePay (`billing.paid → customer.metadata.email`). Guest users criados com placeholder email, atualizados após checkout. AbacatePay SDK usa placeholder quando email não fornecido.
- **CPF/CNPJ sem censura** — Masking com `***` removido de 9 arquivos (8 API routes + PersonInfoCard). Substituído por `formatDocument()` de `@/lib/validators` (formatação completa sem censura). `maskTerm()` removida da consulta page.
- **Fix 500 sem API key** — Auto-fallback para bypass quando `ABACATEPAY_API_KEY` não configurado (dev sem MOCK_MODE). Log de warning ao ativar.

## Débitos técnicos / Próximos passos

- ~~Configurar GitHub Secrets~~ ✓ — `NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY` todos configurados

## Últimas mudanças

- **Fix 500 + remove email + uncensor CPF/CNPJ** (2026-03-05): (1) Auto-fallback bypass quando `ABACATEPAY_API_KEY` ausente — evita 500 em dev. (2) Email removido de `/consulta/[term]` — campo, trust badge "Por email", texto "enviado por email" removidos. Backend: email agora opcional, guest users com `guest-{code}@guest.eopix.app`, webhook `billing.paid` captura email real e atualiza User. (3) CPF/CNPJ desmascarado em 9 arquivos — inline regex com `***` substituído por `formatDocument()` de validators.ts. `maskCnpj()` removida de PersonInfoCard. E2E tests atualizados (email não mais obrigatório). tsc e lint clean.
- **`isBypassPayment` — bypass de pagamento independente** (2026-03-05): Novo flag `isBypassPayment` em `mock-mode.ts` com override via `BYPASS_PAYMENT` env var. `abacatepay.ts`, `stripe.ts` e `purchases/route.ts` agora usam `isBypassPayment` nos code paths de pagamento. Sem `BYPASS_PAYMENT` no env, comportamento 100% backward compatible. Permite `MOCK_MODE=true BYPASS_PAYMENT=false` para testar checkout AbacatePay sandbox com APIs mockadas (custo zero). Docs atualizados.
- **Go-live production fixes** (2026-03-05): OpenAI client lazy init (fix build blocker — `new OpenAI()` no import falhava sem env var). 5 DEBUG console.logs removidos de `apifull.ts` (vazavam dados pessoais completos — CPF, nome, endereço, processos). AbacatePay customer: removidos `cellphone` e `name` fake do inline customer. Default `PAYMENT_PROVIDER` trocado de `'stripe'` para `'abacatepay'`. Migration `add_payment_provider` aplicada no Neon main (produção). Build, tsc, lint validados.
- **Go-live: Stripe removido, AbacatePay only** (2026-03-05): Todas as referências a Stripe removidas dos docs ativos (CLAUDE.md, architecture.md, custos, modos, abacatepay-api.md, status.md). Seções de comparação/migração Stripe→AbacatePay removidas do abacatepay-api.md (migração concluída). Stripe env vars removidas da Vercel. `.env.production.local` criado com keys de produção AbacatePay. Vercel env vars de produção configuradas (7 novas: PAYMENT_PROVIDER, ABACATEPAY_*, TEST_MODE, INNGEST_DEV, GOOGLE_CLIENT_ID, NEXT_PUBLIC_GOOGLE_CLIENT_ID).
- **Hooks + domain.ts** (2026-03-05): `use-report-data` hook extrai fetch/parse/transform do relatório. `use-purchase-polling` hook extrai SSE + fallback polling. `src/types/domain.ts` com Purchase, User, AdminPurchase, PROCESSING_STEPS. Confirmação e minhas-consultas refatorados para usar tipos/hooks centralizados.
- **Monitoramento de saldos API + go-live prep** (2026-03-05): Health endpoint estendido com checks de balance (APIFull R$, Serper credits, OpenAI conectividade). Admin health page mostra saldo com cores (verde/vermelho) e ícone de alerta para low balance. TODO.md reescrito com checklist go-live consolidado. Branch Neon orphan deletado.
- **GoogleLoginButton fallback na confirmação** (2026-03-05): Componente `GoogleLoginButton` extraído de minhas-consultas e reutilizado na confirmação como fallback quando auto-login falha. TODO atualizado (verificação de email removida — risco baixo).
- **Validação pós-commit + lint fix** (2026-03-05): tsc clean, lint fix (`loginRes` unused removido em confirmacao/page.tsx), E2E 25/25 passando. Progresso visual e SSE fix validados end-to-end.
- **Progresso visual na confirmação + fix SSE minhas-consultas** (2026-03-05): Estado `approved` na confirmação agora mostra spinner + barra de progresso + dots (6 etapas), polling 2s atualiza `processingStep`, transição automática para `completed`. Em minhas-consultas: dependency array do SSE effect corrigido (hasProcessing extraído como variável derivada), fallback polling interval agora limpo no cleanup (memory leak fix).
- **Limpar tela de confirmação** (2026-03-05): Removidos "Buscando dados..." (spinner estático) e "Enviamos para {email}" (email nunca é enviado). Botão unificado "ACOMPANHAR MEU RELATORIO" (auto-login já aconteceu). Estado `isLoggedIn` removido. Confirmação agora é handoff limpo para `/minhas-consultas` onde tracking real (SSE, 6 steps) acontece.
- **Remover estado `pending_payment` da confirmação** (2026-03-05): Estado `pending_payment` removido do PageState — no fluxo LIVE o usuário só chega à página após pagar, então PENDING no DB é tratado como `approved` na UI. Polling de pagamento removido. Auto-login agora executa para todos os status. E2E test atualizado. Débito técnico registrado: falta polling PROCESSING→COMPLETED.
- **Teste AbacatePay MOCK_MODE** (2026-03-05): Fluxo completo testado — purchase com `paymentProvider: abacatepay` no DB, webhook `billing.paid` simulado (HMAC-SHA256 + secret validation), idempotency (duplicate → ignored), security (wrong secret/signature → 401), processing via sync fallback com mock data (Chuva + Sol), relatórios renderizam OK.
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
