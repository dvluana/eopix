# Modos de Execução

O sistema suporta três modos de execução, controlados pelas variáveis de ambiente `MOCK_MODE` e `TEST_MODE`.

---

## Resumo

| Modo | Variáveis | APIs de Dados | Pagamento | Jobs | Email |
|------|-----------|---------------|-----------|------|-------|
| **Mock** | `MOCK_MODE=true` | Mockadas | Bypass | Fallback síncrono | Log only |
| **Test** | `TEST_MODE=true` | **Reais** | Bypass | Fallback síncrono | Log only |
| **Produção** | Ambas `false` | Reais | Stripe real | Inngest real | Brevo real |

---

## 1. Mock Mode (`MOCK_MODE=true`)

**Propósito:** Desenvolvimento rápido sem consumir APIs externas.

### Configuração
```bash
MOCK_MODE=true
TEST_MODE=false  # ou ausente
```

### Comportamento

| Componente | Comportamento |
|------------|---------------|
| **APIFull** (CPF/CNPJ) | Retorna dados fictícios hardcoded |
| **OpenAI** (resumos) | Retorna análises mockadas |
| **Serper** (busca web) | Retorna resultados mockados |
| **Stripe** (pagamento) | Bypass - redireciona direto para confirmação |
| **Inngest** (jobs) | Fallback síncrono via `/api/process-search` |
| **Brevo** (email) | Apenas loga no console, não envia |

### Fluxo de Compra

```
1. Usuário submete CPF/CNPJ
2. Purchase criada com status PENDING (sem checkout Stripe)
3. Redireciona para /compra/confirmacao
4. Admin marca como PAID manualmente
5. Admin clica "Processar"
6. Processamento usa dados MOCKADOS
7. Relatório gerado com dados fictícios
```

### Logs
```
[MOCK] APIFull consultCpfCadastral: 12345678901
[MOCK] OpenAI analyzeProcessos: 3 processos
[MOCK] Serper searchWeb: João Silva
🧪 [BYPASS] Stripe bypass - criando fake checkout
📧 [BYPASS] Para: user@example.com | Assunto: ...
```

### Quando Usar
- Desenvolvimento de UI/UX
- Testes de fluxo sem custo de API
- Debugging local rápido
- CI/CD pipelines

---

## 2. Test Mode (`TEST_MODE=true`)

**Propósito:** Testar integração com APIs reais sem precisar de Stripe/Inngest.

### Configuração
```bash
MOCK_MODE=false  # ou ausente
TEST_MODE=true
```

### Comportamento

| Componente | Comportamento |
|------------|---------------|
| **APIFull** (CPF/CNPJ) | **Chamada REAL** - consome créditos |
| **OpenAI** (resumos) | **Chamada REAL** - consome tokens |
| **Serper** (busca web) | **Chamada REAL** - consome créditos |
| **Stripe** (pagamento) | Bypass - redireciona direto para confirmação |
| **Inngest** (jobs) | Fallback síncrono via `/api/process-search` |
| **Brevo** (email) | Apenas loga no console, não envia |

### Fluxo de Compra

```
1. Usuário submete CPF/CNPJ
2. Purchase criada com status PENDING (sem checkout Stripe)
3. Redireciona para /compra/confirmacao
4. Admin marca como PAID manualmente
5. Admin clica "Processar"
6. Processamento chama APIs REAIS
7. Relatório gerado com dados REAIS
```

### Logs
```
🧪 [BYPASS] Stripe bypass - criando purchase PENDING
🧪 [BYPASS] Consultando APIFull CPF (cadastral)...
🧪 [BYPASS] CPF Cadastral: nome=João da Silva, região=SP
🧪 [BYPASS] Gerando resumo com IA...
📧 [BYPASS] Para: user@example.com | Assunto: ...
```

### Quando Usar
- Validar integração com APIFull/OpenAI/Serper
- Testar qualidade dos dados reais
- Verificar formatação do relatório com dados reais
- Testes de homologação antes de ir para produção

### Atenção
- **Consome créditos** das APIs externas
- Certifique-se de que as API keys estão configuradas corretamente
- Use CPFs/CNPJs de teste válidos

---

## 3. Produção (Ambas `false`)

**Propósito:** Ambiente de produção com todos os serviços reais.

### Configuração
```bash
MOCK_MODE=false  # ou ausente
TEST_MODE=false  # ou ausente
```

### Comportamento

| Componente | Comportamento |
|------------|---------------|
| **APIFull** (CPF/CNPJ) | Chamada real |
| **OpenAI** (resumos) | Chamada real |
| **Serper** (busca web) | Chamada real |
| **Stripe** (pagamento) | Checkout real com Pix |
| **Inngest** (jobs) | Processamento assíncrono real |
| **Brevo** (email) | Envio real de emails |

### Fluxo de Compra

```
1. Usuário submete CPF/CNPJ
2. Purchase criada com status PENDING
3. Checkout Stripe gerado (Pix)
4. Redireciona para página de pagamento Stripe
5. Usuário paga via Pix
6. Webhook Stripe notifica pagamento confirmado
7. Purchase atualizada para PAID
8. Inngest dispara job de processamento
9. APIs reais consultadas em background
10. Relatório gerado
11. Email enviado ao usuário
12. Purchase atualizada para COMPLETED
```

### Quando Usar
- Ambiente de produção
- Staging com testes end-to-end completos

---

## Arquitetura dos Modos

### Flags no Código

```typescript
// src/lib/mock-mode.ts

// MOCK_MODE: todas as APIs mockadas
export const isMockMode = process.env.MOCK_MODE === 'true'

// TEST_MODE: APIs reais, mas bypass Stripe/Inngest
export const isTestMode = process.env.TEST_MODE === 'true'

// Bypass mode: pula Stripe e usa fallback Inngest
export const isBypassMode = isMockMode || isTestMode
```

### Uso nos Arquivos

| Arquivo | Flag Usada | Propósito |
|---------|------------|-----------|
| `src/lib/apifull.ts` | `isMockMode` | Mockar dados de CPF/CNPJ |
| `src/lib/openai.ts` | `isMockMode` | Mockar análises de IA |
| `src/lib/google-search.ts` | `isMockMode` | Mockar busca web |
| `src/lib/stripe.ts` | `isBypassMode` | Bypass do checkout |
| `src/lib/email.ts` | `isBypassMode` | Não enviar emails |
| `src/app/api/purchases/route.ts` | `isBypassMode` | Criar purchase sem Stripe |
| `src/app/api/admin/.../process/route.ts` | `isBypassMode` | Fallback síncrono |
| `src/app/api/process-search/[code]/route.ts` | `isBypassMode` | Guard do endpoint |

---

## Configuração Recomendada por Ambiente

### Desenvolvimento Local
```bash
# .env.local
MOCK_MODE=true
# TEST_MODE=false (não precisa definir)
```

### Testes de Integração
```bash
# .env.local
MOCK_MODE=false
TEST_MODE=true
```

### Staging
```bash
# .env (Vercel/servidor)
MOCK_MODE=false
TEST_MODE=false
# Usar Stripe test mode: STRIPE_SECRET_KEY=sk_test_xxx
```

### Produção
```bash
# .env (Vercel/servidor)
MOCK_MODE=false
TEST_MODE=false
# Usar Stripe live mode: STRIPE_SECRET_KEY=sk_live_xxx
```

---

## Checklist de Verificação

### Testes em MOCK_MODE (Custo Zero)

Antes de testar com APIs reais, valide todos os fluxos:

**Frontend (navegador):**
- [ ] Fluxo completo CPF Sol (CPF terminando em 5-9)
- [ ] Fluxo completo CPF Chuva (CPF terminando em 0-4)
- [ ] Fluxo completo CNPJ Sol
- [ ] Fluxo completo CNPJ Chuva
- [ ] Visualização do relatório completo
- [ ] Responsividade em mobile

**Backend (admin + console):**
- [ ] Login com magic code (verificar email no console)
- [ ] Admin: marcar como pago
- [ ] Admin: processar consulta
- [ ] Verificar logs de processamento no terminal

### Teste Único em TEST_MODE (Antes do Go-Live)

**Backend (APIs reais, consome créditos):**
- [ ] Configurar `MOCK_MODE=false` e `TEST_MODE=true`
- [ ] Fazer 1 consulta real com seu CPF
- [ ] Verificar que dados reais da APIFull retornam corretamente
- [ ] Verificar que resumo da IA é gerado
- [ ] Conferir relatório final com dados reais

### Configuração de Email (Brevo)

**Infraestrutura (DNS + Brevo Dashboard):**
- [ ] DNS SPF configurado no provedor de domínio
- [ ] DNS DKIM configurado no provedor de domínio
- [ ] Domínio verificado no Brevo Dashboard

**Teste de envio (produção):**
- [ ] Enviar código de login real para seu email pessoal
- [ ] Verificar entrega na caixa de entrada (não spam)

### Antes de ir para Produção (Vercel)

- [ ] `MOCK_MODE` está `false` ou ausente
- [ ] `TEST_MODE` NÃO está configurado (ou `false`)
- [ ] `STRIPE_SECRET_KEY` é a chave de produção (`sk_live_xxx`)
- [ ] `STRIPE_WEBHOOK_SECRET` está configurado
- [ ] `STRIPE_PRICE_ID` é o price ID de produção
- [ ] Webhook Stripe apontando para `https://www.somoseopix.com.br/api/webhooks/stripe`
- [ ] `INNGEST_EVENT_KEY` e `INNGEST_SIGNING_KEY` são de produção
- [ ] `BREVO_API_KEY` está configurada
- [ ] `EMAIL_FROM_ADDRESS` é um domínio verificado no Brevo

---

## Configuração do Brevo (Email)

O sistema usa email **apenas para envio de código de login** (magic code).

### Variáveis de Ambiente

```bash
BREVO_API_KEY=re_xxxxxxxx           # API key do Brevo Dashboard
EMAIL_FROM_ADDRESS=plataforma@somoseopix.com.br  # Apenas o email (nome do remetente é definido no código)
```

### Configuração de DNS (Obrigatório para Produção)

No Brevo Dashboard > Domains, adicione `somoseopix.com.br` e configure no seu provedor de DNS:

1. **SPF Record (TXT)** - Autoriza Brevo a enviar em nome do domínio
2. **DKIM Record (TXT)** - Assina digitalmente os emails

O Brevo fornece os valores exatos. A verificação pode levar até 48h.

### Template de Email

O template está em `src/lib/email.ts`:

| Função | Propósito |
|--------|-----------|
| `sendMagicCode()` | Código de 6 dígitos para login |

### Monitoramento

- **Brevo Dashboard**: Taxa de entrega, bounces, spam reports (checar 1x/semana)
- **Admin Health**: `/admin/health` mostra status do Brevo
- **Sentry**: Captura erros quando `res.ok === false`
- **Console (bypass mode)**: Emails logados localmente

---

## Troubleshooting

### APIs retornando dados mockados em TEST_MODE
- Verifique se `MOCK_MODE=false` está explícito
- Reinicie o servidor após alterar `.env.local`

### Endpoint `/api/process-search` retorna 403
- Este endpoint só funciona quando `isBypassMode=true`
- Em produção, o processamento é feito pelo Inngest

### Emails não estão sendo enviados em TEST_MODE
- Comportamento esperado - emails são apenas logados
- Para testar envio real, desative ambos os modos

### Stripe retornando erro mesmo com bypass
- O bypass só afeta `createCheckoutSession` e `refundPayment`
- Webhooks do Stripe sempre validam a assinatura real
