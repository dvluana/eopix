# Pre-Deploy Validation — E2E Manual Test via Chrome MCP

> **Data:** 2026-03-08
> **Objetivo:** Validar fluxo completo da plataforma antes de deploy para produção
> **Método:** Production build local + Chrome MCP para teste manual visual

---

## Contexto

Branch `develop` tem ~70 commits não pushados com mudanças significativas:
- Modal de cadastro (RegisterModal)
- AbacatePay v2 checkout
- Deferred account creation
- Landing page refactor
- Admin pipeline monitor
- Bug fixes diversos

Antes de mergear develop → main e fazer deploy na Vercel, precisamos validar que o fluxo completo funciona end-to-end.

---

## Fase 0: Preparação Git

1. Squash dos ~70 commits (muitos "wip: pre-compact checkpoint") em commits atômicos por feature/fix
2. Push para `origin/develop`
3. Verificar migrations aplicadas no Neon develop

## Fase 1: Build & Pré-checks

- `tsc --noEmit` limpo
- `npm run build` sucesso
- Inngest dev server rodando na porta 8288
- Env vars configuradas para TEST_MODE

**Server:** `npm run build && npm start` (porta 3000) — idêntico ao que roda na Vercel.

## Fase 2: Rodada TEST_MODE (CPF 012.086.282-40)

**Config:** `TEST_MODE=true`, `BYPASS_PAYMENT=true`, `MOCK_MODE=false`

| Step | Ação | Critério de sucesso |
|------|-------|-------------------|
| 1 | Abrir landing page | Carrega sem erros, layout OK |
| 2 | Clicar CTA "DESBLOQUEAR" | Modal de registro abre |
| 3 | Preencher registro (nome, email, celular, CPF, senha) | Campos com masks funcionam |
| 4 | Submeter | Conta criada, redirect para confirmação |
| 5 | Acompanhar processamento | Progress bar avança pelas 6 etapas |
| 6 | Relatório gerado | Redirect para `/relatorio/[id]`, dados reais renderizados |
| 7 | Verificar "Minhas Consultas" | Purchase aparece como COMPLETED |
| 8 | Admin login | `/admin` acessível com credenciais admin |
| 9 | Admin: verificar purchase | Status COMPLETED, dados do customer corretos |
| 10 | Admin: health check | APIFull balance, Serper credits, Inngest OK |
| 11 | Admin: monitor | Pipeline monitor mostra atividade recente |

## Fase 3: Rodada LIVE (CNPJ a definir)

**Config:** `MOCK_MODE=false`, `TEST_MODE=false`, `BYPASS_PAYMENT=false`

Mesmos steps 1-11 mas:
- Step 4 redireciona para checkout AbacatePay sandbox
- Pagar com PIX sandbox ou card teste `4242 4242 4242 4242`
- Webhook retorna e dispara Inngest
- Verificar no admin que `paymentExternalId` está preenchido

## Fase 4: Verificações extras

- **Bloqueio de duplicata**: consultar mesmo CPF → 409 + redirect pro relatório existente
- **Navegação**: links "Minhas Consultas" na landing e consulta
- **Error handling**: CPF inválido → mensagem de erro adequada

## Ferramentas

- Chrome MCP para navegação e screenshots (evidência visual)
- Inngest dashboard (localhost:8288) para monitorar pipeline
- Neon MCP para verificar dados no banco se necessário
