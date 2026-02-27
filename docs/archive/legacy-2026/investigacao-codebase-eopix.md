# Investigacao de Codebase - EOPIX

## 1. Arquitetura Geral

### Stack implementada
- **Frontend/Backend web**: Next.js 14 (App Router, `src/app`)
- **ORM**: Prisma (`@prisma/client`)
- **Banco**: Postgres com adapter Neon (`@prisma/adapter-neon`, `src/lib/prisma.ts`)
- **Jobs assíncronos**: Inngest (`src/lib/inngest.ts` + `src/app/api/inngest/route.ts`)
- **Pagamentos**: Stripe (`src/lib/stripe.ts` + webhook em `src/app/api/webhooks/stripe/route.ts`)

### Layouts e arquivos globais
- `src/app/layout.tsx`: layout raiz, metadata, fontes, ThemeProvider, Plausible.
- `src/app/admin/layout.tsx`: wrapper raiz do admin.
- `src/app/admin/login/layout.tsx`: layout especifico da tela de login admin.
- `src/app/admin/(protected)/layout.tsx`: gate server-side com `requireAdminAuth()` e sidebar admin.
- `src/app/not-found.tsx`: fallback 404.
- `src/app/global-error.tsx`: boundary global de erro.

### Middleware
- `middleware.ts`:
- aplica rate limit para `/api/*` por categoria (`auth`, `admin`, `search`, `webhook`, default).
- protege `/api/admin/*` (exceto `/api/admin/login`).
- protege `/admin/*` (exceto `/admin/login`).
- adiciona headers `X-RateLimit-*`.

### Mapa de rotas em `src/app/`

#### Pages (UI)
- `/`
- `/consulta/[term]`
- `/compra/confirmacao`
- `/minhas-consultas`
- `/relatorio/[id]`
- `/manutencao`
- `/termos`
- `/privacidade`
- `/privacidade/titular`
- `/erro/500`
- `/erro/expirado`
- `/erro/invalido`
- `/admin/login`
- `/admin`
- `/admin/compras`
- `/admin/blocklist`
- `/admin/leads`
- `/admin/health`

#### API routes
- `/api/search/validate` - `POST`
- `/api/purchases` - `POST`, `GET`
- `/api/purchases/[code]` - `GET`
- `/api/purchases/stream` - `GET` (SSE)
- `/api/webhooks/stripe` - `POST`
- `/api/process-search/[code]` - `POST` (bypass/dev)
- `/api/report/[id]` - `GET`
- `/api/inngest` - `GET`, `POST`, `PUT` (serve helper)
- `/api/auth/google` - `POST`
- `/api/auth/auto-login` - `POST`
- `/api/auth/me` - `GET`
- `/api/auth/logout` - `POST`
- `/api/leads` - `POST`
- `/api/lgpd-requests` - `POST`
- `/api/health` - `GET`
- `/api/admin/login` - `POST`
- `/api/admin/dashboard` - `GET`
- `/api/admin/purchases` - `GET`
- `/api/admin/purchases/[id]/details` - `GET`
- `/api/admin/purchases/[id]/mark-paid` - `POST`
- `/api/admin/purchases/[id]/process` - `POST`
- `/api/admin/purchases/[id]/mark-paid-and-process` - `POST`
- `/api/admin/purchases/[id]/refund` - `POST`
- `/api/admin/blocklist` - `GET`, `POST`
- `/api/admin/blocklist/[id]` - `DELETE`
- `/api/admin/leads` - `GET`
- `/api/admin/health/incidents` - `GET`

---

## 2. Fluxo Principal do Produto

## Diagrama de fluxo de dados (texto)
```text
[Landing /consulta]
  -> POST /api/search/validate (valida CPF/CNPJ + blocklist)
  -> POST /api/purchases (cria Purchase PENDING)
      -> modo normal: createCheckoutSession (Stripe)
      -> bypass: sem Stripe, segue PENDING para ação manual/admin

[Stripe Checkout]
  -> Stripe envia webhook
  -> POST /api/webhooks/stripe
      -> valida assinatura
      -> idempotencia via WebhookLog(eventKey)
      -> marca Purchase como PAID
      -> inngest.send('search/process')

[Inngest processSearch]
  Step 1: check-cache (SearchResult <24h por term+type)
      -> se hit: vincula Purchase e finaliza
  Step 2: process-all
      -> APIFull (CPF ou CNPJ)
      -> financial-summary (totais financeiros)
      -> Serper/Google (byDocument, byName, reclameAqui)
      -> OpenAI #1 (analise de processos, CPF com processos)
      -> OpenAI #2 (classifica menções + resumo final + extrai dados Reclame Aqui)
      -> salva SearchResult.data (JSON consolidado)
      -> marca Purchase COMPLETED + searchResultId

[Consumo de relatorio]
  -> GET /api/report/[id] (auth + ownership/admin + expiração)
  -> pagina /relatorio/[id] renderiza blocos a partir de SearchResult.data
```

### Pipeline Inngest (`src/lib/inngest.ts`)

### `processSearch` (evento `search/process`)
- **Step Inngest 1 (`check-cache`)**:
- busca `SearchResult` das ultimas 24h por `term` + `type`.
- se existir, marca compra como `COMPLETED`, zera `processingStep`, vincula `searchResultId`.
- **Step Inngest 2 (`process-all`)**:
- atualiza status para `PROCESSING`.
- branch CPF:
- `consultCpfCadastral(term)`
- `consultCpfFinancial(term)` e `consultCpfProcessos(term)` em paralelo
- `calculateCpfFinancialSummary`
- branch CNPJ:
- `consultCnpjDossie(term)`
- `consultCnpjFinancial(term)` (nao bloqueante em erro)
- `calculateCnpjFinancialSummary`
- comum aos dois:
- `searchWeb(name, term, type)`
- `analyzeProcessos` (somente CPF com processos)
- `analyzeMentionsAndSummary` (classificação de menções + resumo + dados RA)
- aplica classificações nos arrays de Google
- salva `SearchResult` (`data`, `summary`, `expiresAt`)
- marca `Purchase` como `COMPLETED`

### Outras funcoes Inngest
- `cleanupSearchResults`: remove relatórios expirados.
- `cleanupLeads`: remove leads antigos.
- `cleanupMagicCodes`: remove magic codes expirados/usados.
- `cleanupPendingPurchases`: expira compras `PENDING` antigas.
- `autoRefundFailedPurchases`: tenta reembolso automático em stuck/failed pagos.
- `anonymizePurchases`: anonimiza PII de compras antigas (LGPD).

### APIFull (`src/lib/apifull.ts`)

### Endpoints usados no código
- `r-cpf-completo` (`consultCpfCadastral`)
- `r-acoes-e-processos-judiciais` (`consultCpfProcessos`)
- `srs-premium` CPF (`consultCpfFinancial`)
- `ic-dossie-juridico` CNPJ (`consultCnpjDossie`)
- `srs-premium` CNPJ (`consultCnpjFinancial`)

### Mapeamentos implementados
- `mapCpfCadastralResponse`: normaliza dados cadastrais PF, endereço, telefone, email, empresas vinculadas.
- `mapCpfProcessosResponse`: normaliza processos e partes.
- `mapCpfFinancialResponse`: normaliza protestos/pendências/totais e score interno.
- `mapCnpjDossieResponse`: normaliza dados empresa, socios, endereço, CNAE e ocorrências jurídicas.
- `mapCnpjFinancialResponse`: normaliza protestos/pendências/totais e score interno.

### Resumo financeiro (`src/lib/financial-summary.ts`)
- `calculateCpfFinancialSummary(data)` e `calculateCnpjFinancialSummary(data)`:
- transforma respostas `srs-premium` em `FinancialSummary`.
- não usa IA.
- `formatFinancialSummary` e `hasFinancialIssues` para exibição/checagem.

### IA (`src/lib/openai.ts`)
- `analyzeProcessos(processos, document)`:
- classifica processos (categoria + relevância de negócio + descrição curta).
- `analyzeMentionsAndSummary(input, document)`:
- classifica menções (`positive|neutral|negative`), filtra homônimos (`relevant`), extrai dados de Reclame Aqui do texto e gera resumo final.
- `generateSummary`: wrapper de compatibilidade.

### Busca web (`src/lib/google-search.ts`)
- usa Serper API (`https://google.serper.dev/search`).
- executa 3 queries em paralelo:
- `byDocument` (CPF/CNPJ formatado),
- `byName` (nome + termos negativos),
- `reclameAqui` (`site:reclameaqui.com.br`).

### Mock/bypass (`src/lib/mock-mode.ts` e `src/lib/mocks/`)
- `isMockMode = MOCK_MODE === 'true'`
- `isTestMode = TEST_MODE === 'true'`
- `isBypassMode = isMockMode || isTestMode`
- mocks disponíveis:
- `src/lib/mocks/apifull-data.ts`
- `src/lib/mocks/google-data.ts`
- `src/lib/mocks/openai-data.ts`

---

## 3. Banco de Dados (`prisma/schema.prisma`)

### Models e relações
- `User`
- campos: `id`, `email`, `createdAt`
- relação: `purchases: Purchase[]`
- `SearchResult`
- campos: `id`, `term`, `type`, `name`, `data (Json)`, `summary`, `expiresAt`, `createdAt`
- relação: `purchases: Purchase[]`
- `Purchase`
- campos principais: `id`, `userId`, `code`, `term`, `amount`, `status`, `stripePaymentIntentId`, `paidAt`, `processingStep`, `searchResultId`, `failure*`, `refund*`
- relações:
- `user -> User` (obrigatória, `onDelete: Cascade`)
- `searchResult -> SearchResult?` (opcional)
- `Blocklist`
- bloqueio por documento (`term` único), com motivo.
- `LeadCapture`
- captura de leads em indisponibilidade/API down.
- `MagicCode`
- código mágico por email (expiração + used).
- `RateLimit`
- contador por `(identifier, action)`.
- `WebhookLog`
- idempotência de webhook Stripe (`eventKey` único).
- `LgpdRequest`
- solicitações LGPD com protocolo único.
- `ApiRequestLog`
- log técnico de chamadas externas.
- `AdminUser`
- credenciais/admin local (`email`, `passwordHash`, `active`, etc).

### Foco: `SearchResult.data` (JSON do relatório)
- O pipeline persiste um JSON consolidado com blocos de relatório.
- CPF salva:
- `cadastral`
- `processos`
- `financial`
- `financialSummary`
- `processAnalysis`
- `google`
- `reclameAqui`
- CNPJ salva:
- `dossie`
- `financial`
- `financialSummary`
- `google`
- `reclameAqui`

---

## 4. Frontend do Relatório

### Arquivo principal
- `src/app/relatorio/[id]/page.tsx`
- faz `fetch('/api/report/${id}')`
- recebe `{ id, term, type, name, data, summary, createdAt, expiresAt }`
- interpreta `data` conforme `type` (CPF/CNPJ)

### Interface `ReportData` (local da página)
- `id`, `term`, `type`, `name`, `summary`, `createdAt`, `expiresAt`
- `data`:
- `cadastral?`
- `processos?`
- `financial?`
- `dossie?`
- `financialSummary?`
- `processAnalysis?`
- `google?`
- `reclameAqui?`

### Componentes de visualização solicitados
- `ClimateBlock`: clima `sol|chuva` por heurística de risco.
- `ChecklistCard`: checklist de sinais financeiros/judiciais/web.
- `FinancialCard`: protestos, dívidas, cheques sem fundo.
- `JudicialCard`: lista de processos.
- `PersonInfoCard`: dados cadastrais de CPF.
- `CompanyInfoCard`: dados cadastrais/societários de CNPJ.
- `WebMentionsCard`: menções negativas (chuva).
- `AiSummary`: resumo final da IA.

---

## 5. Bypass/Admin

### Endpoint de bypass (teste)
- **Implementado**: `src/app/api/process-search/[code]/route.ts`
- função: processa compra manualmente fora da orquestração normal (MOCK/TEST/DEV).
- **Observação**: caminho informado no pedido (`scode]/route.ts`) não existe.

### Admin (`src/app/admin/`)
- páginas:
- `/admin` (dashboard)
- `/admin/compras`
- `/admin/blocklist`
- `/admin/leads`
- `/admin/health`
- autenticação:
- middleware para `/admin/*`
- `requireAdminAuth()` no layout protegido
- APIs admin usam `requireAdmin()`

---

## 6. Tipos TypeScript (`src/types/report.ts`)

### Principais interfaces
- `CpfCadastralResponse`
- `ProcessosCpfResponse`
- `ProcessoRaw`
- `ProcessAnalysis`
- `DossieResponse` e `DossieOcorrencia`
- `SrsPremiumCpfResponse`
- `SrsPremiumCnpjResponse`
- `FinancialSummary`
- `MentionClassification`
- `GoogleSearchResult`
- `GoogleSearchResponse`
- `ReclameAquiData`
- `AIAnalysisResponse`
- `WeatherStatus`

---

## 7. Lista de arquivos críticos (1 linha cada)

- `src/app/api/purchases/route.ts` - cria compra, checkout Stripe/bypass e lista compras do usuário.
- `src/app/api/webhooks/stripe/route.ts` - processa eventos Stripe, idempotência e disparo de pipeline.
- `src/app/api/inngest/route.ts` - endpoint HTTP da Inngest.
- `src/lib/inngest.ts` - pipeline principal + jobs cron de manutenção/refund/LGPD.
- `src/lib/apifull.ts` - integração APIFull e mapeamento de payloads.
- `src/lib/google-search.ts` - integração Serper com 3 consultas paralelas.
- `src/lib/openai.ts` - análise IA de processos/menções e resumo final.
- `src/lib/financial-summary.ts` - cálculo de agregados financeiros sem IA.
- `src/lib/mock-mode.ts` - flags de execução (`MOCK_MODE`, `TEST_MODE`, bypass).
- `src/lib/mocks/apifull-data.ts` - respostas fake da APIFull.
- `src/lib/mocks/google-data.ts` - respostas fake da busca web.
- `src/lib/mocks/openai-data.ts` - respostas fake da IA.
- `src/app/api/process-search/[code]/route.ts` - processamento manual/síncrono em bypass/dev.
- `src/app/api/report/[id]/route.ts` - autorização e entrega do relatório.
- `src/app/relatorio/[id]/page.tsx` - renderização completa do relatório.
- `src/components/relatorio/ClimateBlock.tsx` - bloco de clima de risco.
- `src/components/relatorio/ChecklistCard.tsx` - checklist principal.
- `src/components/relatorio/FinancialCard.tsx` - card financeiro.
- `src/components/relatorio/JudicialCard.tsx` - card judicial.
- `src/components/relatorio/PersonInfoCard.tsx` - card de pessoa (CPF).
- `src/components/relatorio/CompanyInfoCard.tsx` - card de empresa (CNPJ).
- `src/components/relatorio/WebMentionsCard.tsx` - card de menções web.
- `src/components/relatorio/AiSummary.tsx` - card de resumo IA.
- `src/lib/report-utils.ts` - ordenação e geração de textos para cards.
- `src/lib/stripe.ts` - cliente Stripe e reembolso.
- `src/lib/auth.ts` - sessão JWT-like e autorização admin.
- `src/lib/server-auth.ts` - guard server-side do admin layout.
- `src/lib/prisma.ts` - PrismaClient com adapter Neon.
- `prisma/schema.prisma` - schema e relações de dados.
- `middleware.ts` - rate limit + proteção de rotas admin/api.
- `src/app/api/admin/purchases/route.ts` - listagem/paginação de compras admin.
- `src/app/api/admin/purchases/[id]/process/route.ts` - processamento manual de compra paga.
- `src/app/api/admin/purchases/[id]/mark-paid/route.ts` - marca compra como paga.
- `src/app/api/admin/purchases/[id]/mark-paid-and-process/route.ts` - marca paga e inicia processamento.
- `src/app/api/admin/purchases/[id]/refund/route.ts` - reembolso manual.
- `src/app/api/admin/dashboard/route.ts` - métricas de operação.
- `src/app/api/admin/blocklist/route.ts` - gestão de blocklist.
- `src/app/api/admin/leads/route.ts` - listagem de leads capturados.
- `src/app/api/health/route.ts` - healthcheck do sistema/modo.
- `src/app/api/purchases/stream/route.ts` - stream SSE para progresso de compras.
- `src/types/report.ts` - contratos de dados do relatório.

---

## 8. Mapa de dependências entre módulos

```text
UI (/consulta/[term], /compra/confirmacao, /minhas-consultas, /relatorio/[id])
  -> API Routes (src/app/api/*)
     -> auth.ts / server-auth.ts
     -> prisma.ts
     -> stripe.ts
     -> inngest.ts (send events)

webhooks/stripe
  -> validateWebhookSignature (stripe.ts)
  -> prisma (Purchase/WebhookLog)
  -> inngest.send('search/process')

inngest.ts (processSearch)
  -> apifull.ts
  -> financial-summary.ts
  -> google-search.ts
  -> openai.ts
  -> prisma (SearchResult/Purchase)

openai.ts
  -> OPENAI API
  -> mocks/openai-data.ts (MOCK_MODE)

google-search.ts
  -> Serper API
  -> mocks/google-data.ts (MOCK_MODE)

apifull.ts
  -> APIFull API
  -> mocks/apifull-data.ts (MOCK_MODE)

relatorio/[id]/page.tsx
  -> /api/report/[id]
  -> report-utils.ts
  -> components/relatorio/*
```

---

## 9. Campos salvos no pipeline vs campos lidos no frontend

| Campo em `SearchResult.data` | Salvo pipeline CPF | Salvo pipeline CNPJ | Lido em `/relatorio/[id]` |
|---|---:|---:|---:|
| `cadastral` | Sim | Nao | Sim (CPF) |
| `processos` | Sim | Nao | Sim (CPF) |
| `dossie` | Nao | Sim | Sim (CNPJ) |
| `financial` | Sim | Sim | Sim |
| `financialSummary` | Sim | Sim | Sim |
| `processAnalysis` | Sim | Nao | Parcial (campo carregado, sem card dedicado) |
| `google.byDocument` | Sim | Sim | Sim |
| `google.byName` | Sim | Sim | Sim |
| `google.reclameAqui` | Sim | Sim | Indireto (classificação/contagens) |
| `reclameAqui` | Sim | Sim | Sim (`ReclameAquiCard`) |

### Observações
- A página usa `processos` (raw) para compor `JudicialCard` e também exibe `processAnalysis` no `ProcessAnalysisCard`.
- Menções exibidas negativamente usam `google.byDocument + google.byName`; `google.reclameAqui` é usado no pipeline/classificação e resumo RA extraído.

---

## 10. Inconsistências e gaps encontrados

1. **Estrutura de pastas solicitada vs real (parcialmente resolvido)**
- principal continua em `src/lib/inngest.ts`.
- adicionado wrapper compatível em `src/inngest/index.ts`.

2. **Arquivo de IA solicitado vs real (resolvido por compatibilidade)**
- principal continua em `src/lib/openai.ts`.
- adicionado `src/lib/ai-analysis.ts` como reexport.

3. **Módulo Reclame Aqui dedicado não existe**
- solicitado: `src/lib/reclame-aqui.ts`
- real: sem módulo dedicado; dados RA são inferidos em `analyzeMentionsAndSummary`.

4. **Nome de endpoint APIFull divergente no pedido**
- pedido menciona `srs-c-dossie-juridico`
- código usa `ic-dossie-juridico`

5. **`expiresAt` divergente entre fluxos (resolvido)**
- agora ambos usam `getReportExpiresAt()` de `src/lib/report-ttl.ts`.
- TTL configurável via `REPORT_TTL_HOURS` (default 168h).

6. **Acesso admin inconsistente entre camadas (resolvido)**
- `requireAdminAuth()` passou a reutilizar `getSession()` + `isAdminEmail()`.
- middleware valida sessão; autorização admin final segue em layout/API.

7. **Nomenclatura de sessão em rotas diferentes (resolvido)**
- SSE agora usa `getSession(request)` do auth padrão (`eopix_session`).

8. **Endpoint documentado em `docs/valores apis e dados.md` não utilizado no pipeline**
- `cnpj` (CNPJ completo) aparece na doc, mas pipeline usa `ic-dossie-juridico` + `srs-premium`.

9. **Observação de frontend (resolvido)**
- `processAnalysis` agora é exibido no relatório via `ProcessAnalysisCard`.

---

## 11. Divergências entre `docs/valores apis e dados.md` e código atual

- O documento lista 5 APIs incluindo `cnpj`, mas o fluxo produtivo atual usa:
- CPF: `r-cpf-completo`, `r-acoes-e-processos-judiciais`, `srs-premium`
- CNPJ: `ic-dossie-juridico`, `srs-premium`
- O documento descreve muitos campos potenciais de processos; o mapper em `apifull.ts` usa subconjunto normalizado para o produto.
- O documento está consistente no essencial para CPF/processos/srs-premium, mas precisa ser interpretado como **referência de payload bruto**, não contrato do frontend.
