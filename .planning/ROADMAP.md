# Roadmap: EOPIX — Estabilização e Maturidade

## Overview

Este milestone transforma o EOPIX de um produto funcional em um produto operável. Começa com observabilidade (ver o que está acontecendo), adiciona PIX inline (melhor experiência de pagamento), limpa o código (sustentabilidade), e termina com documentação atualizada refletindo o que foi construído.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Admin Purchase Timeline** - Operador consegue investigar qualquer compra com timeline completa em uma única tela
- [ ] **Phase 2: Sentry com Contexto** - Todos os erros do pipeline capturam purchase code, user ID e step para investigação no Sentry
- [ ] **Phase 3: Alertas de Falha** - Operador recebe notificação WhatsApp imediata quando uma compra falha no pipeline
- [ ] **Phase 4: PIX Backend** - Backend suporta transparent checkout PIX com criação, webhook e polling de status
- [ ] **Phase 5: PIX Frontend** - Usuário vê QR Code PIX diretamente no site e é redirecionado automaticamente após pagamento
- [ ] **Phase 6: Consolidação de Tipos** - Entidades como Purchase e User têm um único source of truth de tipos no codebase
- [ ] **Phase 7: Camada de Serviços** - Business logic extraída de API routes para `src/lib/services/` com responsabilidade única
- [ ] **Phase 8: Documentação Atualizada** - Docs refletem o código real: TTL, endpoint financeiro, fluxo PIX, pré-requisitos de operação

## Phase Details

### Phase 1: Admin Purchase Timeline
**Goal**: Operador consegue investigar qualquer compra e ver toda a sua história em uma única tela
**Depends on**: Nothing (first phase)
**Requirements**: OBS-01
**Success Criteria** (what must be TRUE):
  1. Operador busca uma compra por código ou CPF/CNPJ e encontra em menos de 5 segundos
  2. Página de detalhe mostra timeline com cada transição de status, timestamp e step do pipeline
  3. Erros aparecem inline na timeline com mensagem legível (não apenas "FAILED")
  4. Toda a investigação acontece em uma única tela sem precisar cruzar Inngest/Vercel/Neon
**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md — Unified timeline dialog + URL auto-open

### Phase 2: Sentry com Contexto
**Goal**: Cada erro capturado pelo Sentry inclui contexto suficiente para identificar a compra afetada sem abrir outro sistema
**Depends on**: Phase 1
**Requirements**: OBS-02, OBS-04
**Success Criteria** (what must be TRUE):
  1. Todo erro no pipeline Inngest aparece no Sentry com purchase code, CPF/CNPJ, step e status
  2. Todo erro nas API routes inclui user ID e purchase code quando disponíveis
  3. DSN real configurado no Vercel (não placeholder) — erros chegam ao Sentry em produção
  4. Operador consegue ir de um alerta Sentry direto para a compra afetada no admin
**Plans**: TBD
**UI hint**: no

### Phase 3: Alertas de Falha
**Goal**: Operador é notificado no WhatsApp imediatamente quando uma compra falha no pipeline, sem precisar monitorar dashboards
**Depends on**: Phase 2
**Requirements**: OBS-03
**Success Criteria** (what must be TRUE):
  1. Mensagem WhatsApp chega em menos de 30 segundos após transição para FAILED
  2. Mensagem contém código da compra, CPF/CNPJ e descrição do erro
  3. Sistema não envia duplicatas (Inngest retries não disparam múltiplos alertas para a mesma falha)
**Plans**: TBD

### Phase 4: PIX Backend
**Goal**: Backend suporta criação de PIX transparent checkout, processamento do webhook e polling de status
**Depends on**: Phase 3
**Requirements**: PIX-04, PIX-01
**Success Criteria** (what must be TRUE):
  1. `POST /api/purchases/pix` cria transparent checkout via AbacatePay `/v2/transparents/create` e retorna `brCode` e `brCodeBase64`
  2. Webhook `payment.completed` processa PIX e avança purchase para PAID → dispara Inngest
  3. `GET /api/purchases/pix/status?id=...` retorna status atual (`PENDING`, `PAID`, `EXPIRED`) consultando AbacatePay
  4. Dev mode suporta simulação de pagamento via `/v2/transparents/simulate-payment`
**Plans**: TBD

### Phase 5: PIX Frontend
**Goal**: Usuário completa pagamento PIX sem sair do site EOPIX
**Depends on**: Phase 4
**Requirements**: PIX-01, PIX-02, PIX-03
**Success Criteria** (what must be TRUE):
  1. Após iniciar compra com PIX, usuário vê QR Code e código copia-e-cola na mesma página do EOPIX
  2. Página faz polling a cada 3 segundos e redireciona automaticamente para `/minhas-consultas` após confirmação do pagamento
  3. PIX expirado mostra mensagem clara com botão para gerar novo QR Code (sem precisar recomeçar o fluxo)
**Plans**: TBD
**UI hint**: yes

### Phase 6: Consolidação de Tipos
**Goal**: Cada entidade central (Purchase, User, SearchResult) tem exatamente uma definição de tipo no codebase
**Depends on**: Phase 5
**Requirements**: CODE-03
**Success Criteria** (what must be TRUE):
  1. `src/types/domain.ts` e `src/types/report.ts` são os únicos lugares onde Purchase, User e SearchResult são definidos
  2. Zero definições inline duplicadas de interfaces/types nas API routes e componentes
  3. `tsc --noEmit` passa sem erros após consolidação
**Plans**: TBD

### Phase 7: Camada de Serviços
**Goal**: Business logic do pipeline e das compras vive em `src/lib/services/` e pode ser testada independentemente das routes
**Depends on**: Phase 6
**Requirements**: CODE-01, CODE-02
**Success Criteria** (what must be TRUE):
  1. API routes têm no máximo: parse do request, chamada para service, retorno da response — sem lógica de negócio inline
  2. `src/lib/services/` contém módulos distintos para purchase workflow, pipeline orchestration e afins
  3. E2E tests 26/26 continuam passando após refatoração
  4. Pelo menos um service tem testes unitários Vitest cobrindo casos principais
**Plans**: TBD

### Phase 8: Documentação Atualizada
**Goal**: Documentação reflete o código que foi efetivamente construído neste milestone
**Depends on**: Phase 7
**Requirements**: DOCS-01, DOCS-02, DOCS-03
**Success Criteria** (what must be TRUE):
  1. `docs/architecture.md` mostra fluxo PIX inline no sequence diagram e TTL real do SearchResult
  2. `docs/api-contracts/cpf-financeiro.md` documenta endpoint `serasa-premium` (removida referência ao `srs-premium` deprecated)
  3. `docs/status.md` tem seção de pré-requisitos manuais listando: Sentry DSN, Callmebot API key/phone, e env vars necessárias para go-live
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Admin Purchase Timeline | 0/1 | Planning complete | - |
| 2. Sentry com Contexto | 0/TBD | Not started | - |
| 3. Alertas de Falha | 0/TBD | Not started | - |
| 4. PIX Backend | 0/TBD | Not started | - |
| 5. PIX Frontend | 0/TBD | Not started | - |
| 6. Consolidação de Tipos | 0/TBD | Not started | - |
| 7. Camada de Serviços | 0/TBD | Not started | - |
| 8. Documentação Atualizada | 0/TBD | Not started | - |
