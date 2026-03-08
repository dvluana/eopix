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
