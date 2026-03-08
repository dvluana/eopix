# Mock Purchases & Reports for Minhas Consultas

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** In MOCK_MODE, `/minhas-consultas` shows a realistic set of mock purchases (processing, failed, refunded, multiple completed) with working navigation to mock report pages.

**Architecture:** Two API routes need mock data injection: `GET /api/purchases` returns mock purchases when `isMockMode`, and `GET /api/report/[id]` returns mock report data for mock IDs (prefixed `mock-`). All mock data is assembled from existing Chuva/Sol mocks in `src/lib/mocks/`. No DB seeding needed — mocks are injected at the API response level.

**Tech Stack:** Next.js API routes, TypeScript, existing mock data files

---

## Mock Purchase Variations

| # | Status | Type | Document | Name | Report? | Weather |
|---|--------|------|----------|------|---------|---------|
| 1 | PROCESSING (step 3) | CPF | 123.456.789-01 | — | No | — |
| 2 | FAILED | CNPJ | 99.999.999/0001-99 | — | No | — |
| 3 | REFUND_PENDING | CPF | 111.222.333-44 | — | No | — |
| 4 | COMPLETED | CPF | 123.456.789-01 | Joao Carlos da Silva | Yes | Chuva (protestos + processos + menções negativas) |
| 5 | COMPLETED | CPF | 987.654.321-09 | Maria Aparecida Santos | Yes | Sol (tudo limpo) |
| 6 | COMPLETED | CNPJ | 12.345.678/0001-90 | Empresa Problemática Ltda | Yes | Chuva (recuperação judicial + ações + Reclame Aqui ruim) |
| 7 | COMPLETED | CNPJ | 98.765.432/0001-55 | Tech Solutions Ltda | Yes | Sol (ativa + Reclame Aqui bom + prêmios) |
| 8 | COMPLETED | CPF | 555.666.777-88 | Ana Paula Ferreira | Yes | Chuva parcial (só protestos financeiros, sem processos) |

---

### Task 1: Create mock purchases data file

**Files:**
- Create: `src/lib/mocks/purchases-data.ts`

**Step 1: Create the mock purchases and reports data file**

This file exports:
1. `MOCK_PURCHASES` — array of purchase objects matching the `GET /api/purchases` response shape
2. `MOCK_REPORTS` — map of `mock-report-{n}` → report data matching the `GET /api/report/[id]` response shape

The completed reports reuse existing mock data from `apifull-data.ts`, `google-data.ts`, and `openai-data.ts`.

```typescript
// src/lib/mocks/purchases-data.ts
import {
  MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
  MOCK_APIFULL_CPF_CADASTRAL_SOL,
  MOCK_APIFULL_CPF_PROCESSOS_CHUVA,
  MOCK_APIFULL_CPF_PROCESSOS_SOL,
  MOCK_APIFULL_CPF_FINANCIAL_CHUVA,
  MOCK_APIFULL_CPF_FINANCIAL_SOL,
  MOCK_APIFULL_CNPJ_DOSSIE_CHUVA,
  MOCK_APIFULL_CNPJ_DOSSIE_SOL,
  MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA,
  MOCK_APIFULL_CNPJ_FINANCIAL_SOL,
} from './apifull-data'
import {
  MOCK_GOOGLE_CPF_CHUVA,
  MOCK_GOOGLE_CPF_SOL,
  MOCK_GOOGLE_CHUVA,
  MOCK_GOOGLE_SOL,
} from './google-data'
import {
  MOCK_OPENAI_PROCESSOS_CHUVA,
  MOCK_OPENAI_PROCESSOS_SOL,
  MOCK_OPENAI_SUMMARY_CHUVA_CPF,
  MOCK_OPENAI_SUMMARY_SOL_CPF,
  MOCK_OPENAI_SUMMARY_CHUVA_CNPJ,
  MOCK_OPENAI_SUMMARY_SOL_CNPJ,
} from './openai-data'
import type { ReportData } from '@/lib/hooks/use-report-data'

// ========== MOCK PURCHASES ==========
// Shape matches GET /api/purchases response items

export interface MockPurchase {
  id: string
  code: string
  status: string
  processingStep: number
  type: 'CPF' | 'CNPJ'
  term: string
  createdAt: string
  hasReport: boolean
  reportId: string | null
}

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString()

export const MOCK_PURCHASES: MockPurchase[] = [
  // 1. PROCESSING — CPF at step 3
  {
    id: 'mock-purchase-1',
    code: 'MOCK01',
    status: 'PROCESSING',
    processingStep: 3,
    type: 'CPF',
    term: '123.456.789-01',
    createdAt: hoursAgo(0.1), // ~6 min ago
    hasReport: false,
    reportId: null,
  },
  // 2. FAILED — CNPJ
  {
    id: 'mock-purchase-2',
    code: 'MOCK02',
    status: 'FAILED',
    processingStep: 4,
    type: 'CNPJ',
    term: '99.999.999/0001-99',
    createdAt: hoursAgo(2),
    hasReport: false,
    reportId: null,
  },
  // 3. REFUND_PENDING — CPF
  {
    id: 'mock-purchase-3',
    code: 'MOCK03',
    status: 'REFUND_PENDING',
    processingStep: 0,
    type: 'CPF',
    term: '111.222.333-44',
    createdAt: hoursAgo(48),
    hasReport: false,
    reportId: null,
  },
  // 4. COMPLETED — CPF Chuva (Joao Carlos da Silva)
  {
    id: 'mock-purchase-4',
    code: 'MOCK04',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '123.456.789-01',
    createdAt: hoursAgo(1),
    hasReport: true,
    reportId: 'mock-report-cpf-chuva',
  },
  // 5. COMPLETED — CPF Sol (Maria Aparecida Santos)
  {
    id: 'mock-purchase-5',
    code: 'MOCK05',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '987.654.321-09',
    createdAt: hoursAgo(3),
    hasReport: true,
    reportId: 'mock-report-cpf-sol',
  },
  // 6. COMPLETED — CNPJ Chuva (Empresa Problemática)
  {
    id: 'mock-purchase-6',
    code: 'MOCK06',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CNPJ',
    term: '12.345.678/0001-90',
    createdAt: hoursAgo(6),
    hasReport: true,
    reportId: 'mock-report-cnpj-chuva',
  },
  // 7. COMPLETED — CNPJ Sol (Tech Solutions)
  {
    id: 'mock-purchase-7',
    code: 'MOCK07',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CNPJ',
    term: '98.765.432/0001-55',
    createdAt: hoursAgo(12),
    hasReport: true,
    reportId: 'mock-report-cnpj-sol',
  },
  // 8. COMPLETED — CPF Chuva parcial (só financeiro, sem processos)
  {
    id: 'mock-purchase-8',
    code: 'MOCK08',
    status: 'COMPLETED',
    processingStep: 6,
    type: 'CPF',
    term: '555.666.777-88',
    createdAt: hoursAgo(24),
    hasReport: true,
    reportId: 'mock-report-cpf-parcial',
  },
]

// ========== MOCK REPORTS ==========
// Shape matches GET /api/report/[id] response (= ReportData)

const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

export const MOCK_REPORTS: Record<string, ReportData> = {
  // CPF Chuva — full problems (protestos + processos + menções negativas)
  'mock-report-cpf-chuva': {
    id: 'mock-report-cpf-chuva',
    term: '123.456.***-**',
    type: 'CPF',
    name: 'Joao Carlos da Silva',
    data: {
      cadastral: MOCK_APIFULL_CPF_CADASTRAL_CHUVA,
      processos: MOCK_APIFULL_CPF_PROCESSOS_CHUVA,
      financial: MOCK_APIFULL_CPF_FINANCIAL_CHUVA,
      financialSummary: {
        totalProtestos: MOCK_APIFULL_CPF_FINANCIAL_CHUVA.totalProtestos,
        valorTotalProtestos: MOCK_APIFULL_CPF_FINANCIAL_CHUVA.valorTotalProtestos,
        totalDividas: MOCK_APIFULL_CPF_FINANCIAL_CHUVA.totalPendencias,
        valorTotalDividas: MOCK_APIFULL_CPF_FINANCIAL_CHUVA.valorTotalPendencias,
        chequesSemFundo: MOCK_APIFULL_CPF_FINANCIAL_CHUVA.chequesSemFundo,
      },
      processAnalysis: MOCK_OPENAI_PROCESSOS_CHUVA.processAnalysis,
      google: MOCK_GOOGLE_CPF_CHUVA,
      reclameAqui: MOCK_OPENAI_SUMMARY_CHUVA_CPF.reclameAqui || undefined,
    },
    summary: MOCK_OPENAI_SUMMARY_CHUVA_CPF.summary,
    createdAt: hoursAgo(1),
    expiresAt: sevenDaysFromNow,
  },

  // CPF Sol — tudo limpo
  'mock-report-cpf-sol': {
    id: 'mock-report-cpf-sol',
    term: '987.654.***-**',
    type: 'CPF',
    name: 'Maria Aparecida Santos',
    data: {
      cadastral: MOCK_APIFULL_CPF_CADASTRAL_SOL,
      processos: MOCK_APIFULL_CPF_PROCESSOS_SOL,
      financial: MOCK_APIFULL_CPF_FINANCIAL_SOL,
      financialSummary: {
        totalProtestos: 0,
        valorTotalProtestos: 0,
        totalDividas: 0,
        valorTotalDividas: 0,
        chequesSemFundo: 0,
      },
      processAnalysis: MOCK_OPENAI_PROCESSOS_SOL.processAnalysis,
      google: MOCK_GOOGLE_CPF_SOL,
    },
    summary: MOCK_OPENAI_SUMMARY_SOL_CPF.summary,
    createdAt: hoursAgo(3),
    expiresAt: sevenDaysFromNow,
  },

  // CNPJ Chuva — recuperação judicial + ações + Reclame Aqui ruim
  'mock-report-cnpj-chuva': {
    id: 'mock-report-cnpj-chuva',
    term: '12.345.678/****-**',
    type: 'CNPJ',
    name: 'EMPRESA PROBLEMATICA LTDA',
    data: {
      dossie: MOCK_APIFULL_CNPJ_DOSSIE_CHUVA,
      financial: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA,
      financialSummary: {
        totalProtestos: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA.totalProtestos,
        valorTotalProtestos: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA.valorTotalProtestos,
        totalDividas: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA.totalPendencias,
        valorTotalDividas: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA.valorTotalPendencias,
        chequesSemFundo: MOCK_APIFULL_CNPJ_FINANCIAL_CHUVA.chequesSemFundo,
      },
      processAnalysis: MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.processAnalysis,
      google: MOCK_GOOGLE_CHUVA,
      reclameAqui: MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.reclameAqui || undefined,
    },
    summary: MOCK_OPENAI_SUMMARY_CHUVA_CNPJ.summary,
    createdAt: hoursAgo(6),
    expiresAt: sevenDaysFromNow,
  },

  // CNPJ Sol — empresa ativa, Reclame Aqui bom
  'mock-report-cnpj-sol': {
    id: 'mock-report-cnpj-sol',
    term: '98.765.432/****-**',
    type: 'CNPJ',
    name: 'TECH SOLUTIONS SERVICOS DE TI LTDA',
    data: {
      dossie: MOCK_APIFULL_CNPJ_DOSSIE_SOL,
      financial: MOCK_APIFULL_CNPJ_FINANCIAL_SOL,
      financialSummary: {
        totalProtestos: 0,
        valorTotalProtestos: 0,
        totalDividas: 0,
        valorTotalDividas: 0,
        chequesSemFundo: 0,
      },
      processAnalysis: MOCK_OPENAI_PROCESSOS_SOL.processAnalysis,
      google: MOCK_GOOGLE_SOL,
      reclameAqui: MOCK_OPENAI_SUMMARY_SOL_CNPJ.reclameAqui || undefined,
    },
    summary: MOCK_OPENAI_SUMMARY_SOL_CNPJ.summary,
    createdAt: hoursAgo(12),
    expiresAt: sevenDaysFromNow,
  },

  // CPF Chuva parcial — só protestos financeiros (sem processos, sem menções)
  'mock-report-cpf-parcial': {
    id: 'mock-report-cpf-parcial',
    term: '555.666.***-**',
    type: 'CPF',
    name: 'Ana Paula Ferreira',
    data: {
      cadastral: {
        nome: 'Ana Paula Ferreira',
        cpf: '55566677788',
        dataNascimento: '1988-11-03',
        idade: 37,
        nomeMae: 'Sandra Ferreira',
        sexo: 'Feminino',
        signo: 'Escorpiao',
        situacaoRF: 'REGULAR',
        enderecos: [
          {
            logradouro: 'Rua Sete de Setembro',
            numero: '321',
            complemento: 'Bloco B',
            bairro: 'Centro',
            cidade: 'Curitiba',
            uf: 'PR',
            cep: '80000-000',
          },
        ],
        telefones: [
          { ddd: '41', numero: '998765432', tipo: 'Celular' },
        ],
        emails: ['ana.ferreira@email.com'],
        empresasVinculadas: [],
      },
      processos: { processos: [], totalProcessos: 0 },
      financial: {
        nome: 'Ana Paula Ferreira',
        protestos: [
          {
            data: '2025-10-20',
            valor: 1800,
            cartorio: '1o Cartorio de Protestos',
            cidade: 'Curitiba',
            uf: 'PR',
          },
          {
            data: '2026-01-15',
            valor: 3200,
            cartorio: '2o Cartorio de Protestos',
            cidade: 'Curitiba',
            uf: 'PR',
          },
        ],
        pendenciasFinanceiras: [],
        chequesSemFundo: 0,
        totalProtestos: 2,
        valorTotalProtestos: 5000,
        totalPendencias: 0,
        valorTotalPendencias: 0,
        _scoreInterno: 520,
      },
      financialSummary: {
        totalProtestos: 2,
        valorTotalProtestos: 5000,
        totalDividas: 0,
        valorTotalDividas: 0,
        chequesSemFundo: 0,
      },
      processAnalysis: [],
      google: { byDocument: [], byName: [], reclameAqui: [] },
    },
    summary: 'Foram encontrados 2 protestos em cartorio totalizando R$ 5.000. Sem processos judiciais ou mencoes negativas na web. Situacao financeira requer atencao, mas sem indicio de problemas graves.',
    createdAt: hoursAgo(24),
    expiresAt: sevenDaysFromNow,
  },
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `purchases-data.ts`

**Step 3: Commit**

```bash
git add src/lib/mocks/purchases-data.ts
git commit -m "feat: add mock purchases and reports data for MOCK_MODE"
```

---

### Task 2: Inject mock purchases in GET /api/purchases

**Files:**
- Modify: `src/app/api/purchases/route.ts` (GET handler, lines 264-325)

**Step 1: Modify GET handler to inject mock purchases in MOCK_MODE**

When `isMockMode` is true, prepend the mock purchases array to the real DB purchases. This way mock data always shows alongside any real purchases created during the session.

Add at top of file:
```typescript
import { isMockMode } from '@/lib/mock-mode'
```

(Note: `isBypassMode` is already imported — check if `isMockMode` is already imported too. If only `isBypassMode` and `isBypassPayment` are imported, add `isMockMode`.)

In the GET handler, after line 308 (after `const purchases = user.purchases.map(...)`) and before the `isAdmin` check, add:

```typescript
    // In MOCK_MODE, prepend mock purchases for UI showcase
    if (isMockMode) {
      const { MOCK_PURCHASES } = await import('@/lib/mocks/purchases-data')
      purchases.unshift(...MOCK_PURCHASES)
    }
```

Note: `purchases` is `const` — change it to `let` on the declaration line.

**Step 2: Also inject mock purchases for unauthenticated scenario**

Actually, the GET handler returns 401 if no session. In MOCK_MODE, if the user hasn't logged in, they still won't see mock purchases because they get 401 first and then the page shows the login form. The mock purchases will show after login, which is correct behavior.

However, we need to handle the edge case where user is `null` (session exists but user not in DB). After line 294-296 (`if (!user) { return NextResponse.json({ purchases: [] }) }`), modify to also inject mocks:

```typescript
    if (!user) {
      if (isMockMode) {
        const { MOCK_PURCHASES } = await import('@/lib/mocks/purchases-data')
        return NextResponse.json({
          email: session.email,
          purchases: MOCK_PURCHASES,
          isAdmin: false,
        })
      }
      return NextResponse.json({ purchases: [] })
    }
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Clean

**Step 4: Commit**

```bash
git add src/app/api/purchases/route.ts
git commit -m "feat: inject mock purchases in GET /api/purchases when MOCK_MODE"
```

---

### Task 3: Serve mock reports in GET /api/report/[id]

**Files:**
- Modify: `src/app/api/report/[id]/route.ts`

**Step 1: Add mock report handling at the top of the GET handler**

Before the session check and DB query, detect mock report IDs (prefix `mock-report-`) and return mock data directly. This skips auth/DB entirely for mock reports in mock mode.

After line 11 (`const { id } = await params`), add:

```typescript
    // MOCK_MODE: serve mock reports without DB/auth
    if (isMockMode && id.startsWith('mock-report-')) {
      const { MOCK_REPORTS } = await import('@/lib/mocks/purchases-data')
      const mockReport = MOCK_REPORTS[id]
      if (mockReport) {
        return NextResponse.json(mockReport)
      }
      return NextResponse.json(
        { error: 'Mock report nao encontrado' },
        { status: 404 }
      )
    }
```

Add import at top:
```typescript
import { isMockMode } from '@/lib/mock-mode'
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Clean

**Step 3: Commit**

```bash
git add src/app/api/report/\[id\]/route.ts
git commit -m "feat: serve mock reports in GET /api/report/[id] when MOCK_MODE"
```

---

### Task 4: Manual testing with Chrome MCP

**Step 1: Start dev server**

Run: `npm run dev` (starts in MOCK_MODE)

**Step 2: Test minhas-consultas page**

1. Navigate to `http://localhost:3000`
2. Register/login
3. Go to `/minhas-consultas`
4. Verify all 8 mock purchases appear with correct statuses:
   - 1x PROCESSANDO badge with timeline (step 3)
   - 1x FALHOU badge
   - 1x REEMBOLSO PENDENTE badge
   - 5x CONCLUIDO badges with "Ver Relatorio" buttons

**Step 3: Test report navigation**

1. Click "Ver Relatorio" on each completed purchase
2. Verify each loads the correct report:
   - CPF Chuva: Joao Carlos — chuva weather, financial card, judicial card, web mentions, AI summary
   - CPF Sol: Maria Aparecida — sol weather, positive mentions, clean checklist
   - CNPJ Chuva: Empresa Problemática — chuva, company info card, Reclame Aqui bad, ações ativas
   - CNPJ Sol: Tech Solutions — sol, company info card, Reclame Aqui good, prêmios
   - CPF Parcial: Ana Paula — chuva, only financial card (protestos), no judicial/mentions

**Step 4: Verify "Minhas Consultas" back button works**

On any report page, click "Minhas Consultas" back button → should return to the purchase list.

---

### Task 5: Run lint and typecheck

**Step 1: Run full checks**

Run: `npm run lint && npx tsc --noEmit`
Expected: Clean (or only pre-existing warnings)

**Step 2: Run vitest**

Run: `npx vitest run`
Expected: All existing tests pass (no regressions)

**Step 3: Final commit if any fixes needed**

---

### Task 6: Update docs/status.md

**Files:**
- Modify: `docs/status.md`

**Step 1: Add entry to "O que está funcionando" section**

Add under the last `- **...` entry:
```
- **Mock purchases showcase em minhas-consultas** — MOCK_MODE injeta 8 purchases mock (1 processing, 1 failed, 1 refund_pending, 5 completed). Completed cards linkam para mock reports com variações: CPF chuva (protestos+processos+menções), CPF sol (limpo), CNPJ chuva (recuperação judicial+ações+Reclame Aqui ruim), CNPJ sol (ativa+prêmios+Reclame Aqui bom), CPF parcial (só protestos). Report API serve mock data sem DB/auth para IDs `mock-report-*`.
```

**Step 2: Add entry to "Últimas mudanças" section**

Add at top:
```
- **Mock purchases showcase** (2026-03-07): (1) `src/lib/mocks/purchases-data.ts` criado — 8 mock purchases (PROCESSING, FAILED, REFUND_PENDING, 5x COMPLETED) + 5 mock reports completos (CPF chuva, CPF sol, CNPJ chuva, CNPJ sol, CPF parcial). Reusa dados de apifull-data, google-data, openai-data. (2) GET `/api/purchases`: injeta mock purchases via `unshift` quando MOCK_MODE. (3) GET `/api/report/[id]`: serve mock reports para IDs `mock-report-*` sem DB/auth quando MOCK_MODE. (4) Todos os status de card renderizam corretamente em minhas-consultas. "Ver Relatorio" navega para relatório completo com todas as variações de weather/componentes.
```

**Step 3: Commit**

```bash
git add docs/status.md
git commit -m "docs: add mock purchases showcase to status"
```
