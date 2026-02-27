# UC-02: Verificação de Magic Code

## Objetivo
Validar código de 6 dígitos informado pelo usuário e criar sessão de autenticação quando válido.

## Escopo
**Inclui**:
- Validação de formato de código (6 dígitos)
- Verificação de código no banco de dados
- Validação de expiração (10 minutos)
- Verificação se código já foi usado
- Marcação de código como usado após validação
- Criação de sessão autenticada
- Verificação de permissões admin
- Modo de teste (código fixo: 123456)
- Validação de que usuário possui compras

**Não inclui**:
- Envio de código (UC-01)
- Renovação de código expirado (usuário deve solicitar novo código)
- Criação de usuário (usuário já existe com compra)

## Atores
- **Usuário com código**: Pessoa que recebeu código por email e está tentando fazer login

## Regras de Negócio
1. **[RN-01]** Código deve ter exatamente 6 dígitos numéricos
2. **[RN-02]** Código deve existir no banco de dados
3. **[RN-03]** Código não pode ter sido usado anteriormente (`used = false`)
4. **[RN-04]** Código não pode estar expirado (criado há menos de 10 minutos)
5. **[RN-05]** Após validação bem-sucedida, código é marcado como usado
6. **[RN-06]** Usuário deve ter pelo menos uma compra no sistema
7. **[RN-07]** Sessão é criada usando cookie httpOnly
8. **[RN-08]** Em TEST_MODE, aceita código fixo `123456` (bypass de validação no banco)
9. **[RN-09]** Após login, usuário admin é redirecionado para `/admin`, usuário comum para `/minhas-consultas`
10. **[RN-10]** Email do código deve corresponder a usuário com compras

## Contrato HTTP

### Request
`POST /api/auth/verify-code`

```json
{
  "email": "usuario@example.com",
  "code": "123456"
}
```

### Response (200 - Sucesso)
```json
{
  "success": true,
  "isAdmin": false,
  "redirect": "/minhas-consultas"
}
```

### Response (200 - Sucesso Admin)
```json
{
  "success": true,
  "isAdmin": true,
  "redirect": "/admin"
}
```

### Erros
- **400**: Email inválido
  ```json
  {
    "error": "Email invalido"
  }
  ```
- **400**: Código inválido (formato)
  ```json
  {
    "error": "Codigo invalido"
  }
  ```
- **400**: Código inválido ou expirado (não encontrado no banco)
  ```json
  {
    "error": "Codigo invalido ou expirado"
  }
  ```
- **400**: Usuário sem compras (TEST_MODE)
  ```json
  {
    "error": "Nenhuma compra encontrada para este email"
  }
  ```
- **500**: Erro ao verificar código
  ```json
  {
    "error": "Erro ao verificar codigo"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/auth/verify-code/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/(auth)/login/page.tsx`)
- **Banco**: `exists` (modelos: `User`, `MagicCode`, `Session`)

## Dependências
- **depends_on**: UC-01 (usuário precisa ter recebido código)
- **blocks**: UC-09 (acesso ao relatório requer autenticação)

## Paralelização
- **parallel_group**: A (mesmo grupo que UC-01, fluxo sequencial de autenticação)

## Estratégia Técnica
- **[Implementado]** Função `createSession()` em `/src/lib/auth.ts`
- **[Implementado]** Função `isAdminEmail()` em `/src/lib/auth.ts`
- **[Implementado]** Validador `isValidEmail()` em `/src/lib/validators.ts`
- **[Implementado]** Query Prisma com filtros compostos (email, code, used, expiresAt)
- **[Implementado]** Normalização de email (lowercase + trim)

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário informou código válido não expirado
WHEN submete formulário de verificação
THEN código é encontrado no banco
AND código é marcado como usado (used = true)
AND sessão é criada com cookie httpOnly
AND sistema retorna success = true
AND usuário é redirecionado para página apropriada

GIVEN usuário informou código já usado
WHEN submete formulário de verificação
THEN sistema retorna erro 400
AND mensagem "Codigo invalido ou expirado"

GIVEN usuário informou código expirado (>10 minutos)
WHEN submete formulário de verificação
THEN sistema retorna erro 400
AND mensagem "Codigo invalido ou expirado"

GIVEN sistema está em TEST_MODE
AND usuário informa código 123456
WHEN submete formulário de verificação
THEN sistema verifica se usuário tem compras
AND cria sessão normalmente
AND retorna sucesso

GIVEN usuário admin realiza login
WHEN código validado com sucesso
THEN isAdmin = true
AND redirect = "/admin"
```

## Testes Obrigatórios
- [ ] Unit: validação de formato de código (6 dígitos)
- [ ] Integration: código válido cria sessão
- [ ] Integration: código usado retorna erro
- [ ] Integration: código expirado retorna erro
- [ ] Integration: código inexistente retorna erro
- [ ] Integration: marcação de código como usado
- [ ] Integration: verificação de admin
- [ ] Integration: TEST_MODE aceita código fixo
- [ ] E2E: fluxo completo de login

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
# Endpoint existe e responde
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","code":"123456"}'

# Resposta esperada (TEST_MODE=true)
{
  "success": true,
  "isAdmin": false,
  "redirect": "/minhas-consultas"
}

# Verificação no banco
npx prisma studio
# → MagicCode atualizado com:
#    - used: true
# → Session criada com:
#    - email: "test@test.com"
#    - expiresAt: now + 7 days

# Teste de código já usado (segunda tentativa)
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","code":"123456"}'
# → Retorna 400: "Codigo invalido ou expirado"

# Teste de código expirado
# (criar código com expiresAt no passado via Prisma Studio)
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","code":"999999"}'
# → Retorna 400: "Codigo invalido ou expirado"
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/auth/verify-code/route.ts` (108 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)
