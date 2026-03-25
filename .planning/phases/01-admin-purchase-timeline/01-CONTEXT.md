# Phase 1: Admin Purchase Timeline - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Operador consegue investigar qualquer compra em uma única tela do admin: busca por código ou CPF/CNPJ, abre detalhe e vê a timeline completa (status, steps do pipeline, erros com mensagem legível, timestamps). Sem precisar cruzar Inngest dashboard + Vercel logs + Neon.

</domain>

<decisions>
## Implementation Decisions

### Onde vive a tela de investigação
- **D-01:** Melhorar o `PurchaseDetailsDialog` existente — não criar página dedicada nova
- **D-02:** A busca permanece na página `/admin/compras` (filtro por código/CPF já existe)
- **D-03:** URL da compra deve ser compartilhável: `/admin/compras?search=Q8HFHZ` abre diretamente com o dialog da compra correspondente

### Timeline — dados e abordagem
- **D-04:** Timeline inferida dos campos existentes no DB — sem migration, sem nova tabela `PurchaseEvent`
- **D-05:** Campos disponíveis para inferência: `createdAt` (PENDING), `paidAt` (PAID), `updatedAt` (última atualização), `processingStep` (step atual 0-6), `status`, `failureReason`, `failureDetails`, `searchResultId`
- **D-06:** Steps do pipeline sem timestamp preciso (só inferidos do `processingStep` atual) — aceitável para esta fase

### Conteúdo do dialog melhorado
- **D-07:** Mostrar timeline de status: PENDING → PAID → PROCESSING → COMPLETED/FAILED com timestamps reais onde disponíveis
- **D-08:** Steps do pipeline (6 steps) com indicação de qual foi o último executado e qual falhou
- **D-09:** Erros aparecem inline na timeline com mensagem legível (não apenas "FAILED") — usar `failureReason` + `failureDetails` com mapeamento para português
- **D-10:** Mostrar: código da compra, CPF/CNPJ formatado, nome do comprador, email, valor, link para relatório (se existir)

### Claude's Discretion
- Design visual da timeline (vertical vs horizontal, cores, ícones)
- Exato formato de exibição dos timestamps
- Tratamento de edge cases (compra sem `paidAt`, step = 0, etc.)

</decisions>

<specifics>
## Specific Ideas

- O monitor (`/admin/monitor`) já tem o componente `StepProgress` com os 6 steps — reutilizar ou adaptar para o dialog
- O dialog atual já tem `ElapsedTimer` e detecção de "travado" (>5min) — manter
- Caso de uso real: investigar compras de clientes que pagaram mas não receberam relatório (caso Kevin, caso Carolina mencionados no status.md)

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Admin panel existente
- `src/app/admin/_components/PurchaseDetailsDialog.tsx` — dialog atual a ser melhorado
- `src/app/api/admin/purchases/[id]/details/route.ts` — endpoint de detalhes (retorna purchase + processingLogs)
- `src/app/admin/(protected)/monitor/page.tsx` — componente `StepProgress` reutilizável
- `src/app/admin/(protected)/compras/page.tsx` — página de lista com busca existente
- `src/app/admin/_components/admin-utils.ts` — utilitários de formatação compartilhados

### Tipos e domínio
- `src/types/domain.ts` — `PROCESSING_STEPS`, `Purchase`, `AdminPurchase`
- `src/types/report.ts` — tipos centrais

### Schema do banco
- `prisma/schema.prisma` — model `Purchase` (campos disponíveis para inferência da timeline)

### Requisito
- `.planning/REQUIREMENTS.md` — OBS-01 (requisito desta fase)

### Sem specs externas adicionais
- Nenhuma spec externa além das listadas acima — decisões completamente capturadas nas decisions acima

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PurchaseDetailsDialog.tsx`: dialog Radix com fetch de detalhes, ElapsedTimer, detecção de stuck, botão retry — base para melhorias
- `StepProgress` (monitor/page.tsx): pipeline visual com 6 steps, CheckCircle/Loader/número — adaptar para timeline histórica
- `StatusBadge.tsx`: badge de status já estilizado
- `formatCurrency`, `formatDate`, `formatDateShort` (admin-utils.ts): formatadores prontos
- `PROCESSING_STEPS` (domain.ts): array com step number + label para os 6 steps

### Established Patterns
- Admin routes usam `requireAdmin()` para auth
- Componentes admin usam classes CSS `adm-*` (brutalist design, border preta, box-shadow offset)
- API routes seguem: `try/catch` → `NextResponse.json()`

### Integration Points
- `details/route.ts` já retorna `processingLogs` com `step`, `label`, `status` (pending/in_progress/completed) — estender com timestamps quando disponíveis
- Busca na compras page: query param `?search=` já existe, adicionar comportamento de auto-abrir dialog quando `?id=` presente

</code_context>

<deferred>
## Deferred Ideas

- Timestamps precisos por step do pipeline (requer tabela `PurchaseEvent` com migration) — avaliar em fase futura se necessário
- Link direto `/admin/compras/[id]` como página dedicada — `?search=código` resolve o caso de uso imediato

</deferred>

---

*Phase: 01-admin-purchase-timeline*
*Context gathered: 2026-03-25*
