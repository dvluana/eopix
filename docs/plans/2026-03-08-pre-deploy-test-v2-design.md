# Pre-Deploy Validation v2 — Design

**Goal:** Validar o fluxo completo da plataforma EOPIX (registro, compra, processamento, relatório, admin) usando `npm run dev:live` com APIs reais antes do deploy na Vercel.

## Lições da tentativa anterior

- `npm start` (production build) local não replica a Vercel — serverless vs server persistente, env files conflitam, Inngest dev server morre sem gerenciamento.
- `npm run dev:live` é o modo correto para testes locais com APIs reais. Roda Next.js + Inngest dev server juntos via `concurrently`.
- Fallback sync (`/api/process-search`) é safety net, não mecanismo principal.

## Approach

### Ambiente
- `.env.local`: `TEST_MODE=true`, `BYPASS_PAYMENT=true`, `MOCK_MODE=false`
- `.env.production.local` não deve existir (já renomeado para `.bak`)
- Comando: `npm run dev:live`
- DB: Neon develop branch

### Teste CPF (012.086.282-40)
1. Landing page carrega
2. Navegar para `/consulta/01208628240`
3. Registrar conta via modal (nome, email, celular, CPF, senha)
4. Compra bypassa pagamento → Purchase criada PAID
5. Inngest dev server processa evento `search/process`
6. Confirmação mostra progresso etapa por etapa (6 etapas)
7. Relatório completo renderiza
8. Admin: login, verificar purchase no painel, monitor pipeline

### Teste CNPJ (a definir)
- Mesmo fluxo com CNPJ fornecido pela Luana

### O que NÃO é testado localmente
- Webhook real do AbacatePay (precisa URL pública)
- Inngest Cloud (retries, memoization, crons)
- Cold starts serverless
- Esses itens serão validados via Vercel Preview Deploy em iteração futura

## Critérios de sucesso
- Purchase vai de PAID → PROCESSING → COMPLETED sem intervenção manual
- Relatório renderiza com dados reais da APIFull
- Admin panel mostra purchase e pipeline monitor funciona
- Nenhum erro 500 ou processing travado
