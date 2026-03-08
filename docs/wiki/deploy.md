---
title: "Deploy"
---

## Workflow: develop → main → Vercel

### Pre-flight
1. `npm run lint` — deve passar
2. `npx vitest run` — deve passar
3. `git status` — deve estar limpo

### Merge
4. `git push origin develop`
5. `git checkout main && git pull origin main`
6. `git merge develop --ff-only`
7. `git push origin main`
8. `git checkout develop`

### Verificação pós-deploy
9. Aguardar ~60s
10. `curl -s https://somoseopix.com.br/api/health | jq .status`
11. Chrome MCP: screenshot da homepage

### Rollback
- Reportar problema, perguntar antes de agir
- `git revert` ou redeploy do commit anterior

## Checklist Produção

- [ ] `ABACATEPAY_API_KEY` (sem prefixo `_dev_`)
- [ ] `ABACATEPAY_WEBHOOK_SECRET`
- [ ] `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`
- [ ] `APIFULL_API_KEY`, `SERPER_API_KEY`, `OPENAI_API_KEY`
- [ ] `NEXT_PUBLIC_APP_URL` apontando pro domínio
- [ ] Saldos: APIFull ≥ R$30, Serper ≥ 500 credits

## Paginas Relacionadas

<CardGroup cols={2}>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Rodar testes antes do deploy
  </Card>
  <Card title="Status" icon="signal" href="/status">
    Status vivo do projeto
  </Card>
</CardGroup>
