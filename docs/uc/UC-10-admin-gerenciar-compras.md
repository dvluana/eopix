# UC-10: Admin - Gerenciar Compras

## Objetivo
Permitir que administradores listem, filtrem, visualizem detalhes e executem ações sobre compras do sistema.

## Escopo
**Inclui**:
- Autenticação de admin (verificação de email em ADMIN_EMAILS)
- Listagem paginada de compras (GET /api/admin/purchases)
- Filtros: status, busca por código/documento/email
- Paginação customizável (page, limit)
- Visualização de detalhes de compra (GET /api/admin/purchases/[id]/details)
- Marcar compra como paga manualmente (POST /api/admin/purchases/[id]/mark-paid)
- Processar compra manualmente (POST /api/admin/purchases/[id]/process)
- Reembolsar compra (POST /api/admin/purchases/[id]/refund)
- Mascaramento de documentos para privacidade

**Não inclui**:
- Criação de compra (UC-05)
- Processamento automático (UC-07/UC-08)
- Webhook Asaas (UC-06)
- Edição de dados da compra (campos são readonly)
- Exclusão de compra (soft delete apenas)

## Atores
- **Admin**: Usuário com email listado em `ADMIN_EMAILS` (variável de ambiente)

## Regras de Negócio
1. **[RN-01]** Apenas emails listados em `ADMIN_EMAILS` podem acessar endpoints admin
2. **[RN-02]** Listagem suporta filtros: status, search (código/documento/email)
3. **[RN-03]** Paginação padrão: page=1, limit=20
4. **[RN-04]** Status válidos: PENDING, PAID, PROCESSING, COMPLETED, FAILED, REFUNDED
5. **[RN-05]** Busca é case-insensitive e remove caracteres especiais de documentos
6. **[RN-06]** Documentos são mascarados no retorno (CPF/CNPJ)
7. **[RN-07]** Mark-paid: apenas compras PENDING podem ser marcadas como pagas
8. **[RN-08]** Mark-paid: define `paidAt = now()`, NÃO dispara processamento automático
9. **[RN-09]** Process: dispara job Inngest manualmente para compra PAID
10. **[RN-10]** Refund: chama API Asaas e marca compra como REFUNDED
11. **[RN-11]** Detalhes: retorna compra completa com usuário e relatório vinculado

## Contrato HTTP

### Request (GET - Listar)
`GET /api/admin/purchases?page=1&limit=20&status=PENDING&search=ABC`

Headers:
```
Cookie: session=<admin-session>
```

### Response (200 - Lista)
```json
{
  "purchases": [
    {
      "id": "uuid",
      "code": "ABC123",
      "term": "123.456.***-**",
      "type": "CPF",
      "status": "COMPLETED",
      "amount": 2990,
      "email": "usuario@example.com",
      "buyerName": "João Silva",
      "hasReport": true,
      "reportId": "uuid",
      "asaasPaymentId": "pay_123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "paidAt": "2024-01-01T00:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Request (GET - Detalhes)
`GET /api/admin/purchases/[id]/details`

### Response (200 - Detalhes)
```json
{
  "id": "uuid",
  "code": "ABC123",
  "term": "12345678910",
  "status": "COMPLETED",
  "amount": 2990,
  "email": "usuario@example.com",
  "buyerName": "João Silva",
  "buyerCpfCnpj": "12345678910",
  "asaasPaymentId": "pay_123",
  "processingStep": 0,
  "refundAttempts": 0,
  "termsAcceptedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "paidAt": "2024-01-01T00:05:00.000Z",
  "searchResult": {
    "id": "uuid",
    "name": "João Silva"
  }
}
```

### Request (POST - Marcar como Pago)
`POST /api/admin/purchases/[id]/mark-paid`

### Response (200)
```json
{
  "success": true,
  "message": "Compra marcada como paga. Use o botao Processar para gerar o relatorio."
}
```

### Request (POST - Processar)
`POST /api/admin/purchases/[id]/process`

### Response (200)
```json
{
  "success": true,
  "message": "Processamento iniciado. Acompanhe o progresso na lista de compras."
}
```

### Request (POST - Reembolsar)
`POST /api/admin/purchases/[id]/refund`

### Response (200)
```json
{
  "success": true,
  "message": "Reembolso solicitado com sucesso."
}
```

### Erros
- **401**: Não autenticado ou não admin
  ```json
  {
    "error": "Acesso negado"
  }
  ```
- **400**: Ação inválida
  ```json
  {
    "error": "Apenas compras pendentes podem ser marcadas como pagas"
  }
  ```
- **404**: Compra não encontrada
  ```json
  {
    "error": "Compra nao encontrada"
  }
  ```
- **500**: Erro interno
  ```json
  {
    "error": "Erro ao processar acao"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivos múltiplos em `/src/app/api/admin/purchases/`)
- **Frontend**: `exists` (arquivo: `/src/app/admin/compras/page.tsx`)
- **Banco**: `exists` (modelo: `Purchase`)

## Dependências
- **depends_on**: UC-05 (compras precisam existir)
- **depends_on**: UC-02 (admin precisa estar autenticado)
- **blocks**: Nenhum (painel admin é independente)

## Paralelização
- **parallel_group**: E (admin, independente de outros fluxos)

## Estratégia Técnica
- **[Implementado]** Função `requireAdmin()` em `/src/lib/auth.ts`
- **[Implementado]** Query Prisma com filtros dinâmicos (where condicional)
- **[Implementado]** Paginação com skip/take
- **[Implementado]** Mascaramento de documentos usando regex
- **[Implementado]** Inngest trigger para processamento manual
- **[Implementado]** Integração Asaas para refund

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN admin autenticado acessa painel
WHEN faz GET /api/admin/purchases
THEN sistema valida permissões de admin
AND retorna lista paginada de compras
AND documentos são mascarados
AND inclui metadados de paginação

GIVEN admin filtra por status PENDING
WHEN aplica filtro
THEN apenas compras PENDING são retornadas

GIVEN admin busca por código "ABC123"
WHEN aplica busca
THEN compras com código matching são retornadas

GIVEN admin marca compra PENDING como paga
WHEN faz POST /api/admin/purchases/[id]/mark-paid
THEN compra vira PAID com paidAt definido
AND NÃO dispara processamento automático
AND mensagem informa que deve processar manualmente

GIVEN admin processa compra PAID manualmente
WHEN faz POST /api/admin/purchases/[id]/process
THEN evento Inngest é disparado
AND compra vira PROCESSING
AND processamento segue normalmente

GIVEN admin reembolsa compra
WHEN faz POST /api/admin/purchases/[id]/refund
THEN API Asaas é chamada
AND compra vira REFUNDED
AND retorna confirmação
```

## Testes Obrigatórios
- [ ] Unit: validação de admin
- [ ] Integration: listagem com paginação
- [ ] Integration: filtro por status
- [ ] Integration: busca por código/documento/email
- [ ] Integration: mark-paid em compra PENDING
- [ ] Integration: bloqueio mark-paid em compra não-PENDING
- [ ] Integration: processamento manual
- [ ] Integration: refund via Asaas
- [ ] Integration: acesso negado para não-admin
- [ ] E2E: fluxo completo de gestão

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
# Login como admin
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eopix.com","code":"123456"}'
# → Salvar cookie de sessão

# Listar compras
curl -X GET "http://localhost:3000/api/admin/purchases?page=1&limit=10" \
  -H "Cookie: session=<admin-session>"

# Resposta esperada
{
  "purchases": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}

# Filtrar por status
curl -X GET "http://localhost:3000/api/admin/purchases?status=PENDING" \
  -H "Cookie: session=<admin-session>"

# Buscar por código
curl -X GET "http://localhost:3000/api/admin/purchases?search=ABC123" \
  -H "Cookie: session=<admin-session>"

# Detalhes de compra
curl -X GET "http://localhost:3000/api/admin/purchases/uuid-123/details" \
  -H "Cookie: session=<admin-session>"

# Marcar como pago (compra PENDING)
curl -X POST "http://localhost:3000/api/admin/purchases/uuid-123/mark-paid" \
  -H "Cookie: session=<admin-session>"

# Resposta esperada
{
  "success": true,
  "message": "Compra marcada como paga. Use o botao Processar para gerar o relatorio."
}

# Verificar no banco
npx prisma studio
# → Purchase.status: "PAID"
# → Purchase.paidAt: <timestamp>

# Processar manualmente
curl -X POST "http://localhost:3000/api/admin/purchases/uuid-123/process" \
  -H "Cookie: session=<admin-session>"

# Verificar Inngest
# → Evento "search/process" disparado

# Reembolsar compra
curl -X POST "http://localhost:3000/api/admin/purchases/uuid-123/refund" \
  -H "Cookie: session=<admin-session>"

# Verificar no banco
# → Purchase.status: "REFUNDED"

# Teste de acesso negado (não-admin)
curl -X GET "http://localhost:3000/api/admin/purchases" \
  -H "Cookie: session=<user-session>"

# Resposta esperada (401)
{
  "error": "Acesso negado"
}
```

## Arquivos Implementados
- **Caminho base**: `/src/app/api/admin/purchases/`
- **Arquivos**:
  - `route.ts` (listagem) - 86 linhas
  - `[id]/details/route.ts` (detalhes)
  - `[id]/mark-paid/route.ts` (marcar pago) - 68 linhas
  - `[id]/process/route.ts` (processar manualmente)
  - `[id]/refund/route.ts` (reembolsar)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Mark-paid é separado de processamento para permitir controle manual
- Útil em modo bypass (pagamento offline) ou debugging
- Refund integra diretamente com Asaas
- Documentos mascarados protegem privacidade mesmo no admin
