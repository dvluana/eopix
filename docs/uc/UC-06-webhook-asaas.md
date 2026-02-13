# UC-06: Webhook Asaas

## Objetivo
Receber notificações do Asaas sobre alterações de status de pagamento e atualizar compras no banco de dados.

## Escopo
**Inclui**:
- Validação de token do webhook (segurança)
- Validação de payload (campos obrigatórios)
- Idempotência (evitar processamento duplicado)
- Busca de compra por externalReference (código da compra)
- Mapeamento de eventos Asaas para status internos
- Atualização de purchase com novo status
- Armazenamento de dados do pagador (nome, CPF/CNPJ)
- Trigger de job Inngest para processar consulta (quando PAID)
- Logging de webhook processado (WebhookLog)

**Não inclui**:
- Criação de compra (UC-05)
- Processamento de consulta (UC-07/UC-08 - Inngest)
- Notificação ao usuário (email/SMS)
- Verificação manual de pagamento

## Atores
- **Sistema Asaas**: Gateway de pagamento que envia webhooks
- **Sistema Inngest**: Plataforma de jobs assíncronos

## Regras de Negócio
1. **[RN-01]** Webhook deve conter token válido no header `asaas-access-token`
2. **[RN-02]** Payload deve conter `event`, `payment.id` e `payment.externalReference`
3. **[RN-03]** Idempotência: evento duplicado (mesmo `event:paymentId`) é ignorado
4. **[RN-04]** Purchase deve existir (busca por `code = externalReference`)
5. **[RN-05]** Mapeamento de eventos:
   - `PAYMENT_CONFIRMED` | `PAYMENT_RECEIVED` → status `PAID`
   - `PAYMENT_REPROVED_BY_RISK_ANALYSIS` → status `FAILED`
   - `PAYMENT_REFUNDED` → status `REFUNDED`
   - Demais eventos mantêm status atual
6. **[RN-06]** Ao marcar como PAID, define `paidAt = now()`
7. **[RN-07]** Armazena `buyerName` e `buyerCpfCnpj` se disponíveis
8. **[RN-08]** Atualiza `asaasPaymentId` se não estava definido
9. **[RN-09]** Quando status vira PAID, envia evento `search/process` para Inngest
10. **[RN-10]** Webhook é logado em `WebhookLog` com chave única `event:paymentId`
11. **[RN-11]** Falha ao disparar Inngest NÃO falha o webhook (pode ser retriado depois)

## Contrato HTTP

### Request
`POST /api/webhooks/asaas`

Headers:
```
asaas-access-token: <webhook-token>
```

Body:
```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_123456",
    "status": "CONFIRMED",
    "externalReference": "ABC123",
    "value": 29.90,
    "payer": {
      "name": "João Silva",
      "cpfCnpj": "12345678910"
    }
  }
}
```

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
- **401**: Token inválido
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **400**: Payload inválido
  ```json
  {
    "error": "Invalid payload"
  }
  ```
- **404**: Compra não encontrada
  ```json
  {
    "error": "Purchase not found"
  }
  ```
- **500**: Erro interno
  ```json
  {
    "error": "Internal server error"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/webhooks/asaas/route.ts`)
- **Banco**: `exists` (modelos: `Purchase`, `WebhookLog`)
- **Integração**: `exists` (Inngest via `/src/lib/inngest.ts`)

## Dependências
- **depends_on**: UC-05 (purchase precisa existir)
- **blocks**: UC-07, UC-08 (processamento depende de webhook PAID)

## Paralelização
- **parallel_group**: B (fluxo de compra/pagamento)

## Estratégia Técnica
- **[Implementado]** Função `validateWebhookToken()` em `/src/lib/asaas.ts`
- **[Implementado]** Idempotência via `WebhookLog.eventKey` (unique constraint)
- **[Implementado]** Switch/case para mapear eventos Asaas
- **[Implementado]** Inngest trigger com `inngest.send()`
- **[Implementado]** Try/catch para não falhar webhook se Inngest falhar
- **[Implementado]** Logging via console.log

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN Asaas envia webhook PAYMENT_CONFIRMED
AND token é válido
AND purchase existe
WHEN webhook é recebido
THEN evento não é duplicado (verificação em WebhookLog)
AND purchase é atualizada para status PAID
AND paidAt é definido
AND dados do pagador são armazenados
AND evento search/process é enviado para Inngest
AND webhook é logado em WebhookLog
AND sistema retorna 200 received = true

GIVEN webhook duplicado é recebido
WHEN processa webhook
THEN encontra registro em WebhookLog
AND retorna 200 com duplicate = true
AND NÃO atualiza purchase novamente

GIVEN token inválido
WHEN recebe webhook
THEN sistema retorna 401 Unauthorized

GIVEN purchase não existe
WHEN recebe webhook com externalReference inválido
THEN sistema retorna 404
AND loga warning no console

GIVEN Inngest falha ao receber evento
WHEN webhook marca purchase como PAID
THEN webhook retorna 200 (sucesso)
AND erro Inngest é logado
AND purchase fica marcada como PAID (pode reprocessar depois)
```

## Testes Obrigatórios
- [ ] Unit: validação de token
- [ ] Unit: mapeamento de eventos
- [ ] Integration: webhook PAYMENT_CONFIRMED → PAID
- [ ] Integration: webhook PAYMENT_REFUNDED → REFUNDED
- [ ] Integration: webhook duplicado (idempotência)
- [ ] Integration: webhook com purchase inexistente
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
- [ ] Testes mínimos implementados (GAP - UC-15)
- [x] Lint + typecheck passando
- [x] Build sem erros

## Evidências de Conclusão

```bash
# Preparação: criar purchase PENDING no banco
# code: "TEST01", status: "PENDING", asaasPaymentId: null

# Teste de webhook PAYMENT_CONFIRMED
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: <seu-webhook-token>" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_123",
      "status": "CONFIRMED",
      "externalReference": "TEST01",
      "value": 29.90,
      "payer": {
        "name": "João Silva",
        "cpfCnpj": "12345678910"
      }
    }
  }'

# Resposta esperada
{
  "received": true
}

# Verificação no banco
npx prisma studio
# → Purchase atualizada:
#    - status: "PAID"
#    - paidAt: <timestamp>
#    - buyerName: "João Silva"
#    - buyerCpfCnpj: "12345678910"
#    - asaasPaymentId: "pay_123"
# → WebhookLog criado:
#    - eventKey: "PAYMENT_CONFIRMED:pay_123"
#    - event: "PAYMENT_CONFIRMED"
#    - paymentId: "pay_123"

# Verificar logs do Inngest
# → Evento "search/process" enviado com purchaseId

# Teste de webhook duplicado (mesma requisição)
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: <seu-webhook-token>" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_123",
      "externalReference": "TEST01"
    }
  }'

# Resposta esperada
{
  "received": true,
  "duplicate": true
}

# Teste de token inválido
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -H "asaas-access-token: invalid-token" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_123",
      "externalReference": "TEST01"
    }
  }'

# Resposta esperada (401)
{
  "error": "Unauthorized"
}

# Verificar console logs
# → "Purchase TEST01 updated to PAID"
# → "Inngest job triggered for purchase TEST01"
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/webhooks/asaas/route.ts` (174 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Idempotência é crítica: Asaas pode reenviar webhooks
- Falha de Inngest não quebra webhook para garantir que pagamento seja registrado
- WebhookLog permite debugging e auditoria de pagamentos
- Eventos não mapeados são ignorados mas logados para observabilidade
