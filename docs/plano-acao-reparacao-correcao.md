# Plano de Acao - Reparacao e Correcao (EOPIX)

## Objetivo
Corrigir inconsistencias funcionais e de arquitetura identificadas na investigacao, reduzindo risco operacional (auth, expiracao, fluxo de processamento), alinhando documentacao e melhorando previsibilidade de manutencao.

## Escopo
- Corrigir gaps de comportamento e seguranca.
- Padronizar contratos internos (cookies, expiracao, nomenclatura).
- Alinhar docs com implementacao real.
- Adicionar validacao automatizada para evitar regressao.

## Prioridades
- **P0 (critico)**: risco de acesso indevido/quebra de fluxo.
- **P1 (alto)**: inconsistencias de produto e operacao.
- **P2 (medio)**: alinhamento de arquitetura/documentacao/UX.

## Status de Execucao (2026-02-27)
- **Concluido**
- P0.1 Unificar regra de autenticacao admin
- P0.2 Corrigir cookie de sessao no SSE
- P1.3 Padronizar expiracao de relatorio (`REPORT_TTL_HOURS`, default 168h)
- P2.5 Compatibilidade de nomenclatura (`src/inngest/index.ts`, `src/lib/ai-analysis.ts`) + docs alinhadas
- P2.6 Exibir `processAnalysis` no frontend (`ProcessAnalysisCard`)
- Parte da Fase 4: teste unitario para TTL (`tests/unit/report-ttl.test.ts`)
- **Proximo (em andamento)**
- P1.4 Consolidar contrato de processamento manual/admin (maquina de estados e guardas de transicao)

---

## Fase 1 - Estabilizacao Critica (P0)

### 1) Unificar regra de autenticacao admin
**Problema:** `requireAdmin()` aceita `ADMIN_EMAILS` ou `AdminUser`; `requireAdminAuth()` (layout admin) valida so `ADMIN_EMAILS`.  
**Risco:** admin valido via DB pode falhar no painel.

**Acoes**
1. Refatorar `src/lib/server-auth.ts` para reutilizar a mesma logica de `isAdminEmail()` de `src/lib/auth.ts`.
2. Evitar dupla fonte de verdade no layout.
3. Garantir redirecionamento consistente para `/admin/login`.

**Arquivos**
- `src/lib/server-auth.ts`
- `src/lib/auth.ts` (se precisar export auxiliar server-safe)
- `src/app/admin/(protected)/layout.tsx` (ajuste de consumo, se necessario)

**Criterios de aceite**
- Usuario presente apenas em `AdminUser` acessa `/admin`.
- Usuario fora de `AdminUser` e fora de `ADMIN_EMAILS` recebe redirect.
- APIs `/api/admin/*` e layout `/admin/*` aplicam mesma regra.

---

### 2) Corrigir inconsistência de cookie de sessao no SSE
**Problema:** auth usa `eopix_session`; `/api/purchases/stream` verifica `session`.  
**Risco:** stream pode ficar sempre nao autenticado.

**Acoes**
1. Atualizar `src/app/api/purchases/stream/route.ts` para ler `eopix_session`.
2. Reusar `getSession()` de `src/lib/auth.ts` ao inves de parse manual.
3. Garantir resposta `401` apenas quando realmente sem sessao valida.

**Arquivos**
- `src/app/api/purchases/stream/route.ts`
- `src/lib/auth.ts` (apenas se precisar adaptar helper)

**Criterios de aceite**
- Usuario autenticado recebe eventos SSE.
- Usuario sem sessao valida recebe `401`.
- Nenhum parse manual duplicado de cookie JWT-like no endpoint SSE.

---

## Fase 2 - Consistencia de Produto (P1)

### 3) Padronizar expiracao de relatorio (`expiresAt`)
**Problema:** Inngest salva +7 dias; bypass salva +24h.  
**Risco:** comportamento diferente entre ambientes e frustracao de usuario.

**Acoes**
1. Definir regra oficial unica (recomendado: configuravel via env `REPORT_TTL_HOURS`, default 168h).
2. Aplicar em:
- `src/lib/inngest.ts`
- `src/app/api/process-search/[code]/route.ts`
3. Documentar regra no `README/docs`.

**Arquivos**
- `src/lib/inngest.ts`
- `src/app/api/process-search/[code]/route.ts`
- `docs/` (arquivo de fluxo e/ou modos)

**Criterios de aceite**
- Fluxo normal e bypass salvam mesma janela de expiracao.
- Teste de integracao valida `expiresAt` dentro do TTL esperado.

---

### 4) Consolidar contrato de processamento manual/admin
**Problema:** multiplos caminhos (`mark-paid`, `process`, `mark-paid-and-process`, bypass endpoint) com sobreposicao funcional.  
**Risco:** operacao confusa e estados inconsistentes.

**Acoes**
1. Definir maquina de estados oficial (`PENDING -> PAID -> PROCESSING -> COMPLETED|FAILED|REFUNDED`).
2. Revisar endpoints admin para proibir transicoes invalidas.
3. Padronizar mensagens de erro e auditoria de acao.
4. Manter `mark-paid-and-process` como orquestrador unico (ou deprecar, com plano claro).

**Arquivos**
- `src/app/api/admin/purchases/[id]/mark-paid/route.ts`
- `src/app/api/admin/purchases/[id]/process/route.ts`
- `src/app/api/admin/purchases/[id]/mark-paid-and-process/route.ts`
- `src/app/api/admin/purchases/[id]/details/route.ts`

**Criterios de aceite**
- Nao ha transicao de status invalida.
- Fluxo manual fica deterministicamente reproduzivel.
- Dashboard/admin reflete estado real sem ambiguidade.

---

## Fase 3 - Alinhamento Tecnico e UX (P2)

### 5) Resolver divergencias de nomenclatura (codigo vs pedido/docs)
**Problema:** caminhos esperados (`src/inngest`, `ai-analysis`, `reclame-aqui`) nao existem; endpoint documentado difere (`srs-c-dossie-juridico` vs `ic-dossie-juridico`).  
**Risco:** onboarding lento e erro de manutencao.

**Acoes**
1. Atualizar docs para “fonte unica de verdade” do codigo real.
2. Incluir tabela de alias/historico de nomes.
3. Opcional: criar wrappers de compatibilidade (`ai-analysis.ts` reexportando `openai.ts`) se houver dependencia externa.

**Arquivos**
- `docs/valores apis e dados.md`
- `docs/fluxo-sistema.md`
- `docs/investigacao-codebase-eopix.md`
- opcional: `src/lib/ai-analysis.ts` (wrapper)

**Criterios de aceite**
- Docs e codigo apontam para os mesmos modulos/endpoints.
- Nao existem referencias quebradas em readmes/docs internas.

---

### 6) Decidir uso de `processAnalysis` no frontend
**Problema:** pipeline salva `processAnalysis`, mas UI nao exibe bloco dedicado.  
**Risco:** dado calculado sem valor visivel.

**Acoes (escolher 1)**
1. **Exibir** card “Analise de Processos por IA” em `/relatorio/[id]`; ou
2. **Remover persistencia** de `processAnalysis` e manter apenas resumo agregado.

**Arquivos (se exibir)**
- `src/app/relatorio/[id]/page.tsx`
- `src/components/relatorio/*` (novo card)

**Criterios de aceite**
- Campo passa a ter uso claro no produto (UI) ou deixa de ser salvo.
- Sem inconsistencias entre payload salvo e layout renderizado.

---

## Fase 4 - Qualidade e Protecao contra Regressao

### 7) Testes automatizados de fluxos criticos
**Acoes**
1. Cobrir unit/integration para:
- auth admin (layout + API)
- SSE com cookie correto
- TTL de `expiresAt`
- transicoes de estado de compra
2. Criar smoke e2e para:
- compra -> processamento -> relatorio
- fluxo bypass/admin

**Arquivos**
- `tests/` e/ou `src/**/*.test.ts`
- suites e2e existentes (Playwright/Vitest conforme padrao do repo)

**Criterios de aceite**
- CI falha em regressao de auth, cookie, TTL e transicao de status.

---

## Sequencia de Execucao Recomendada
1. P0.1 autenticacao admin
2. P0.2 cookie SSE
3. P1.3 TTL unico
4. P1.4 contrato de transicoes admin/manual
5. P2.5 alinhamento docs/nomenclatura
6. P2.6 destino de `processAnalysis`
7. Fase 4 testes e endurecimento

---

## Estimativa de Esforco
- **Fase 1 (P0):** 0.5-1 dia
- **Fase 2 (P1):** 1-2 dias
- **Fase 3 (P2):** 0.5-1.5 dia
- **Fase 4 (testes):** 1-2 dias
- **Total:** 3-6 dias uteis (1 engenheiro)

---

## Riscos e Mitigacoes
- **Risco:** quebrar acesso admin em producao.  
Mitigacao: feature flag + teste de conta admin seed + rollback rapido.

- **Risco:** impacto em usuarios com relatorios gerados no bypass.  
Mitigacao: migracao apenas para novos registros; nao alterar expiracao retroativa sem comunicacao.

- **Risco:** refatorar fluxo admin e criar regressao de status.  
Mitigacao: teste de maquina de estados + validacao por endpoint.

---

## Definicao de Pronto (DoD)
- Todos os itens P0 e P1 concluidos.
- Documentacao principal alinhada ao codigo.
- Testes criticos verdes em CI.
- Sem divergencia de regra de auth/sessao/TTL entre fluxos normal e bypass.
