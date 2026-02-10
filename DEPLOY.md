# E O PIX - Guia de Deploy para Produção

## Status Atual

- **URL de Produção**: `https://www.somoseopix.com.br`
- **URL Vercel**: `https://eopix.vercel.app`
- **Modo**: Produção com APIs reais
- **Banco**: Neon PostgreSQL conectado

---

## 1. Deploy Inicial (Atual)

### Variáveis Obrigatórias no Vercel

| Variável | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `MOCK_MODE` | `true` |
| `NEXT_PUBLIC_APP_URL` | `https://www.somoseopix.com.br` |
| `DATABASE_URL` | Connection string Neon (pooler) |
| `DIRECT_URL` | Connection string Neon (direta) |
| `JWT_SECRET` | Gerar com `openssl rand -base64 32` |
| `ADMIN_EMAILS` | Seu email admin |

### Comandos

```bash
# Build local para verificar erros
npm run build

# Deploy
vercel --prod
```

---

## 2. Pendências para Produção Completa

### APIs Externas (Criar contas e configurar)

- [ ] **Asaas** - Pagamentos PIX (https://www.asaas.com/)
- [ ] **APIFull** - Consulta CPF/CNPJ (https://apifull.io/)
- [ ] **Escavador** - Processos judiciais (https://www.escavador.com/)
- [ ] **Google CSE** - Busca customizada (https://programmablesearchengine.google.com/)
- [ ] **OpenAI** - Resumos com IA (https://platform.openai.com/)
- [ ] **Brevo** - Emails transacionais (https://app.brevo.com/)
- [ ] **Inngest** - Background jobs (https://app.inngest.com/)

### Domínio Próprio (Configurado)

1. Domínio `somoseopix.com.br` configurado no Vercel
2. DNS configurado
3. `NEXT_PUBLIC_APP_URL` = `https://www.somoseopix.com.br`
4. `MOCK_MODE` = `false` para produção

---

## 3. Quando Ativar APIs Reais

1. Criar contas em todos os serviços
2. Configurar API keys no Vercel Dashboard
3. Mudar `MOCK_MODE` para `false`
4. Configurar webhook Asaas: `https://www.somoseopix.com.br/api/webhooks/asaas`
5. Verificar domínio no Brevo e adicionar DNS

---

## 4. Checklist de Verificação

### Com Mock (Desenvolvimento)
- [ ] Acessar `https://www.somoseopix.com.br`
- [ ] Digitar CPF (dados mock serão retornados)
- [ ] Verificar fluxo de compra (PIX mock)
- [ ] Testar login admin em `/admin`
- [ ] Verificar dashboard admin

### Com APIs Reais (Futuro)
- [ ] Testar pagamento PIX real
- [ ] Verificar recebimento de emails
- [ ] Testar webhook Asaas
- [ ] Verificar relatório gerado com dados reais

---

## 5. Arquivos de Configuração

- `.env.production.example` - Template de variáveis para produção
- `vercel.json` - Configurações de deploy Vercel
- `next.config.mjs` - Headers de segurança

---

## Suporte

- Vercel: https://vercel.com/docs
- Neon: https://neon.tech/docs
