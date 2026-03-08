---
title: "Claude Workflow"
---

Como o Claude Code está configurado neste projeto.

## Hooks (`.claude/settings.json`)

| Hook | Trigger | O que faz |
|---|---|---|
| SessionStart (startup/resume) | Início/retomada | Mostra branch, últimos commits, TODO.md |
| SessionStart (compact) | Pós-compactação | Mostra branch + TODO.md |
| PreCompact (auto) | Antes de compactar | Auto-commit via smart-commit.sh |
| PostToolUse (Write/Edit) | Após editar .ts/.tsx | TypeScript check + ESLint |
| PostToolUse (Write/Edit) | Após editar .ts/.tsx | Roda testes relacionados |
| PostToolUse (Write/Edit) | Após editar src/ | Lembra de atualizar docs (check-docs) |

## Custom Skills

| Skill | Comando | O que faz |
|---|---|---|
| `/commit` | `git add` + conventional commit | Commit estruturado em develop |
| `/deploy` | lint → test → merge → push → verify | Deploy completo develop → main |

## Rules (`.claude/rules/`)

Arquivos com frontmatter `paths:` que auto-carregam quando editando arquivos matching.
Economizam tokens: só carregam contexto relevante ao arquivo sendo editado.

| Rule | Paths | Lembra de |
|---|---|---|
| `inngest.md` | `src/lib/inngest/**` | Array functions, wiki/inngest.md |
| `payment.md` | `src/lib/abacatepay.ts`, `payment.ts` | API docs, produto inline, specs |
| `admin.md` | `src/app/admin/**`, `api/admin/**` | JWT, rate limit, wiki/admin.md |
| `purchases.md` | `src/app/api/purchases/**` | Validações, specs/purchase-flow.md |

## CLAUDE.md

Sempre carregado. Contém:
- Regras obrigatórias (branch develop, source of truth, etc.)
- Mapa do projeto (ponteiros para onde encontrar cada coisa)
- Referências a docs/wiki/ e docs/specs/

## Boas Práticas

- Sempre ler TODO.md ao iniciar
- Atualizar TODO.md ao pausar
- Usar `/commit` para commits estruturados
- Usar `/deploy` para deploy completo
- Verificar Chrome MCP após deploy

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Setup" icon="gear" href="/wiki/setup">
    Configuracao do ambiente
  </Card>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Como rodar testes
  </Card>
</CardGroup>
