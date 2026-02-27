# UC-04: Validação de Documento

## Objetivo
Validar CPF ou CNPJ informado pelo usuário antes de iniciar processo de compra, verificando formato, dígitos verificadores e blocklist.

## Escopo
**Inclui**:
- Limpeza de documento (remoção de caracteres especiais)
- Validação de formato CPF (11 dígitos)
- Validação de formato CNPJ (14 dígitos)
- Verificação de dígitos verificadores
- Rate limiting por IP (proteção contra scraping)
- Verificação de blocklist (documentos bloqueados)
- Mascaramento de documento para exibição

**Não inclui**:
- Criação de compra (UC-05)
- Consulta de dados reais do documento (removido por performance)
- Validação de existência do documento em base governamental

## Atores
- **Visitante**: Pessoa acessando o site para consultar CPF ou CNPJ

## Regras de Negócio
1. **[RN-01]** Documento é obrigatório
2. **[RN-02]** Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ) após limpeza
3. **[RN-03]** Dígitos verificadores devem ser válidos (algoritmo oficial)
4. **[RN-04]** Rate limiting por IP: máximo de tentativas por período (definido em `checkRateLimit`)
5. **[RN-05]** Documentos na blocklist retornam erro 403 com motivo
6. **[RN-06]** Documento limpo é retornado (apenas dígitos)
7. **[RN-07]** Documento mascarado é retornado para exibição (CPF: xxx.xxx.***-**, CNPJ: xx.xxx.xxx/****-**)
8. **[RN-08]** Validação deve ser rápida (~300ms) - teaser de nome foi removido por performance

## Contrato HTTP

### Request
`POST /api/search/validate`

```json
{
  "document": "123.456.789-10"
}
```

### Response (200 - CPF Válido)
```json
{
  "valid": true,
  "type": "CPF",
  "term": "12345678910",
  "maskedDocument": "123.456.***-**"
}
```

### Response (200 - CNPJ Válido)
```json
{
  "valid": true,
  "type": "CNPJ",
  "term": "12345678000190",
  "maskedDocument": "12.345.678/****-**"
}
```

### Response (403 - Documento Bloqueado)
```json
{
  "blocked": true,
  "reason": "SOLICITACAO_TITULAR",
  "message": "Este documento nao pode ser consultado."
}
```

### Erros
- **400**: Documento obrigatório
  ```json
  {
    "error": "Documento e obrigatorio"
  }
  ```
- **400**: Documento inválido
  ```json
  {
    "error": "Documento invalido"
  }
  ```
- **429**: Rate limit excedido
  ```json
  {
    "error": "Limite de buscas excedido. Tente novamente mais tarde."
  }
  ```
- **500**: Erro interno do servidor
  ```json
  {
    "error": "Erro interno do servidor"
  }
  ```

## Status Implementação
- **Backend**: `exists` (arquivo: `/src/app/api/search/validate/route.ts`)
- **Frontend**: `exists` (arquivo: `/src/app/page.tsx`)
- **Banco**: `exists` (modelo: `Blocklist`)

## Dependências
- **depends_on**: Nenhuma (ponto de entrada do sistema)
- **blocks**: UC-05 (validação precede compra)

## Paralelização
- **parallel_group**: B (fluxo de compra/pagamento)

## Estratégia Técnica
- **[Implementado]** Função `cleanDocument()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCPF()` em `/src/lib/validators.ts`
- **[Implementado]** Função `isValidCNPJ()` em `/src/lib/validators.ts`
- **[Implementado]** Função `checkRateLimit()` em `/src/lib/rate-limit.ts`
- **[Implementado]** Query Prisma para busca em blocklist
- **[Implementado]** Mascaramento de documento usando regex replace

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário informa CPF válido
WHEN submete formulário de busca
THEN documento é limpo (apenas dígitos)
AND dígitos verificadores são validados
AND blocklist é consultada
AND sistema retorna valid = true, type = "CPF"
AND termo limpo e mascarado são retornados

GIVEN usuário informa CNPJ válido
WHEN submete formulário de busca
THEN documento é validado como CNPJ
AND retorna type = "CNPJ"
AND máscara CNPJ é aplicada (xx.xxx.xxx/****-**)

GIVEN documento está na blocklist
WHEN tenta validar
THEN sistema retorna 403
AND blocked = true
AND reason contém motivo do bloqueio

GIVEN usuário excede rate limit por IP
WHEN tenta validar novamente
THEN sistema retorna 429
AND mensagem de limite excedido

GIVEN documento com dígitos verificadores inválidos
WHEN tenta validar
THEN sistema retorna 400
AND mensagem "Documento invalido"
```

## Testes Obrigatórios
- [ ] Unit: validação de CPF com dígitos corretos
- [ ] Unit: validação de CPF com dígitos incorretos
- [ ] Unit: validação de CNPJ com dígitos corretos
- [ ] Unit: validação de CNPJ com dígitos incorretos
- [ ] Unit: limpeza de documento (remoção de pontos, traços, barras)
- [ ] Integration: verificação de blocklist
- [ ] Integration: rate limiting por IP
- [ ] Integration: mascaramento de CPF
- [ ] Integration: mascaramento de CNPJ
- [ ] E2E: fluxo completo de validação

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
# Teste com CPF válido
curl -X POST http://localhost:3000/api/search/validate \
  -H "Content-Type: application/json" \
  -d '{"document":"12345678910"}'

# Resposta esperada
{
  "valid": true,
  "type": "CPF",
  "term": "12345678910",
  "maskedDocument": "123.456.***-**"
}

# Teste com CNPJ válido
curl -X POST http://localhost:3000/api/search/validate \
  -H "Content-Type: application/json" \
  -d '{"document":"12.345.678/0001-90"}'

# Resposta esperada
{
  "valid": true,
  "type": "CNPJ",
  "term": "12345678000190",
  "maskedDocument": "12.345.678/****-**"
}

# Teste com documento inválido
curl -X POST http://localhost:3000/api/search/validate \
  -H "Content-Type: application/json" \
  -d '{"document":"11111111111"}'

# Resposta esperada (400)
{
  "error": "Documento invalido"
}

# Teste com documento bloqueado
# (adicionar documento à blocklist via Prisma Studio)
curl -X POST http://localhost:3000/api/search/validate \
  -H "Content-Type: application/json" \
  -d '{"document":"12345678910"}'

# Resposta esperada (403)
{
  "blocked": true,
  "reason": "SOLICITACAO_TITULAR",
  "message": "Este documento nao pode ser consultado."
}

# Teste de rate limiting
for i in {1..20}; do
  curl -X POST http://localhost:3000/api/search/validate \
    -H "Content-Type: application/json" \
    -d '{"document":"12345678910"}'
done
# → Retorna 429 após limite excedido
```

## Arquivo Implementado
- **Caminho**: `/src/app/api/search/validate/route.ts` (85 linhas)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel)

## Notas de Implementação
- Teaser de nome foi removido para melhorar performance de 3-6s para ~300ms
- Nome completo será obtido na página de consulta (UC-05)
- Rate limiting protege contra scraping massivo
