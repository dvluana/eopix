# UC-08: Processamento CNPJ

## Objetivo
Processar consulta de CNPJ de forma assíncrona através de job Inngest, coletando dados de APIs externas e gerando relatório com IA.

## Escopo
**Inclui**:
- Verificação de cache (SearchResult válido nas últimas 24h)
- Reutilização de cache existente (economia de APIs)
- Consulta de dossiê jurídico (ic-dossie-juridico via APIFull) - contém cadastro + processos
- Consulta de dados financeiros (srs-premium via APIFull)
- Busca de menções na web (3 queries via Serper/Google)
- Análise de menções e geração de resumo com IA (OpenAI GPT-4)
- Cálculo de score financeiro (sem IA)
- Atualização de progresso (6 steps, alguns consolidados)
- Criação de SearchResult
- Atualização de Purchase para COMPLETED
- Retry automático (3 tentativas)

**Não inclui**:
- Processamento de CPF (UC-07)
- Webhook de pagamento (UC-06)
- Visualização de relatório (UC-09)
- Análise de processos com IA (processos CNPJ já vem categorizados do dossiê)
- Notificação ao usuário (email/SMS)

## Atores
- **Sistema Inngest**: Orquestrador de jobs assíncronos
- **APIFull**: Provedor de dados cadastrais, financeiros e jurídicos
- **Serper/Google**: API de busca na web
- **OpenAI GPT-4**: IA para análise de menções e resumo

## Regras de Negócio
1. **[RN-01]** Job é disparado por evento `search/process` com `type = "CNPJ"`
2. **[RN-02]** Cache: se existe SearchResult para mesmo termo criado há <24h, reutiliza
3. **[RN-03]** Ao reutilizar cache, atualiza Purchase para COMPLETED com searchResultId
4. **[RN-04]** Purchase inicia com status PROCESSING e processingStep = 1
5. **[RN-05]** Etapas de processamento:
   - Step 1: Dossiê jurídico (ic-dossie-juridico) - cadastro + processos em 1 chamada - BLOQUEIA se falhar
   - Step 2: Dados financeiros (srs-premium) - NÃO bloqueia se falhar
   - Step 3: Processos (já vem no dossiê, apenas update de step)
   - Step 4: Menções na web (3 queries Serper)
   - Step 5: IA - Análise de menções e geração de resumo (processos não precisam IA)
   - Step 6: Salvar SearchResult e finalizar
6. **[RN-06]** Dados financeiros retornam null se API falhar (não quebra job)
7. **[RN-07]** Score financeiro é calculado sem IA (lógica determinística)
8. **[RN-08]** Processos CNPJ já vem categorizados no dossiê, não precisam análise IA
9. **[RN-09]** SearchResult expira em 7 dias
10. **[RN-10]** Retry: 3 tentativas com backoff exponencial
11. **[RN-11]** Se job falhar após 3 tentativas, Purchase vira FAILED

## Contrato (Inngest Event)

### Event Trigger
```typescript
{
  name: 'search/process',
  data: {
    purchaseId: 'uuid',
    purchaseCode: 'ABC123',
    term: '12345678000190',
    type: 'CNPJ',
    email: 'usuario@example.com'
  }
}
```

### Return (Sucesso - Cache)
```typescript
{
  success: true,
  cached: true,
  searchResultId: 'uuid'
}
```

### Return (Sucesso - Novo)
```typescript
{
  success: true,
  searchResultId: 'uuid'
}
```

### Error
Job lança exceção, Inngest faz retry automático (3x).

## Status Implementação
- **Backend**: `exists` (função `processSearch` em `/src/lib/inngest.ts`)
- **Banco**: `exists` (modelos: `Purchase`, `SearchResult`)
- **Integrações**: `exists` (APIFull, Serper, OpenAI)

## Dependências
- **depends_on**: UC-06 (webhook marca purchase como PAID e dispara job)
- **blocks**: UC-09 (relatório depende de SearchResult)

## Paralelização
- **parallel_group**: C (processamento assíncrono)
- **parallel_with**: UC-07 (CPF e CNPJ podem ser processados em paralelo)

## Estratégia Técnica
- **[Implementado]** Função `consultCnpjDossie()` em `/src/lib/apifull.ts`
- **[Implementado]** Função `consultCnpjFinancial()` em `/src/lib/apifull.ts`
- **[Implementado]** Função `searchWeb()` em `/src/lib/google-search.ts`
- **[Implementado]** Função `analyzeMentionsAndSummary()` em `/src/lib/openai.ts`
- **[Implementado]** Função `calculateCnpjFinancialSummary()` em `/src/lib/financial-summary.ts`
- **[Implementado]** Inngest steps para retry granular
- **[Implementado]** Cache check antes de processar

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN Purchase foi marcada como PAID
AND evento search/process foi disparado com type = "CNPJ"
WHEN job Inngest executa
THEN verifica cache de SearchResult (24h)
AND se cache existe, reutiliza e finaliza
AND se cache não existe, inicia processamento
AND Purchase vira PROCESSING com step = 1

GIVEN não há cache válido
WHEN processa CNPJ
THEN step 1: consulta dossiê jurídico (razão social, endereço, processos, etc.)
AND step 2: consulta dados financeiros (score, protestos, etc.)
AND step 3: marca step 3 (processos já vieram no dossiê)
AND step 4: busca menções na web (3 queries)
AND step 5: analisa menções e gera resumo com IA
AND step 6: cria SearchResult no banco
AND step 6: atualiza Purchase para COMPLETED
AND retorna searchResultId

GIVEN API financeira falha
WHEN processa CNPJ
THEN job continua (não bloqueia)
AND cnpjFinancialData = null
AND score financeiro usa fallback

GIVEN job falha 3 vezes
WHEN Inngest tenta retry
THEN Purchase é marcada como FAILED
AND job não tenta mais

GIVEN dossiê contém processos
WHEN processa CNPJ
THEN processos NÃO são analisados com IA
AND processos são incluídos no SearchResult como estão
```

## Testes Obrigatórios
- [ ] Unit: cálculo de score financeiro CNPJ
- [ ] Integration: cache hit (reutilizar SearchResult)
- [ ] Integration: cache miss (processar novo)
- [ ] Integration: consulta APIFull dossiê
- [ ] Integration: consulta APIFull financeira (com falha)
- [ ] Integration: busca Serper
- [ ] Integration: análise IA resumo (sem processos)
- [ ] Integration: criação de SearchResult
- [ ] Integration: atualização de Purchase
- [ ] Integration: retry em caso de erro
- [ ] E2E: fluxo completo de processamento

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Contrato de eventos especificado
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
# Preparação: criar Purchase PAID no banco
# purchaseId: "uuid-789"
# code: "TEST03"
# status: "PAID"
# term: "12345678000190" (CNPJ válido)

# Disparar evento Inngest manualmente (dev mode)
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search/process",
    "data": {
      "purchaseId": "uuid-789",
      "purchaseCode": "TEST03",
      "term": "12345678000190",
      "type": "CNPJ",
      "email": "test@test.com"
    }
  }'

# Verificar progresso no banco (em tempo real)
npx prisma studio
# → Purchase.processingStep evolui: 1 → 2 → 3 → 4 → 5 → 6 → 0
# → Purchase.status: PROCESSING → COMPLETED

# Verificar SearchResult criado
# → term: "12345678000190"
# → type: "CNPJ"
# → name: "EMPRESA EXEMPLO LTDA" (do dossiê)
# → data: { dossie, financial, financialSummary, google, ... }
# → summary: "Texto gerado pela IA..."
# → expiresAt: now + 7 days

# Verificar Purchase finalizada
# → status: "COMPLETED"
# → searchResultId: <id do SearchResult>
# → processingStep: 0

# Teste de cache (disparar novamente com mesmo CNPJ)
# (criar nova Purchase com mesmo term)
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search/process",
    "data": {
      "purchaseId": "uuid-999",
      "purchaseCode": "TEST04",
      "term": "12345678000190",
      "type": "CNPJ",
      "email": "test@test.com"
    }
  }'

# Verificar logs
# → "check-cache" step encontra SearchResult válido
# → Purchase é atualizada diretamente para COMPLETED
# → NÃO faz novas chamadas para APIs externas

# Verificar Inngest dashboard
# → Job "process-search" executado com sucesso
# → Todos os steps marcados como completed

# Verificar dados do dossiê
# → razaoSocial, nomeFantasia, cnae, endereco, socios, etc.
# → processos incluídos (já categorizados)
```

## Arquivo Implementado
- **Caminho**: `/src/lib/inngest.ts` (função `processSearch`, linhas 61-316)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel + Inngest Cloud)

## Notas de Implementação
- CNPJ é mais simples que CPF: dossiê traz cadastro + processos em 1 chamada
- Processos CNPJ não precisam análise IA (já vem categorizados)
- Cache de 24h economiza chamadas de API e reduz custos
- Dados financeiros são opcionais (não quebram job)
- Steps granulares permitem debugging preciso do progresso
- Retry automático garante resiliência contra falhas temporárias

## Diferenças UC-07 vs UC-08
| Aspecto | CPF (UC-07) | CNPJ (UC-08) |
|---------|-------------|--------------|
| Chamadas APIFull | 3 separadas | 2 (dossiê consolida 2) |
| Análise IA processos | Sim (se houver) | Não (já categorizados) |
| Complexidade | Maior | Menor |
| Campo nome | `nome` | `razaoSocial` |
