# EOPIX — Projeto de Estabilização e Maturidade

## O Que É Isso

EOPIX é um SaaS brasileiro de relatórios de risco CPF/CNPJ (compra única, R$39,90). O produto já funciona em produção mas foi construído em "vibe code" — rápido, com IA, sem estrutura formal. Agora precisa de maturidade: observabilidade, confiabilidade e código sustentável.

**Core Value:** Quando um cliente paga, o relatório é gerado e entregue. Sem exceção. E quando dá errado, o operador sabe na hora, sabe o motivo, e resolve em minutos.

## Contexto

- **Stack:** Next.js 14 App Router · TypeScript · Prisma/Neon · AbacatePay v2 · Inngest · OpenAI gpt-4o-mini · APIFull · Serper · Resend · Sentry · Tailwind + Radix
- **Estado atual:** Produção funcionando, clientes pagando, mas debugging é doloroso — logs espalhados entre Inngest, Vercel e Neon sem ponto central de investigação
- **Modo:** MOCK_MODE (local) / LIVE (Vercel + Neon main)

## Problema Central

Quando um cliente tem problema (pagou, não recebeu relatório), o operador não sabe onde olhar. Logs estão em 3 lugares diferentes (Inngest dashboard, Vercel logs, Neon). Sentry está instalado mas nunca foi usado — não captura contexto de usuário/compra. O `/admin/monitor` existe mas não resolve investigação de casos específicos.

## Objetivos do Milestone

1. **Observabilidade** — Ver tudo sobre uma compra em um lugar: status, erros, logs, timeline. Sentry com contexto (purchase code, CPF/CNPJ, user ID)
2. **PIX Inline** — Transparent checkout AbacatePay v2 (`/v2/transparents/create`): QR Code no site, polling de status, sem redirect para página externa
3. **Código Limpo** — Separar regra de negócio, infra e UI que hoje estão misturados nos mesmos arquivos
4. **Documentação Viva** — Docs refletindo o código real (TTL atual, endpoints reais, fluxos atuais)

## Restrições

- Trabalhar sempre em `develop`. Nunca commitar em `main` diretamente.
- Neon `main` é produção — nunca rodar migrations direto
- Manter E2E tests passando (26/26 Playwright)
- AbacatePay v2 (não regredir para v1)

## Requirements

### Validated (já existe no código)

- ✓ Compra CPF/CNPJ com pagamento AbacatePay v2 (checkout hosted)
- ✓ Pipeline Inngest: APIFull + Serper + OpenAI → SearchResult
- ✓ Auth email+senha (bcrypt) + admin JWT
- ✓ Admin panel com mark-paid, reprocess, refund, blocklist, leads
- ✓ Sistema de email (Resend) com 9 templates
- ✓ Recuperação de senha
- ✓ E2E tests Playwright (26/26)
- ✓ CI/CD GitHub Actions + Neon branching
- ✓ Sentry instalado (mas não configurado com contexto)

### Active (o que queremos construir)

- [ ] Sentry com contexto completo (purchase code, user ID, CPF/CNPJ, status) em todos os erros
- [ ] Admin panel: página de investigação de compra individual com timeline completa
- [ ] PIX Transparent Checkout inline (sem redirect)
- [ ] Separação de concerns: business logic extraída de API routes e componentes
- [ ] Documentação atualizada (TTL, endpoints, fluxos)

### Out of Scope

- Blog SEO — foco é estabilidade, não crescimento
- RBAC / audit logging avançado — débito técnico conhecida, mas não agora
- Multi-tenancy — produto é single-tenant por design
- Stripe / outros payment providers — AbacatePay only

## Key Decisions

| Decisão | Racional | Resultado |
|---------|----------|-----------|
| PIX via Transparent Checkout | Resolve redirect problem sem trocar de gateway | AbacatePay `/v2/transparents/create` |
| Sentry como observabilidade (não Axiom/Datadog) | Já instalado, zero custo adicional, suficiente para o volume atual | Configurar contexto + alertas |
| Admin panel como central de investigação | Já existe `/admin`, mais rápido que nova ferramenta | Melhorar página de detalhes de compra |
| Separar business logic das routes | Tudo misturado = difícil de testar e entender | Extrair para `src/lib/services/` |

## Evolution

Este documento evolui a cada transição de fase.

**Após cada fase:** Mover requirements de Active → Validated quando implementado.

---
*Last updated: 2026-03-25 após inicialização*
