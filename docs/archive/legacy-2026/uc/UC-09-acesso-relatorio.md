# UC-09: Acesso ao Relatório

## Objetivo
Permitir que usuário autenticado visualize relatório completo de consulta (CPF ou CNPJ) processada pelo sistema.

## Escopo
**Inclui**:
- Validação de autenticação via sessão
- Validação de ID do relatório
- Verificação de permissão de acesso (usuário dona da compra ou admin)
- Verificação de expiração do relatório (7 dias)
- Mascaramento de documento para exibição
- Retorno de dados completos do relatório (JSON)

**Não inclui**:
- Processamento de dados (UC-07/UC-08)
- Criação de relatório (UC-07/UC-08)
- Download de PDF (feature futura)
- Compartilhamento de relatório (feature futura)

## Atores
- **Usuário autenticado**: Pessoa que comprou consulta e possui sessão válida
- **Admin**: Usuário com permissões administrativas (pode ver todos os relatórios)

## Regras de Negócio
1. **[RN-01]** ID do relatório é obrigatório
2. **[RN-02]** Usuário deve estar autenticado (sessão válida)
3. **[RN-03]** SearchResult deve existir no banco
4. **[RN-04]** Usuário só pode acessar relatórios vinculados às suas compras
5. **[RN-05]** Admin pode acessar qualquer relatório
6. **[RN-06]** Relatório expirado retorna erro 410 (Gone)
7. **[RN-07]** Documento (term) é mascarado no retorno (CPF: xxx.xxx.***-**, CNPJ: xx.xxx.xxx/****-**)
8. **[RN-08]** Dados completos (data) são retornados sem filtros
9. **[RN-09]** Retorna metadados: id, term mascarado, type, name, createdAt, expiresAt

## Contrato HTTP

### Request
`GET /api/report/[id]`

Headers:
```
Cookie: session=...
```

### Response (200 - Sucesso CPF)
```json
{
  "id": "uuid",
  "term": "123.456.***-**",
  "type": "CPF",
  "name": "João Silva",
  "data": {
    "cadastral": { ... },
    "processos": { ... },
    "financial": { ... },
    "financialSummary": { ... },
    "processAnalysis": [ ... ],
    "google": { ... },
    "reclameAqui": { ... }
  },
  "summary": "Texto do resumo gerado pela IA...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

### Response (200 - Sucesso CNPJ)
```json
{
  "id": "uuid",
  "term": "12.345.678/****-**",
  "type": "CNPJ",
  "name": "EMPRESA EXEMPLO LTDA",
  "data": {
    "dossie": { ... },
    "financial": { ... },
    "financialSummary": { ... },
    "google": { ... },
    "reclameAqui": { ... }
  },
  "summary": "Texto do resumo gerado pela IA...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}
```

### Erros
- **400**: ID obrigatório
  ```json
  {
    "error": "ID do relatorio obrigatorio"
  }
  ```
- **401**: Não autenticado
  ```json
  {
    "error": "Nao autenticado"
  }
  ```
- **403**: Acesso negado
  ```json
  {
    "error": "Acesso negado"
  }
  ```
- **404**: Relatório não encontrado
  ```json
  {
    "error": "Relatorio nao encontrado"
  }
  ```
- **410**: Relatório expirado
  ```json
  {
    "error": "Relatorio expirado"
  }
  ```
- **500**: Erro ao buscar relatório
  ```json
  {
    "error": "Erro ao buscar relatorio"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/report/[id]/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/relatorio/[id]/page.tsx`)
- **Banco**: `exists` (modelo: `SearchResult`)

## Dependências
- **depends_on**: UC-07 ou UC-08 (relatório precisa estar processado)
- **depends_on**: UC-02 (usuário precisa estar autenticado)
- **blocks**: Nenhum (ponto final do fluxo)

## Paralelização
- **parallel_group**: D (visualização, independente de outros fluxos)

## Estratégia Técnica
- **[Implementado]** Função `getSession()` em `/src/lib/auth.ts`
- **[Implementado]** Query Prisma com `include: { purchases: { include: { user } } }`
- **[Implementado]** Verificação de admin via env `ADMIN_EMAILS`
- **[Implementado]** Mascaramento de documento usando regex
- **[Implementado]** Comparação case-insensitive de emails

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário autenticado possui compra com relatório pronto
WHEN acessa /api/report/[id]
THEN sessão é validada
AND SearchResult é encontrado
AND usuário é verificado como owner (email da compra)
AND relatório não está expirado
AND sistema retorna dados completos
AND documento é mascarado

GIVEN admin acessa relatório de outro usuário
WHEN faz GET /api/report/[id]
THEN admin tem acesso concedido
AND dados completos são retornados

GIVEN usuário não autenticado
WHEN tenta acessar relatório
THEN sistema retorna 401
AND mensagem "Nao autenticado"

GIVEN usuário tenta acessar relatório de outra pessoa
WHEN faz GET /api/report/[id]
THEN sistema retorna 403
AND mensagem "Acesso negado"

GIVEN relatório expirou (>7 dias)
WHEN usuário tenta acessar
THEN sistema retorna 410
AND mensagem "Relatorio expirado"
```

## Testes Obrigatórios
- [ ] Unit: mascaramento de CPF
- [ ] Unit: mascaramento de CNPJ
- [ ] Integration: acesso com sessão válida
- [ ] Integration: bloqueio sem sessão (401)
- [ ] Integration: acesso como owner da compra
- [ ] Integration: bloqueio de acesso não autorizado (403)
- [ ] Integration: acesso como admin
- [ ] Integration: relatório expirado (410)
- [ ] Integration: relatório não encontrado (404)
- [ ] E2E: fluxo completo de visualização

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
# Preparação: criar SearchResult e Purchase vinculada
# searchResultId: "uuid-report-1"
# term: "12345678910"
# type: "CPF"
# expiresAt: now + 7 days
# purchase.userId.email: "test@test.com"

# Login como usuário
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","code":"123456"}'
# → Salvar cookie de sessão

# Acessar relatório
curl -X GET http://localhost:3000/api/report/uuid-report-1 \
  -H "Cookie: session=<session-token>"

# Resposta esperada
{
  "id": "uuid-report-1",
  "term": "123.456.***-**",
  "type": "CPF",
  "name": "João Silva",
  "data": { ... },
  "summary": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "expiresAt": "2024-01-08T00:00:00.000Z"
}

# Teste sem autenticação
curl -X GET http://localhost:3000/api/report/uuid-report-1

# Resposta esperada (401)
{
  "error": "Nao autenticado"
}

# Teste com outro usuário (não owner)
# (fazer login com outro email que não possui a compra)
curl -X GET http://localhost:3000/api/report/uuid-report-1 \
  -H "Cookie: session=<outro-session-token>"

# Resposta esperada (403)
{
  "error": "Acesso negado"
}

# Teste com relatório expirado
# (alterar expiresAt para passado via Prisma Studio)
curl -X GET http://localhost:3000/api/report/uuid-report-1 \
  -H "Cookie: session=<session-token>"

# Resposta esperada (410)
{
  "error": "Relatorio expirado"
}

# Teste como admin
# (fazer login com email listado em ADMIN_EMAILS)
curl -X GET http://localhost:3000/api/report/uuid-report-1 \
  -H "Cookie: session=<admin-session-token>"

# Resposta esperada (200 - acesso permitido)
{
  "id": "uuid-report-1",
  "term": "123.456.***-**",
  ...
}
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/report/[id]/route.ts` (97 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Verificação de owner é feita através da relação Purchase → User
- Admin pode acessar qualquer relatório (útil para suporte)
- Relatório expirado retorna 410 (Gone) em vez de 404 para clareza
- Mascaramento protege privacidade do documento no frontend
