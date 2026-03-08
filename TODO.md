# TODO — EOPIX Go-Live

## Go-Live (ações manuais — Luana)

### Pagamento
- [ ] Gerar API key produção AbacatePay (sem prefixo `_dev_`)
- [ ] Configurar webhook produção no dashboard AbacatePay:
  - URL: `https://{DOMINIO}/api/webhooks/abacatepay`
  - Secret: gerar com `openssl rand -hex 32`
  - Evento: `checkout.completed`

### Saldos de API (pré-pago)
- [ ] Colocar saldo na APIFull (dashboard: app.apifull.com.br) — mínimo R$30 (~2-3 consultas CPF)
- [ ] Colocar créditos na OpenAI (platform.openai.com/settings/organization/billing)
- [ ] Verificar créditos Serper (free tier: 2.500 buscas, depois plano paid)

### Env vars produção (Vercel)
- [ ] Configurar todas as env vars na Vercel:
  ```
  PAYMENT_PROVIDER=abacatepay
  ABACATEPAY_API_KEY=abc_XXX
  ABACATEPAY_WEBHOOK_SECRET=XXX
  ABACATEPAY_PRODUCT_ID=prod_CxQkybBBLkBt26UQMhCwKPZr
  NEXT_PUBLIC_APP_URL=https://{DOMINIO}
  APIFULL_API_KEY=XXX
  SERPER_API_KEY=XXX
  OPENAI_API_KEY=XXX
  INNGEST_EVENT_KEY=XXX
  INNGEST_SIGNING_KEY=XXX
  BREVO_API_KEY=XXX
  NEXT_PUBLIC_SENTRY_DSN=XXX
  MOCK_MODE → NÃO SETAR (ou false)
  TEST_MODE → NÃO SETAR (ou false)
  ```

### CI/CD
- [x] Configurar GitHub Secrets: `NEON_API_KEY`, `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`
- [x] Fix Neon API v2 URL + compute endpoint + connection_uri em `test-with-branch.ts`
- [x] Fix DIRECT_URL para prisma migrate deploy no CI
- [x] CI E2E: trocar `npm run dev` por `npm run build && npm start` em `startTestServer()` — dev mode trava no GitHub Actions runner

### Auth
- [x] Substituir Google OAuth por Email+Senha (bcrypt)
- [x] Fix flash do form de login em minhas-consultas (tri-state null/false/true)
- [x] Botão "Painel Admin" na topbar para admins (verifica AdminUser table)
- [ ] Implementar reset de senha (iteração futura)
- [ ] Remover `GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_CLIENT_ID` do Vercel (se configurados)

---

## Hotfixes Produção (2026-03-11)

### Bugs críticos (código pronto, falta deploy)
- [x] `processSearch` não registrado no Inngest `serve()` — adicionado ao array `functions` em `crons.ts`
- [x] Webhook handler engolia erros do Inngest (retornava 200) — agora re-throws, retorna 500 para AbacatePay retry
- [x] Webhook: purchases PAID permitidas no retry (antes skipava PAID, não re-triggerava Inngest)
- [x] Webhook: request logging adicionado para debug
- [x] UX checkout logado: removidos campos cellphone/buyerTaxId — backend resolve do perfil/última compra
- [x] `cellphone` adicionado ao model User — migration criada e aplicada no Neon develop
- [x] `createPurchase` só envia campos com valor (não envia strings vazias)

### Falta fazer (deploy)
- [ ] Substituir wip commit por commits atômicos (git reset --soft + re-commit)
- [ ] Rodar E2E mock (26/26) — falhas anteriores eram servidor não-mock pré-existente
- [ ] Aplicar migration `add_user_cellphone` no Neon main (produção)
- [ ] Atualizar `docs/status.md`
- [ ] Merge develop → main + push
- [ ] Recuperar purchase RUVW8B (resetar para PAID + re-processar via admin)
- [ ] Verificar config webhook AbacatePay no dashboard (URL + secret + evento)
- [ ] Verificar no Inngest dashboard que `process-search` aparece nas funções registradas
- [ ] Fazer compra teste end-to-end após deploy

---

## Cleanup
- [x] Deletar branch Neon orphan `br-cold-field-aik2eumi`

---

## Débitos técnicos
- [x] Extrair hook `use-report-data`
- [x] Implementar hook `use-purchase-polling` para SSE
- [x] Criar `src/types/domain.ts` (Purchase, User, entidades DB)
- [x] Bloquear compra duplicada para mesmo CPF/CNPJ (409 + redirect)
- [x] Nav consistente: landing/consulta mostram "Minhas Consultas", grid padrão nav__inner
- [x] Auditoria admin: timing-safe JWT, sameSite strict, rate limit login, revenue fix, pagination clamp, lead filter fix

### Admin panel refactor (concluído 2026-03-11)
- [x] Health endpoint: fix APIFull/Serper parsing, add Inngest check, remove Brevo
- [x] Security: remove JWT dev-secret fallback, reduce admin session to 8h, fix over-fetching
- [x] Stripe cleanup: delete webhook/stripe.ts, rewrite payment.ts, update Prisma default
- [x] Toast system: Radix Toast, replace 16 alert() + 1 confirm()
- [x] Shared components: StatusBadge, AdminError, admin-utils extracted
- [x] Cleanup: Zod blocklist, CSV escape, free-text leads filter, refund UX, dead code

### Documentation System (concluído 2026-03-12)
- [x] `docs/wiki/`: 7 páginas operacionais (setup, testing, deploy, admin, inngest, claude-workflow)
- [x] `docs/specs/`: 3 specs de produto vivas (purchase-flow, report-pipeline, auth)
- [x] `docs/external/abacatepay/`: docs crawleadas reorganizadas (de docs/payment/)
- [x] `.claude/rules/`: 4 regras por path (inngest, payment, admin, purchases)
- [x] CLAUDE.md atualizado com ponteiros para wiki/specs
- [x] Hook check-docs: lembra de atualizar docs quando edita código mapeado
- [x] MkDocs Material: `pip install mkdocs-material && npm run docs` para wiki visual
- [x] Custom skills: `/commit` e `/deploy`

### Modal de Cadastro + AbacatePay v1 Customer (2026-03-07)
- [x] Reverter AbacatePay v2 → v1 (`/v1/billing/create`, produtos inline)
- [x] Criar `RegisterModal.tsx` — modal Radix Dialog (fullscreen mobile, centered desktop)
- [x] Campos: nome, email, celular (mask), CPF/CNPJ (mask), senha (eye toggle), confirmar senha
- [x] Adicionar `customer` inline no body v1 (name, email, cellphone, taxId formatados)
- [x] Backend: purchases route aceita name/cellphone/buyerTaxId, passa ao AbacatePay
- [x] Backend: register route aceita cellphone, salva no User
- [x] Consulta page: form inline substituído por botão que abre modal
- [x] Ambos CTAs (hero + bottom) abrem o modal para não-logados
- [x] E2E tests: atualizar para preencher campos do modal (26/26 passando)
- [x] Teste manual: fluxo completo com AbacatePay v1 dev key (checkout sandbox OK — customer data correto)

### DX — Developer Experience (concluído 2026-03-12)
- [x] Scripts simplificados: `npm run dev` (mock, auto MOCK_MODE=true) + `npm run dev:live` (tudo real + Inngest auto)
- [x] Inngest Dev Server integrado: `dev:live` inicia Next.js + Inngest automaticamente via `concurrently`
- [x] `npm run inngest` avulso para rodar dashboard Inngest separado quando necessário
- [x] Documentação `modos-de-execucao.md` atualizada com scripts e quando usar cada um

### Débitos da auditoria admin (futuro)
- [ ] Audit logging (tabela AdminActionLog — rastrear mark-paid, refund, etc.)
- [ ] Admin user CRUD via UI (criar/desativar admin sem acesso direto ao DB)
- [ ] RBAC com campo `role` do AdminUser
- [ ] Toggle `active` para AdminUser via UI
- [ ] Log de login falhado com IP/timestamp
- [ ] Padronizar formato de erro nas respostas admin (`{error}` vs `{message}`)
- [ ] Fix timezone dashboard (usar Intl.DateTimeFormat em vez de toLocaleString→Date roundtrip)
- [ ] Mobile responsiveness (collapsible sidebar, breakpoints)
- [ ] Incidents persistence (move from in-memory to DB)
- [ ] Session invalidation mechanism (revoke tokens server-side)

---

## Referência rápida — APIFull endpoints (testados e confirmados)

| Endpoint | URL | Link | Param |
|---|---|---|---|
| CPF Cadastral | `/api/r-cpf-completo` | `r-cpf-completo` | `cpf` |
| CPF Processos | `/api/r-acoes-e-processos-judiciais` | `r-acoes-e-processos-judiciais` | `cpf` |
| CPF/CNPJ Financeiro | `/api/srs-premium` | `srs-premium` | `document` |
| CNPJ Dossiê | `/api/ic-dossie-juridico` | `ic-dossie-juridico` | `document` |

Padrão: URL = `https://api.apifull.com.br/api/{link}`, User-Agent obrigatório.

## Decisões importantes

- APIFull exige `User-Agent` header (403 sem ele)
- `srs-premium` retorna formato `dados.data.serasaPremium` (usado pelos mappers). `serasa-premium` retorna formato diferente (`dados.HEADER`) — NÃO usar.
- TEST_MODE sem Inngest: usar fluxo de 2 passos (mark-paid + process-search)
- Neon MCP cria branch do main por default — rodar `prisma migrate deploy` após criar
- Admin endpoints em `/api/admin/*` (login em `/api/admin/login`)
