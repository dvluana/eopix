# Status Vivo — EOPIX

**Atualizado em:** 2026-03-04
**Branch atual:** develop
**Modo de execução:** MOCK_MODE=true (local)

## O que está funcionando ✓

- Stripe checkout + webhook
- Pipeline Inngest básico (cache + APIFull)
- Relatório display (page.tsx)
- Modos MOCK/TEST/LIVE
- **lib/inngest.ts refatorado** (3 módulos + barrel export)

## Débitos técnicos / Próximos passos

- Extrair hook use-report-data
- Criar `src/types/domain.ts` (Purchase, User, entidades DB) — planejado, ainda não existe
- Implementar use-report-polling hook para SSE

## Últimas mudanças

- **docs/modos-de-execucao.md reescrito** (2026-03-04): tabela expandida com todos os serviços por modo, pipeline por modo (LIVE/TEST/MOCK), seção de mocks com cenários Chuva/Sol e localização de arquivos, seção de Sentry com pontos de captura e configuração, checklist atualizado
- **2026-03-04** — Auditoria de documentação: AGENTS.md removido, referências legacy corrigidas em 6 docs, CLAUDE.md expandido com MCPs/Branch/Neon policy
- **2026-03-04** — lib/inngest.ts refatorado em 3 módulos (client.ts, process-search.ts, crons.ts) com barrel export zero-break
- 2026-03-04 — Arquivos legacy arquivados + api-contracts divididos
- 2026-03-04 — architecture.md com Mermaid criado

**Regra para IA:** Após qualquer edição significativa, atualize esta seção automaticamente.
