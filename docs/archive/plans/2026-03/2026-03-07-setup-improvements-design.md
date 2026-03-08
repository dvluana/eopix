# Setup Improvements — Design Doc

> Baseado nos insights de 306 sessões (42 buggy_code, 53 wrong_approach, 21 misunderstood_request)

**Goal:** Reduzir bugs repetidos no workflow com Claude Code via regras no CLAUDE.md, hooks automáticos e limpeza de contexto desatualizado.

**Approach:** B — Hooks + CLAUDE.md (lint hook + test hook para arquivos editados + regras + cleanup MEMORY.md)

---

## 1. CLAUDE.md — 7 novas seções

### 1.1 Operações Destrutivas em DB
> Ao fazer DELETE/UPDATE/DROP, afetar APENAS os registros pedidos. Nunca deletar dados extras "por limpeza". Mostrar SQL exato e pedir confirmação antes de executar.

**Evidência:** Claude deletou users extras além do pedido, causou 500 errors em produção.

### 1.2 APIs Externas
> Antes de implementar qualquer integração com API externa: ler docs em `docs/api-contracts/` ou `docs/abacatepay-api.md`. Nunca adivinhar formato de request/response. Nunca usar CPFs fictícios (123.456.789-09). Se o doc não cobre o caso, perguntar antes.

**Evidência:** 10+ sessões de back-and-forth com AbacatePay por adivinhar em vez de ler docs.

### 1.3 Workflow: Testar via MCP imediatamente
> Quando pedido para testar via Chrome MCP ou browser, executar imediatamente — não entrar em plan mode. Testar primeiro, planejar fixes depois.

**Evidência:** Claude ficava em planning mode quando pediam pra testar via Chrome MCP.

### 1.4 Scoping de Tarefas
> Em tarefas de documentação, NÃO modificar código fonte. Se subagent modificar código inesperadamente, reverter imediatamente.

**Evidência:** Subagents modificaram UploadSpreadsheetDrawer.tsx e DashboardPage.tsx durante tarefas de docs.

### 1.5 TypeScript + Zod
> Sempre TypeScript. Validações com Zod. Rodar `npx tsc --noEmit` após editar arquivos .ts/.tsx.

**Evidência:** Zod v4 mismatch causou friction; tsc já roda via hook mas regra explícita reforça.

### 1.6 Deploy
> Deploy workflow: (1) rodar testes, (2) merge develop→main, (3) deploy, (4) verificar produção via Chrome MCP. Nunca pular verificação pós-deploy.

**Evidência:** Produção quebrou pós-deploy múltiplas vezes (500 errors AbacatePay, checkout bugs).

### 1.7 Bug Fixing
> Bug fix NÃO está completo até ser verificado. Implementar fix E testar na mesma sessão. Se Chrome MCP disponível, verificar visualmente. Preferir TDD: failing test primeiro, depois fix.

**Evidência:** 40% sessions "partially_achieved" — fix implementado mas não verificado.

---

## 2. Hooks

### 2.1 Modificar `typecheck.sh` — adicionar ESLint
- Após rodar tsc, rodar `npx eslint` no arquivo editado
- Se lint error, reportar mas NÃO bloquear (exit 0 com warning em stderr)
- Lint errors são informativos, não bloqueantes (tsc errors sim)

### 2.2 Novo `run-related-tests.sh` (PostToolUse, Edit/Write)
- Detecta arquivo editado
- Mapeia para test file por convenção: `src/lib/foo.ts` → `tests/unit/foo.test.ts`
- Se test file existe, roda `npx vitest run <test-file>`
- Se falhar: exit 2 (bloqueia) + mostra erros em stderr
- Se não encontrar test file: exit 0 (não faz nada)
- Só roda para arquivos `.ts`/`.tsx` em `src/`

### 2.3 Hooks existentes mantidos como estão
- `smart-commit.sh` (PreCompact) — auto-commit antes de compactação
- `SessionStart` — lê branch + TODO.md

---

## 3. MEMORY.md — Limpeza

### Corrigir
1. Payment provider default: `stripe` → `abacatepay`
2. Purchase states: remover `REFUND_FAILED` (não existe mais)
3. `domain.ts planned` → `domain.ts criado`

### Remover
4. Seção "Manual TEST_MODE Run — Troubleshooting Log" completa (estado de sessão específica de 2026-03-05, branch já deletado)

### Manter
- Endpoints úteis descobertos (mover para seção permanente)
- Toda a seção de Architecture Insights
- E2E Testing setup
- Documentation Status

---

## Resultado esperado

| Métrica (insights) | Antes | Depois (esperado) |
|---------------------|-------|-------------------|
| buggy_code | 42 eventos | Reduzido via test hook + TDD rule |
| wrong_approach | 53 eventos | Reduzido via API docs rule + verify rule |
| misunderstood_request | 21 eventos | Reduzido via scoping rule + DB ops rule |
| partially_achieved | 40% sessões | Reduzido via bug fixing rule |
