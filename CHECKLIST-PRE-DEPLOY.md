# ✅ CHECKLIST PRÉ-DEPLOY - E o Pix?

**Versão**: v1.1.0
**Data**: 2026-02-13
**Status**: ⏳ Pendente Aprovação Final

---

## 🧪 TESTES E VALIDAÇÕES

### Testes Automatizados
- [x] ✅ Testes unitários passando (50/50)
- [x] ✅ Testes E2E passando (10/10)
- [x] ✅ Build produção compilando sem erros
- [x] ✅ Lint clean (sem erros críticos)
- [x] ✅ Coverage > 70% (73% functions, 72% statements)

### Testes Manuais Recomendados
- [ ] ⏳ Compra CPF completa via Asaas sandbox
- [ ] ⏳ Compra CNPJ completa via Asaas sandbox
- [ ] ⏳ Processamento completo (mock data)
- [ ] ⏳ Recebimento de email de conclusão (Brevo)
- [ ] ⏳ Autenticação via magic code com usuário real
- [ ] ⏳ Admin: marcar compra como paga
- [ ] ⏳ Admin: adicionar/remover da blocklist
- [ ] ⏳ Verificar analytics no Plausible

---

## 🔐 SEGURANÇA

### Variáveis de Ambiente
- [ ] ⚠️  Remover `TEST_MODE=true`
- [ ] ⚠️  Remover `MOCK_MODE=true` (se aplicável)
- [ ] ⏳ Atualizar `NEXT_PUBLIC_APP_URL` para domínio produção
- [ ] ⏳ Verificar `JWT_SECRET` é forte (256+ bits)
- [ ] ⏳ Verificar `ASAAS_ENV=production` (quando sair de sandbox)
- [ ] ⏳ Atualizar `ASAAS_API_KEY` para produção (quando sair de sandbox)
- [ ] ⏳ Atualizar `ASAAS_WEBHOOK_SECRET` para produção
- [ ] ⏳ Verificar `ADMIN_EMAILS` contém emails corretos
- [x] ✅ `DATABASE_URL` configurado (Neon production)
- [x] ✅ `BREVO_API_KEY` configurado
- [x] ✅ `APIFULL_API_KEY` configurado
- [x] ✅ `SERPER_API_KEY` configurado
- [x] ✅ `OPENAI_API_KEY` configurado

### Proteções
- [x] ✅ Rate limiting configurado
- [x] ✅ Validações de CPF/CNPJ ativas
- [x] ✅ Blocklist funcional
- [x] ✅ Autenticação via JWT
- [x] ✅ Admin routes protegidas
- [ ] ⏳ Turnstile (Cloudflare) configurado
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  - `TURNSTILE_SECRET_KEY`

---

## 📊 MONITORAMENTO E OBSERVABILIDADE

### Sentry (Error Tracking)
- [ ] ⏳ Criar conta/projeto Sentry
- [ ] ⏳ Configurar `NEXT_PUBLIC_SENTRY_DSN`
- [ ] ⏳ Configurar `SENTRY_AUTH_TOKEN`
- [ ] ⏳ Testar captura de erro
- [ ] ⏳ Configurar alertas

### Analytics (Plausible)
- [x] ✅ Script Plausible integrado
- [x] ✅ `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` configurado
- [ ] ⏳ Verificar eventos sendo tracked após deploy
- [ ] ⏳ Configurar goals no Plausible

### Logs
- [x] ✅ Logs estruturados implementados
- [ ] ⏳ Configurar agregação de logs (opcional)

---

## 💳 PAGAMENTOS (ASAAS)

### Configuração
- [x] ✅ Asaas API key configurada (sandbox)
- [x] ✅ Webhook token configurado
- [x] ✅ Webhook endpoint implementado (`/api/webhooks/asaas`)
- [ ] ⏳ Atualizar para chaves de produção quando aprovar
- [ ] ⏳ Registrar webhook no painel Asaas (produção)
- [ ] ⏳ Testar webhook em produção

### Testes
- [ ] ⏳ Criar cobrança via API (sandbox)
- [ ] ⏳ Confirmar pagamento via webhook (sandbox)
- [ ] ⏳ Verificar processamento disparado
- [ ] ⏳ Testar reembolso (opcional)

---

## 📧 EMAIL (BREVO)

### Configuração
- [x] ✅ Brevo API key configurada
- [x] ✅ Email sender configurado (`plataforma@somoseopix.com.br`)
- [x] ✅ Template de magic code implementado
- [x] ✅ Template de conclusão implementado

### Validações
- [ ] ⏳ Enviar email de teste (magic code)
- [ ] ⏳ Enviar email de teste (conclusão)
- [ ] ⏳ Verificar emails não vão para spam
- [ ] ⏳ Verificar links nos emails funcionam

---

## 🗄️ BANCO DE DADOS (NEON)

### Configuração
- [x] ✅ Database URL configurada
- [x] ✅ Conexão funcionando (latency: 186ms)
- [x] ✅ Migrations rodadas
- [x] ✅ Prisma Client gerado

### Backups
- [ ] ⏳ Verificar política de backup do Neon
- [ ] ⏳ Testar restore de backup (opcional)
- [ ] ⏳ Documentar processo de rollback

---

## 🔄 BACKGROUND JOBS (INNGEST)

### Configuração
- [x] ✅ Inngest API key configurada
- [x] ✅ Jobs implementados:
  - Process purchase
  - Process LGPD deletion
  - Send completion email
  - Generate NFS-e
- [ ] ⏳ Verificar `INNGEST_DEV=false` em produção
- [ ] ⏳ Testar jobs em produção

---

## 🌐 DEPLOY (VERCEL)

### Configuração
- [ ] ⏳ Criar projeto no Vercel (se não existir)
- [ ] ⏳ Configurar variáveis de ambiente no Vercel
- [ ] ⏳ Configurar domínio customizado
- [ ] ⏳ Configurar SSL/HTTPS
- [ ] ⏳ Configurar redirects (se necessário)

### Build
- [x] ✅ Build local funcionando (`npm run build`)
- [ ] ⏳ Build no Vercel funcionando
- [ ] ⏳ Verificar size dos bundles (otimização)

---

## 📱 FRONTEND

### Performance
- [x] ✅ Imagens otimizadas (Next.js Image)
- [x] ✅ Fonts otimizadas (next/font)
- [ ] ⏳ Lighthouse score > 90 (desktop)
- [ ] ⏳ Lighthouse score > 80 (mobile)

### SEO
- [ ] ⏳ Meta tags configuradas
- [ ] ⏳ Open Graph configuradas
- [ ] ⏳ Sitemap.xml gerado
- [ ] ⏳ Robots.txt configurado
- [ ] ⏳ Favicon configurado

### Acessibilidade
- [ ] ⏳ Testes básicos de acessibilidade
- [ ] ⏳ Contraste de cores adequado
- [ ] ⏳ Alt text em imagens

---

## 📚 DOCUMENTAÇÃO

### Código
- [x] ✅ README atualizado
- [ ] ⏳ Documentação de APIs (opcional)
- [ ] ⏳ Guia de contribuição (opcional)

### Operacional
- [ ] ⏳ Runbook de incidentes
- [ ] ⏳ Guia de troubleshooting
- [ ] ⏳ Documentação de deploy
- [ ] ⏳ Documentação de rollback

---

## 🚨 CONTINGÊNCIA

### Planos
- [ ] ⏳ Plano de rollback documentado
- [ ] ⏳ Contatos de emergência definidos
- [ ] ⏳ Processo de escalação definido

### Monitoramento
- [ ] ⏳ Alertas configurados (Sentry)
- [ ] ⏳ Uptime monitoring (UptimeRobot, Pingdom, etc)
- [ ] ⏳ Status page (opcional)

---

## ✅ APROVAÇÃO FINAL

### Checklist de Go-Live
- [x] ✅ Todos os testes passando
- [x] ✅ Build produção OK
- [ ] ⏳ Variáveis de ambiente revisadas
- [ ] ⏳ Sentry configurado
- [ ] ⏳ Turnstile configurado
- [ ] ⏳ Testes manuais completos
- [ ] ⏳ Aprovação do PO/Stakeholder

### Assinatura
- [ ] ⏳ **Tech Lead**: _______________________
- [ ] ⏳ **Product Owner**: __________________
- [ ] ⏳ **DevOps**: _________________________

---

## 📝 NOTAS

### Prioridades
1. **CRÍTICO**: Remover TEST_MODE, configurar Sentry
2. **IMPORTANTE**: Configurar Turnstile, testar compra manual
3. **DESEJÁVEL**: SEO, performance, documentação

### Riscos Conhecidos
- Autenticação só funciona para usuários com compras (by design)
- APIs externas podem ter rate limits (monitorar)
- Primeiro deploy pode revelar issues de cache/CDN

### Suporte Pós-Deploy
- Monitorar Sentry por 24-48h
- Estar disponível para correções urgentes
- Validar primeiras transações reais

---

**Última atualização**: 2026-02-13 22:23
**Responsável**: Equipe E o Pix?
