# CLAUDE.md — EOPIX (Next.js 14 SaaS de verificação de risco)

## Contexto do Projeto

SaaS brasileiro de relatório CPF/CNPJ com compra única (R$29,90). Fluxo: AbacatePay → Inngest async → APIFull + Serper + OpenAI → relatório consolidado (TTL 7 dias).

## Stack & Modos

Next.js 14 App Router · TypeScript strict · Prisma/Neon · AbacatePay · Inngest · OpenAI gpt-4o-mini · APIFull · Serper · Sentry · Tailwind + Radix.
Modos: MOCK_MODE=true (local), TEST_MODE=true (APIs reais sem pagamento).

## Regras Obrigatórias (NUNCA QUEBRE)

- Trabalhe SEMPRE em `develop`. NUNCA commit em `main`.
- Source of truth de APIs: `@docs/api-contracts/` (nunca docs/valores apis e dados.md antigo).
- Tipos centrais: `@src/types/report.ts` e `@src/types/domain.ts`.
- Após qualquer edição: atualize `@docs/status.md` e marque tarefas.
- Após alterar fluxo de produto: atualizar spec correspondente em `docs/specs/`.
- Após alterar configuração/operacional: atualizar wiki em `docs/wiki/`.
- Prefira Server Components; “use client” só para interatividade.
- Validações server-side com Zod.

## Mapa do projeto (vá direto, não explore)
- `app/`                   → App Router, pages, layouts
- `app/api/purchases/`     → Rota de compra e webhook AbacatePay
- `app/api/admin/`         → Login (`/login`), purchases, mark-paid, process, refund
- `app/api/inngest/`       → Handler Inngest
- `app/relatorio/[id]/`    → Página de resultado
- `components/`            → UI reutilizável
- `lib/`                   → Prisma client, utilitários
- `src/types/report.ts`    → Tipos centrais — fonte de verdade
- `prisma/`                → Schema e migrations
- `docs/wiki/`             → Conhecimento operacional (setup, testing, deploy, admin, inngest)
- `docs/specs/`            → Specs de produto vivas (purchase-flow, report-pipeline, auth)
- `docs/api-contracts/`    → Contratos por serviço externo
- `docs/external/`         → Docs crawleadas (AbacatePay, etc.)
- `docs/`                  → Leia APENAS se referenciado explicitamente

## NUNCA ABRA
node_modules/ · .next/ · dist/ · coverage/ · .git/ · *.lock

## Ao iniciar
Leia TODO.md e entenda onde parei.

## Ao pausar ou terminar tarefa
Atualize TODO.md antes de parar.

## Referências (leia sob demanda, não automaticamente)

- Arquitetura: @docs/architecture.md (Mermaid diagrams)
- Status vivo: @docs/status.md
- Specs de produto: @docs/specs/ (purchase-flow, report-pipeline, auth)
- Wiki operacional: @docs/wiki/ (setup, testing, deploy, admin, inngest, claude-workflow)
- Contratos API: @docs/api-contracts/
- AbacatePay docs: @docs/external/abacatepay/api-v2-condensed.md

## Comandos

- dev: npm run dev
- lint/test: npm run lint && npx vitest run
- e2e: npm run test:e2e (Playwright, requer MOCK_MODE=true + dev server)
- prisma: npx prisma studio / migrate dev

## Branch e Neon Policy

- Branch de trabalho: `develop`. NUNCA commit em `main`.
- Neon dev/teste: branch `develop`. Neon `main` é produção-only.
- Nunca rodar migrations/seeds contra Neon `main`.
- MCP `create_branch` cria do default (main). Para branches de teste, rodar `prisma migrate deploy` após criar.

## MCP Usage Policy

Quando disponível, prefira ferramentas MCP sobre fluxos manuais:
- `neon` MCP para inspeção de projeto/branch/database e connection strings.
- `vercel` MCP para checks de deployment/runtime.
- `chrome` MCP para diagnósticos de browser e investigação end-to-end.

## Higiene de Documentação

- Mover docs desatualizados para `docs/archive/legacy-2026/` em vez de deletar.
- Sempre que editar pipeline, relatório ou tipos: atualize @docs/status.md.
- Após migração de payment/pipeline/fluxo: rodar `npm run test:e2e` para validar E2E.
- Rules em `.claude/rules/` auto-carregam por path — lembram de atualizar docs relevantes.
- Rules em `.claude/rules/` cobrem: admin, auth, inngest, payment, pipeline, purchases, relatorio.
- Hook `check-docs.sh` cobre todos os paths acima + mocks + prisma.
- Se criar novo modulo em `src/lib/` ou `src/app/api/`: criar rule correspondente em `.claude/rules/`.

## Operações Destrutivas (DB e Git)

- DELETE/UPDATE/DROP: afetar APENAS os registros pedidos. Nunca deletar dados extras "por limpeza".
- Mostrar SQL exato e pedir confirmação ANTES de executar operações destrutivas.
- git push, merge para main, reset --hard: sempre pedir confirmação.

## APIs Externas

- ANTES de implementar integração com API externa: ler docs em `docs/api-contracts/` ou `docs/external/`.
- Nunca adivinhar formato de request/response — ler o contrato primeiro.
- Nunca usar CPFs fictícios (ex: 123.456.789-09). Usar CPFs válidos de teste.
- Se o doc não cobre o caso: perguntar ao usuário antes de assumir.

## Workflow MCP

- Quando pedido para testar via Chrome MCP ou browser: executar imediatamente.
- NÃO entrar em plan mode quando o pedido é para testar. Testar primeiro, planejar fixes depois.

## Scoping de Tarefas

- Em tarefas de documentação, NÃO modificar código fonte.
- Se subagent modificar código inesperadamente, reverter imediatamente.

## Bug Fixing

- Bug fix NÃO está completo até ser verificado funcionando.
- Implementar fix E testar na mesma sessão (vitest + Chrome MCP se UI).
- Preferir TDD: failing test primeiro, depois implementação.
- NUNCA declarar "fix aplicado" sem evidência (test pass ou screenshot).

## Deploy

- Deploy workflow: (1) `npm run lint && npx vitest run`, (2) merge develop→main, (3) deploy Vercel, (4) verificar produção via Chrome MCP.
- Nunca pular verificação pós-deploy.