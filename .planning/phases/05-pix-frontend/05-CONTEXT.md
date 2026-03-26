# Phase 5: PIX Frontend - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Tela de pagamento PIX inline — usuário permanece no site EOPIX durante todo o pagamento. Após clicar DESBLOQUEAR, o sistema cria a cobrança PIX e exibe o QR Code diretamente na página. Sem redirect para o AbacatePay hosted checkout.

Entrega: nova página `/compra/pix` com QR Code + copia-e-cola + polling automático + tela de expiração com renovação.

</domain>

<decisions>
## Implementation Decisions

### Fluxo de checkout
- **D-01:** PIX inline substitui o checkout hosted do AbacatePay. O botão DESBLOQUEAR cria a purchase e redireciona para `/compra/pix?purchaseId=<uuid>` — sem redirect para site externo, sem opção de cartão.
- **D-02:** Fluxo: `POST /api/purchases` → obtém `purchaseId` → `POST /api/purchases/pix` → `/compra/pix?purchaseId=xxx` → QR Code exibido inline.

### Estrutura da página
- **D-03:** Nova página `/compra/pix` (não adicionar estado na `/compra/confirmacao` existente). A tela PIX tem UX única (QR + countdown + renovação) que justifica página própria.
- **D-04:** `purchaseId` (UUID) é passado como query param — não o `purchase.code` (short code usado em outras rotas).

### Comportamento de polling
- **D-05:** Polling a cada 3 segundos via `setInterval`. Ao receber `PAID` ou `COMPLETED`, redirecionar para `/minhas-consultas` imediatamente. A página de minhas-consultas já tem polling próprio para PROCESSING → COMPLETED.
- **D-06:** Não exibir tela de progresso do pipeline na página PIX — redirecionar para `/minhas-consultas` e deixar o `ProcessingTracker` existente fazer o trabalho.

### Expiração do PIX
- **D-07:** Countdown em MM:SS a partir de `pixExpiresAt`. Quando chegar a zero (ou status retornar `EXPIRED`), transicionar para estado de expirado.
- **D-08:** Botão "Gerar novo QR Code" chama o mesmo `POST /api/purchases/pix` com o mesmo `purchaseId` — o backend já cria nova cobrança e sobrescreve os campos no banco.

### Claude's Discretion
- Layout visual exato da tela PIX (tamanho QR, posição do código copia-e-cola, cores) — seguir padrão brutalist EOPIX existente (preto/amarelo, bordas pretas, monospace)
- Tratamento de erros de rede no polling (silencioso, próxima iteração retenta)
- Mock mode: exibir placeholder quando `brCodeBase64` for o valor de bypass

</decisions>

<specifics>
## Specific Ideas

- "Tudo dentro da EOPIX mesmo" — experiência completamente inline, sem sair do site em nenhum momento do pagamento.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PIX Backend (Phase 4)
- `src/app/api/purchases/pix/route.ts` — POST cria cobrança PIX; GET não existe nessa rota (status é rota separada). Retorna: `pixId`, `brCode`, `brCodeBase64`, `expiresAt`
- `src/app/api/purchases/pix/status/route.ts` — GET com `?purchaseId=<uuid>`. Retorna: `{ status: 'PENDING'|'PAID'|'EXPIRED'|'COMPLETED'|'FAILED', expiresAt }`
- `src/lib/abacatepay.ts` — `createPixCharge`, `checkPixStatus`, `simulatePixPayment`

### Fluxo de compra existente
- `src/app/consulta/[term]/page.tsx` — Entry point atual: cria purchase e obtém `purchaseId`. Precisa ser atualizado para redirecionar para `/compra/pix` em vez de `/compra/confirmacao`
- `src/app/compra/confirmacao/page.tsx` — Padrão de estado machine (PageState) e polling existente para referência de padrões

### Componentes reutilizáveis
- `src/components/ProcessingTracker.tsx` — Padrão de polling + progresso (referência de padrão, não reutilizar diretamente)
- `src/components/RegisterModal.tsx` e `src/components/TopBar.tsx` — Referência do design brutalist EOPIX

### Requirements
- `.planning/REQUIREMENTS.md` §PIX — PIX-02 (polling + redirect) e PIX-03 (expirado + renovação)

### Tipos centrais
- `src/types/domain.ts` — Tipos existentes; `PixState` pode ser adicionado aqui ou ficar no componente

</canonical_refs>

<deferred>
## Deferred Ideas

- Opção de pagamento com cartão de crédito — fora de escopo desta fase e do milestone atual

</deferred>

---

*Phase: 05-pix-frontend*
*Context gathered: 2026-03-26*
