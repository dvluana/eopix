# UC-03: Auto-login via Código da Compra

## Objetivo
Permitir login automático usando código da compra (6 caracteres alfanuméricos), sem necessidade de magic code por email.

## Escopo
**Inclui**:
- Validação de formato do código da compra
- Busca de compra por código
- Validação de status da compra (apenas PAID, COMPLETED, PROCESSING)
- Criação de sessão autenticada automaticamente
- Redirecionamento para página de confirmação da compra

**Não inclui**:
- Login via magic code (UC-01 + UC-02)
- Criação de compra (UC-05)
- Validação de pagamento (UC-06)
- Verificação de permissões admin (auto-login é sempre usuário comum)

## Atores
- **Comprador**: Pessoa que acabou de realizar compra e foi redirecionada para página de confirmação

## Regras de Negócio
1. **[RN-01]** Código deve ser string não vazia
2. **[RN-02]** Código é convertido para uppercase na busca
3. **[RN-03]** Compra deve existir no banco de dados
4. **[RN-04]** Apenas compras com status PAID, COMPLETED ou PROCESSING permitem auto-login
5. **[RN-05]** Compras PENDING retornam `reason: "payment_pending"` (sem erro, mas sem criar sessão)
6. **[RN-06]** Sessão é criada com email do usuário vinculado à compra
7. **[RN-07]** Auto-login não verifica se é admin (sempre usuário comum)
8. **[RN-08]** Endpoint retorna email e status da compra para tracking

## Contrato HTTP

### Request
`POST /api/auth/auto-login`

```json
{
  "code": "ABC123"
}
```

### Response (200 - Sucesso)
```json
{
  "success": true,
  "email": "usuario@example.com",
  "status": "PAID"
}
```

### Response (200 - Pagamento Pendente)
```json
{
  "success": false,
  "reason": "payment_pending",
  "status": "PENDING"
}
```

### Erros
- **400**: Código inválido (vazio ou não string)
  ```json
  {
    "error": "Codigo invalido"
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
    "error": "Erro interno"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/auth/auto-login/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/compra/confirmacao/page.tsx`)
- **Banco**: `exists` (modelo: `Purchase`)

## Dependências
- **depends_on**: UC-05 (compra precisa existir)
- **blocks**: Nenhum (auto-login é opcional, usuário pode usar magic code)

## Paralelização
- **parallel_group**: B (fluxo de compra/pagamento)

## Estratégia Técnica
- **[Implementado]** Função `createSession()` em `/src/lib/auth.ts`
- **[Implementado]** Query Prisma com `include: { user: true }` para obter email
- **[Implementado]** Validação de status usando array de statuses permitidos
- **[Implementado]** Logging via console.log para debugging
- **[Implementado]** Sentry para captura de erros

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário acessou página de confirmação após compra
AND compra está com status PAID
WHEN página chama endpoint de auto-login
THEN compra é encontrada pelo código
AND sessão é criada com email do usuário
AND sistema retorna success = true
AND frontend redireciona para "minhas-consultas"

GIVEN compra está com status PENDING
WHEN tenta auto-login
THEN sistema retorna success = false
AND reason = "payment_pending"
AND NÃO cria sessão
AND frontend exibe mensagem aguardando pagamento

GIVEN código de compra inválido
WHEN tenta auto-login
THEN sistema retorna erro 404
AND mensagem "Compra nao encontrada"

GIVEN compra está COMPLETED
WHEN tenta auto-login
THEN sessão é criada normalmente
AND usuário acessa relatório diretamente
```

## Testes Obrigatórios
- [ ] Unit: validação de formato do código
- [ ] Integration: auto-login com compra PAID
- [ ] Integration: auto-login com compra COMPLETED
- [ ] Integration: auto-login com compra PROCESSING
- [ ] Integration: bloqueio de auto-login com compra PENDING
- [ ] Integration: erro com código inexistente
- [ ] Integration: criação de sessão
- [ ] E2E: fluxo completo pós-compra

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
# Criar compra PAID no banco via Prisma Studio
# code: "TEST01"
# status: "PAID"
# userId: <id de usuário válido>

# Teste de auto-login bem-sucedido
curl -X POST http://localhost:3000/api/auth/auto-login \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST01"}'

# Resposta esperada
{
  "success": true,
  "email": "test@test.com",
  "status": "PAID"
}

# Verificação no banco
npx prisma studio
# → Session criada com:
#    - email: "test@test.com"
#    - expiresAt: now + 7 days

# Teste com compra PENDING
curl -X POST http://localhost:3000/api/auth/auto-login \
  -H "Content-Type: application/json" \
  -d '{"code":"PENDING01"}'

# Resposta esperada
{
  "success": false,
  "reason": "payment_pending",
  "status": "PENDING"
}

# Teste com código inválido
curl -X POST http://localhost:3000/api/auth/auto-login \
  -H "Content-Type: application/json" \
  -d '{"code":"INVALID"}'

# Resposta esperada (404)
{
  "error": "Compra nao encontrada"
}

# Verificar logs no console
# → [Auto-Login] Session created for: test@test.com
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/auth/auto-login/route.ts` (57 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)
