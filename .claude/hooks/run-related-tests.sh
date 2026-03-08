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
