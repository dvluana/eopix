# TODO — EOPIX Go-Live

## Go-Live (ações manuais — Luana)

### Pagamento
- [ ] Gerar API key produção AbacatePay (sem prefixo `_dev_`)
- [ ] Configurar webhook produção no dashboard AbacatePay:
  - URL: `https://{DOMINIO}/api/webhooks/abacatepay`
  - Secret: gerar com `openssl rand -hex 32`
  - Evento: `billing.paid`

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

### Auth
- [ ] Testar Google OAuth com domínio real (localhost OK, produção pendente)

---

## Cleanup
- [x] Deletar branch Neon orphan `br-cold-field-aik2eumi`

---

## Débitos técnicos
- [x] Extrair hook `use-report-data`
- [x] Implementar hook `use-purchase-polling` para SSE
- [x] Criar `src/types/domain.ts` (Purchase, User, entidades DB)

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
