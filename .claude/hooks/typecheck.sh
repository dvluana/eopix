#!/bin/bash

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Só roda para arquivos .ts e .tsx
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Roda tsc na raiz do projeto
cd '/Users/luana/Documents/Code Projects/eopix'

OUTPUT=$(npx tsc --noEmit 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Filtra apenas erros do arquivo editado (menos ruído)
  FILE_ERRORS=$(echo "$OUTPUT" | grep "^$FILE_PATH" | head -10)

  if [ -n "$FILE_ERRORS" ]; then
    # exit 2 + stderr = CC bloqueia e força leitura do feedback
    echo "TypeScript errors em $FILE_PATH:" >&2
    echo "$FILE_ERRORS" >&2
    exit 2
  fi
  # Erros existem mas não neste arquivo — não bloqueia
fi

exit 0
