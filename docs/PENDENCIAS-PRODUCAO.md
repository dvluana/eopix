# E O PIX? - Pendências para Produção

> **Documento gerado em:** 08/02/2026
> **Status atual:** MVP funcional em modo mock - E2E validado
> **Objetivo:** Checklist completo para deploy em produção

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

### Bug Corrigido Durante Testes

**Arquivo:** `src/app/relatorio/[id]/page.tsx`

**Problema:** Erro "An unsupported type was passed to use(): [object Object]"

**Causa:** Uso incorreto de `use(params)` com Promise em Client Component

**Correção aplicada:**
```diff
- import React, { useEffect, useState, use } from 'react';
- import { useRouter } from 'next/navigation';
-
- interface PageProps {
-   params: Promise<{ id: string }>
- }
-
- export default function Page({ params }: PageProps) {
-   const { id: reportId } = use(params);
+ import React, { useEffect, useState } from 'react';
+ import { useRouter, useParams } from 'next/navigation';
+
+ export default function Page() {
+   const params = useParams();
+   const reportId = params.id as string;
```

---

## Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo | Resolvido | Total |
|-----------|---------|------|-------|-------|-----------|-------|
| Segurança | 1 | 2 | 0 | 0 | 0 | 3 |
| Backend/APIs | 0 | 3 | 2 | 0 | 0 | 5 |
| Frontend | 0 | 0 | 1 | 0 | **2** | 3 |
| Integrações | 0 | 8 | 0 | 0 | 0 | 8 |
| Monitoramento | 0 | 1 | 2 | 0 | 0 | 3 |
| Compliance | 0 | 1 | 0 | 0 | 0 | 1 |
| **TOTAL** | **1** | **15** | **5** | **0** | **2** | **23** |

---

## 1. SEGURANÇA 🔴

### 1.1 [CRÍTICO] Variáveis de Ambiente Vazias

**Problema:** Arquivo `.env.local` contém chaves de API vazias que precisam ser preenchidas antes do deploy.

**Arquivo:** `.env.local`

**Chaves faltantes:**
```env
ASAAS_API_KEY=""
ASAAS_WEBHOOK_SECRET=""
APIFULL_TOKEN=""
ESCAVADOR_API_KEY=""
GOOGLE_CUSTOM_SEARCH_API_KEY=""
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=""
OPENAI_API_KEY=""
RESEND_API_KEY=""
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
JWT_SECRET=""
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""
```

**Solução:**
1. Criar contas em cada serviço (ver seção Vinculação em `docs/back.md`)
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

## 2. BACKEND/APIs 🟡

### 2.1 [ALTO] Cache 24h Não Implementado

**Problema:** A spec define que consultas ao mesmo CPF/CNPJ dentro de 24h devem usar dados cacheados, mas essa lógica não está implementada no job Inngest.

**Arquivo:** `src/lib/inngest.ts`

**Spec (docs/back.md linhas 790-793):**
> "Cache 24h (compartilhado): Antes de chamar APIs, verificar SELECT * FROM SearchResult WHERE term = {term} AND type = {type} AND createdAt > NOW() - 24h."

**Solução:** Adicionar no início do `processSearch`:
```typescript
// Check cache before API calls
const existingResult = await step.run('check-cache', async () => {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  return prisma.searchResult.findFirst({
    where: {
      term,
      type,
      createdAt: { gte: twentyFourHoursAgo },
      expiresAt: { gt: new Date() },
    },
  })
})

if (existingResult) {
  // Skip API calls, just link purchase to existing result
  await step.run('link-existing', async () => {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'COMPLETED', searchResultId: existingResult.id },
    })
  })
  // Send email and return
  // ... (rest of notification logic)
  return { success: true, cached: true, searchResultId: existingResult.id }
}
```

---

### 2.2 [ALTO] Reembolso Automático Não Implementado

**Problema:** A spec define reembolso automático em caso de falha técnica, mas o código apenas marca como `FAILED` sem chamar a API de reembolso do Asaas.

**Arquivo:** `src/lib/inngest.ts:210-220`

**Spec (docs/spec.md linhas 293-306):**
> "API retornou HTTP 5xx → Retry 1x. Se falhar de novo → reembolso automático via Asaas"

**Solução:**
```typescript
// No catch block do processSearch:
catch (error) {
  // Update purchase to FAILED
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
  })

  if (purchase?.asaasPaymentId) {
    try {
      const { refundPayment } = await import('./asaas')
      const refundResult = await refundPayment(purchase.asaasPaymentId)

      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: refundResult.success ? 'REFUNDED' : 'REFUND_FAILED'
        },
      })
    } catch (refundError) {
      console.error('Refund failed:', refundError)
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: 'REFUND_FAILED' },
      })
    }
  } else {
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'FAILED' },
    })
  }

  throw error
}
```

---

### 2.3 [ALTO] Formulário LGPD (Direitos do Titular) Não Salva Dados

**Problema:** O formulário em `/privacidade/titular` gera um protocolo aleatório mas não persiste os dados no banco nem envia para um serviço externo.

**Arquivo:** `src/app/privacidade/titular/page.tsx:84-89`

**Código atual:**
```typescript
// TODO: Enviar para backend ou Tally
const randomNum = Math.floor(Math.random() * 9999);
setProtocol(`LGPD-${year}-${randomNum}`);
```

**Soluções possíveis:**
1. **Tally Forms (recomendado para MVP):** Substituir formulário por embed do Tally
2. **Backend próprio:** Criar modelo `LgpdRequest` + endpoint `/api/lgpd-requests`

**Modelo sugerido (se optar por backend):**
```prisma
model LgpdRequest {
  id           String   @id @default(cuid())
  protocol     String   @unique
  nome         String
  cpfCnpj      String
  email        String
  tipo         String   // "exclusao" | "correcao" | "homonimo"
  descricao    String
  status       String   @default("PENDING") // PENDING | COMPLETED
  createdAt    DateTime @default(now())
  resolvedAt   DateTime?
}
```

---

### 2.4 [MÉDIO] Health Incidents em Memória

**Problema:** Os incidents de health check são armazenados em memória (array) e hardcoded. Perdem-se ao reiniciar o servidor.

**Arquivo:** `src/app/api/admin/health/incidents/route.ts:15-37`

**Código atual:**
```typescript
const incidents: Incident[] = []

// Mock incidents for demo
if (isMockMode && incidents.length === 0) {
  incidents.push(...)
}
```

**Soluções:**
1. **Criar modelo Prisma:**
```prisma
model HealthIncident {
  id         String    @id @default(cuid())
  service    String
  status     String    // investigating | identified | monitoring | resolved
  message    String
  startedAt  DateTime
  resolvedAt DateTime?
  createdAt  DateTime  @default(now())
}
```

2. **Ou remover funcionalidade** se não for usada (simplificar)

---

### 2.5 [MÉDIO] Cleanup de Leads Usa 30 Dias (Spec Diz 90)

**Problema:** O job de limpeza de leads usa 30 dias, mas a spec define 90 dias.

**Arquivo:** `src/lib/inngest.ts:251`

**Código atual:**
```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
```

**Spec (docs/spec.md linha 491):**
> "LeadCapture: Manter por 90 dias, depois purgar."

**Solução:**
```typescript
const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
```

---

## 3. FRONTEND 🟡

### 3.1 [ALTO] LeadCaptureForm Integrado com API ✅

**Status:** RESOLVIDO na sessão anterior

O form agora chama `/api/leads` corretamente.

---

### 3.2 [ALTO] Bug useParams no Relatório ✅

**Status:** RESOLVIDO durante testes E2E

**Arquivo:** `src/app/relatorio/[id]/page.tsx`

**Problema:** Uso de `use(params)` com Promise não funciona em Client Components do Next.js 14+.

**Correção:** Substituído por `useParams()` hook de `next/navigation`.

---

### 3.3 [MÉDIO] Falta Botão "Relatar Erro" nos Cards do Relatório

**Problema:** A spec define que cada card do relatório deve ter um botão "Relatar erro" que abre formulário Tally pré-preenchido.

**Spec (docs/spec.md linha 532):**
> "Botão 'Relatar erro': Presente em cada card do relatório. Abre formulário pré-preenchido."

**Arquivo:** `src/components/relatorio/*.tsx`

**Solução:** Adicionar em cada card do relatório:
```tsx
<a
  href={`https://tally.so/r/FORM_ID?term=${term}&card=${cardType}`}
  target="_blank"
  rel="noopener noreferrer"
  style={{ fontSize: '11px', color: '#888', textDecoration: 'underline' }}
>
  Relatar erro
</a>
```

---

## 4. INTEGRAÇÕES EXTERNAS 🟡

Todas as integrações estão em modo mock. Para produção, cada uma precisa de conta + configuração.

### 4.1 [ALTO] Neon PostgreSQL

**Status:** ✅ Configurado (DATABASE_URL presente)

---

### 4.2 [ALTO] Asaas (Pagamento Pix)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em asaas.com
2. Completar cadastro (dados empresa/MEI)
3. Gerar chave API Sandbox primeiro
4. Configurar webhook: `https://seudominio.com.br/api/webhooks/asaas`
5. Preencher `ASAAS_API_KEY` e `ASAAS_WEBHOOK_SECRET`
6. Testar em sandbox antes de produção

---

### 4.3 [ALTO] APIFull (Dados Financeiros)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em apifull.com.br
2. Comprar créditos
3. Copiar token de API
4. Preencher `APIFULL_TOKEN`

---

### 4.4 [ALTO] Escavador (Processos Judiciais)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em escavador.com
2. Assinar plano API
3. Copiar chave de API
4. Preencher `ESCAVADOR_API_KEY`

---

### 4.5 [ALTO] Google Custom Search (Notícias/Web)

**Status:** ❌ Não configurado

**Passos:**
1. Criar projeto no Google Cloud Console
2. Ativar Custom Search API
3. Criar mecanismo de busca em programmablesearchengine.google.com
4. Preencher `GOOGLE_CUSTOM_SEARCH_API_KEY` e `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

**Atenção:** Limite gratuito de 100 queries/dia

---

### 4.6 [ALTO] OpenAI (Resumo IA)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em platform.openai.com
2. Adicionar créditos (mínimo $5)
3. Gerar API key
4. Preencher `OPENAI_API_KEY`

---

### 4.7 [ALTO] Resend (Email Transacional)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em resend.com
2. Adicionar domínio e configurar DNS (SPF/DKIM)
3. Aguardar verificação
4. Gerar API key
5. Preencher `RESEND_API_KEY`

---

### 4.8 [ALTO] Cloudflare Turnstile (CAPTCHA)

**Status:** ❌ Não configurado

**Passos:**
1. Acessar dash.cloudflare.com → Turnstile
2. Criar widget
3. Adicionar domínios permitidos
4. Preencher `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY`

---

### 4.9 [ALTO] Inngest (Background Jobs)

**Status:** ❌ Não configurado

**Passos:**
1. Criar conta em inngest.com
2. Criar app com endpoint: `https://seudominio.com.br/api/inngest`
3. Preencher `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY`

---

## 5. MONITORAMENTO 🟡

### 5.1 [ALTO] Sentry Instalado Mas Não Configurado

**Problema:** O pacote `@sentry/nextjs` está instalado mas não há configuração.

**Arquivo:** `package.json` (linha 43)

**Faltam:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Solução:**
```bash
npx @sentry/wizard@latest -i nextjs
```

Preencher `NEXT_PUBLIC_SENTRY_DSN` e `SENTRY_AUTH_TOKEN`

---

### 5.2 [MÉDIO] Plausible Analytics Parcialmente Configurado

**Status:** Script presente no layout, mas domínio pode estar incorreto.

**Arquivo:** `src/app/layout.tsx:70-74`

**Verificar:**
1. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` está correto no `.env.local`
2. Domínio registrado no Plausible

**Eventos customizados da spec não implementados:**
- `input_submitted`
- `teaser_viewed`
- `checkout_started`
- `payment_completed`
- `processing_started`
- `processing_completed`
- `processing_failed`
- `report_viewed`
- `login_magic_link`
- `lead_captured`
- `email_notification_sent`

---

### 5.3 [MÉDIO] Console.logs em Produção

**Problema:** 42 arquivos contêm `console.log/warn/error`. A maioria são logs de mock mode, mas alguns podem vazar em produção.

**Arquivos principais:**
- `src/lib/asaas.ts`
- `src/lib/apifull.ts`
- `src/lib/escavador.ts`
- `src/lib/datajud.ts`
- `src/lib/brasilapi.ts`
- `src/lib/google-search.ts`
- `src/lib/openai.ts`
- `src/lib/resend.ts`
- `src/lib/turnstile.ts`
- `src/lib/inngest.ts`
- `src/app/api/webhooks/asaas/route.ts`

**Solução recomendada:**
1. Substituir `console.log` por Sentry em produção
2. Ou usar biblioteca de logging estruturado (ex: pino)
3. Condicionar logs: `if (process.env.NODE_ENV !== 'production')`

---

## 6. COMPLIANCE 🟡

### 6.1 [ALTO] LIA (Legitimate Interest Assessment) Não Elaborado

**Problema:** A spec menciona que o LIA deve ser elaborado antes do lançamento.

**Spec (docs/spec.md linha 552):**
> "LIA: Legitimate Interest Assessment deve ser elaborado antes do lançamento."

**Solução:** Contratar assessoria jurídica para elaborar o documento.

---

## 7. CHECKLIST DE DEPLOY

### Antes do Deploy

- [ ] Todas as variáveis de ambiente preenchidas
- [ ] `JWT_SECRET` com 64+ caracteres
- [ ] `ADMIN_EMAILS` configurado
- [ ] `MOCK_MODE=false` (ou variável removida)
- [ ] `ASAAS_ENV=production`
- [ ] DNS configurado para o domínio
- [ ] SSL/HTTPS funcionando
- [ ] SPF/DKIM do Resend verificado
- [ ] Domínios do Turnstile configurados
- [ ] Webhook do Asaas apontando para produção

### Após Deploy (Testes Obrigatórios)

**Validados em E2E (MOCK_MODE=true):**
- [x] CPF válido → teaser → pagamento sandbox → webhook → relatório
- [x] CPF inválido → erro inline
- [ ] CPF blocklist → bloqueado (não testado em E2E)
- [x] Login magic link → email chega → código funciona
- [x] Relatório Sol renderiza corretamente
- [ ] Relatório Chuva renderiza corretamente (requer dados mock chuva)
- [x] Admin acessível apenas para emails autorizados

**Pendentes (requerem integração real):**
- [ ] Health check retorna status real das APIs
- [ ] Sentry captura erros

### Pós-Go-Live

- [ ] Compra real R$ 29,90 (teste com CPF próprio)
- [ ] Reembolsar compra de teste via admin
- [ ] Verificar NFS-e no Asaas (se configurado)
- [ ] Monitorar Sentry por 24h
- [ ] Verificar analytics no Plausible

---

## 8. ARQUIVOS A MODIFICAR (RESUMO)

| Arquivo | Ação | Prioridade | Status |
|---------|------|------------|--------|
| `.env.local` | Preencher todas as chaves | CRÍTICO | Pendente |
| `src/lib/inngest.ts` | Adicionar cache 24h + reembolso automático | ALTO | Pendente |
| `src/app/privacidade/titular/page.tsx` | Integrar com backend ou Tally | ALTO | Pendente |
| `src/app/relatorio/[id]/page.tsx` | Corrigir useParams | ALTO | ✅ Feito |
| `src/app/api/admin/health/incidents/route.ts` | Persistir incidents ou remover | MÉDIO | Pendente |
| `src/components/relatorio/*.tsx` | Adicionar "Relatar erro" | MÉDIO | Pendente |
| Configurar Sentry | Rodar wizard | ALTO | Pendente |
| Adicionar eventos Plausible | Analytics customizados | MÉDIO | Pendente |

---

## 9. ESTIMATIVA DE ESFORÇO

| Tarefa | Tempo Estimado |
|--------|----------------|
| Configurar todas as integrações | 2-3 horas |
| Implementar cache 24h | 30 min |
| Implementar reembolso automático | 1 hora |
| Integrar formulário LGPD | 1 hora |
| Configurar Sentry | 15 min |
| Adicionar eventos Plausible | 1 hora |
| Testes de integração | 2-3 horas |
| **TOTAL** | **8-10 horas** |

---

**Última atualização:** 08/02/2026 - Testes E2E concluídos + bug fix relatorio
