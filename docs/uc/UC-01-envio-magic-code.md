# UC-01: Envio de Magic Code

## Objetivo
Enviar código de autenticação de 6 dígitos por email para usuários que possuem compras no sistema.

## Escopo
**Inclui**:
- Validação de formato de email
- Rate limiting duplo (por email e por IP)
- Verificação de existência de compras
- Geração de código único de 6 dígitos
- Invalidação de códigos anteriores não utilizados
- Envio de email via Brevo
- Modo de teste (código fixo: 123456)

**Não inclui**:
- Verificação do código (UC-02)
- Criação de usuário (usuário é criado automaticamente na primeira compra)
- Recuperação de senha (não há senha no sistema)

## Atores
- **Usuário com compras**: Pessoa que já realizou pelo menos uma compra no sistema e deseja fazer login

## Regras de Negócio
1. **[RN-01]** Email deve ser válido e normalizado (lowercase + trim)
2. **[RN-02]** Rate limiting por email: máximo de tentativas por hora (definido em `checkRateLimit`)
3. **[RN-03]** Rate limiting por IP: máximo de tentativas por hora
4. **[RN-04]** Apenas usuários com compras podem receber código (segurança: não vazar existência de emails)
5. **[RN-05]** Código tem 6 dígitos numéricos
6. **[RN-06]** Código expira em 10 minutos
7. **[RN-07]** Códigos anteriores não utilizados são invalidados automaticamente
8. **[RN-08]** Em TEST_MODE, retorna código fixo `123456` (sem enviar email)
9. **[RN-09]** Sempre retorna sucesso, mesmo para emails sem compras (anti-enumeration)

## Contrato HTTP

### Request
`POST /api/auth/send-code`

```json
{
  "email": "usuario@example.com"
}
```

### Response (200 - Sucesso)
```json
{
  "success": true,
  "message": "Codigo enviado para seu email."
}
```

### Response (200 - Sucesso em TEST_MODE)
```json
{
  "success": true,
  "message": "Codigo enviado para seu email.",
  "_testHint": "Use o código 123456 para login em modo de teste"
}
```

### Erros
- **400**: Email inválido
  ```json
  {
    "error": "Email invalido"
  }
  ```
- **429**: Rate limit excedido (por email)
  ```json
  {
    "error": "Limite de tentativas excedido. Tente novamente mais tarde.",
    "retryAfter": 3600
  }
  ```
- **429**: Rate limit excedido (por IP)
  ```json
  {
    "error": "Muitas tentativas deste IP. Tente novamente mais tarde.",
    "retryAfter": 3600
  }
  ```
- **500**: Erro ao enviar código
  ```json
  {
    "error": "Erro ao enviar codigo"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/auth/send-code/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/(auth)/login/page.tsx`)
- **Banco**: `exists` (modelos: `User`, `MagicCode`)

## Dependências
- **depends_on**: Nenhuma (ponto de entrada do sistema)
- **blocks**: UC-02 (verificação de código)

## Paralelização
- **parallel_group**: A (independente de outros fluxos)

## Estratégia Técnica
- **[Implementado]** Função `generateMagicCode()` em `/src/lib/auth.ts`
- **[Implementado]** Função `sendMagicCode()` em `/src/lib/email.ts`
- **[Implementado]** Função `checkRateLimit()` em `/src/lib/rate-limit.ts`
- **[Implementado]** Validador `isValidEmail()` em `/src/lib/validators.ts`

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário com compras informa email válido
WHEN envia formulário de login
THEN código de 6 dígitos é gerado
AND código é salvo no banco com expiresAt = now + 10min
AND códigos anteriores não utilizados são invalidados
AND email é enviado via Brevo com código
AND sistema retorna status 200 com mensagem de sucesso

GIVEN usuário informa email válido mas sem compras
WHEN envia formulário de login
THEN sistema retorna sucesso (anti-enumeration)
AND NÃO envia email
AND loga tentativa para debugging

GIVEN usuário excede rate limit por email
WHEN tenta enviar código novamente
THEN sistema retorna erro 429
AND informa tempo de espera (retryAfter)

GIVEN sistema está em TEST_MODE
WHEN envia código
THEN NÃO envia email via Brevo
AND loga código no console
AND retorna hint com código fixo 123456
```

## Testes Obrigatórios
- [ ] Unit: validação de email (formato válido/inválido)
- [ ] Unit: geração de código (6 dígitos numéricos)
- [ ] Integration: criação de MagicCode no banco
- [ ] Integration: invalidação de códigos anteriores
- [ ] Integration: rate limiting por email
- [ ] Integration: rate limiting por IP
- [ ] Integration: anti-enumeration (email sem compras)
- [ ] E2E: fluxo completo de envio de código

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
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'

# Resposta esperada (TEST_MODE=true)
{
  "success": true,
  "message": "Codigo enviado para seu email.",
  "_testHint": "Use o código 123456 para login em modo de teste"
}

# Verificação no banco
npx prisma studio
# → MagicCode criado com:
#    - email: "test@test.com"
#    - code: "123456" (ou código real)
#    - expiresAt: now + 10min
#    - used: false

# Verificação de rate limiting
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/auth/send-code \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com"}'
done
# → Retorna 429 após limite excedido
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/auth/send-code/route.ts` (141 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)
