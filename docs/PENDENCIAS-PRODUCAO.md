# E O PIX? - Pendências para Produção

> **Documento gerado em:** 08/02/2026
> **Status atual:** MVP funcional - Pronto para configurações de produção
> **Objetivo:** Checklist completo para deploy em produção

---

## TEST_MODE - Modo de Teste Funcional (Pré-Produção)

### O que é?

O `TEST_MODE` permite testar o fluxo completo na Vercel **antes** de ir para produção real, usando APIs reais (APIFull, Escavador, Serper, OpenAI) sem precisar de Brevo ou Asaas configurados.

### Como ativar

```env
TEST_MODE=true   # Bypass pagamento/auth
MOCK_MODE=false  # APIs reais (não mockadas)
```

### O que o TEST_MODE faz

| Funcionalidade | Comportamento em TEST_MODE |
|----------------|---------------------------|
| **Login** | Aceita código fixo `123456` sempre |
| **Envio de código** | Loga no console, não envia email |
| **Pagamento** | Bypass Asaas, purchase criada como PAID |
| **Processamento** | Inngest job disparado imediatamente |
| **APIs externas** | Chamadas reais (APIFull, Escavador, etc.) |

### Arquivos modificados

| Arquivo | Modificação |
|---------|-------------|
| `src/app/api/auth/verify-code/route.ts` | Aceita código fixo 123456 |
| `src/app/api/auth/send-code/route.ts` | Loga código, não envia email |
| `src/app/api/purchases/route.ts` | Bypass Asaas, cria PAID, dispara Inngest |
| `src/lib/brevo.ts` | Não envia email em TEST_MODE |

### Fluxo de teste

1. **Home** → Digitar CPF/CNPJ
2. **Teaser** → Ver prévia, confirmar "pagamento"
3. **Confirmação** → Redirecionado direto (sem checkout Asaas)
4. **Backend** → Inngest processa com APIs reais
5. **Login** → Usar código `123456`
6. **Minhas Consultas** → Ver relatório processado

### Dados de teste

Ver arquivo `docs/DADOS-TESTE.md` (não commitado) com CPFs/CNPJs autorizados para testes.

### Quando remover TEST_MODE

1. ✅ Configurar Brevo (emails transacionais)
2. ✅ Configurar Asaas produção (pagamentos)
3. ✅ Configurar Inngest (jobs em background)
4. ✅ Testar fluxo completo com pagamento real
5. ✅ Definir `TEST_MODE=false` na Vercel

---

## Testes E2E Realizados (08/02/2026)

Todos os fluxos do frontend foram testados via MCP Chrome DevTools com `MOCK_MODE=true`.

| # | Fluxo | Status | Observações |
|---|-------|--------|-------------|
| 1 | HOME - Validação CPF/CNPJ | ✅ OK | CPF inválido mostra erro, válido redireciona |
| 2 | TEASER - Prévia da Consulta | ✅ OK | Documento mascarado, form funcional |
| 3 | CONFIRMAÇÃO - Pós-Pagamento | ✅ OK | Código e email exibidos corretamente |
| 4 | AUTENTICAÇÃO - Magic Link | ✅ OK | Código 6 dígitos verificado no banco |
| 5 | MINHAS CONSULTAS | ✅ OK | Lista compras, status badges OK |
| 6 | RELATÓRIO | ✅ OK | **Bug corrigido:** `use(params)` → `useParams()` |
| 7 | ADMIN - Painel | ✅ OK | Dashboard, compras, leads, blocklist, health |
| 8 | LEAD CAPTURE | ✅ OK | Form em /manutencao salva lead |
| 9 | PÁGINAS JURÍDICAS | ✅ OK | /termos, /privacidade, /privacidade/titular |
| 10 | PÁGINAS DE ERRO | ✅ OK | /erro/500, /erro/expirado, /erro/invalido |

---

## Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo | Resolvido | Total |
|-----------|---------|------|-------|-------|-----------|-------|
| Segurança | 1 | 2 | 0 | 0 | 0 | 3 |
| Backend/APIs | 0 | 0 | 2 | 0 | **3** | 5 |
| Frontend | 0 | 0 | 1 | 0 | **2** | 3 |
| Integrações | 0 | 2 | 0 | 0 | **6** | 8 |
| Monitoramento | 0 | 0 | 2 | 0 | **1** | 3 |
| Compliance | 0 | 1 | 0 | 0 | 0 | 1 |
| **TOTAL** | **1** | **5** | **5** | **0** | **12** | **23** |

---

## 1. SEGURANÇA 🔴

### 1.1 [CRÍTICO] Variáveis de Ambiente Vazias

**Problema:** Arquivo `.env.local` contém chaves de API vazias que precisam ser preenchidas antes do deploy.

**Arquivo:** `.env.local`

**Chaves faltantes (usuária deve configurar):**
```env
BREVO_API_KEY=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

**Solução:**
1. Criar contas em cada serviço (ver Fase 1 do plano)
2. Preencher todas as chaves
3. NUNCA commitar o arquivo com chaves reais

---

### 1.2 [ALTO] JWT_SECRET Fraco

**Problema:** `JWT_SECRET` está vazio no `.env.local`. Em produção, precisa ser uma string aleatória forte (64+ caracteres).

**Solução:**
```bash
openssl rand -hex 32
```

---

### 1.3 [ALTO] ADMIN_EMAILS Não Configurado

**Problema:** A variável `ADMIN_EMAILS` não está definida no `.env.local`. Necessária para proteger o painel admin.

**Solução:** Adicionar ao `.env.local`:
```env
ADMIN_EMAILS=admin@seudominio.com.br,outro@seudominio.com.br
```

---

## 2. BACKEND/APIs 🟢

### 2.1 [RESOLVIDO] Cache 24h Implementado ✅

**Status:** Implementado em `src/lib/inngest.ts`

O sistema agora verifica se existe um SearchResult válido (não expirado, criado nas últimas 24h) antes de chamar as APIs externas. Se existir, reutiliza os dados do cache.

---

### 2.2 [RESOLVIDO] Reembolso Automático Implementado ✅

**Status:** Implementado em `src/lib/inngest.ts`

O sistema agora:
- Tenta reembolso automático via Asaas quando falha após retries
- Atualiza status para `REFUNDED` ou `REFUND_FAILED`
- Job cleanup para purchases stuck por mais de 2h

---

### 2.3 [RESOLVIDO] Formulário LGPD Backend Criado ✅

**Status:** Implementado

**Arquivos criados/modificados:**
- `prisma/schema.prisma` - Model `LgpdRequest` adicionado
- `src/app/api/lgpd-requests/route.ts` - Endpoint POST criado
- `src/app/privacidade/titular/page.tsx` - Conectado ao backend

O formulário agora:
- Valida todos os campos (nome, CPF/CNPJ, email, tipo, descrição)
- Gera protocolo único (LGPD-2026-XXXX)
- Salva no banco de dados
- Exibe confirmação com número do protocolo

---

### 2.4 [MÉDIO] Health Incidents em Memória

**Problema:** Os incidents de health check são armazenados em memória (array) e hardcoded.

**Status:** Baixa prioridade - funciona para MVP

---

### 2.5 [MÉDIO] Cleanup de Leads 30→90 Dias

**Problema:** O job de limpeza de leads usa 30 dias, mas a spec define 90 dias.

**Nota:** Pode manter 30 dias para LGPD compliance mais restrito.

---

## 3. FRONTEND 🟢

### 3.1 [RESOLVIDO] LeadCaptureForm Integrado com API ✅

O form agora chama `/api/leads` corretamente.

---

### 3.2 [RESOLVIDO] Bug useParams no Relatório ✅

**Arquivo:** `src/app/relatorio/[id]/page.tsx`

**Correção:** Substituído `use(params)` por `useParams()` hook.

---

### 3.3 [MÉDIO] Falta Botão "Relatar Erro" nos Cards do Relatório

**Status:** Baixa prioridade - pode ser adicionado pós-lançamento

---

## 4. INTEGRAÇÕES EXTERNAS

### 4.1 [RESOLVIDO] Neon PostgreSQL ✅

**Status:** Configurado (DATABASE_URL presente)

---

### 4.2 [RESOLVIDO] Asaas (Pagamento Pix) ✅

**Status:** Configurado em sandbox

**Para produção:**
1. Gerar chave API de produção no painel Asaas
2. Configurar webhook de produção: `https://www.somoseopix.com.br/api/webhooks/asaas`
3. Atualizar variáveis:
   - `ASAAS_ENV=production`
   - `ASAAS_API_KEY=<chave_producao>`
   - `ASAAS_WEBHOOK_TOKEN=<token_producao>`

---

### 4.3 [RESOLVIDO] APIFull (Dados Financeiros) ✅

**Status:** Configurado e testado

---

### 4.4 [RESOLVIDO] Escavador (Processos Judiciais) ✅

**Status:** Configurado e testado

---

### 4.5 [RESOLVIDO] Serper (Web Search) ✅

**Status:** Configurado e testado

Substituiu Google Custom Search por Serper API (mais barato e sem limite de 100 queries/dia).

---

### 4.6 [RESOLVIDO] OpenAI (Resumo IA) ✅

**Status:** Configurado e testado

---

### 4.7 [RESOLVIDO] Brevo (Email Transacional) ✅

**Status:** Código implementado em `src/lib/brevo.ts`

**Para produção:**
1. Criar conta em brevo.com
2. Adicionar domínio `somoseopix.com.br`
3. Configurar DNS (SPF/DKIM/DMARC) - ver `docs/brevo-setup.md` se existir
4. Gerar API key → `BREVO_API_KEY`
5. Definir `EMAIL_FROM_ADDRESS` com email verificado

---

### 4.8 [RESOLVIDO] Inngest (Background Jobs) ✅

**Status:** Código implementado em `src/lib/inngest.ts`

**Para produção:**
1. Criar conta em inngest.com
2. Criar app com endpoint: `https://www.somoseopix.com.br/api/inngest`
3. Copiar → `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY`

---

## 5. MONITORAMENTO

### 5.1 [RESOLVIDO] Sentry Configurado ✅

**Status:** Implementado

**Arquivos criados:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `src/app/global-error.tsx`
- `next.config.mjs` atualizado com `withSentryConfig`

**Falta configurar na Vercel:**
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

---

### 5.2 [MÉDIO] Plausible Analytics Parcialmente Configurado

**Status:** Script presente, eventos customizados pendentes

---

### 5.3 [MÉDIO] Console.logs em Produção

**Status:** Aceitável para MVP - Sentry captura erros principais

---

## 6. COMPLIANCE 🟡

### 6.1 [ALTO] LIA (Legitimate Interest Assessment) Não Elaborado

**Problema:** A spec menciona que o LIA deve ser elaborado antes do lançamento.

**Solução:** Contratar assessoria jurídica para elaborar o documento.

---

## 7. CHECKLIST DE DEPLOY

### Variáveis para TEST_MODE (Pré-Produção na Vercel)

```env
# Modo de teste - bypass auth e pagamento
TEST_MODE=true
MOCK_MODE=false  # APIs reais

# Banco de dados (obrigatório)
DATABASE_URL=postgresql://...

# APIs de dados (obrigatório)
APIFULL_TOKEN=...
ESCAVADOR_API_KEY=...
SERPER_API_KEY=...
OPENAI_API_KEY=...

# Auth (obrigatório)
JWT_SECRET=<64+ caracteres>
ADMIN_EMAILS=admin@exemplo.com

# App URL
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app

# Podem ficar vazios em TEST_MODE
BREVO_API_KEY=          # bypass
ASAAS_API_KEY=           # bypass
INNGEST_EVENT_KEY=       # local run
SENTRY_DSN=              # opcional
```

### Variáveis para PRODUÇÃO REAL

```env
# Desativar modo de teste
TEST_MODE=false
MOCK_MODE=false

# Email (Brevo)
BREVO_API_KEY=

# Monitoramento (Sentry)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Pagamento
ASAAS_ENV=production
ASAAS_API_KEY=<chave_producao>
ASAAS_WEBHOOK_TOKEN=<token_producao>
```

### Antes do Deploy

- [ ] Todas as variáveis de ambiente preenchidas
- [ ] `JWT_SECRET` com 64+ caracteres
- [ ] `ADMIN_EMAILS` configurado
- [ ] `MOCK_MODE=false`
- [ ] `ASAAS_ENV=production`
- [ ] DNS configurado para o domínio
- [ ] SSL/HTTPS funcionando
- [ ] SPF/DKIM do Brevo verificado
- [ ] Webhook do Asaas apontando para produção
- [ ] Inngest endpoint configurado

### Após Deploy (Testes Obrigatórios)

- [ ] Compra real R$ 29,90 (teste com CPF próprio)
- [ ] Email de confirmação chega
- [ ] Relatório processa corretamente
- [ ] Login magic link funciona
- [ ] Reembolso via admin funciona
- [ ] Sentry captura erros de teste

### Pós-Go-Live

- [ ] Monitorar Sentry por 24h
- [ ] Verificar analytics no Plausible
- [ ] Reembolsar compra de teste

---

## 8. ARQUIVOS MODIFICADOS (RESUMO)

| Arquivo | Ação | Status |
|---------|------|--------|
| `prisma/schema.prisma` | Adicionado model LgpdRequest | ✅ Feito |
| `src/app/api/lgpd-requests/route.ts` | Criado endpoint POST | ✅ Feito |
| `src/app/privacidade/titular/page.tsx` | Conectado ao backend | ✅ Feito |
| `sentry.client.config.ts` | Configuração Sentry client | ✅ Feito |
| `sentry.server.config.ts` | Configuração Sentry server | ✅ Feito |
| `sentry.edge.config.ts` | Configuração Sentry edge | ✅ Feito |
| `instrumentation.ts` | Instrumentação Next.js | ✅ Feito |
| `src/app/global-error.tsx` | Página de erro global | ✅ Feito |
| `next.config.mjs` | Integração Sentry | ✅ Feito |
| `src/lib/inngest.ts` | Cache 24h + reembolso | ✅ Feito anteriormente |
| `src/app/api/auth/verify-code/route.ts` | TEST_MODE - código fixo 123456 | ✅ Feito |
| `src/app/api/auth/send-code/route.ts` | TEST_MODE - loga código | ✅ Feito |
| `src/app/api/purchases/route.ts` | TEST_MODE - bypass Asaas | ✅ Feito |
| `src/lib/brevo.ts` | TEST_MODE - não envia email | ✅ Feito |
| `docs/DADOS-TESTE.md` | CPFs/CNPJs para testes | ✅ Feito (não commitado) |

---

**Última atualização:** 08/02/2026 - TEST_MODE implementado para testes pré-produção
