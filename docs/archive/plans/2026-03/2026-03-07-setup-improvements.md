# Setup Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce repeated bugs in Claude Code workflow via CLAUDE.md rules, automated hooks (lint + related tests), and MEMORY.md cleanup.

**Architecture:** Add 7 behavior rules to CLAUDE.md, enhance the existing typecheck hook with ESLint, create a new hook that runs related vitest tests on edit, clean up stale MEMORY.md entries.

**Tech Stack:** Bash hooks, Claude Code settings.json, CLAUDE.md, vitest

---

## Pre-requisites

- Branch: `develop`
- Existing hooks: `.claude/hooks/typecheck.sh`, `.claude/hooks/smart-commit.sh`
- Existing settings: `.claude/settings.json` (project-level)
- MEMORY.md: `/Users/luana/.claude/projects/-Users-luana-Documents-Code-Projects-eopix/memory/MEMORY.md`

---

## Task 1: Add 7 rules to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md:85-86` (append after last section)

**Step 1: Add the new sections**

Append the following after the last line of `CLAUDE.md` (after line 86):

```markdown

## Operações Destrutivas (DB e Git)

- DELETE/UPDATE/DROP: afetar APENAS os registros pedidos. Nunca deletar dados extras "por limpeza".
- Mostrar SQL exato e pedir confirmação ANTES de executar operações destrutivas.
- git push, merge para main, reset --hard: sempre pedir confirmação.

## APIs Externas

- ANTES de implementar integração com API externa: ler docs em `docs/api-contracts/` ou `docs/abacatepay-api.md`.
- Nunca adivinhar formato de request/response — ler o contrato primeiro.
- Nunca usar CPFs fictícios (ex: 123.456.789-09). Usar CPFs válidos de teste.
- Se o doc não cobre o caso: perguntar ao usuário antes de assumir.

## Workflow MCP

- Quando pedido para testar via Chrome MCP ou browser: executar imediatamente.
- NÃO entrar em plan mode quando o pedido é para testar. Testar primeiro, planejar fixes depois.

## Scoping de Tarefas

- Em tarefas de documentação, NÃO modificar código fonte.
- Se subagent modificar código inesperadamente, reverter imediatamente.

## Bug Fixing

- Bug fix NÃO está completo até ser verificado funcionando.
- Implementar fix E testar na mesma sessão (vitest + Chrome MCP se UI).
- Preferir TDD: failing test primeiro, depois implementação.
- NUNCA declarar "fix aplicado" sem evidência (test pass ou screenshot).

## Deploy

- Deploy workflow: (1) `npm run lint && npx vitest run`, (2) merge develop→main, (3) deploy Vercel, (4) verificar produção via Chrome MCP.
- Nunca pular verificação pós-deploy.
```

**Step 2: Verify CLAUDE.md is valid**

Run: `head -5 CLAUDE.md && echo "..." && tail -20 CLAUDE.md`
Expected: New sections visible at the end.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add 7 workflow rules to CLAUDE.md based on insights analysis"
```

---

## Task 2: Add ESLint to typecheck hook

**Files:**
- Modify: `.claude/hooks/typecheck.sh`

**Step 1: Update typecheck.sh**

Replace the full contents of `.claude/hooks/typecheck.sh` with:

```bash
#!/bin/bash

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Só roda para arquivos .ts e .tsx
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

cd '/Users/luana/Documents/Code Projects/eopix'

# 1. TypeScript check (bloqueia se erro no arquivo editado)
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -ne 0 ]; then
  FILE_ERRORS=$(echo "$TSC_OUTPUT" | grep "^$FILE_PATH" | head -10)
  if [ -n "$FILE_ERRORS" ]; then
    echo "TypeScript errors em $FILE_PATH:" >&2
    echo "$FILE_ERRORS" >&2
    exit 2
  fi
fi

# 2. ESLint check (warning only, não bloqueia)
LINT_OUTPUT=$(npx eslint "$FILE_PATH" --no-error-on-unmatched-pattern --format compact 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -c "Error")
  if [ "$LINT_ERRORS" -gt 0 ]; then
    echo "ESLint issues em $FILE_PATH:" >&2
    echo "$LINT_OUTPUT" | head -10 >&2
    # Não bloqueia (exit 0) — lint é informativo
  fi
fi

exit 0
```

**Step 2: Test the hook manually**

Run: `echo '{"tool_input":{"file_path":"src/lib/validators.ts"}}' | bash .claude/hooks/typecheck.sh; echo "Exit: $?"`
Expected: `Exit: 0` (no errors in validators.ts)

**Step 3: Test with a bad file**

Run: `echo '{"tool_input":{"file_path":"src/lib/prisma.ts"}}' | bash .claude/hooks/typecheck.sh; echo "Exit: $?"`
Expected: `Exit: 0` (lint warnings in stderr if any, but no blocking)

**Step 4: Commit**

```bash
git add .claude/hooks/typecheck.sh
git commit -m "feat: add ESLint check to typecheck hook (non-blocking)"
```

---

## Task 3: Create run-related-tests hook

**Files:**
- Create: `.claude/hooks/run-related-tests.sh`
- Modify: `.claude/settings.json:17-20` (add second PostToolUse hook)

**Step 1: Create the hook script**

Create `.claude/hooks/run-related-tests.sh`:

```bash
#!/bin/bash

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Só roda para arquivos .ts e .tsx em src/
if [[ "$FILE_PATH" != src/*.ts && "$FILE_PATH" != src/*.tsx ]]; then
  exit 0
fi

# Não roda para arquivos de teste
if [[ "$FILE_PATH" == *test* || "$FILE_PATH" == *spec* ]]; then
  exit 0
fi

cd '/Users/luana/Documents/Code Projects/eopix'

# Mapeia src/lib/foo.ts → tests/unit/foo.test.ts
BASENAME=$(basename "$FILE_PATH" | sed 's/\.tsx\?$//')
TEST_FILE="tests/unit/${BASENAME}.test.ts"

if [ ! -f "$TEST_FILE" ]; then
  # Sem test file correspondente — não faz nada
  exit 0
fi

OUTPUT=$(npx vitest run "$TEST_FILE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Extrai só as linhas de falha (não o output todo)
  FAILURES=$(echo "$OUTPUT" | grep -A 2 "FAIL\|AssertionError" | head -15)
  echo "Tests failing em $TEST_FILE:" >&2
  echo "$FAILURES" >&2
  exit 2
fi

exit 0
```

**Step 2: Make it executable**

Run: `chmod +x .claude/hooks/run-related-tests.sh`

**Step 3: Test the hook manually**

Run: `echo '{"tool_input":{"file_path":"src/lib/validators.ts"}}' | bash .claude/hooks/run-related-tests.sh; echo "Exit: $?"`
Expected: `Exit: 0` (validators tests pass — we just fixed them)

Run: `echo '{"tool_input":{"file_path":"src/lib/auth.ts"}}' | bash .claude/hooks/run-related-tests.sh; echo "Exit: $?"`
Expected: `Exit: 0` (auth tests exist and pass)

Run: `echo '{"tool_input":{"file_path":"src/app/api/admin/blocklist/route.ts"}}' | bash .claude/hooks/run-related-tests.sh; echo "Exit: $?"`
Expected: `Exit: 0` (no matching test file — skipped)

**Step 4: Register hook in settings.json**

Replace `.claude/settings.json` with:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [{ "type": "command", "command": "cd '/Users/luana/Documents/Code Projects/eopix' && echo '=== RETOMADA ===' && git branch --show-current && git log --oneline -3 && echo '' && cat TODO.md 2>/dev/null || echo 'Sem TODO.md'" }]
      },
      {
        "matcher": "compact",
        "hooks": [{ "type": "command", "command": "cd '/Users/luana/Documents/Code Projects/eopix' && echo '=== PÓS-COMPACTAÇÃO ===' && git branch --show-current && echo '' && cat TODO.md 2>/dev/null || echo 'Sem TODO.md'" }]
      }
    ],
    "PreCompact": [{
      "matcher": "auto",
      "hooks": [{ "type": "command", "command": "bash '/Users/luana/Documents/Code Projects/eopix/.claude/hooks/smart-commit.sh'" }]
    }],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash '/Users/luana/Documents/Code Projects/eopix/.claude/hooks/typecheck.sh'" }]
      },
      {
        "matcher": "Write|Edit",
        "hooks": [{ "type": "command", "command": "bash '/Users/luana/Documents/Code Projects/eopix/.claude/hooks/run-related-tests.sh'" }]
      }
    ]
  }
}
```

**Step 5: Commit**

```bash
git add .claude/hooks/run-related-tests.sh .claude/settings.json
git commit -m "feat: add run-related-tests hook (auto-runs vitest on edit)"
```

---

## Task 4: Clean up MEMORY.md

**Files:**
- Modify: `/Users/luana/.claude/projects/-Users-luana-Documents-Code-Projects-eopix/memory/MEMORY.md`

**Step 1: Fix stale info**

1. Line 51: Change `default: \`stripe\`` to `default: \`abacatepay\``
2. Line 52: Remove `REFUND_FAILED` from purchase states
3. Line 104: Change `domain.ts planned, not yet created` to `domain.ts created (2026-03-05)`

**Step 2: Remove stale session state**

Delete the entire section "Manual TEST_MODE Run — Troubleshooting Log (2026-03-05)" (lines 57-100).

Move the "Endpoints úteis descobertos" subsection (lines 95-100) into a new permanent section called "## Admin API Endpoints" before "## Project Structure Notes".

**Step 3: Verify MEMORY.md is under 200 lines**

Run: `wc -l /Users/luana/.claude/projects/-Users-luana-Documents-Code-Projects-eopix/memory/MEMORY.md`
Expected: Under 200 lines (currently ~124, will shrink to ~85 after removing troubleshooting section).

**Step 4: No git commit** (MEMORY.md is outside the repo)

---

## Task 5: Verify everything works end-to-end

**Step 1: Edit a TypeScript file and verify both hooks fire**

Make a trivial edit to `src/lib/validators.ts` (add a blank line, then remove it). Both hooks should fire:
1. typecheck.sh: tsc + eslint (exit 0)
2. run-related-tests.sh: runs `tests/unit/validators.test.ts` (exit 0, 24 tests pass)

**Step 2: Verify CLAUDE.md loads**

Start a new Claude Code session (or use `/clear`) and verify the new rules appear in the system context.

**Step 3: Final commit**

```bash
git add -A
git commit -m "docs: setup improvements complete — CLAUDE.md rules, hooks, memory cleanup"
```

Only if there are uncommitted changes from the verification steps.
