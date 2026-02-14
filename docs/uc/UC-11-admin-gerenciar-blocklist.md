# UC-11: Admin - Gerenciar Blocklist

## Objetivo
Permitir que administradores gerenciem lista de documentos (CPF/CNPJ) bloqueados para consulta, respeitando LGPD e decisões judiciais.

## Escopo
**Inclui**:
- Autenticação de admin (verificação de email em ADMIN_EMAILS)
- Listagem paginada de documentos bloqueados (GET /api/admin/blocklist)
- Busca por documento ou nome associado
- Adicionar documento à blocklist (POST /api/admin/blocklist)
- Validação de CPF/CNPJ antes de adicionar
- Motivos de bloqueio: SOLICITACAO_TITULAR, JUDICIAL, HOMONIMO
- Remoção de documento da blocklist (DELETE /api/admin/blocklist/[id])
- Mascaramento de documentos para privacidade

**Não inclui**:
- Validação automática de solicitações LGPD (UC-12)
- Notificação ao titular do bloqueio
- Histórico de alterações na blocklist
- Edição de motivo de bloqueio (apenas adicionar/remover)

## Atores
- **Admin**: Usuário com email listado em `ADMIN_EMAILS` (variável de ambiente)

## Regras de Negócio
1. **[RN-01]** Apenas emails listados em `ADMIN_EMAILS` podem acessar endpoints admin
2. **[RN-02]** Documento deve ser CPF ou CNPJ válido
3. **[RN-03]** Documento é limpo (apenas dígitos) antes de salvar
4. **[RN-04]** Motivos válidos: `SOLICITACAO_TITULAR`, `JUDICIAL`, `HOMONIMO`
5. **[RN-05]** Documento duplicado retorna erro 409 (Conflict)
6. **[RN-06]** Nome associado é opcional (útil para identificação)
7. **[RN-07]** Documentos são mascarados no retorno (CPF/CNPJ)
8. **[RN-08]** Listagem suporta busca por documento limpo ou nome associado
9. **[RN-09]** Paginação padrão: page=1, limit=20
10. **[RN-10]** Remoção é permanente (não soft delete)

## Contrato HTTP

### Request (GET - Listar)
`GET /api/admin/blocklist?page=1&limit=20&search=João`

Headers:
```
Cookie: session=<admin-session>
```

### Response (200 - Lista)
```json
{
  "blocklist": [
    {
      "id": "uuid",
      "term": "123.456.***-**",
      "associatedName": "João Silva",
      "reason": "SOLICITACAO_TITULAR",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Request (POST - Adicionar)
`POST /api/admin/blocklist`

```json
{
  "term": "123.456.789-10",
  "associatedName": "João Silva",
  "reason": "SOLICITACAO_TITULAR"
}
```

### Response (200 - Adicionado)
```json
{
  "id": "uuid",
  "term": "123.456.***-**",
  "reason": "SOLICITACAO_TITULAR",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Request (DELETE - Remover)
`DELETE /api/admin/blocklist/[id]`

### Response (200 - Removido)
```json
{
  "success": true,
  "message": "Documento removido da blocklist"
}
```

### Erros
- **401**: Não autenticado ou não admin
  ```json
  {
    "error": "Acesso negado"
  }
  ```
- **400**: Documento obrigatório
  ```json
  {
    "error": "Documento obrigatorio"
  }
  ```
- **400**: Documento inválido
  ```json
  {
    "error": "Documento invalido"
  }
  ```
- **400**: Motivo inválido
  ```json
  {
    "error": "Motivo invalido"
  }
  ```
- **409**: Documento já bloqueado
  ```json
  {
    "error": "Documento ja esta na blocklist"
  }
  ```
- **404**: Bloqueio não encontrado
  ```json
  {
    "error": "Bloqueio nao encontrado"
  }
  ```
- **500**: Erro interno
  ```json
  {
    "error": "Erro ao processar acao"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivos em `/src/app/api/admin/blocklist/`)
- **Frontend**: `exists` (arquivo: `/src/app/admin/blocklist/page.tsx`)
- **Banco**: `exists` (modelo: `Blocklist`)

## Dependências
- **depends_on**: UC-02 (admin precisa estar autenticado)
- **blocks**: UC-04, UC-05 (validação e compra verificam blocklist)

## Paralelização
- **parallel_group**: E (admin, independente de outros fluxos)
- **parallel_with**: UC-10 (ambos são painéis admin)

## Estratégia Técnica
- **[Implementado]** Função `requireAdmin()` em `/src/lib/auth.ts`
- **[Implementado]** Função `cleanDocument()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCPF()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCNPJ()` em `/src/lib/validators.ts`
- **[Implementado]** Query Prisma com busca case-insensitive
- **[Implementado]** Unique constraint em `Blocklist.term`

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN admin autenticado acessa painel blocklist
WHEN faz GET /api/admin/blocklist
THEN sistema valida permissões de admin
AND retorna lista paginada de documentos bloqueados
AND documentos são mascarados

GIVEN admin adiciona CPF válido à blocklist
WHEN faz POST /api/admin/blocklist com motivo SOLICITACAO_TITULAR
THEN documento é limpo e validado
AND registro é criado na Blocklist
AND documento é retornado mascarado

GIVEN admin tenta adicionar documento já bloqueado
WHEN faz POST /api/admin/blocklist
THEN sistema retorna erro 409
AND mensagem "Documento ja esta na blocklist"

GIVEN admin busca por nome associado
WHEN aplica filtro de busca
THEN documentos matching são retornados

GIVEN admin remove documento da blocklist
WHEN faz DELETE /api/admin/blocklist/[id]
THEN registro é deletado permanentemente
AND retorna confirmação

GIVEN usuário tenta consultar documento bloqueado
WHEN chama UC-04 ou UC-05
THEN sistema retorna erro 403
AND mensagem de bloqueio
```

## Testes Obrigatórios
- [ ] Unit: validação de CPF/CNPJ
- [ ] Unit: limpeza de documento
- [ ] Integration: listagem com paginação
- [ ] Integration: busca por documento
- [ ] Integration: busca por nome associado
- [ ] Integration: adicionar CPF à blocklist
- [ ] Integration: adicionar CNPJ à blocklist
- [ ] Integration: bloqueio de duplicata (409)
- [ ] Integration: validação de motivo
- [ ] Integration: remoção de bloqueio
- [ ] Integration: acesso negado para não-admin
- [ ] Integration: UC-04 respeita blocklist
- [ ] Integration: UC-05 respeita blocklist
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

# Listar blocklist
curl -X GET "http://localhost:3000/api/admin/blocklist?page=1&limit=10" \
  -H "Cookie: session=<admin-session>"

# Resposta esperada
{
  "blocklist": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}

# Adicionar CPF à blocklist
curl -X POST http://localhost:3000/api/admin/blocklist \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<admin-session>" \
  -d '{
    "term": "123.456.789-10",
    "associatedName": "João Silva",
    "reason": "SOLICITACAO_TITULAR"
  }'

# Resposta esperada
{
  "id": "uuid",
  "term": "123.456.***-**",
  "reason": "SOLICITACAO_TITULAR",
  "createdAt": "2024-01-01T00:00:00.000Z"
}

# Verificar no banco
npx prisma studio
# → Blocklist criada:
#    - term: "12345678910" (limpo)
#    - associatedName: "João Silva"
#    - reason: "SOLICITACAO_TITULAR"

# Tentar adicionar novamente (duplicata)
curl -X POST http://localhost:3000/api/admin/blocklist \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<admin-session>" \
  -d '{
    "term": "123.456.789-10",
    "reason": "JUDICIAL"
  }'

# Resposta esperada (409)
{
  "error": "Documento ja esta na blocklist"
}

# Buscar por nome
curl -X GET "http://localhost:3000/api/admin/blocklist?search=João" \
  -H "Cookie: session=<admin-session>"

# Resposta esperada (encontra "João Silva")
{
  "blocklist": [
    {
      "id": "uuid",
      "term": "123.456.***-**",
      "associatedName": "João Silva",
      ...
    }
  ]
}

# Remover da blocklist
curl -X DELETE "http://localhost:3000/api/admin/blocklist/uuid" \
  -H "Cookie: session=<admin-session>"

# Resposta esperada
{
  "success": true,
  "message": "Documento removido da blocklist"
}

# Verificar impacto em UC-04
curl -X POST http://localhost:3000/api/search/validate \
  -H "Content-Type: application/json" \
  -d '{"document":"123.456.789-10"}'

# Com bloqueio ativo: retorna 403
# Sem bloqueio: retorna 200 (válido)

# Teste de acesso negado (não-admin)
curl -X GET "http://localhost:3000/api/admin/blocklist" \
  -H "Cookie: session=<user-session>"

# Resposta esperada (401)
{
  "error": "Acesso negado"
}
```

## Arquivos Implementados
- **Caminho base**: `/src/app/api/admin/blocklist/`
- **Arquivos**:
  - `route.ts` (listagem GET, adicionar POST) - 140 linhas
  - `[id]/route.ts` (remover DELETE)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Blocklist é verificada em UC-04 (validação) e UC-05 (compra)
- Remoção é permanente - não há histórico (por simplicidade)
- Mascaramento protege privacidade mesmo no admin
- Unique constraint em `term` garante não duplicação
- Motivo HOMONIMO permite bloquear CPF/CNPJ de homônimo de pessoa pública

## Uso dos Motivos
- **SOLICITACAO_TITULAR**: Pessoa solicitou bloqueio via LGPD (UC-12)
- **JUDICIAL**: Ordem judicial determinou bloqueio
- **HOMONIMO**: Homônimo de pessoa pública/política (evitar exposição indevida)
