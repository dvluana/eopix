# E O PIX? — Plano de Implementação Backend

> **Filosofia: código primeiro, contas depois.**  
> Todo o backend é construído com banco local (SQLite) e mocks das APIs.  
> Só no final, na Fase de Vinculação, você cria contas e conecta serviços reais.
>
> **Spec:** v3.2 · **Stack:** Next.js 14 + Prisma + Inngest · **Deploy:** Vercel  
> **Última atualização:** Fevereiro 2026

---

## Índice

### Parte A — Desenvolvimento (sem contas externas)

1. [Passo Zero: Setup do Projeto](#01-passo-zero)
2. [Fase 1: Fundação (Banco Local + Validações + Segurança)](#02-fase-1)
3. [Fase 2: Fluxo de Compra (Mock Asaas + Webhook Simulado)](#03-fase-2)
4. [Fase 3: Processamento (Wrappers + Mock APIs + Inngest Local)](#04-fase-3)
5. [Fase 4: Autenticação + Área Logada](#05-fase-4)
6. [Fase 5: Admin](#06-fase-5)
7. [Fase 6: Compliance + Páginas Institucionais](#07-fase-6)

### Parte B — Vinculação de Serviços (criar contas + conectar)

8. [Vinculação 1: Banco de Dados (Neon PostgreSQL)](#08-vinc-db)
9. [Vinculação 2: Deploy (Vercel)](#09-vinc-vercel)
10. [Vinculação 3: APIs e Serviços Externos](#10-vinc-apis)

### Parte C — Referência

11. [Mapa Completo de Endpoints](#11-endpoints)
12. [Variáveis de Ambiente (template completo)](#12-env)
13. [Estratégia de Testes](#13-testes)
14. [Checklist de Go Live](#14-golive)
15. [Troubleshooting](#15-troubleshooting)

---

## Como usar este documento com Claude Code

Quando abrir o Claude Code no terminal, o primeiro prompt deve ser:

```
Leia os arquivos em docs/ para entender o projeto E O PIX?.
Estamos na PARTE A (desenvolvimento local, sem contas externas).
Todas as APIs usam MOCK MODE. O banco é SQLite local.
Me confirme que entendeu e estamos prontos para a Fase 1.
```

Quando chegar na **Parte B** (vinculação), o prompt muda:

```
Estamos na PARTE B do docs/plano-backend.md.
Leia a seção de Vinculação correspondente.
Me diga EXATAMENTE o que eu preciso fazer fora do código
(criar conta, copiar chave, configurar painel, etc.)
e depois faça as mudanças no código pra conectar o serviço real.
```

---

# PARTE A — DESENVOLVIMENTO

> Tudo roda local. Banco SQLite. APIs mockadas. Sem cartão de crédito em lugar nenhum.

---

<a id="01-passo-zero"></a>

## 01 · Passo Zero: Setup do Projeto

### 1.1 Criar o projeto Next.js

```bash
npx create-next-app@14 eopix --typescript --tailwind --eslint --app --src-dir
cd eopix
```

### 1.2 Instalar dependências

```bash
# Core
npm i @prisma/client inngest resend jose openai zod

# Dev
npm i -D prisma @types/node vitest
```

**NÃO instalar agora:** `@sentry/nextjs`, `plausible-tracker` — ficam para a Parte B.

**NÃO instalar nunca:** bcrypt (sem senha), passport (sem OAuth), NextAuth (overkill), redis (rate limit via banco), mongoose (não usa MongoDB).

### 1.3 Colocar docs/ na raiz do projeto

| Arquivo                 | O que é                                   |
| ----------------------- | ----------------------------------------- |
| `docs/spec.md`          | Spec técnica v3.2                         |
| `docs/controle.md`      | Controle de implementação (mapa de telas) |
| `docs/plano-backend.md` | Este documento                            |

### 1.4 Importar código das telas para `src/components/`

### 1.5 Configurar banco LOCAL (SQLite)

No `prisma/schema.prisma`, usar SQLite durante o desenvolvimento:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

> ⚠️ **Na Parte B (Vinculação 1)** você troca para PostgreSQL + Neon. O Prisma facilita essa troca — muda 2 linhas no schema e roda migration.

### 1.6 Criar `.env.local` mínimo (sem chaves reais)

```env
# === MODO DESENVOLVIMENTO ===
MOCK_MODE=true

# === DATABASE (SQLite local, sem conta) ===
DATABASE_URL=file:./prisma/dev.db

# === AUTH ===
JWT_SECRET=dev-secret-local-nao-usar-em-producao-trocar-depois
ADMIN_EMAILS=admin@test.com

# === APP ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRICE_CENTS=2990

# === CHAVES ABAIXO IGNORADAS NO MOCK_MODE ===
# Preenchidas na Parte B (Vinculação)
ASAAS_ENV=sandbox
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=mock-token-local
APIFULL_API_KEY=
ESCAVADOR_API_KEY=
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_CX=
OPENAI_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=E O PIX? <noreply@eopix.com.br>
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=
SENTRY_DSN=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

### 1.7 Estrutura de pastas final

```
eopix/
├── docs/
│   ├── spec.md
│   ├── controle.md
│   └── plano-backend.md
├── prisma/
│   ├── schema.prisma              ← SQLite local (troca pra Neon na Parte B)
│   └── dev.db                     ← banco local (gerado pelo Prisma)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               ← T.1 Home
│   │   ├── consulta/[term]/
│   │   ├── compra/confirmacao/
│   │   ├── minhas-consultas/
│   │   ├── relatorio/[id]/
│   │   ├── termos/
│   │   ├── privacidade/
│   │   │   └── titular/
│   │   ├── admin/
│   │   │   ├── page.tsx
│   │   │   ├── blocklist/
│   │   │   ├── health/
│   │   │   ├── compras/
│   │   │   └── leads/
│   │   ├── api/
│   │   │   ├── auth/send-code/route.ts
│   │   │   ├── auth/verify-code/route.ts
│   │   │   ├── search/validate/route.ts
│   │   │   ├── purchases/route.ts
│   │   │   ├── report/[id]/route.ts
│   │   │   ├── leads/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── webhooks/asaas/route.ts
│   │   │   ├── admin/dashboard/route.ts
│   │   │   ├── admin/blocklist/route.ts
│   │   │   ├── admin/purchases/route.ts
│   │   │   ├── admin/leads/route.ts
│   │   │   ├── admin/health/incidents/route.ts
│   │   │   └── inngest/route.ts
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── global-error.tsx
│   ├── lib/
│   │   ├── prisma.ts               ← Singleton
│   │   ├── mock-mode.ts            ← Flag global + helpers
│   │   ├── asaas.ts                ← Real + mock integrados
│   │   ├── apifull.ts
│   │   ├── escavador.ts
│   │   ├── datajud.ts              ← Datajud/CNJ (grátis)
│   │   ├── brasilapi.ts
│   │   ├── google-search.ts
│   │   ├── openai.ts
│   │   ├── resend.ts               ← Mock = console.log
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   ├── turnstile.ts            ← Mock = bypass
│   │   ├── validators.ts
│   │   └── inngest.ts
│   ├── lib/mocks/                   ← Dados mock realistas
│   │   ├── apifull-data.ts
│   │   ├── escavador-data.ts
│   │   ├── datajud-data.ts
│   │   ├── brasilapi-data.ts
│   │   ├── google-data.ts
│   │   └── openai-data.ts
│   └── components/                  ← UI importadas
├── scripts/
│   ├── test-flow.ts
│   ├── test-webhook.ts
│   ├── seed.ts                     ← Popula banco com dados de teste
│   └── simulate-payment.ts         ← Simula pagamento sem Asaas
├── .env.local
├── middleware.ts
└── package.json
```

### 1.8 O padrão Mock Mode

**Arquivo central:** `src/lib/mock-mode.ts`

```typescript
export const isMockMode = process.env.MOCK_MODE === "true";
```

**Cada wrapper de API segue o mesmo padrão:**

```typescript
// src/lib/apifull.ts
import { isMockMode } from './mock-mode'
import { MOCK_APIFULL_CPF } from './mocks/apifull-data'

export async function consultCpf(cpf: string) {
  if (isMockMode) {
    console.log(`[MOCK] APIFull consultCpf: ${cpf}`)
    await new Promise(r => setTimeout(r, 500)) // simula latência
    return MOCK_APIFULL_CPF
  }
  // Chamada real (ativada na Parte B)
  const res = await fetch(...)
  return parseResponse(res)
}
```

> **Vantagem:** Todo o código é escrito e testado AGORA. Na Vinculação, só troca `MOCK_MODE=false` e preenche chaves.

---

<a id="02-fase-1"></a>

## 02 · Fase 1: Fundação (Banco Local + Validações + Segurança)

> **Contas externas:** Nenhuma.

### Passo 1.1 — Schema Prisma (6 modelos)

**Arquivo:** `prisma/schema.prisma`

Detalhes críticos:

| Modelo           | Campo                        | Detalhe                                                                                     |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------- |
| **User**         | `email`                      | `@unique` — identidade de login                                                             |
| **SearchResult** | `term`                       | CPF ou CNPJ limpo                                                                           |
|                  | `type`                       | `"CPF"` ou `"CNPJ"`                                                                         |
|                  | `name`                       | Nome descoberto pela APIFull (nullable)                                                     |
|                  | `data`                       | `String` (JSON stringified — SQLite não tem Json nativo)                                    |
|                  | `summary`                    | Resumo do GPT-4o-mini (nullable, campo próprio além do data)                                |
|                  | `expiresAt`                  | `createdAt + 7 dias`                                                                        |
|                  | `purchases`                  | Relação 1:N — uma SearchResult pode ter VÁRIOS Purchases (cache compartilhado)              |
|                  | `@@index`                    | `@@index([term, type, createdAt])` — cache lookup rápido                                    |
| **Purchase**     | `status`                     | String: `PENDING`, `PAID`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`, `REFUND_FAILED` |
|                  | `code`                       | Alfanumérico 6 chars, `@unique` — exibido pro usuário                                       |
|                  | `searchResultId`             | FK para SearchResult (nullable, preenchido após processamento)                              |
|                  | `termsAcceptedAt`            | `DateTime` obrigatório (LGPD)                                                               |
|                  | `paidAt`                     | `DateTime` (nullable, preenchido pelo webhook)                                              |
|                  | `buyerName` / `buyerCpfCnpj` | Preenchidos pelo webhook Asaas                                                              |
| **Blocklist**    | `term`                       | CPF ou CNPJ bloqueado, `@@unique`                                                           |
|                  | `associatedName`             | Nome associado (nullable) — bloqueia buscas Google também                                   |
|                  | `reason`                     | String: `SOLICITACAO_TITULAR`, `JUDICIAL`, `HOMONIMO`                                       |
| **MagicCode**    | `expiresAt`                  | `createdAt + 10 minutos`                                                                    |
|                  | `used`                       | Boolean, default false                                                                      |

**Cache compartilhado:** Se Usuário B compra o mesmo CPF que Usuário A consultou há 2h, B paga R$ 29,90 mas o backend reutiliza o SearchResult existente (custo de API = zero). Cada usuário tem seu próprio Purchase apontando pro mesmo SearchResult.

> ⚠️ **Nota SQLite:** Usar `String` onde PostgreSQL usaria `Json`. Na Vinculação 1 trocar para `Json`.

```bash
npx prisma migrate dev --name init
npx prisma generate
```

**Prompt para Claude Code:**

```
Fase 1, Passo 1: Crie o schema Prisma com os 6 modelos da spec (seção 4).
Banco SQLite local (datasource url = "file:./dev.db").
SearchResult: campos term, type ("CPF"/"CNPJ"), name (nullable), data (String, JSON),
  summary (nullable), expiresAt. Relação 1:N com Purchase. @@index([term, type, createdAt]).
Purchase: searchResultId (FK nullable pro SearchResult), paidAt (nullable).
  Status usa PAID (não CONFIRMED): PENDING → PAID → PROCESSING → COMPLETED.
Blocklist: campo associatedName (nullable) além de term e reason.
Purchase.code alfanumérico 6 chars uppercase gerado no create.
Rode a migration.
```

### Passo 1.2 — Prisma Client Singleton

**Arquivo:** `src/lib/prisma.ts` — evita múltiplas instâncias no hot reload.

### Passo 1.3 — Validadores CPF/CNPJ

**Arquivo:** `src/lib/validators.ts`

| Função                 | Input → Output                           |
| ---------------------- | ---------------------------------------- |
| `validateCpf(value)`   | string → boolean (mod 11)                |
| `validateCnpj(value)`  | string → boolean                         |
| `detectType(value)`    | string → `"CPF"` \| `"CNPJ"`             |
| `maskCpf(value)`       | string → `"***.456.789-**"`              |
| `maskCnpj(value)`      | string → `"12.345.678/0001-**"`          |
| `cleanDocument(value)` | string → remove `.` `-` `/`              |
| `formatCpf(value)`     | string → `"123.456.789-00"` (input mask) |
| `formatCnpj(value)`    | string → `"12.345.678/0001-90"`          |

Usar Zod schemas para validação de request bodies.

### Passo 1.4 — Cloudflare Turnstile (bypass no dev)

**Arquivo:** `src/lib/turnstile.ts`

```typescript
import { isMockMode } from './mock-mode'

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (isMockMode) {
    console.log('[MOCK] Turnstile bypass')
    return true
  }
  // Chamada real (Parte B)
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { ... })
  return data.success === true
}
```

### Passo 1.5 — Rate Limiting

**Arquivo:** `src/lib/rate-limit.ts`

| Ação               | Limite  | Janela | Chave |
| ------------------ | ------- | ------ | ----- |
| Validação CPF/CNPJ | 10/hora | IP     |
| Compra             | 3/hora  | IP     |
| Magic code         | 3/hora  | Email  |
| Magic link geral   | 20/hora | IP     |

**Arquivo:** `middleware.ts` — rate limit + auth guard + admin guard.

### Passo 1.6 — Conectar T.1 Home ao Backend

Submit → Server Action: limpa input → valida CPF/CNPJ → Turnstile (bypass mock) → rate limit → blocklist → redirect `/consulta/${term}`.

**Blocklist check detalhado:**

1. `SELECT FROM Blocklist WHERE term = {input}` — CPF/CNPJ direto
2. Se bloqueado → "Dados indisponíveis por solicitação do titular."
3. Se `associatedName` preenchido → esse nome também é bloqueado nas buscas Google durante o processamento (Fase 3). O job Inngest verifica a blocklist antes de fazer queries Google.

### Passo 1.7 — Script de seed

**Arquivo:** `scripts/seed.ts` — cria user, purchases variados, blocklist, leads, SearchResult mock.

```bash
npx tsx scripts/seed.ts
```

### ✅ Validação da Fase 1

- [ ] `npx prisma studio` → 6 tabelas, dados do seed visíveis
- [ ] CPF válido na Home → redirect para `/consulta/{term}`
- [ ] CPF inválido → erro inline
- [ ] CPF na blocklist → "Dados indisponíveis"
- [ ] Máscara automática no input
- [ ] Rate limit: 11° request → 429

---

<a id="03-fase-2"></a>

## 03 · Fase 2: Fluxo de Compra (Mock Asaas + Webhook Simulado)

> **Contas externas:** Nenhuma. Mock simula checkout + webhook.

### Passo 2.1 — Health Check API (mock)

`GET /api/health` — no mock: sempre retorna `{ allApisUp: true }`.

### Passo 2.2 — Asaas Client (com mock)

**Arquivo:** `src/lib/asaas.ts`

```typescript
export async function createPixCharge(params) {
  if (isMockMode) {
    const fakePaymentId = `pay_mock_${Date.now()}`;
    return {
      paymentId: fakePaymentId,
      // Mock: redirect direto pra confirmação (pula checkout)
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL}/compra/confirmacao?code=${params.externalRef}&mock=true`,
    };
  }
  // Real (Parte B)...
}
```

**No mock:** Clicar "Desbloquear" cria Purchase e redireciona direto para confirmação (pula Asaas).

### Passo 2.3 — Script simular pagamento

**Arquivo:** `scripts/simulate-payment.ts`

```bash
npx tsx scripts/simulate-payment.ts TEST01
# Busca Purchase pelo code → muda pra PAID → dispara Inngest → muda pra PROCESSING
```

### Passo 2.4 — Botão "Simular Pagamento" (dev only)

Na tela de confirmação, quando `MOCK_MODE=true`, mostrar botão extra que chama o webhook mock. Assim testa sem rodar scripts.

### Passo 2.5 — Webhook Asaas

`POST /api/webhooks/asaas` — código é o MESMO para mock e real:

```
1. Validar auth (mock: aceita "mock-token-local")
2. Extrair evento + paymentId
3. Buscar Purchase WHERE asaasPaymentId = {id}
4. IDEMPOTÊNCIA: se já PAID/PROCESSING/COMPLETED → 200
5. Extrair buyerName + buyerCpfCnpj do payload
6. Atualizar → status PAID + gravar buyerName/buyerCpfCnpj + paidAt = now
7. Disparar Inngest → status muda pra PROCESSING dentro do job
8. Retornar 200
```

### Passo 2.6 — Conectar T.2 Teaser + T.3 Confirmação + M.1 Modal + T.8 Lead Capture

T.2: Submit → Purchase PENDING → mock checkout → redirect confirmação.
T.3: Busca Purchase pelo code → exibe dados.
M.1: `PATCH /api/purchases/{code}/email`.
T.8: `POST /api/leads` → grava LeadCapture.

### ✅ Validação da Fase 2

- [ ] Email no Teaser → redirect confirmação (pula Asaas)
- [ ] Confirmação mostra email + código
- [ ] "Simular Pagamento" → PAID → PROCESSING
- [ ] Corrigir email funciona
- [ ] Lead capture grava no banco
- [ ] Webhook duplicado → idempotente
- [ ] buyerName/buyerCpfCnpj gravados no Purchase

---

<a id="04-fase-3"></a>

## 04 · Fase 3: Processamento (Wrappers + Mock APIs + Inngest Local)

> **Contas externas:** Nenhuma. Inngest dev server roda local: `npx inngest-cli dev`

### Passo 3.1 — Dados mock realistas

**Diretório:** `src/lib/mocks/`

#### `mocks/apifull-data.ts`

```typescript
// CPF com problemas (Chuva)
export const MOCK_APIFULL_CPF_CHUVA = {
  name: "João Carlos da Silva",
  cleanNameYears: null, // não tem nome limpo
  recentInquiries: 12, // empresas que consultaram recentemente
  protests: [
    {
      date: "2025-08-15",
      amount: 4200,
      registry: "2º Cartório - Porto Alegre",
    },
    {
      date: "2025-11-03",
      amount: 5750,
      registry: "1º Cartório - Porto Alegre",
    },
    { date: "2026-01-22", amount: 2500, registry: "3º Cartório - Canoas" },
  ],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 3,
  totalProtestsAmount: 12450,
  region: "RS", // usado pra filtragem de homônimos
};

// CPF limpo (Sol)
export const MOCK_APIFULL_CPF_SOL = {
  name: "Maria Aparecida Santos",
  cleanNameYears: 5, // "Nome limpo há 5 anos"
  recentInquiries: 3, // "3 empresas consultaram este CPF recentemente"
  protests: [],
  debts: [],
  bouncedChecks: 0,
  totalProtests: 0,
  totalProtestsAmount: 0,
  region: "SC",
};
```

#### `mocks/escavador-data.ts`

```typescript
export const MOCK_ESCAVADOR_CHUVA = {
  totalCount: 51,
  processes: [
    {
      tribunal: "TRT-4",
      date: "2024-03-12",
      classe: "Ação Trabalhista",
      polo: "Réu",
    },
    {
      tribunal: "TJRS",
      date: "2024-09-18",
      classe: "Execução Título",
      polo: "Réu",
    },
    { tribunal: "TJRS", date: "2025-11-14", classe: "Cobrança", polo: "Réu" },
  ],
};

export const MOCK_ESCAVADOR_SOL = { totalCount: 0, processes: [] };
```

#### `mocks/brasilapi-data.ts`

```typescript
export const MOCK_BRASILAPI_CNPJ = {
  razaoSocial: "TECH SOLUTIONS SERVICOS DE TI LTDA",
  situacao: "ATIVA",
  abertura: "2018-03-15",
  cnaePrincipal: {
    codigo: "6201-5/01",
    descricao: "Desenvolvimento de programas de computador sob encomenda",
  },
  cnaeSecundarios: [
    {
      codigo: "6202-3/00",
      descricao: "Consultoria em tecnologia da informação",
    },
    { codigo: "6311-9/00", descricao: "Tratamento de dados" },
  ],
  socios: [
    { nome: "CARLOS EDUARDO PEREIRA", qualificacao: "Sócio-Administrador" },
  ],
  capitalSocial: 100000,
  endereco: { municipio: "Florianópolis", uf: "SC" },
};
```

#### `mocks/datajud-data.ts`

```typescript
// Processos complementares ao Escavador (pode ter sobreposição, job faz dedup)
export const MOCK_DATAJUD_CHUVA = {
  processes: [
    {
      tribunal: "TJRS",
      number: "5001234-56.2024.8.21.0001",
      date: "2024-05-20",
      classe: "Execução Fiscal",
      polo: "Réu",
    },
    {
      tribunal: "TJRS",
      number: "5009876-12.2025.8.21.0010",
      date: "2025-03-10",
      classe: "Busca e Apreensão",
      polo: "Réu",
    },
  ],
};

export const MOCK_DATAJUD_SOL = { processes: [] };
```

#### `mocks/google-data.ts` + `mocks/openai-data.ts`

Resultados de busca fictícios e resumos IA pré-prontos para cenários Sol e Chuva.

**Google mock — inclui menções com classificação:**

```typescript
export const MOCK_GOOGLE_SOL = {
  general: [
    {
      title: "Prêmio Top Empresas SC 2025",
      url: "...",
      snippet: "...",
      classification: "positive",
    },
    {
      title: "Evento de networking em Florianópolis",
      url: "...",
      snippet: "...",
      classification: "neutral",
    },
  ],
  focused: [], // nenhuma menção negativa
  reclameAqui: [
    {
      title: "Tech Solutions - Reclame Aqui",
      url: "...",
      snippet: "Nota 8.5 - Respondeu 95% das reclamações",
      classification: "positive",
    },
  ],
};

export const MOCK_GOOGLE_CHUVA = {
  general: [
    {
      title: "Reportagem sobre fraudes em SC",
      url: "...",
      snippet: "...",
      classification: "negative",
    },
  ],
  focused: [
    {
      title: "Processo por inadimplência",
      url: "...",
      snippet: "...",
      classification: "negative",
    },
  ],
  reclameAqui: [],
};
```

**OpenAI mock — resumo com destaques positivos (Sol) ou alertas (Chuva):**

```typescript
export const MOCK_OPENAI_SUMMARY_SOL_CNPJ = {
  summary:
    "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 2 menções positivas encontradas na web. Nota 8.5 no Reclame Aqui com 95% de resolução.",
  mentionClassifications: [
    { url: "...", classification: "positive", reason: "Premiação empresarial" },
    { url: "...", classification: "neutral", reason: "Evento networking" },
  ],
};

export const MOCK_OPENAI_SUMMARY_SOL_CPF = {
  summary:
    "Nenhuma ocorrência financeira, judicial ou de menções negativas encontrada para este CPF nos registros públicos consultados em 05/02/2026. Nome limpo há pelo menos 5 anos.",
  mentionClassifications: [],
};

export const MOCK_OPENAI_SUMMARY_CHUVA = {
  summary:
    "Atenção: 3 protestos totalizando R$ 12.450 e 51 processos judiciais encontrados. Menções de inadimplência na web.",
  mentionClassifications: [
    {
      url: "...",
      classification: "negative",
      reason: "Reportagem sobre fraude",
    },
  ],
};
```

### Passo 3.2 — Wrappers de API (todos com mock)

Cada wrapper segue o padrão:

```typescript
// src/lib/apifull.ts
export async function consultCpf(cpf: string) {
  if (isMockMode) {
    // CPFs último dígito 0-4 = Chuva, 5-9 = Sol
    const lastDigit = parseInt(cpf.slice(-1))
    await new Promise(r => setTimeout(r, 500)) // simula latência
    return lastDigit < 5 ? MOCK_APIFULL_CPF_CHUVA : MOCK_APIFULL_CPF_SOL
  }
  // === CHAMADA REAL (Parte B) ===
  const res = await fetch(...)
}
```

> **Truque:** CPFs terminados em 0-4 → Chuva. 5-9 → Sol. Testa ambos cenários sem configurar nada.

5 wrappers: `apifull.ts`, `escavador.ts`, `brasilapi.ts`, `google-search.ts`, `openai.ts`.

### Passo 3.2b — Datajud/CNJ (API gratuita, processos judiciais)

**Arquivo:** `src/lib/datajud.ts`

API gratuita do CNJ que complementa o Escavador. Retorna processos judiciais públicos.

```typescript
export async function searchDatajud(name: string, document: string) {
  if (isMockMode) {
    return MOCK_DATAJUD; // processos complementares fictícios
  }
  // Real: consulta API pública do Datajud/CNJ
  // Endpoint: https://api-publica.datajud.cnj.jus.br/...
}
```

> **Importante:** Datajud é GRATUITA e complementa o Escavador. Sempre chamar as duas em paralelo. Dados do Datajud podem ter processos que o Escavador não tem e vice-versa. O job Inngest faz merge + dedup.

### Passo 3.3 — Resend (mock = console.log)

```typescript
export async function sendEmail(params) {
  if (isMockMode) {
    console.log(`📧 [MOCK] Para: ${params.to} | Assunto: ${params.subject}`);
    return { id: `mock_${Date.now()}` };
  }
  // Real (Parte B)
}
```

> No dev, emails aparecem no terminal. Suficiente pra testar.

### Passo 3.4 — Inngest (dev server local)

```bash
npx inngest-cli dev  # Dashboard local em localhost:8288, sem conta
```

**Job `process-search`:**

**Fluxo CPF:**

```
1. [SÉRIE] APIFull(cpf) → descobre nome + financeiro → falha: retry 1x → reembolso
   ⚠️ Score retornado pela APIFull é DESCARTADO (nunca exibido).
2. [PARALELO] Com o nome:
   ├── Escavador(nome, cpf) → processos detalhados
   ├── Datajud/CNJ(nome, cpf) → processos complementares (GRÁTIS)
   ├── Google geral("{Nome}") → menções web
   └── Google focada("{Nome}" + "golpe" OR "fraude" OR "processo") → menções negativas
3. [SÉRIE] Merge + dedup processos (Escavador + Datajud)
4. [SÉRIE] GPT-4o-mini(todos os dados, região do CPF) → resumo factual + filtragem homônimos + classificação de menções
5. [SÉRIE] Salvar:
   - Criar/atualizar SearchResult (term, type, name, data JSON, summary)
   - Vincular Purchase.searchResultId → SearchResult.id
   - Purchase.status → COMPLETED
   - Enviar email via Resend
```

**Fluxo CNPJ:**

```
1. [SÉRIE] BrasilAPI → razão social (GRÁTIS). Fallback: APIFull
2. [PARALELO] Com o nome/razão social:
   ├── APIFull(cnpj) → financeiro (Score DESCARTADO)
   ├── Escavador(razaoSocial, cnpj) → processos
   ├── Datajud/CNJ(razaoSocial, cnpj) → processos complementares (GRÁTIS)
   ├── Google geral("{Razão Social}")
   ├── Google focada("{Razão Social}" + "golpe" OR "fraude" OR "processo")
   └── Google Reclame Aqui("{Razão Social}" site:reclameaqui.com.br)
3. [SÉRIE] Merge + dedup processos
4. [SÉRIE] GPT-4o-mini → resumo + classificação de menções (positive/neutral/negative) + filtragem homônimos
5. [SÉRIE] Salvar + vincular + notificar (mesmo do CPF)
```

**Cache 24h (compartilhado):** Antes de chamar APIs, verificar `SELECT * FROM SearchResult WHERE term = {term} AND type = {type} AND createdAt > NOW() - 24h`. Se existe, pular TODAS as APIs — apenas vincular o Purchase existente ao SearchResult encontrado (Purchase.searchResultId = SearchResult.id). Usuário B paga R$ 29,90 mas custo de API = zero.

**Reclame Aqui — lógica especial (v3.2):**

- CPF: busca geral pode capturar, mas não tem query dedicada
- CNPJ: query dedicada `site:reclameaqui.com.br`
- Se Google retornar resultados: IA resume (nota, reclamações, taxa resposta)
- Se Google NÃO retornar resultados: card **não é exibido** (não mostra vazio)
- **Dados positivos (v3.2):** Se empresa tem nota alta, índice de resolução elevado ou selo RA1000, esses são dados positivos concretos → exibir inclusive no cenário Sol (no bloco de menções positivas ou no resumo IA). GPT extrai nota/índice do snippet do Google.

### Passo 3.5 — Lógica de falha e reembolso

| Situação                            | Ação                                           |
| ----------------------------------- | ---------------------------------------------- |
| API crítica (APIFull/Escavador) 5xx | Retry 1x → reembolso (mock: console.log)       |
| Timeout 120s                        | Reembolso                                      |
| Datajud falha                       | NÃO reembolsa, usa só dados do Escavador       |
| Google falha                        | NÃO reembolsa, card vazio                      |
| GPT falha                           | NÃO reembolsa, sem resumo                      |
| CPF sem dados na APIFull            | NÃO reembolsa, relatório com "Dados limitados" |
| Reembolso falha                     | Retry 3x → `REFUND_FAILED` + log               |

### Passo 3.6 — Conectar T.6/T.7 Relatório

`/relatorio/[id]/page.tsx`: sessão → SearchResult → ownership → expirado? → Sol/Chuva.

**Disclaimer obrigatório (próximo ao ícone Sol/Chuva):**

> _"Ícones representam volume de registros públicos, não avaliação de risco de crédito. A interpretação é exclusivamente sua."_

---

#### Layout Sol — CNPJ (v3.2 — dados positivos)

O que o usuário vê, nesta ordem:

1. **Checklist com recorte temporal:**
   - "✅ Situação financeira: Nome limpo há X anos — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos"
   - "✅ Processos judiciais: Nenhum encontrado nos tribunais consultados"
   - "✅ Menções na web: Nenhuma ocorrência negativa" (ou "3 menções encontradas, todas neutras ou positivas")
   - **Instrução técnica:** "há X anos" vem do campo `cleanNameYears` da APIFull. Se campo não disponível, omitir e mostrar apenas "Nome limpo — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos"

2. **Bloco Cadastro Empresarial (dados reais):** Razão social, situação cadastral, data de abertura formatada como "Empresa ativa há X anos", CNAE principal e secundários, quadro societário completo, capital social.

3. **Menções positivas na web (se houver):** Resumo em texto + links para cada fonte. Só exibe menções classificadas como "positive" ou "neutral" pelo GPT.

4. **Reclame Aqui positivo (se aplicável):** Nota da empresa, índice de resolução, selo RA1000. GPT extrai nota/índice do snippet do Google. Se nota alta + resolução elevada → exibir mesmo no Sol.

5. **Resumo IA:** 2-3 frases. Exemplo: "Empresa ativa há 8 anos, sem ocorrências financeiras ou judiciais. 2 menções positivas encontradas na web. Nota 8.5 no Reclame Aqui com 95% de resolução."

6. **Selo de verificação:**
   - Data da consulta (ex: "Consultado em 05/02/2026")
   - Lista genérica de fontes: "Fontes consultadas: cartórios de protesto, tribunais de justiça, Receita Federal, Reclame Aqui, notícias e registros públicos"
   - Validade: "Válido por 7 dias"

7. **Texto de fechamento:** "Pelo que encontramos, o céu está limpo. Boa parceria!"

> ⚠️ Sem links "Consultar Receita Federal" / "Consultar Serasa" no cenário Sol (remover do Figma se existir).

#### Layout Sol — CPF (v3.2 — dados positivos)

Mesma lógica do CNPJ com diferenças:

1. **Checklist com recorte temporal:** Mesma lógica, sem bloco cadastro empresarial.
2. **Indicador de atividade comercial (se disponível):** "X empresas consultaram este CPF recentemente" — campo `recentInquiries` da APIFull.
3. **Menções positivas na web (se houver).**
4. **Resumo IA elaborado.** Exemplo: "Nenhuma ocorrência financeira, judicial ou de menções negativas encontrada para este CPF nos registros públicos consultados em 05/02/2026. Nome limpo há pelo menos 5 anos."
5. **Selo de verificação.**
6. **Texto de fechamento.**

#### Layout Chuva (1+ ocorrências)

- Checklist resumido no topo (o que está ok) + cards expandidos APENAS para categorias com dados.
- Menções web: card expandido com classificação — negativas em destaque, neutras/positivas separadas visualmente.
- Texto de fechamento: "Encontramos alguns pontos de atenção. Avalie com cuidado."

---

#### Prompt base do GPT-4o-mini

```
Você é um assistente neutro. Liste fatos. Não use adjetivos. Não faça recomendações.
Apenas resuma os dados encontrados.

Quando não houver ocorrências negativas, destaque dados positivos factuais:
tempo de nome limpo, tempo de empresa ativa, menções positivas, nota Reclame Aqui.
Dados positivos são fatos, não elogios.

Classifique cada menção da web como "positive", "neutral" ou "negative".
Retorne as classificações no campo mentionClassifications.

O CPF/CNPJ é da região {region}. Ignore notícias de outros estados para evitar homônimos.
```

---

#### Lógica por card — empty states e comportamentos

| Card                    | CPF                            | CNPJ                                                      | Empty state (v3.2)                                                                                                                                                                                 | Link externo            |
| ----------------------- | ------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Cadastro Empresarial    | ❌ Não exibe                   | ✅ SEMPRE exibe (Sol: bloco positivo, Chuva: card normal) | "Dados cadastrais não encontrados para este CNPJ."                                                                                                                                                 | Receita Federal         |
| Situação Financeira     | ✅                             | ✅                                                        | **Sol:** "Nome limpo há X anos. 0 protestos nos últimos 5 anos. 0 dívidas. 0 cheques devolvidos." **Se sem recorte temporal:** "Nome limpo — 0 protestos, 0 dívidas ativas, 0 cheques devolvidos." | Serasa/SPC              |
| Processos Judiciais     | ✅ Lista (Escavador + Datajud) | ✅ Idem                                                   | "Nenhum processo judicial encontrado. ☀️"                                                                                                                                                          | Tribunal de origem      |
| Notícias e Web          | ✅ (classificadas)             | ✅ (classificadas)                                        | "Nenhuma menção relevante encontrada na web." **Sol com menções:** "Encontramos X menções, todas neutras ou positivas" + links                                                                     | Link de cada notícia    |
| Reclame Aqui            | Busca, oculta se vazio         | ✅ Query dedicada                                         | **NÃO exibe card** se sem dados. **Sol positivo:** exibe nota/resolução/selo se dados positivos encontrados                                                                                        | "Ver no Reclame Aqui →" |
| Resumo Geral (IA)       | ✅ (com destaques positivos)   | ✅ (com destaques positivos)                              | —                                                                                                                                                                                                  | —                       |
| **Selo de Verificação** | ✅ SEMPRE                      | ✅ SEMPRE                                                 | —                                                                                                                                                                                                  | —                       |

#### Regras visuais mantidas

- **Regra absoluta:** Nunca mostrar card vazio individual. Cards expandidos de ocorrências negativas são exclusivos do Chuva. Dados positivos e cadastrais SEMPRE aparecem (em qualquer cenário).
- **CNPJ Baixada/Suspensa:** Card Cadastro Empresarial com borda vermelha.
- **Score:** APIFull retorna Score — é **DESCARTADO**. Nunca exibido.
- **Processos judiciais:** Separar Trabalhista (Empresa Ré) de Cível/outros.
- **BrasilAPI fallback:** Se BrasilAPI falhar para dados cadastrais CNPJ, usar APIFull como fallback.

**Botão "Relatar erro":** Presente em CADA card do relatório. Abre formulário pré-preenchido (Tally) com o tipo de card e dados da consulta.

### ✅ Validação da Fase 3

- [ ] Simular pagamento → job processa mock → PAID → PROCESSING → COMPLETED
- [ ] Purchase.searchResultId vinculado ao SearchResult criado
- [ ] Email no console
- [ ] **Relatório Sol CPF** (CPF terminado 5-9) — checklist com recorte temporal + resumo IA positivo + selo verificação
- [ ] **Relatório Sol CNPJ** — checklist + bloco cadastral real + CNAE + selo verificação
- [ ] **Relatório Chuva** (CPF terminado 0-4) — checklist resumido + cards expandidos
- [ ] Recorte temporal "há X anos" aparece quando campo disponível, omitido quando não
- [ ] Indicador atividade comercial "X empresas consultaram" aparece no Sol CPF
- [ ] Menções web classificadas (positive/neutral/negative) exibidas conforme cenário
- [ ] Reclame Aqui positivo (nota alta) exibido no Sol
- [ ] Reclame Aqui sem dados → card oculto (não mostra vazio)
- [ ] Selo de verificação com data + fontes + validade 7 dias
- [ ] Disclaimer obrigatório visível próximo ao ícone Sol/Chuva
- [ ] Botão "Relatar erro" em cada card
- [ ] Cache 24h: segunda consulta mesmo CPF → pula APIs, vincula SearchResult existente
- [ ] Inngest dashboard local mostra jobs
- [ ] Datajud mockado retorna processos complementares

---

<a id="05-fase-4"></a>

## 05 · Fase 4: Autenticação + Área Logada

> **Contas externas:** Nenhuma. Email do magic code vai pro console.

### Passo 4.1 — Send Code

`POST /api/auth/send-code`: validar email → rate limit → buscar User → gerar 6 dígitos → criar MagicCode → enviar email (console.log no mock).

> **Dica dev:** O código aparece no terminal. Não precisa de email real.

### Passo 4.2 — Verify Code

`POST /api/auth/verify-code`: buscar MagicCode → verificar expiração → 3 tentativas max → marcar used → criar sessão JWT (cookie httpOnly, 30 dias).

### Passo 4.3 — Auth Helpers

`src/lib/auth.ts`: `createSession`, `getSession`, `requireAuth`, `requireAdmin`, `destroySession`.

### Passo 4.4 — T.4 Login + T.5 Minhas Consultas

**T.4:** Sem sessão → login (email → código do console).
**T.5:** Lista Purchases com 6 status visuais:

| Status DB              | Visual              | Descrição                                            |
| ---------------------- | ------------------- | ---------------------------------------------------- |
| `PAID` / `PROCESSING`  | ⏳ Processando      | "Consulta em andamento. Pode levar até 2-3 minutos." |
| `COMPLETED`            | ✅ Concluído        | Botão "Ver Relatório"                                |
| `FAILED` / `REFUNDED`  | ❌ Falhou           | "Reembolso automático processado."                   |
| `REFUND_FAILED`        | ⚠️ Reembolso falhou | "Estamos resolvendo."                                |
| `COMPLETED` + expirado | 📅 Expirado         | "Relatório expirado" (searchResult.expiresAt < now)  |

"Nova Consulta" → Home (email pré-preenchido se logado).

**Fluxo técnico "Nova Consulta" (v3.2):**

1. Botão "Nova Consulta" no topo de Minhas Consultas → `<Link href="/">`
2. Home (`/`) → nada muda
3. Teaser (`/consulta/[term]`): ao carregar, verifica se existe sessão ativa via cookie JWT (`getSession()`)
4. Se sessão existe → pré-preenche campo de email com `session.email`. Campo permanece editável.
5. Se não → campo vazio (fluxo normal)
6. Após pagar e retornar à confirmação → "Ir para Minhas Consultas" → nova consulta já aparece na lista como "⏳ Processando"

### ✅ Validação da Fase 4

- [ ] Email → código no console → digitar → sessão criada
- [ ] Minhas Consultas lista compras do seed
- [ ] "Ver Relatório" abre relatório mock
- [ ] Sessão persiste entre reloads
- [ ] Sem sessão → login
- [ ] "Nova Consulta" → Home → digitar CPF → Teaser abre com email pré-preenchido da sessão
- [ ] Email pré-preenchido é editável
- [ ] Nova compra aparece na lista como "Processando" após retorno

---

<a id="06-fase-5"></a>

## 06 · Fase 5: Admin

> **Contas externas:** Nenhuma.

### Passo 5.1 — Admin Guard

No middleware: `session.email in ADMIN_EMAILS` (dev: `admin@test.com`).

### Passo 5.2 — Endpoints Admin

| Tela          | Endpoint                                       | Dados                                                                  |
| ------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| A.1 Dashboard | `GET /api/admin/dashboard`                     | Aggregations do banco local                                            |
| A.2 Blocklist | `GET/POST/DELETE /api/admin/blocklist`         | CRUD (inclui campo `associatedName` — nome que bloqueia buscas Google) |
| A.3 Health    | `GET /api/admin/health/incidents`              | Histórico                                                              |
| A.4 Compras   | `GET /api/admin/purchases` + `POST .../refund` | Lista + reembolso mock                                                 |
| A.5 Leads     | `GET /api/admin/leads`                         | Lista                                                                  |

### ✅ Validação da Fase 5

- [ ] Login `admin@test.com` → acesso admin
- [ ] Dashboard com dados do seed
- [ ] Blocklist: adicionar → consulta bloqueada → remover → funciona
- [ ] Reembolsar compra → status muda (mock)

---

<a id="07-fase-6"></a>

## 07 · Fase 6: Compliance + Páginas Institucionais

> **Contas externas:** Nenhuma.

### Passo 6.1 — Jobs de Limpeza (Inngest Cron)

| Job                         | Frequência   | Lógica                                             |
| --------------------------- | ------------ | -------------------------------------------------- |
| `cleanup-search-results`    | Diário 03:00 | `DELETE WHERE expiresAt < NOW()`                   |
| `cleanup-leads`             | Diário 03:15 | `DELETE WHERE createdAt < NOW() - 90d`             |
| `cleanup-magic-codes`       | Diário 03:30 | `DELETE WHERE expiresAt < NOW()`                   |
| `cleanup-pending-purchases` | A cada 15min | `SET status='CANCELLED' WHERE PENDING AND > 30min` |
| `anonymize-purchases`       | Mensal       | Anonimizar dados > 2 anos                          |

### Passo 6.2 — Páginas Institucionais + Erro

Estáticas: P.1 `/termos`, P.2 `/privacidade`.
**P.3 `/privacidade/titular`:** Embed de formulário Tally para solicitar exclusão, corrigir dados, informar homônimo. Não precisa de backend próprio — Tally gerencia.
Erro: E.1-E.4 (404, 500, expirado, link inválido) com tom irônico.

**Botão "Relatar erro"** (nos cards do relatório): Abre formulário Tally pré-preenchido com tipo de card + código da consulta. Mesmo embed do Tally, modal ou link externo.

### ✅ Validação da Fase 6

- [ ] Jobs rodam no Inngest dev dashboard
- [ ] Páginas jurídicas acessíveis
- [ ] 404 → E.1 com tom de voz

---

### 🎉 Fim da Parte A

**Todo o código está escrito e testando localmente.**

Fluxo completo funciona: Home → Teaser → pagamento mock → confirmação → simular webhook → processamento mock → relatório → login → minhas consultas → admin.

Agora: Parte B — conectar serviços reais.

---

# PARTE B — VINCULAÇÃO DE SERVIÇOS

> **Aqui você cria contas, coloca cartão onde necessário, copia chaves e conecta tudo.**
> **Ordem fixa:** Banco de Dados → Vercel → APIs.
>
> ⚠️ **REGRA IMPORTANTE PARA O CLAUDE CODE:**
> Quando chegar nesta parte, o Claude Code deve **ler esta seção inteira** e te avisar **exatamente o que você precisa fazer fora do código** (criar conta, copiar chave, configurar DNS, etc.) ANTES de fazer qualquer mudança no código. Ele deve te guiar passo a passo, esperar você confirmar que fez, e só depois trocar os mocks.

**Prompt para o Claude Code na Parte B:**

```
Estamos na PARTE B do docs/plano-backend.md.
Leia a seção de Vinculação correspondente (ex: Vinculação 1).
Me diga EXATAMENTE o que eu preciso fazer fora do código
(criar conta, copiar chave, configurar painel, etc.)
Espera eu confirmar que fiz tudo antes de mexer no código.
```

---

<a id="08-vinc-db"></a>

## 08 · Vinculação 1: Banco de Dados (Neon PostgreSQL)

> **O que é:** Trocar SQLite local por PostgreSQL na nuvem.
> **Custo:** Grátis (free tier: 0.5 GB).
> **Cartão:** NÃO precisa.
> **Por que primeiro:** O banco precisa existir antes do deploy na Vercel.

### 📋 O que VOCÊ faz (fora do código):

**Passo 1 — Criar conta no Neon**

- Acessar [neon.tech](https://neon.tech)
- Sign up com GitHub ou email
- Sem cartão de crédito

**Passo 2 — Criar projeto**

- Clicar "Create Project"
- Nome: `eopix`
- Região: `sa-east-1` (São Paulo) — mais próximo do Brasil
- Postgres version: default (16+)
- Clicar "Create"

**Passo 3 — Copiar connection strings**

- No dashboard → "Connection Details"
- Selecionar "Pooled connection" → copiar a URL inteira
  - Formato: `postgresql://user:pass@ep-xxx.sa-east-1.aws.neon.tech/eopix?sslmode=require`
  - Cola no `.env.local` como `DATABASE_URL`
- Selecionar "Direct connection" → copiar
  - Cola como `DIRECT_URL`

**Passo 4 — Colar no `.env.local`**

```env
DATABASE_URL=postgresql://neondb_owner:XXXXX@ep-xxx.sa-east-1.aws.neon.tech/eopix?sslmode=require
DIRECT_URL=postgresql://neondb_owner:XXXXX@ep-xxx.sa-east-1.aws.neon.tech/eopix?sslmode=require
```

**Passo 5 — Confirmar pro Claude Code:** "Banco Neon criado, chaves no .env.local"

### 🤖 O que o CLAUDE CODE faz (no código):

1. **Trocar datasource no `prisma/schema.prisma`:**

   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

2. **Trocar `String` por `Json`** no campo `SearchResult.data`

3. **Rodar migration no Neon:**

   ```bash
   npx prisma migrate deploy
   ```

4. **Testar:** `npx prisma studio` → deve mostrar tabelas no Neon remoto

5. **Rodar seed** para popular banco remoto com dados de teste

### ✅ Validação

- [ ] `npx prisma studio` conecta ao Neon (não mais ao dev.db)
- [ ] Seed rodou, dados aparecem
- [ ] App local funciona com banco remoto
- [ ] Todas as funcionalidades da Parte A continuam funcionando

---

<a id="09-vinc-vercel"></a>

## 09 · Vinculação 2: Deploy (Vercel)

> **O que é:** Colocar o app online.
> **Custo:** Grátis (free tier).
> **Cartão:** NÃO precisa.
> **Por que segundo:** A URL da Vercel é necessária para configurar webhooks e emails depois.

### 📋 O que VOCÊ faz (fora do código):

**Passo 1 — Push para GitHub**

```bash
git init
git add .
git commit -m "E O PIX? v1.0"
# Criar repo no GitHub (pode ser privado)
git remote add origin git@github.com:seu-user/eopix.git
git push -u origin main
```

**Passo 2 — Criar conta na Vercel**

- Acessar [vercel.com](https://vercel.com)
- Sign up com GitHub
- Sem cartão

**Passo 3 — Importar o projeto**

- "Add New Project"
- Selecionar o repo `eopix`
- Framework: Next.js (detectado automaticamente)
- Clicar "Deploy"

**Passo 4 — Configurar variáveis de ambiente**

- Settings → Environment Variables
- Colar TODAS as variáveis do `.env.local`
- **IMPORTANTE:** Trocar `NEXT_PUBLIC_APP_URL` para a URL da Vercel (ex: `https://eopix-xxx.vercel.app`)
- **MANTER** `MOCK_MODE=true` por enquanto (APIs ainda não conectadas)

**Passo 5 — Anotar a URL**

- Após deploy, a Vercel gera uma URL tipo `https://eopix-xxx.vercel.app`
- Anotar esta URL — será usada para configurar webhooks e emails

**Passo 6 (quando tiver domínio) — Configurar domínio**

- Settings → Domains → Adicionar `eopix.com.br`
- Configurar DNS conforme instruções da Vercel (registro CNAME ou A)

**Passo 7 — Confirmar:** "Deploy feito, URL é https://eopix-xxx.vercel.app"

### 🤖 O que o CLAUDE CODE faz:

1. Verificar que o build passa: `npm run build`
2. Corrigir erros de tipo/import se houver
3. Nada mais — o deploy é automático

### ✅ Validação

- [ ] URL da Vercel funciona
- [ ] Fluxo completo funciona na URL pública (com mocks)
- [ ] Build sem erros

---

<a id="10-vinc-apis"></a>

## 10 · Vinculação 3: APIs e Serviços Externos

> **Aqui conecta tudo que precisa de conta + chave.**
> **Ordem:** gratuitos primeiro → pagos depois.
> **Para cada serviço:** o Claude Code te avisa o que fazer, espera, e depois troca o mock.

---

### 10.1 — Inngest (grátis, jobs assíncronos)

> **Nota sobre Datajud/CNJ:** A API do Datajud é **pública e gratuita**, sem necessidade de conta, chave ou cadastro. O wrapper `datajud.ts` já funciona sem vinculação. Nenhuma ação necessária aqui.

**Custo:** Grátis até 25k events/mês. **Cartão:** Não.

**📋 O que VOCÊ faz:**

1. Criar conta em [inngest.com](https://inngest.com) — sign up com GitHub
2. "Create App"
3. Nome: `eopix`
4. Endpoint URL: `https://SUA-URL-VERCEL/api/inngest`
5. Copiar `Signing Key` → `INNGEST_SIGNING_KEY`
6. Copiar `Event Key` → `INNGEST_EVENT_KEY`
7. Adicionar ambas na Vercel (Settings → Environment Variables)
8. **Redesplegar** (Vercel → Deployments → Redeploy)

**🤖 Claude Code faz:** Verificar jobs no dashboard do Inngest.

**✅ Validação:** Jobs aparecem no dashboard cloud ao simular pagamento.

---

### 10.2 — Cloudflare Turnstile (grátis, CAPTCHA)

**Custo:** Grátis. **Cartão:** Não.

**📋 O que VOCÊ faz:**

1. Criar conta na Cloudflare (se não tiver) — [dash.cloudflare.com](https://dash.cloudflare.com)
2. Menu lateral → Turnstile → "Add Widget"
3. Nome: `E O PIX?`
4. Domains: adicionar `eopix.com.br` E `eopix-xxx.vercel.app` (a URL do Passo 2)
5. Widget type: "Managed"
6. Clicar "Create"
7. Copiar `Site Key` → `TURNSTILE_SITE_KEY`
8. Copiar `Secret Key` → `TURNSTILE_SECRET_KEY`
9. Adicionar ambas na Vercel
10. Redesplegar

**🤖 Claude Code faz:** Garantir que o widget renderiza no frontend quando `MOCK_MODE=false`. Remover bypass.

**✅ Validação:** Widget Turnstile aparece na Home na URL pública.

---

### 10.3 — Resend (grátis, email transacional)

**Custo:** Grátis até 3.000 emails/mês. **Cartão:** Não.

**📋 O que VOCÊ faz:**

1. Criar conta em [resend.com](https://resend.com)
2. **API Keys** → Create API Key → copiar → `RESEND_API_KEY`
3. **Domains** → Add Domain → digitar `eopix.com.br`
4. **Resend mostra 3 registros DNS que você precisa adicionar:**

   | Tipo  | Nome                             | Valor                  |
   | ----- | -------------------------------- | ---------------------- |
   | MX    | `eopix.com.br`                   | (valor do Resend)      |
   | TXT   | `eopix.com.br`                   | (valor SPF do Resend)  |
   | CNAME | `resend._domainkey.eopix.com.br` | (valor DKIM do Resend) |

5. **Adicionar esses registros no DNS** do seu provedor de domínio (Registro.br, Cloudflare, etc.)
6. Voltar no Resend → clicar "Verify" → aguardar (geralmente minutos)
7. Quando status ficar "Verified" ✅, adicionar `RESEND_API_KEY` na Vercel
8. Redesplegar

**🤖 Claude Code faz:** Verificar envio real. Testar com seu email.

**✅ Validação:** Email de magic code chega na sua caixa de entrada (não console).

---

### 10.4 — Asaas (pago, pagamento Pix)

**Custo:** ~R$ 0,99 + 1,99% por transação. **Cartão:** Sim (para saque, não para criar conta).

**📋 O que VOCÊ faz:**

**Primeiro: Sandbox (sem dinheiro real)**

1. Criar conta em [asaas.com](https://www.asaas.com)
2. Completar cadastro (dados empresa/MEI, documentos)
3. Integrações → "Nova Integração" → Gerar **Chave de API Sandbox**
4. Copiar a chave → `ASAAS_API_KEY`
5. Manter `ASAAS_ENV=sandbox`
6. **Configurar Webhook Sandbox:**
   - Integrações → Webhooks → "Novo Webhook"
   - URL: `https://SUA-URL-VERCEL/api/webhooks/asaas`
   - Eventos: marcar `PAYMENT_RECEIVED` e `PAYMENT_CONFIRMED`
   - Copiar o token de autenticação → `ASAAS_WEBHOOK_TOKEN`
7. Adicionar tudo na Vercel
8. Redesplegar

**Depois: Produção (quando for lançar de verdade)**

1. No Asaas → gerar **Chave de API de Produção**
2. Trocar `ASAAS_ENV=production`
3. Trocar `ASAAS_API_KEY` pela chave de produção
4. Configurar **novo webhook de produção** com a URL final (`https://eopix.com.br/api/webhooks/asaas`)
5. Trocar `ASAAS_WEBHOOK_TOKEN` pelo token do webhook de produção
6. Configurar NFS-e automática no painel (código de serviço definir com contador)
7. Atualizar na Vercel
8. Redesplegar

**🤖 Claude Code faz:** Trocar `MOCK_MODE=false`. Testar fluxo no sandbox (Asaas tem simulação de Pix).

**✅ Validação:** Pagamento Pix no sandbox → webhook chega → Purchase PROCESSING → job processa.

---

### 10.5 — APIFull (paga, dados financeiros)

**Custo:** Pré-paga (créditos). **Cartão:** Sim.

**📋 O que VOCÊ faz:**

1. Criar conta em [apifull.com.br](https://apifull.com.br)
2. Comprar créditos iniciais
3. Painel → API Key → copiar → `APIFULL_API_KEY`
4. Adicionar na Vercel
5. Redesplegar

**🤖 Claude Code faz:** Testar chamada real com um CPF. Verificar parsing da resposta. Ajustar se formato da API mudou.

**✅ Validação:** CPF consultado → dados reais retornados e parseados corretamente.

---

### 10.6 — Escavador (paga, processos judiciais)

**Custo:** Pré-paga (créditos). **Cartão:** Sim.

**📋 O que VOCÊ faz:**

1. Criar conta em [escavador.com](https://www.escavador.com)
2. Plano API → comprar créditos
3. Painel → API Key → copiar → `ESCAVADOR_API_KEY`
4. Adicionar na Vercel → redesplegar

**🤖 Claude Code faz:** Testar chamada real. Verificar parsing.

**✅ Validação:** Processos reais retornados para um CPF/nome.

---

### 10.7 — Google Custom Search (semi-paga, buscas web)

**Custo:** 100 queries/dia grátis, depois $5/1000 queries. **Cartão:** Não inicialmente (sim se >100/dia).

**📋 O que VOCÊ faz:**

**Passo 1 — Criar motor de busca**

1. Acessar [programmablesearchengine.google.com](https://programmablesearchengine.google.com)
2. "New Search Engine"
3. Search the entire web: SIM
4. Nome: `E O PIX? Search`
5. Criar → copiar o **Search Engine ID** (cx) → `GOOGLE_CSE_CX`

**Passo 2 — Criar API Key**

1. Acessar [console.cloud.google.com](https://console.cloud.google.com)
2. Criar projeto (ou usar existente) → nome: `eopix`
3. Pesquisar "Custom Search API" → Ativar
4. Credentials → Create API Key → copiar → `GOOGLE_CSE_API_KEY`

**Passo 3 (se ultrapassar 100 queries/dia)**

- Google Cloud → Billing → ativar faturamento
- Custo: $5 por 1.000 queries extras

5. Adicionar ambas na Vercel → redesplegar

**🤖 Claude Code faz:** Testar queries reais. Verificar parsing.

**✅ Validação:** Busca por nome real retorna resultados web.

---

### 10.8 — OpenAI (paga, resumo IA)

**Custo:** ~R$ 0,03/consulta. **Cartão:** Sim.

**📋 O que VOCÊ faz:**

1. Criar conta em [platform.openai.com](https://platform.openai.com)
2. Settings → Billing → adicionar créditos (mínimo $5)
3. API Keys → Create → copiar → `OPENAI_API_KEY`
4. Adicionar na Vercel → redesplegar

**🤖 Claude Code faz:** Testar geração de resumo com dados reais. Verificar tom neutro conforme prompt.

**✅ Validação:** Resumo gerado com tom neutro e factual.

---

### 10.9 — Sentry (grátis, monitoramento de erros)

**Custo:** Grátis até 5k errors/mês. **Cartão:** Não.

**📋 O que VOCÊ faz:**

1. Criar conta em [sentry.io](https://sentry.io) — sign up com GitHub
2. Create Project → selecionar "Next.js"
3. Copiar o **DSN** → `SENTRY_DSN`
4. Adicionar na Vercel

**🤖 Claude Code faz:**

```bash
npx @sentry/wizard@latest -i nextjs
```

Configurar alertas: taxa de erro > 10% em 1h → email. `REFUND_FAILED` → email imediato.

**✅ Validação:** Provocar erro de teste → aparece no dashboard do Sentry.

---

### 10.10 — Plausible (grátis, analytics)

**Custo:** Grátis (self-hosted ou Community Edition). **Cartão:** Não.

**📋 O que VOCÊ faz:**

1. Criar conta em [plausible.io](https://plausible.io) (ou self-host)
2. Add Site → `eopix.com.br`
3. Copiar o script tag que o Plausible mostra

**🤖 Claude Code faz:** Adicionar script no `layout.tsx`. Configurar eventos customizados:

| Evento                    | Onde dispara                      |
| ------------------------- | --------------------------------- |
| `input_submitted`         | Home → submit formulário          |
| `teaser_viewed`           | Teaser carregou                   |
| `checkout_started`        | Clicou "Desbloquear Relatório"    |
| `payment_completed`       | Webhook confirmou pagamento       |
| `processing_started`      | Job Inngest iniciou               |
| `processing_completed`    | Job Inngest finalizou com sucesso |
| `processing_failed`       | Job Inngest falhou                |
| `report_viewed`           | Relatório aberto pelo usuário     |
| `login_magic_link`        | Código de login enviado           |
| `lead_captured`           | Lead capturado (T.8 manutenção)   |
| `email_notification_sent` | Email de relatório pronto enviado |

**✅ Validação:** Page view registrado no dashboard do Plausible.

---

### 10.11 — Desligar MOCK_MODE (último passo!)

Depois que TODAS as APIs estão configuradas e validadas:

**📋 O que VOCÊ faz:**

1. Na Vercel → Environment Variables → trocar `MOCK_MODE=false`
2. Redesplegar

**🤖 Claude Code faz:** Nada — o código já está pronto. Apenas verificar que tudo funciona sem mocks.

**✅ Validação final:** Fluxo completo com dados reais, pagamento sandbox, email real, relatório real.

---

# PARTE C — REFERÊNCIA

---

<a id="11-endpoints"></a>

## 11 · Mapa Completo de Endpoints

### Públicos (sem auth)

| Método | Rota                          | Descrição                                | Fase |
| ------ | ----------------------------- | ---------------------------------------- | ---- |
| POST   | `/api/search/validate`        | Validar CPF/CNPJ + Turnstile + blocklist | 1    |
| GET    | `/api/health`                 | Ping APIs                                | 2    |
| POST   | `/api/purchases`              | Criar Purchase + Asaas checkout          | 2    |
| GET    | `/api/purchases/{code}`       | Buscar Purchase (confirmação)            | 2    |
| PATCH  | `/api/purchases/{code}/email` | Corrigir email (M.1)                     | 2    |
| POST   | `/api/leads`                  | Capturar lead                            | 2    |
| POST   | `/api/webhooks/asaas`         | Webhook Asaas                            | 2    |
| POST   | `/api/auth/send-code`         | Enviar magic code                        | 4    |
| POST   | `/api/auth/verify-code`       | Verificar código → sessão                | 4    |

### Autenticados (session JWT)

| Método | Rota               | Descrição                 | Fase |
| ------ | ------------------ | ------------------------- | ---- |
| GET    | `/api/purchases`   | Listar compras do usuário | 4    |
| GET    | `/api/report/{id}` | Buscar relatório          | 3    |

### Admin (session JWT + ADMIN_EMAILS)

| Método | Rota                               | Descrição        | Fase |
| ------ | ---------------------------------- | ---------------- | ---- |
| GET    | `/api/admin/dashboard`             | Métricas         | 5    |
| GET    | `/api/admin/blocklist`             | Listar           | 5    |
| POST   | `/api/admin/blocklist`             | Adicionar        | 5    |
| DELETE | `/api/admin/blocklist/{id}`        | Remover          | 5    |
| GET    | `/api/admin/health/incidents`      | Histórico        | 5    |
| GET    | `/api/admin/purchases`             | Listar compras   | 5    |
| POST   | `/api/admin/purchases/{id}/refund` | Reembolso manual | 5    |
| GET    | `/api/admin/leads`                 | Listar leads     | 5    |

### Inngest

| Rota           | Descrição                           | Fase |
| -------------- | ----------------------------------- | ---- |
| `/api/inngest` | Serve endpoint (registra functions) | 3    |

---

<a id="12-env"></a>

## 12 · Variáveis de Ambiente

```env
# === MODO ===
MOCK_MODE=true                          # false após vincular tudo

# === DATABASE ===
DATABASE_URL=file:./prisma/dev.db       # trocar para Neon na Vinculação 1
# DIRECT_URL=                           # só com Neon

# === ASAAS ===
ASAAS_ENV=sandbox
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=mock-token-local

# === APIs DE DADOS ===
APIFULL_API_KEY=
ESCAVADOR_API_KEY=
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_CX=

# === IA ===
OPENAI_API_KEY=

# === EMAIL ===
RESEND_API_KEY=
EMAIL_FROM=E O PIX? <noreply@eopix.com.br>

# === AUTH ===
JWT_SECRET=dev-secret-trocar-em-producao
ADMIN_EMAILS=admin@test.com

# === CAPTCHA ===
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# === INNGEST ===
INNGEST_SIGNING_KEY=
INNGEST_EVENT_KEY=

# === MONITORING ===
SENTRY_DSN=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# === APP ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
PRICE_CENTS=2990
```

### Resumo de onde obter cada chave

| Var                 | Serviço    | URL                      | Free?          | Cartão? |
| ------------------- | ---------- | ------------------------ | -------------- | ------- |
| `DATABASE_URL`      | Neon       | neon.tech                | ✅             | Não     |
| `ASAAS_API_KEY`     | Asaas      | asaas.com                | Pay-per-use    | Sim     |
| `APIFULL_API_KEY`   | APIFull    | apifull.com.br           | Pré-paga       | Sim     |
| `ESCAVADOR_API_KEY` | Escavador  | escavador.com            | Pré-paga       | Sim     |
| `GOOGLE_CSE_*`      | Google     | console.cloud.google.com | 100/dia grátis | Não\*   |
| `OPENAI_API_KEY`    | OpenAI     | platform.openai.com      | Pay-per-use    | Sim     |
| `RESEND_API_KEY`    | Resend     | resend.com               | ✅ 3k/mês      | Não     |
| `TURNSTILE_*`       | Cloudflare | dash.cloudflare.com      | ✅             | Não     |
| `INNGEST_*`         | Inngest    | inngest.com              | ✅ 25k/mês     | Não     |
| `SENTRY_DSN`        | Sentry     | sentry.io                | ✅ 5k/mês      | Não     |

\*Google: cartão só se ultrapassar 100 queries/dia grátis.

---

<a id="13-testes"></a>

## 13 · Estratégia de Testes

### Scripts disponíveis

```bash
npx tsx scripts/seed.ts                # Popular banco de teste
npx tsx scripts/simulate-payment.ts X  # Simular webhook (code = X)
npx tsx scripts/test-flow.ts           # Teste E2E completo
```

### Testes obrigatórios antes do go-live

| #   | Teste                                                                      | Criticidade |
| --- | -------------------------------------------------------------------------- | ----------- |
| 1   | CPF válido → redirect teaser                                               | 🔴 Blocker  |
| 2   | CPF inválido → erro inline                                                 | 🔴 Blocker  |
| 3   | CPF blocklist → bloqueado                                                  | 🔴 Blocker  |
| 4   | Pagamento sandbox → webhook → PAID → PROCESSING                            | 🔴 Blocker  |
| 5   | buyerName/buyerCpfCnpj gravados no Purchase via webhook                    | 🔴 Blocker  |
| 6   | Job processa → COMPLETED + searchResultId vinculado                        | 🔴 Blocker  |
| 7   | Email de notificação chega (real)                                          | 🔴 Blocker  |
| 8   | Relatório Sol CPF renderiza (checklist temporal + resumo positivo + selo)  | 🔴 Blocker  |
| 9   | Relatório Sol CNPJ renderiza (checklist + cadastro real + CNAE + selo)     | 🔴 Blocker  |
| 10  | Relatório Chuva renderiza (checklist resumido + cards expandidos)          | 🔴 Blocker  |
| 11  | Disclaimer obrigatório visível próximo ao ícone                            | 🔴 Blocker  |
| 12  | Login magic code funciona                                                  | 🔴 Blocker  |
| 13  | Minhas Consultas lista corretamente (6 status visuais)                     | 🔴 Blocker  |
| 14  | Selo de verificação com data + fontes + validade                           | 🔴 Blocker  |
| 15  | Relatório expirado → redirect E.3                                          | 🟡 High     |
| 16  | Webhook duplicado → idempotente                                            | 🟡 High     |
| 17  | Webhook sem auth → 401                                                     | 🟡 High     |
| 18  | Falha API crítica → reembolso automático                                   | 🟡 High     |
| 19  | Rate limit funciona                                                        | 🟡 High     |
| 20  | Cache 24h: 2ª consulta mesmo CPF → SearchResult reutilizado                | 🟡 High     |
| 21  | Score APIFull descartado (não aparece no relatório)                        | 🟡 High     |
| 22  | Recorte temporal "há X anos" aparece quando disponível, omitido quando não | 🟡 High     |
| 23  | Menções classificadas (positive/neutral/negative) exibidas por cenário     | 🟡 High     |
| 24  | Nova Consulta → Teaser com email pré-preenchido da sessão                  | 🟡 High     |
| 25  | Reclame Aqui sem dados → card oculto (não vazio)                           | 🟢 Medium   |
| 26  | Reclame Aqui positivo (nota alta) exibido no Sol                           | 🟢 Medium   |
| 27  | CNPJ Baixada/Suspensa → card com borda vermelha                            | 🟢 Medium   |
| 28  | Botão "Relatar erro" em cada card → abre Tally                             | 🟢 Medium   |
| 29  | Datajud retorna processos complementares ao Escavador                      | 🟢 Medium   |
| 30  | Admin com dados reais                                                      | 🟢 Medium   |
| 31  | Blocklist com associatedName bloqueia buscas Google                        | 🟢 Medium   |
| 32  | Reembolso manual funciona                                                  | 🟢 Medium   |
| 33  | Indicador atividade comercial CPF ("X empresas consultaram")               | 🟢 Medium   |
| 34  | Jobs de limpeza executam                                                   | 🟢 Medium   |
| 35  | Sentry captura erros                                                       | 🟢 Medium   |
| 36  | Pagamento real R$ 29,90 (produção)                                         | 🔴 Blocker  |
| 37  | Reembolsar pagamento real de teste                                         | 🔴 Blocker  |

---

<a id="14-golive"></a>

## 14 · Checklist de Go Live

### Código

- [ ] `MOCK_MODE=false`
- [ ] Build sem erros na Vercel
- [ ] Todas as env vars preenchidas

### Banco

- [ ] Neon migrado (`npx prisma migrate deploy`)
- [ ] `JWT_SECRET` é string aleatória forte (64+ chars)
- [ ] `ADMIN_EMAILS` com emails reais

### Integrações

- [ ] `ASAAS_ENV=production` + chave de produção + webhook de produção
- [ ] Asaas NFS-e configurada
- [ ] Resend SPF/DKIM/DMARC verificado
- [ ] Inngest → URL de produção
- [ ] Turnstile → domínio de produção
- [ ] Sentry → projeto ativo
- [ ] Plausible → site ativo

### Teste final

- [ ] Compra real R$ 29,90 com CPF próprio
- [ ] Webhook grava buyerName/buyerCpfCnpj no Purchase
- [ ] Email chega
- [ ] Relatório Sol renderiza com dados reais + recorte temporal + selo verificação
- [ ] Relatório Chuva renderiza com cards expandidos + menções classificadas
- [ ] Disclaimer obrigatório visível
- [ ] Selo de verificação com data + fontes + validade 7 dias
- [ ] Menções web classificadas corretamente por cenário
- [ ] Reclame Aqui positivo exibido no Sol quando nota alta
- [ ] Botão "Relatar erro" funciona (abre Tally)
- [ ] P.3 `/privacidade/titular` → Tally embed funciona
- [ ] Score da APIFull não aparece em nenhum lugar
- [ ] Reclame Aqui: card oculto quando sem dados
- [ ] Cache 24h: 2ª consulta → reutiliza SearchResult
- [ ] Nova Consulta com email pré-preenchido funciona
- [ ] Reembolsar compra de teste via admin

### Segurança

- [ ] `.env.local` no `.gitignore`
- [ ] Nenhuma chave hardcoded
- [ ] Webhook valida token Asaas
- [ ] Rate limits aplicados
- [ ] Turnstile ativo
- [ ] Admin guard protege `/admin/*`

---

<a id="15-troubleshooting"></a>

## 15 · Troubleshooting

| Problema                                      | Causa                     | Solução                                      |
| --------------------------------------------- | ------------------------- | -------------------------------------------- |
| "Cannot read property 'payment' of undefined" | Payload Asaas inesperado  | Logar payload completo antes de parsear      |
| Purchase fica PENDING                         | Webhook não chegou        | Verificar URL no Asaas + logs Vercel         |
| Job Inngest não dispara                       | Chaves erradas            | Verificar `INNGEST_SIGNING_KEY` no dashboard |
| Email não chega                               | SPF/DKIM não configurado  | Verificar DNS no Resend                      |
| Relatório "Dados limitados"                   | CPF sem registros         | Comportamento normal                         |
| 429 Too Many Requests                         | Rate limit                | Aguardar 1 hora                              |
| "E-mail não encontrado"                       | Nunca comprou             | Correto — sem compra, sem conta              |
| Turnstile falha                               | Chave errada para domínio | Verificar domínio no Cloudflare              |
| Prisma "prepared statement"                   | Hot reload Next.js        | Usar singleton `lib/prisma.ts`               |
| Google "quota exceeded"                       | >100/dia grátis           | Ativar billing Google Cloud                  |
| Build falha Vercel                            | Tipo/import errado        | `npm run build` local primeiro               |
| SQLite → Postgres falha                       | Tipos incompatíveis       | String→Json no SearchResult.data             |

### Comandos úteis

```bash
# Dev local
npm run dev                            # App
npx prisma studio                      # Banco visual
npx inngest-cli dev                    # Jobs local
npx tsx scripts/seed.ts                # Popular banco
npx tsx scripts/simulate-payment.ts X  # Simular pagamento

# Produção
vercel logs --follow                   # Logs tempo real
npx prisma migrate deploy              # Migrations no Neon
npm run build                          # Check build antes de push
```

---

> **Custo total:** R$ 3,33/mês fixo + ~R$ 4/consulta
> **Margem bruta:** ~87% (R$ 25,90/consulta)
> **Timeline:** Parte A: 3-4 semanas · Parte B: 1-2 semanas · Total: 4-6 semanas
