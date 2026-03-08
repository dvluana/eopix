#!/bin/bash
# Stop hook: lembra de atualizar docs quando código-fonte muda
# Roda no PostToolUse para Write|Edit — informativo, não bloqueia

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Só verifica arquivos em src/
if [[ "$FILE_PATH" != src/* ]]; then
  exit 0
fi

# Não verifica arquivos de teste ou tipo
if [[ "$FILE_PATH" == *test* || "$FILE_PATH" == *spec* || "$FILE_PATH" == *types/* ]]; then
  exit 0
fi

cd '/Users/luana/Documents/Code Projects/eopix'

# Mapeamento código → docs que devem ser atualizados
DOCS=""

case "$FILE_PATH" in
  src/lib/inngest/*)
    DOCS="docs/wiki/inngest.md + docs/specs/report-pipeline.md"
    ;;
  src/lib/abacatepay.ts|src/lib/payment.ts)
    DOCS="docs/specs/purchase-flow.md"
    ;;
  src/app/api/purchases/*)
    DOCS="docs/specs/purchase-flow.md"
    ;;
  src/app/api/webhooks/*)
    DOCS="docs/specs/purchase-flow.md"
    ;;
  src/app/api/auth/*)
    DOCS="docs/specs/auth.md"
    ;;
  src/app/api/admin/*|src/app/admin/*)
    DOCS="docs/wiki/admin.md"
    ;;
  src/lib/auth.ts|src/lib/server-auth.ts)
    DOCS="docs/specs/auth.md"
    ;;
  src/lib/apifull.ts)
    DOCS="docs/specs/report-pipeline.md + docs/api-contracts/"
    ;;
  src/lib/openai.ts|src/lib/ai-analysis.ts|src/lib/google-search.ts|src/lib/financial-summary.ts)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/app/api/report/*|src/app/api/search/*|src/app/api/process-search/*)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/app/relatorio/*)
    DOCS="docs/specs/report-pipeline.md"
    ;;
  src/lib/mock-mode.ts|src/lib/mocks/*)
    DOCS="docs/modos-de-execucao.md"
    ;;
  src/lib/prisma.ts)
    DOCS="docs/wiki/setup.md"
    ;;
esac

if [ -n "$DOCS" ]; then
  echo "Lembre de atualizar: $DOCS" >&2
fi

exit 0
