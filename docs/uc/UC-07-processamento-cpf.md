# UC-07: Processamento CPF

## Objetivo
Processar consulta de CPF de forma assíncrona através de job Inngest, coletando dados de APIs externas e gerando relatório com IA.

## Escopo
**Inclui**:
- Verificação de cache (SearchResult válido nas últimas 24h)
- Reutilização de cache existente (economia de APIs)
- Consulta de dados cadastrais (r-cpf-completo via APIFull)
- Consulta de dados financeiros (srs-premium via APIFull)
- Consulta de processos judiciais (r-acoes-e-processos-judiciais via APIFull)
- Busca de menções na web (3 queries via Serper/Google)
- Análise de processos com IA (OpenAI GPT-4)
- Análise de menções e geração de resumo com IA (OpenAI GPT-4)
- Cálculo de score financeiro (sem IA)
- Atualização de progresso (6 steps)
- Criação de SearchResult
- Atualização de Purchase para COMPLETED
- Retry automático (3 tentativas)

**Não inclui**:
- Processamento de CNPJ (UC-08)
- Webhook de pagamento (UC-06)
- Visualização de relatório (UC-09)
- Notificação ao usuário (email/SMS)

## Atores
- **Sistema Inngest**: Orquestrador de jobs assíncronos
- **APIFull**: Provedor de dados cadastrais, financeiros e judiciais
- **Serper/Google**: API de busca na web
- **OpenAI GPT-4**: IA para análise e resumo

## Regras de Negócio
1. **[RN-01]** Job é disparado por evento `search/process` com `type = "CPF"`
2. **[RN-02]** Cache: se existe SearchResult para mesmo termo criado há <24h, reutiliza
3. **[RN-03]** Ao reutilizar cache, atualiza Purchase para COMPLETED com searchResultId
4. **[RN-04]** Purchase inicia com status PROCESSING e processingStep = 1
5. **[RN-05]** Etapas de processamento:
   - Step 1: Dados cadastrais (r-cpf-completo) - BLOQUEIA se falhar
   - Step 2: Dados financeiros (srs-premium) - NÃO bloqueia se falhar
   - Step 3: Processos judiciais (r-acoes-e-processos-judiciais) - NÃO bloqueia se falhar
   - Step 4: Menções na web (3 queries Serper)
   - Step 5: IA - Análise de processos e geração de resumo
   - Step 6: Salvar SearchResult e finalizar
6. **[RN-06]** Dados financeiros e processos retornam null se API falhar (não quebra job)
7. **[RN-07]** Score financeiro é calculado sem IA (lógica determinística)
8. **[RN-08]** Análise de processos só ocorre se houver processos
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
    term: '12345678910',
    type: 'CPF',
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
- **parallel_with**: UC-08 (CPF e CNPJ podem ser processados em paralelo)

## Estratégia Técnica
- **[Implementado]** Função `consultCpfCadastral()` em `/src/lib/apifull.ts`
- **[Implementado]** Função `consultCpfFinancial()` em `/src/lib/apifull.ts`
- **[Implementado]** Função `consultCpfProcessos()` em `/src/lib/apifull.ts`
- **[Implementado]** Função `searchWeb()` em `/src/lib/google-search.ts`
- **[Implementado]** Função `analyzeProcessos()` em `/src/lib/openai.ts`
- **[Implementado]** Função `analyzeMentionsAndSummary()` em `/src/lib/openai.ts`
- **[Implementado]** Função `calculateCpfFinancialSummary()` em `/src/lib/financial-summary.ts`
- **[Implementado]** Inngest steps para retry granular
- **[Implementado]** Cache check antes de processar

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN Purchase foi marcada como PAID
AND evento search/process foi disparado com type = "CPF"
WHEN job Inngest executa
THEN verifica cache de SearchResult (24h)
AND se cache existe, reutiliza e finaliza
AND se cache não existe, inicia processamento
AND Purchase vira PROCESSING com step = 1

GIVEN não há cache válido
WHEN processa CPF
THEN step 1: consulta dados cadastrais (nome, endereços, etc.)
AND step 2: consulta dados financeiros (score, protestos, etc.)
AND step 3: consulta processos judiciais
AND step 4: busca menções na web (3 queries)
AND step 5: analisa processos com IA (se houver)
AND step 5: analisa menções e gera resumo com IA
AND step 6: cria SearchResult no banco
AND step 6: atualiza Purchase para COMPLETED
AND retorna searchResultId

GIVEN API financeira falha
WHEN processa CPF
THEN job continua (não bloqueia)
AND cpfFinancialData = null
AND score financeiro usa fallback

GIVEN job falha 3 vezes
WHEN Inngest tenta retry
THEN Purchase é marcada como FAILED
AND job não tenta mais
```

## Testes Obrigatórios
- [ ] Unit: cálculo de score financeiro
- [ ] Integration: cache hit (reutilizar SearchResult)
- [ ] Integration: cache miss (processar novo)
- [ ] Integration: consulta APIFull cadastral
- [ ] Integration: consulta APIFull financeira (com falha)
- [ ] Integration: consulta APIFull processos (com falha)
- [ ] Integration: busca Serper
- [ ] Integration: análise IA processos
- [ ] Integration: análise IA resumo
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
# purchaseId: "uuid-123"
# code: "TEST01"
# status: "PAID"
# term: "12345678910" (CPF válido)

# Disparar evento Inngest manualmente (dev mode)
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search/process",
    "data": {
      "purchaseId": "uuid-123",
      "purchaseCode": "TEST01",
      "term": "12345678910",
      "type": "CPF",
      "email": "test@test.com"
    }
  }'

# Verificar progresso no banco (em tempo real)
npx prisma studio
# → Purchase.processingStep evolui: 1 → 2 → 3 → 4 → 5 → 6 → 0
# → Purchase.status: PROCESSING → COMPLETED

# Verificar SearchResult criado
# → term: "12345678910"
# → type: "CPF"
# → name: "João Silva" (do cadastral)
# → data: { cadastral, processos, financial, financialSummary, google, ... }
# → summary: "Texto gerado pela IA..."
# → expiresAt: now + 7 days

# Verificar Purchase finalizada
# → status: "COMPLETED"
# → searchResultId: <id do SearchResult>
# → processingStep: 0

# Teste de cache (disparar novamente com mesmo CPF)
# (criar nova Purchase com mesmo term)
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{
    "name": "search/process",
    "data": {
      "purchaseId": "uuid-456",
      "purchaseCode": "TEST02",
      "term": "12345678910",
      "type": "CPF",
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
```

## Arquivo Implementado
- **Caminho**: `/src/lib/inngest.ts` (função `processSearch`, linhas 61-316)
- **Commit**: Implementado em v1.0.0
- **Deploy**: Produção (Vercel + Inngest Cloud)

## Notas de Implementação
- Cache de 24h economiza chamadas de API e reduz custos
- Dados financeiros e processos são opcionais (não quebram job)
- IA é usada apenas para análise e resumo, não para score
- Steps granulares permitem debugging preciso do progresso
- Retry automático garante resiliência contra falhas temporárias
