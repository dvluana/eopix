# UC-06: Webhook Stripe

## Objetivo
Receber notificações do Stripe sobre alterações de status de pagamento e atualizar compras no banco de dados.

## Escopo
**Inclui**:
- Validação de assinatura do webhook (stripe-signature header)
- Validação de payload
- Idempotência (evitar processamento duplicado)
- Busca de compra por client_reference_id (código da compra)
- Mapeamento de eventos Stripe para status internos
- Atualização de purchase com novo status
- Armazenamento de dados do cliente (nome)
- Trigger de job Inngest para processar consulta (quando PAID)
- Logging de webhook processado (WebhookLog)

**Não inclui**:
- Criação de compra (UC-05)
- Processamento de consulta (UC-07/UC-08 - Inngest)
- Notificação ao usuário (email/SMS)
- Verificação manual de pagamento

## Atores
- **Sistema Stripe**: Gateway de pagamento que envia webhooks
- **Sistema Inngest**: Plataforma de jobs assíncronos

## Regras de Negócio
1. **[RN-01]** Webhook deve conter assinatura válida no header `stripe-signature`
2. **[RN-02]** Payload deve ser um evento Stripe válido
3. **[RN-03]** Idempotência: evento duplicado (mesmo `event.type:event.id`) é ignorado
4. **[RN-04]** Purchase deve existir (busca por `code = client_reference_id`)
5. **[RN-05]** Mapeamento de eventos:
   - `checkout.session.completed` (payment_status=paid) → status `PAID` (cartão)
   - `checkout.session.async_payment_succeeded` → status `PAID` (Pix)
   - `checkout.session.async_payment_failed` → status `FAILED` (Pix expirado)
   - `charge.refunded` → status `REFUNDED`
6. **[RN-06]** Ao marcar como PAID, define `paidAt = now()`
7. **[RN-07]** Armazena `buyerName` se disponível em customer_details
8. **[RN-08]** Atualiza `stripePaymentIntentId` com payment_intent da session
9. **[RN-09]** Quando status vira PAID, envia evento `search/process` para Inngest
10. **[RN-10]** Webhook é logado em `WebhookLog` com chave única `event.type:event.id`
11. **[RN-11]** Falha ao disparar Inngest NÃO falha o webhook (pode ser retriado depois)

## Contrato HTTP

### Request
`POST /api/webhooks/stripe`

Headers:
```
stripe-signature: t=1234567890,v1=abc123...
Content-Type: application/json
```

Body: Raw Stripe event payload (verificado pela assinatura)

### Response (200 - Sucesso)
```json
{
  "received": true
}
```

### Response (200 - Duplicado)
```json
{
  "received": true,
  "duplicate": true
}
```

### Erros
- **400**: Assinatura ausente
  ```json
  {
    "error": "Missing signature"
  }
  ```
- **401**: Assinatura inválida
  ```json
  {
    "error": "Invalid signature"
  }
  ```
- **500**: Erro interno
  ```json
  {
    "error": "Internal server error"
  }
  ```

## Eventos Tratados

| Evento Stripe | Método Pagamento | Status Purchase | Ação |
|---------------|------------------|-----------------|------|
| `checkout.session.completed` (paid) | Cartão | PAID | Trigger Inngest |
| `checkout.session.async_payment_succeeded` | Pix | PAID | Trigger Inngest |
| `checkout.session.async_payment_failed` | Pix (expirado) | FAILED | - |
| `charge.refunded` | Qualquer | REFUNDED | - |

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/webhooks/stripe/route.ts`)
- **Banco**: `exists` (modelos: `Purchase`, `WebhookLog`)
- **Integração**: `exists` (Inngest via `/src/lib/inngest.ts`)

## Dependências
- **depends_on**: UC-05 (purchase precisa existir)
- **blocks**: UC-07, UC-08 (processamento depende de webhook PAID)

## Paralelização
- **parallel_group**: B (fluxo de compra/pagamento)

## Estratégia Técnica
- **[Implementado]** Função `validateWebhookSignature()` em `/src/lib/stripe.ts`
- **[Implementado]** Idempotência via `WebhookLog.eventKey` (unique constraint)
- **[Implementado]** Switch/case para mapear eventos Stripe
- **[Implementado]** Inngest trigger com `inngest.send()`
- **[Implementado]** Try/catch para não falhar webhook se Inngest falhar
- **[Implementado]** Logging via console.log

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN Stripe envia webhook checkout.session.completed (payment_status=paid)
AND assinatura é válida
AND purchase existe
WHEN webhook é recebido
THEN evento não é duplicado (verificação em WebhookLog)
AND purchase é atualizada para status PAID
AND paidAt é definido
AND stripePaymentIntentId é armazenado
AND evento search/process é enviado para Inngest
AND webhook é logado em WebhookLog
AND sistema retorna 200 received = true

GIVEN Stripe envia webhook checkout.session.async_payment_succeeded
AND assinatura é válida
AND purchase existe (Pix pendente)
WHEN webhook é recebido
THEN purchase é atualizada para status PAID
AND processamento é iniciado via Inngest

GIVEN Stripe envia webhook checkout.session.async_payment_failed
AND assinatura é válida
AND purchase existe (Pix pendente)
WHEN webhook é recebido
THEN purchase é atualizada para status FAILED
AND failureReason é definido como PAYMENT_FAILED

GIVEN webhook duplicado é recebido
WHEN processa webhook
THEN encontra registro em WebhookLog
AND retorna 200 com duplicate = true
AND NÃO atualiza purchase novamente

GIVEN assinatura inválida
WHEN recebe webhook
THEN sistema retorna 401 Invalid signature

GIVEN Inngest falha ao receber evento
WHEN webhook marca purchase como PAID
THEN webhook retorna 200 (sucesso)
AND erro Inngest é logado
AND purchase fica marcada como PAID (pode reprocessar depois)
```

## Configuração do Stripe

### Dashboard Stripe
1. Acessar https://dashboard.stripe.com/webhooks
2. Adicionar endpoint: `https://www.somoseopix.com.br/api/webhooks/stripe`
3. Selecionar eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `charge.refunded`
4. Copiar `Signing secret` para `STRIPE_WEBHOOK_SECRET`

### Variáveis de Ambiente
```bash
STRIPE_SECRET_KEY=sk_live_xxx      # ou sk_test_xxx para testes
STRIPE_WEBHOOK_SECRET=whsec_xxx    # Webhook signing secret
STRIPE_PRICE_ID=price_xxx          # ID do preço (R$ 29,90)
```

### Teste Local com Stripe CLI
```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Escutar webhooks localmente
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Em outro terminal, simular eventos
stripe trigger checkout.session.completed
stripe trigger checkout.session.async_payment_succeeded
```

## Testes Obrigatórios
- [ ] Unit: validação de assinatura
- [ ] Unit: mapeamento de eventos
- [ ] Integration: webhook checkout.session.completed → PAID
- [ ] Integration: webhook async_payment_succeeded → PAID (Pix)
- [ ] Integration: webhook async_payment_failed → FAILED
- [ ] Integration: webhook duplicado (idempotência)
- [ ] Integration: armazenamento em WebhookLog
- [ ] Integration: trigger de Inngest
- [ ] Integration: falha de Inngest não quebra webhook
- [ ] E2E: fluxo completo de pagamento

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Contrato HTTP especificado
- [x] Dependências mapeadas
- [x] Critérios de aceite testáveis

## Checklist DoD
- [x] Backend implementado e funcionando
- [x] Banco de dados com migrações aplicadas
- [x] Documentação atualizada (este arquivo)
- [ ] Testes mínimos implementados
- [x] Lint + typecheck passando
- [x] Build sem erros

## Arquivo Implementado
- **Caminho**: `/src/app/api/webhooks/stripe/route.ts`
- **Lib**: `/src/lib/stripe.ts`

## Notas de Implementação
- Idempotência é crítica: Stripe pode reenviar webhooks
- Falha de Inngest não quebra webhook para garantir que pagamento seja registrado
- WebhookLog permite debugging e auditoria de pagamentos
- Eventos não mapeados são ignorados mas logados para observabilidade
- Stripe valida a assinatura usando o raw body e o secret
