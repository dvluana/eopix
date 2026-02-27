# UC-12: LGPD - Solicitação de Direitos

## Objetivo
Permitir que titulares de dados exerçam seus direitos garantidos pela LGPD através de formulário público de solicitação.

## Escopo
**Inclui**:
- Formulário público para solicitação LGPD (sem autenticação)
- Validação de CPF/CNPJ do titular
- Validação de email e nome
- Tipos de solicitação: ACESSO, CORRECAO, EXCLUSAO, PORTABILIDADE, OPOSICAO, REVOGACAO
- Geração de protocolo único (formato: LGPD-YYYY-NNNN)
- Armazenamento de solicitação no banco
- Retorno de número de protocolo para acompanhamento

**Não inclui**:
- Processamento automático da solicitação (UC-17 - pendente)
- Painel admin para gerenciar solicitações (UC-18 - pendente)
- Notificação por email ao titular
- Verificação de identidade do solicitante (apenas validação de dados)
- Bloqueio automático do documento (feito manualmente pelo admin)

## Atores
- **Titular de dados**: Pessoa física ou jurídica que deseja exercer direitos LGPD

## Regras de Negócio
1. **[RN-01]** Formulário é público (não requer autenticação)
2. **[RN-02]** Nome deve ter pelo menos 3 caracteres
3. **[RN-03]** Email deve ser válido e normalizado (lowercase + trim)
4. **[RN-04]** CPF/CNPJ deve ser válido
5. **[RN-05]** Tipos válidos: ACESSO, CORRECAO, EXCLUSAO, PORTABILIDADE, OPOSICAO, REVOGACAO
6. **[RN-06]** Descrição deve ter pelo menos 10 caracteres
7. **[RN-07]** Protocolo tem formato `LGPD-YYYY-NNNN` (ano + 4 dígitos aleatórios)
8. **[RN-08]** Protocolo deve ser único (máximo 10 tentativas de geração)
9. **[RN-09]** Solicitação é criada com status PENDENTE (campo futuro)
10. **[RN-10]** Documento é armazenado limpo (apenas dígitos)

## Contrato HTTP

### Request
`POST /api/lgpd-requests`

```json
{
  "nome": "João Silva",
  "cpfCnpj": "123.456.789-10",
  "email": "joao@example.com",
  "tipo": "EXCLUSAO",
  "descricao": "Solicito a exclusão de todos os meus dados pessoais do sistema."
}
```

### Response (200 - Sucesso)
```json
{
  "success": true,
  "protocol": "LGPD-2024-1234",
  "message": "Solicitação registrada com sucesso. Guarde seu número de protocolo."
}
```

### Erros
- **400**: Nome muito curto
  ```json
  {
    "error": "Nome deve ter pelo menos 3 caracteres"
  }
  ```
- **400**: Email inválido
  ```json
  {
    "error": "Email inválido"
  }
  ```
- **400**: CPF ou CNPJ inválido
  ```json
  {
    "error": "CPF ou CNPJ inválido"
  }
  ```
- **400**: Tipo de solicitação inválido
  ```json
  {
    "error": "Tipo de solicitação inválido"
  }
  ```
- **400**: Descrição muito curta
  ```json
  {
    "error": "Descrição deve ter pelo menos 10 caracteres"
  }
  ```
- **500**: Erro ao gerar protocolo
  ```json
  {
    "error": "Erro ao gerar protocolo. Tente novamente."
  }
  ```
- **500**: Erro ao processar solicitação
  ```json
  {
    "error": "Erro ao processar solicitação"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/lgpd-requests/route.ts`)
- **Frontend**: `pending` (UC-16 - formulário público)
- **Banco**: `exists` (modelo: `LgpdRequest`)

## Dependências
- **depends_on**: Nenhuma (formulário público)
- **blocks**: UC-17 (processamento de solicitações), UC-18 (painel admin LGPD)

## Paralelização
- **parallel_group**: F (auxiliares, independente de outros fluxos)

## Estratégia Técnica
- **[Implementado]** Função `isValidEmail()` em `/src/lib/validators.ts`
- **[Implementado]** Função `cleanDocument()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCPF()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCNPJ()` em `/src/lib/validators.ts`
- **[Implementado]** Função `generateProtocol()` local (LGPD-YYYY-NNNN)
- **[Implementado]** Validação de tipos usando array const

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN titular preenche formulário LGPD com dados válidos
WHEN submete solicitação de EXCLUSAO
THEN nome, email e CPF/CNPJ são validados
AND descrição tem tamanho mínimo
AND protocolo único é gerado
AND solicitação é criada no banco
AND protocolo é retornado ao titular

GIVEN titular informa CPF inválido
WHEN submete formulário
THEN sistema retorna erro 400
AND mensagem "CPF ou CNPJ inválido"

GIVEN titular escolhe tipo inválido
WHEN submete formulário
THEN sistema retorna erro 400
AND mensagem "Tipo de solicitação inválido"

GIVEN geração de protocolo falha 10 vezes (colisão)
WHEN tenta criar solicitação
THEN sistema retorna erro 500
AND mensagem de erro de protocolo
```

## Testes Obrigatórios
- [ ] Unit: validação de nome (mínimo 3 caracteres)
- [ ] Unit: validação de email
- [ ] Unit: validação de CPF/CNPJ
- [ ] Unit: validação de tipo de solicitação
- [ ] Unit: validação de descrição (mínimo 10 caracteres)
- [ ] Unit: geração de protocolo
- [ ] Integration: criação de solicitação ACESSO
- [ ] Integration: criação de solicitação EXCLUSAO
- [ ] Integration: criação de solicitação PORTABILIDADE
- [ ] Integration: unicidade de protocolo
- [ ] Integration: limpeza de documento
- [ ] E2E: fluxo completo de solicitação

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Contrato HTTP especificado
- [x] Dependências mapeadas
- [x] Critérios de aceite testáveis

## Checklist DoD
- [x] Backend implementado e funcionando
- [ ] Frontend implementado (GAP - UC-16)
- [x] Banco de dados com migrações aplicadas
- [x] Documentação atualizada (este arquivo)
- [ ] Testes mínimos implementados (GAP - UC-15)
- [x] Lint + typecheck passando
- [x] Build sem erros

## Evidências de Conclusão

```bash
# Criar solicitação de EXCLUSAO
curl -X POST http://localhost:3000/api/lgpd-requests \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpfCnpj": "123.456.789-10",
    "email": "joao@example.com",
    "tipo": "EXCLUSAO",
    "descricao": "Solicito a exclusão de todos os meus dados pessoais do sistema conforme LGPD."
  }'

# Resposta esperada
{
  "success": true,
  "protocol": "LGPD-2024-1234",
  "message": "Solicitação registrada com sucesso. Guarde seu número de protocolo."
}

# Verificar no banco
npx prisma studio
# → LgpdRequest criada:
#    - protocol: "LGPD-2024-1234"
#    - nome: "João Silva"
#    - cpfCnpj: "12345678910" (limpo)
#    - email: "joao@example.com"
#    - tipo: "EXCLUSAO"
#    - descricao: "Solicito a exclusão..."
#    - createdAt: <timestamp>

# Criar solicitação de ACESSO
curl -X POST http://localhost:3000/api/lgpd-requests \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "cpfCnpj": "98.765.432/0001-10",
    "email": "maria@example.com",
    "tipo": "ACESSO",
    "descricao": "Solicito acesso a todos os dados que vocês possuem sobre minha empresa."
  }'

# Resposta esperada
{
  "success": true,
  "protocol": "LGPD-2024-5678",
  "message": "Solicitação registrada com sucesso. Guarde seu número de protocolo."
}

# Teste com CPF inválido
curl -X POST http://localhost:3000/api/lgpd-requests \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpfCnpj": "111.111.111-11",
    "email": "joao@example.com",
    "tipo": "EXCLUSAO",
    "descricao": "Solicito exclusão dos dados."
  }'

# Resposta esperada (400)
{
  "error": "CPF ou CNPJ inválido"
}

# Teste com tipo inválido
curl -X POST http://localhost:3000/api/lgpd-requests \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpfCnpj": "123.456.789-10",
    "email": "joao@example.com",
    "tipo": "OUTRO",
    "descricao": "Solicito exclusão dos dados."
  }'

# Resposta esperada (400)
{
  "error": "Tipo de solicitação inválido"
}

# Teste com descrição curta
curl -X POST http://localhost:3000/api/lgpd-requests \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "cpfCnpj": "123.456.789-10",
    "email": "joao@example.com",
    "tipo": "EXCLUSAO",
    "descricao": "Curto"
  }'

# Resposta esperada (400)
{
  "error": "Descrição deve ter pelo menos 10 caracteres"
}
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/lgpd-requests/route.ts` (120 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Formulário é público para facilitar exercício de direitos LGPD
- Protocolo permite rastreamento sem expor dados sensíveis
- Validação de CPF/CNPJ garante seriedade das solicitações
- Admin deve processar manualmente cada solicitação (UC-17/UC-18 pendentes)
- Não envia email de confirmação (feature futura)

## Tipos de Solicitação LGPD
- **ACESSO**: Titular solicita acesso aos dados armazenados
- **CORRECAO**: Titular solicita correção de dados incorretos
- **EXCLUSAO**: Titular solicita exclusão de todos os dados (direito ao esquecimento)
- **PORTABILIDADE**: Titular solicita cópia dos dados em formato estruturado
- **OPOSICAO**: Titular se opõe ao tratamento de seus dados
- **REVOGACAO**: Titular revoga consentimento previamente dado

## Fluxo Esperado (Manual)
1. Titular cria solicitação via API (UC-12)
2. Admin visualiza solicitação no painel (UC-18 - pendente)
3. Admin valida identidade do titular (processo manual)
4. Admin executa ação solicitada (UC-17 - pendente):
   - EXCLUSAO → adiciona CPF/CNPJ à blocklist + deleta dados
   - ACESSO → gera relatório de dados armazenados
   - etc.
5. Admin marca solicitação como CONCLUIDA
