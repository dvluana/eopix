# Deploy to Production

Workflow completo de deploy develop → main → Vercel → verificação.

## Pre-flight checks
1. Verificar que estamos na branch `develop`
2. Rodar `npm run lint` — se falhar, parar
3. Rodar `npx vitest run` — se falhar, parar
4. Rodar `git status` — se houver mudanças não commitadas, parar

## Merge
5. `git push origin develop`
6. `git checkout main && git pull origin main`
7. `git merge develop --ff-only` — se falhar (não fast-forward), parar e avisar
8. `git push origin main`
9. `git checkout develop`

## Verificação pós-deploy
10. Aguardar ~60s para Vercel deploy completar
11. Verificar health endpoint: `curl -s https://somoseopix.com.br/api/health | jq .status`
12. Se Chrome MCP disponível: navegar para `https://somoseopix.com.br` e tirar screenshot
13. Reportar resultado: SUCESSO ou FALHA com detalhes

## Rollback (se verificação falhar)
- Reportar o problema encontrado
- Perguntar se deve fazer rollback antes de agir
