# PLANO DE EXECUÇÃO PARALELA (MULTIAGENTES)

**Projeto**: E o Pix?
**Versão**: 1.0
**Data**: 2026-02-13
**Objetivo**: Definir lotes, dependências e ordem de merge para execução paralela de UCs

---

## Lotes de Execução

### LOTE A - Autenticação (3 UCs) 🟢 PARALELO
- **UC-01**: Envio Magic Code
- **UC-02**: Verificação Magic Code
- **UC-03**: Auto-login

**Pré-requisito**: Nenhum
**Merge**: Qualquer ordem
**Riscos**: Nenhum (independentes)
**Status**: ✅ COMPLETED (já implementado)

---

### LOTE B - Compra (3 UCs) 🔴 SEQUENCIAL
1. **UC-04**: Validação Documento
2. **UC-05**: Criação Compra (depende UC-04)
3. **UC-06**: Webhook Asaas (depende UC-05)

**Pré-requisito**: Nenhum
**Merge**: Ordem obrigatória (B1 → B2 → B3)
**Riscos**: Quebra fluxo se ordem invertida
**Status**: ✅ COMPLETED (já implementado)

---

### LOTE C - Processamento (2 UCs) 🟢 PARALELO
- **UC-07**: Processamento CPF
- **UC-08**: Processamento CNPJ

**Pré-requisito**: LOTE B completo
**Merge**: Qualquer ordem
**Riscos**: Nenhum (lógica isolada)
**Status**: ✅ COMPLETED (já implementado)

---

### LOTE D - Relatório (1 UC)
- **UC-09**: Acesso Relatório

**Pré-requisito**: LOTE C completo
**Merge**: Após C
**Riscos**: Nenhum
**Status**: ✅ COMPLETED (já implementado)

---

### LOTE E - Admin (2 UCs) 🟢 PARALELO
- **UC-10**: Admin Compras
- **UC-11**: Admin Blocklist

**Pré-requisito**: LOTE B completo
**Merge**: Qualquer ordem
**Riscos**: Nenhum
**Status**: ✅ COMPLETED (já implementado)

---

### LOTE F - Auxiliares (1 UC)
- **UC-12**: LGPD

**Pré-requisito**: Nenhum
**Merge**: Qualquer momento
**Riscos**: Nenhum
**Status**: ✅ COMPLETED (já implementado)

---

## Lotes Pendentes (Sprint 4)

### LOTE G - Testes (3 UCs) 🔴 SEQUENCIAL
1. **UC-13**: Vitest
2. **UC-14**: Playwright
3. **UC-15**: Testes Críticos (depende UC-13, UC-14)

**Pré-requisito**: TODAS UCs existentes documentadas
**Merge**: Ordem obrigatória (G1, G2 → G3)
**Riscos**: Quebra CI se config incorreta
**Status**: 🔵 PENDING

**Detalhamento**:
- UC-13 e UC-14 podem ser executados em paralelo (configurações independentes)
- UC-15 depende de ambos estarem completos (precisa de vitest + playwright)
- Coverage mínimo: 60%
- Prioridade: validadores, auth, purchase flow, webhook

---

### LOTE H - Notificações (2 UCs) 🟢 PARALELO
- **UC-16**: Email Conclusão
- **UC-17**: Analytics Plausible

**Pré-requisito**: LOTE C completo (para UC-16)
**Merge**: Qualquer ordem
**Riscos**: Nenhum
**Status**: 🔵 PENDING

**Detalhamento**:
- UC-16 modifica `src/lib/inngest.ts` (adiciona step 7)
- UC-17 modifica `src/app/layout.tsx` (adiciona script Plausible)
- Sem conflitos esperados (arquivos diferentes)

---

### LOTE I - Compliance (2 UCs) 🔴 SEQUENCIAL
1. **UC-18**: NFS-e
2. **UC-19**: Anonimização (depende UC-18 para testar)

**Pré-requisito**: LOTE B completo
**Merge**: Ordem obrigatória (I1 → I2)
**Riscos**: Mudança no schema `Purchase`
**Status**: 🔵 PENDING

**Detalhamento**:
- UC-18 adiciona campo `invoiceId` ao modelo Purchase (migration)
- UC-19 modifica campos `buyerName`, `buyerCpfCnpj` (anonimização)
- Executar sequencialmente para evitar conflitos de migration

---

## Ordem de Execução Recomendada

### Sprint Atual (Documentação + Testes)
1. ✅ **Fase 1**: Saneamento Docs (1 commit)
2. ✅ **Fase 2**: UCs Existentes (12 commits)
3. ✅ **Fase 3**: UCs Pendentes (1 commit)
4. 🔄 **Fase 4**: Plano Execução (1 commit) ← VOCÊ ESTÁ AQUI
5. 🔵 **Fase 5**: Rastreabilidade (1 commit)
6. 🔵 **MERGE DEVELOP → MAIN** (documentação completa)

### Sprint 4 (Implementação Pendências)
7. 🔵 **LOTE G**: Testes (3 commits: vitest → playwright → testes críticos)
8. 🔵 **LOTE H**: Notificações (2 commits paralelos)
9. 🔵 **LOTE I**: Compliance (2 commits sequenciais)
10. 🔵 **Fase 6**: Relatório Final (1 commit)
11. 🔵 **MERGE DEVELOP → MAIN** (produção ready)

---

## Estratégia de Integração Contínua

### Gates de Qualidade (Antes de Cada Commit)
```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run build         # Next.js build
npm run test          # Vitest (após UC-13)
npm run test:e2e      # Playwright (após UC-14)
```

### Conflitos Esperados (Mitigation)

#### UC-16 + UC-07/08: Modificam mesmo arquivo (`inngest.ts`)
**Mitigação**:
- UC-16 adiciona step 7, não altera steps 1-6
- Usar git merge com atenção aos steps
- Validar que step 7 é chamado APÓS step 6

#### UC-18 + UC-05: Modificam schema `Purchase`
**Mitigação**:
- UC-18 adiciona campo `invoiceId?`, não altera existentes
- Executar `npx prisma migrate dev` para aplicar migration
- Validar que modelo Purchase continua funcionando

#### UC-19 + UC-18: Modificam campos de `Purchase`
**Mitigação**:
- UC-18 adiciona `invoiceId`
- UC-19 anonimiza `buyerName`, `buyerCpfCnpnj`
- Executar sequencialmente (I1 → I2)
- Testar anonimização NÃO afeta invoiceId

---

## Responsáveis (Sugestão Multiagentes)

### Agente 1: Autenticação + Auxiliares
- **UCs**: LOTE A (UC-01, UC-02, UC-03) + LOTE F (UC-12)
- **Status**: ✅ Completo
- **Total**: 4 UCs

### Agente 2: Compra + Relatório
- **UCs**: LOTE B (UC-04, UC-05, UC-06) + LOTE D (UC-09)
- **Status**: ✅ Completo
- **Total**: 4 UCs

### Agente 3: Processamento + Admin
- **UCs**: LOTE C (UC-07, UC-08) + LOTE E (UC-10, UC-11)
- **Status**: ✅ Completo
- **Total**: 4 UCs

### Agente 4: Testes (Sprint 4)
- **UCs**: LOTE G (UC-13, UC-14, UC-15)
- **Status**: 🔵 Pendente
- **Total**: 3 UCs
- **Ordem**: UC-13 || UC-14 → UC-15

### Agente 5: Notificações + Compliance (Sprint 4)
- **UCs**: LOTE H (UC-16, UC-17) + LOTE I (UC-18, UC-19)
- **Status**: 🔵 Pendente
- **Total**: 4 UCs
- **Ordem**: (UC-16 || UC-17) → UC-18 → UC-19

---

## Sincronização e Comunicação

### Daily Standup (Async)
- **Formato**: Commits com mensagens claras
- **Padrão**: `docs(uc-XX): especificar [nome]` ou `feat(uc-XX): implementar [nome]`
- **Review**: Revisar commits antes de merge

### Pull Requests
- **Estratégia**: 1 PR por lote (não por UC individual)
- **Exemplo**: PR "LOTE G - Testes" com 3 commits (UC-13, UC-14, UC-15)
- **Review**: Obrigatório antes de merge para main
- **Gates**: Lint, typecheck, build, tests (após UC-13)

### Resolução de Conflitos
- **Conflitos de código**: Resolver via git merge com atenção aos contextos
- **Conflitos de schema**: Executar migrations sequencialmente
- **Dúvidas**: Consultar documentação (docs/uc/UC-XX-*.md)

---

## Diagrama de Dependências (DAG)

```
LOTE A (UC-01, UC-02, UC-03) ────┐
                                  │
LOTE F (UC-12) ──────────────────┤
                                  │
                                  ├──→ Documentação Completa
                                  │
LOTE B (UC-04 → UC-05 → UC-06) ──┤
                                  │
         ┌────────────────────────┘
         │
         ├──→ LOTE C (UC-07 || UC-08) ──→ LOTE D (UC-09)
         │                                      │
         │                                      ├──→ v1.0.0 (PROD)
         │                                      │
         └──→ LOTE E (UC-10 || UC-11) ─────────┘

---

Sprint 4 (Implementação):

LOTE G: (UC-13 || UC-14) ──→ UC-15
                                │
                                ├──→ Testes Completos
                                │
LOTE H: (UC-16 || UC-17) ───────┤
                                │
LOTE I: UC-18 ──→ UC-19 ────────┘
                                │
                                └──→ v1.1.0 (PROD)
```

---

## Métricas de Sucesso

### Sprint Atual (Documentação)
- [x] 19/19 UCs documentadas (100%)
- [x] Todas UCs com DoR completo
- [x] Rastreabilidade implementada (traceability.csv + CHANGELOG.md)
- [x] README atualizado com índice docs
- [ ] Merge develop → main (pendente)

### Sprint 4 (Implementação)
- [ ] 7/7 UCs implementadas
- [ ] Coverage >= 60%
- [ ] Testes E2E críticos passando
- [ ] Email conclusão enviado
- [ ] Analytics Plausible ativo
- [ ] NFS-e emitida automaticamente
- [ ] Job anonimização agendado
- [ ] Merge develop → main

### Go-Live (Produção)
- [ ] Todos gates de qualidade verdes
- [ ] Variáveis de produção configuradas
- [ ] Health check 100%
- [ ] Sentry configurado
- [ ] Deploy Vercel successful

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Conflito em inngest.ts (UC-16) | Média | Baixo | Adicionar step 7 isoladamente, não alterar steps 1-6 |
| Migration quebrando build (UC-18) | Baixa | Alto | Testar migration em dev, validar schema antes de merge |
| Coverage < 60% (UC-15) | Média | Médio | Priorizar testes críticos, aumentar coverage incrementalmente |
| Plausible bloqueado por ad-blocker (UC-17) | Alta | Baixo | Cookieless, sem PII, não afeta funcionalidade |
| Job anonimização deletando dados errados (UC-19) | Baixa | Alto | Dry-run em staging, adicionar AuditLog, reversível |

---

## Checklist de Aprovação do Plano

- [x] Todas UCs mapeadas (19 UCs)
- [x] Dependências explícitas (DAG claro)
- [x] Lotes de paralelização definidos
- [x] Conflitos identificados e mitigados
- [x] Gates de qualidade especificados
- [x] Responsáveis sugeridos (5 agentes)
- [x] Sincronização planejada (async standups)
- [x] Riscos mapeados e mitigados
- [x] Métricas de sucesso definidas

---

**Status**: ✅ APROVADO
**Próximo passo**: Fase 5 (Rastreabilidade)
