# EOPIX — Requirements v1 (Milestone: Estabilização e Maturidade)

> Projeto brownfield. Requirements "Validated" = já existe no código. Requirements "Active" = o que vamos construir.

---

## v1 Requirements

### OBS — Observabilidade

- [x] **OBS-01**: Operador consegue buscar uma compra por código ou CPF/CNPJ no admin e ver timeline completa (status, cada step do pipeline, erros, timestamps) em uma única tela
- [x] **OBS-02**: Sentry configurado com contexto completo (purchase code, user ID, CPF/CNPJ, pipeline step, status) em todos os erros do pipeline Inngest e API routes
- [ ] **OBS-03**: Quando uma compra falha no pipeline (FAILED), operador recebe notificação WhatsApp via Callmebot com: código da compra, erro, CPF/CNPJ
- [x] **OBS-04**: Sentry com DSN real configurado no Vercel (pré-requisito manual: criar conta sentry.io)

> **Pré-requisitos manuais OBS:**
> - Criar conta em sentry.io (gratuito), pegar DSN → configurar `NEXT_PUBLIC_SENTRY_DSN` no Vercel
> - Configurar Callmebot: mandar "I allow callmebot to send me messages" para +1 (202) 858-1401 no WhatsApp → pegar API key → configurar `CALLMEBOT_API_KEY` e `CALLMEBOT_PHONE` no Vercel

### PIX — Checkout Inline

- [ ] **PIX-01**: Usuário que escolhe PIX vê QR Code diretamente na página do EOPIX (sem redirect para site do AbacatePay)
- [ ] **PIX-02**: Página de pagamento PIX faz polling automático a cada 3 segundos e redireciona para `/minhas-consultas` quando pagamento confirmado
- [ ] **PIX-03**: PIX expirado mostra mensagem clara com opção de gerar novo QR Code
- [ ] **PIX-04**: Webhook `payment.completed` do AbacatePay processa PIX (separado do `checkout.completed` atual)

> **Notas técnicas PIX:**
> - Endpoint: `POST /v2/transparents/create` com `method: "PIX"`, `data.amount`, `data.customer`
> - Status check: `GET /v2/transparents/check?id=...` → `{ data: { status: "PENDING"|"PAID"|"EXPIRED" } }`
> - Dev mode: `POST /v2/transparents/simulate-payment?id=...` para testes
> - Webhook event: `payment.completed` (diferente do checkout hosted que usa `checkout.completed`)

### CODE — Separação de Concerns

- [ ] **CODE-01**: Business logic do pipeline Inngest extraída para `src/lib/services/` (sem lógica de negócio inline nas API routes)
- [ ] **CODE-02**: API routes com responsabilidade única: recebe request → valida → delega para service → retorna response
- [ ] **CODE-03**: Tipos duplicados consolidados — um único source of truth por entidade (sem `Purchase` definido em 3 lugares)

### DOCS — Documentação Atualizada

- [ ] **DOCS-01**: `docs/architecture.md` atualizado: TTL real (30 dias ou o valor atual no código), fluxo PIX inline, cache real
- [ ] **DOCS-02**: `docs/api-contracts/cpf-financeiro.md` atualizado: `serasa-premium` endpoint (não mais `srs-premium`)
- [ ] **DOCS-03**: `docs/status.md` com seção de pré-requisitos manuais para go-live (Sentry, Callmebot, env vars)

---

## v2 Requirements (deferred)

- Audit logging (tabela AdminActionLog — rastrear mark-paid, refund, etc.)
- Admin CRUD de usuários via UI
- RBAC com campo `role` no AdminUser
- Uptime monitoring (Better Stack ou UptimeRobot)
- Blog SEO
- Mobile responsiveness do admin panel

---

## Out of Scope

- Stripe / outros payment providers — AbacatePay v2 only
- Multi-tenancy — produto é single-tenant por design
- OAuth (Google, GitHub) — email+senha é suficiente
- WhatsApp marketing para clientes — Resend email já resolve

---

## Traceability

| REQ-ID  | Phase                        | Status           |
|---------|------------------------------|------------------|
| OBS-01  | Phase 1 - Admin Purchase Timeline | Complete |
| OBS-02  | Phase 2 - Sentry com Contexto    | Complete |
| OBS-04  | Phase 2 - Sentry com Contexto    | Pending (manual) |
| OBS-03  | Phase 3 - Alertas de Falha       | Pending      |
| PIX-04  | Phase 4 - PIX Backend            | Pending      |
| PIX-01  | Phase 4 - PIX Backend            | Pending      |
| PIX-02  | Phase 5 - PIX Frontend           | Pending      |
| PIX-03  | Phase 5 - PIX Frontend           | Pending      |
| CODE-03 | Phase 6 - Consolidação de Tipos  | Pending      |
| CODE-01 | Phase 7 - Camada de Serviços     | Pending      |
| CODE-02 | Phase 7 - Camada de Serviços     | Pending      |
| DOCS-01 | Phase 8 - Documentação Atualizada | Pending     |
| DOCS-02 | Phase 8 - Documentação Atualizada | Pending     |
| DOCS-03 | Phase 8 - Documentação Atualizada | Pending     |
