# UC-05: Criação de Compra + Checkout Asaas

## Objetivo
Criar registro de compra no banco de dados e gerar checkout Asaas para pagamento via PIX.

## Escopo
**Inclui**:
- Validação de inputs (term, email, termsAccepted)
- Validação de CPF/CNPJ
- Rate limiting por IP (proteção contra spam)
- Verificação de blocklist
- Criação ou recuperação de usuário
- Geração de código único de compra (6 caracteres alfanuméricos)
- Criação de registro Purchase com status PENDING
- Integração com Asaas para criar cobrança PIX
- Modo bypass (MOCK_MODE/TEST_MODE): cria compra PENDING sem Asaas
- Listagem de compras do usuário autenticado (GET)

**Não inclui**:
- Processamento de pagamento (UC-06 - webhook)
- Processamento de dados da consulta (UC-07/UC-08 - Inngest)
- Validação prévia de documento (UC-04 - já foi feita no frontend)

## Atores
- **Comprador**: Pessoa que validou documento e está pronta para pagar
- **Sistema Asaas**: Gateway de pagamento PIX

## Regras de Negócio
1. **[RN-01]** Campos term, email e termsAccepted são obrigatórios
2. **[RN-02]** Email deve ser válido e normalizado (lowercase + trim)
3. **[RN-03]** Documento deve ser CPF ou CNPJ válido
4. **[RN-04]** Rate limiting por IP (exceto em MOCK_MODE/TEST_MODE)
5. **[RN-05]** Documentos na blocklist retornam erro 403
6. **[RN-06]** Usuário é criado automaticamente se não existir
7. **[RN-07]** Código de compra tem 6 caracteres alfanuméricos (sem I, O, 0, 1)
8. **[RN-08]** Código de compra deve ser único (máximo 10 tentativas)
9. **[RN-09]** Preço é obtido de variável de ambiente (PRICE_CENTS, padrão: 2990 = R$ 29,90)
10. **[RN-10]** Purchase é criada com status PENDING
11. **[RN-11]** Em modo bypass, retorna URL de confirmação sem criar checkout Asaas
12. **[RN-12]** Em modo normal, cria checkout Asaas e armazena paymentId
13. **[RN-13]** Se Asaas falhar, purchase órfã é deletada
14. **[RN-14]** GET /api/purchases requer autenticação e retorna apenas compras do usuário

## Contrato HTTP

### Request (POST)
`POST /api/purchases`

```json
{
  "term": "12345678910",
  "email": "usuario@example.com",
  "termsAccepted": true
}
```

### Response (200 - Sucesso Normal)
```json
{
  "code": "ABC123",
  "checkoutUrl": "https://app.asaas.com/payment/..."
}
```

### Response (200 - Sucesso Bypass Mode)
```json
{
  "code": "ABC123",
  "checkoutUrl": "http://localhost:3000/compra/confirmacao?code=ABC123",
  "_bypassMode": true
}
```

### Request (GET)
`GET /api/purchases`

Headers:
```
Cookie: session=...
```

### Response (200 - Lista de Compras)
```json
{
  "email": "usuario@example.com",
  "purchases": [
    {
      "id": "uuid",
      "code": "ABC123",
      "status": "COMPLETED",
      "processingStep": 0,
      "type": "CPF",
      "term": "123.456.***-**",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "hasReport": true,
      "reportId": "uuid"
    }
  ]
}
```

### Erros (POST)
- **400**: Campos obrigatórios
  ```json
  {
    "error": "term, email e termsAccepted sao obrigatorios"
  }
  ```
- **400**: Email inválido
  ```json
  {
    "error": "Email invalido"
  }
  ```
- **400**: Documento inválido
  ```json
  {
    "error": "Documento invalido"
  }
  ```
- **403**: Documento bloqueado
  ```json
  {
    "error": "Este documento nao pode ser consultado"
  }
  ```
- **429**: Rate limit excedido
  ```json
  {
    "error": "Limite de compras excedido. Tente novamente mais tarde."
  }
  ```
- **500**: Erro ao criar pagamento
  ```json
  {
    "error": "Erro ao criar pagamento. Tente novamente."
  }
  ```
- **500**: Erro ao criar compra
  ```json
  {
    "error": "Erro ao criar compra"
  }
  ```

### Erros (GET)
- **401**: Não autenticado
  ```json
  {
    "error": "Nao autenticado"
  }
  ```
- **500**: Erro ao listar compras
  ```json
  {
    "error": "Erro ao listar compras"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/purchases/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/consulta/[term]/page.tsx`)
- **Banco**: `exists` (modelos: `Purchase`, `User`)
- **Integração**: `exists` (Asaas via `/src/lib/asaas.ts`)

## Dependências
- **depends_on**: UC-04 (validação de documento)
- **blocks**: UC-06 (webhook precisa de purchase criada)

## Paralelização
- **parallel_group**: B (fluxo de compra/pagamento)

## Estratégia Técnica
- **[Implementado]** Função `createPixCharge()` em `/src/lib/asaas.ts`
- **[Implementado]** Função `generateCode()` local (6 caracteres alfanuméricos)
- **[Implementado]** Função `checkRateLimit()` em `/src/lib/rate-limit.ts`
- **[Implementado]** Função `isBypassMode` em `/src/lib/mock-mode.ts`
- **[Implementado]** Função `getSession()` em `/src/lib/auth.ts`
- **[Implementado]** Validadores em `/src/lib/validators.ts`
- **[Implementado]** Sentry para tracking de erros Asaas
- **[Implementado]** Rollback de purchase órfã em caso de erro Asaas

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário informou documento válido e email
AND aceitou termos de uso
WHEN submete formulário de compra
THEN usuário é criado ou recuperado
AND código único de 6 caracteres é gerado
AND purchase é criada com status PENDING
AND checkout Asaas é criado
AND purchase é atualizada com asaasPaymentId
AND sistema retorna code e checkoutUrl
AND usuário é redirecionado para Asaas

GIVEN sistema está em modo bypass
WHEN cria compra
THEN purchase é criada com status PENDING
AND NÃO cria checkout Asaas
AND retorna URL de confirmação local
AND _bypassMode = true

GIVEN Asaas retorna erro ao criar checkout
WHEN tenta criar compra
THEN purchase órfã é deletada
AND sistema retorna erro 500
AND erro é enviado para Sentry

GIVEN documento está na blocklist
WHEN tenta criar compra
THEN sistema retorna erro 403
AND NÃO cria purchase

GIVEN usuário autenticado faz GET /api/purchases
WHEN busca suas compras
THEN sistema retorna lista de compras do usuário
AND termos são mascarados (CPF/CNPJ)
AND hasReport indica se relatório está pronto
```

## Testes Obrigatórios
- [ ] Unit: geração de código único
- [ ] Unit: validação de inputs obrigatórios
- [ ] Integration: criação de usuário novo
- [ ] Integration: recuperação de usuário existente
- [ ] Integration: criação de purchase PENDING
- [ ] Integration: integração com Asaas (mock)
- [ ] Integration: rollback de purchase em erro Asaas
- [ ] Integration: verificação de blocklist
- [ ] Integration: rate limiting
- [ ] Integration: modo bypass
- [ ] Integration: GET lista de compras autenticadas
- [ ] E2E: fluxo completo de compra

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Contrato HTTP especificado
- [x] Dependências mapeadas
- [x] Critérios de aceite testáveis

## Checklist DoD
- [x] Backend implementado e funcionando
- [x] Frontend implementado e funcionando
- [x] Banco de dados com migrações aplicadas
- [x] Documentação atualizada (este arquivo)
- [ ] Testes mínimos implementados (GAP - UC-15)
- [x] Lint + typecheck passando
- [x] Build sem erros

## Evidências de Conclusão

```bash
# Teste POST - Criar compra (modo bypass)
curl -X POST http://localhost:3000/api/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "term": "12345678910",
    "email": "test@test.com",
    "termsAccepted": true
  }'

# Resposta esperada (bypass mode)
{
  "code": "ABC123",
  "checkoutUrl": "http://localhost:3000/compra/confirmacao?code=ABC123",
  "_bypassMode": true
}

# Verificação no banco
npx prisma studio
# → Purchase criada com:
#    - code: "ABC123"
#    - status: "PENDING"
#    - term: "12345678910"
#    - amount: 2990
#    - termsAcceptedAt: <timestamp>
# → User criado ou recuperado:
#    - email: "test@test.com"

# Teste GET - Listar compras (com sessão autenticada)
curl -X GET http://localhost:3000/api/purchases \
  -H "Cookie: session=<session-token>"

# Resposta esperada
{
  "email": "test@test.com",
  "purchases": [
    {
      "id": "uuid",
      "code": "ABC123",
      "status": "PENDING",
      "processingStep": 0,
      "type": "CPF",
      "term": "123.456.***-**",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "hasReport": false,
      "reportId": null
    }
  ]
}

# Teste com documento bloqueado
# (adicionar à blocklist via Prisma Studio)
curl -X POST http://localhost:3000/api/purchases \
  -H "Content-Type: application/json" \
  -d '{
    "term": "12345678910",
    "email": "test@test.com",
    "termsAccepted": true
  }'

# Resposta esperada (403)
{
  "error": "Este documento nao pode ser consultado"
}

# Teste de rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/purchases \
    -H "Content-Type: application/json" \
    -d '{
      "term": "12345678910",
      "email": "test@test.com",
      "termsAccepted": true
    }'
done
# → Retorna 429 após limite excedido
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/purchases/route.ts` (248 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Modo bypass permite desenvolvimento sem configurar Asaas
- Purchase órfã é deletada se Asaas falhar (evita poluir banco)
- Código de compra evita caracteres ambíguos (I, O, 0, 1)
- GET endpoint retorna compras com termo mascarado para privacidade
