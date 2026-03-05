#!/bin/bash

git add -A

DIFF=$(git diff --cached --stat 2>/dev/null)
if [ -z "$DIFF" ]; then
  exit 0  # Nada para commitar
fi

# Tenta gerar mensagem descritiva via claude -p
# timeout 30 garante que não trava se a API estiver lenta
MSG=$(echo "$DIFF" | timeout 30 claude -p \
  "Gere uma mensagem de commit convencional em inglês." \
  "Responda APENAS a mensagem, sem explicação." \
  "Formato: tipo(escopo): descrição" \
  --output-format text 2>/dev/null)

# Fallback com nomes dos arquivos se claude -p falhar
if [ -z "$MSG" ]; then
  FILES=$(git diff --cached --name-only | head -3 | tr '\n' ' ')
  MSG="wip: pre-compact checkpoint [$FILES]"
fi

git commit -m "$MSG" --no-verify
