## Fazendo agora

- [ ] **Teste manual CPF Chuva com APIs reais (TEST_MODE)** — validar pipeline completo

## Estado atual do teste

### Infraestrutura criada (tudo pronto)
- Neon branch: `test/manual-cpf-chuva` (ID: `br-cold-field-aik2eumi`, project: `sweet-haze-72592464`)
- Admin seeded: `e2e-admin@eopix.test` / `E2eAdminPass!2026`
- Purchase `UJ9HC2` criada e marcada como PAID (CPF `00678080933`)
- Connection strings no bloco de comando abaixo

### Comando pra iniciar o dev server
```bash
TEST_MODE=true MOCK_MODE=false \
  ADMIN_EMAILS="luanacrdl@gmail.com,e2e-admin@eopix.test" \
  DATABASE_URL="postgresql://neondb_owner:npg_nsV7FXYPmb6H@ep-winter-salad-aif9yste-pooler.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require" \
  DIRECT_URL="postgresql://neondb_owner:npg_nsV7FXYPmb6H@ep-winter-salad-aif9yste.c-4.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require" \
  npm run dev
```

### Próximo passo
```bash
# Process (fallback sincrono — consome credito real ~R$11,91)
curl -X POST localhost:3000/api/process-search/UJ9HC2
```

## RESOLVIDO: APIFull endpoints corrigidos

- `apifull.ts`: URLs (`/consulta` → `/api/{endpoint}`), links (`r-cpf-completo` → `ic-cpf-completo`, `srs-premium` → `serasa-premium`), `User-Agent` header adicionado
- `docs/api-contracts/` atualizados
- Confirmado com curl: response 200

## Cleanup pendente (após terminar testes)

- [ ] Deletar branch Neon `br-cold-field-aik2eumi` via MCP `delete_branch`
- [ ] Verificar se mappers de response em `apifull.ts` batem com formato real da API

## Próximo

- [ ] Reprocessar purchase UJ9HC2 (ou criar nova)
- [ ] Validar relatório renderizado no browser
- [ ] Testar CPF Sol, CNPJ Chuva, CNPJ Sol
- [ ] Extrair hook use-report-data
- [ ] Criar `src/types/domain.ts`

## Últimas decisões importantes

- APIFull exige `User-Agent` header (403 sem ele)
- TEST_MODE sem Inngest: usar fluxo de 2 passos (mark-paid + process-search)
- Neon MCP cria branch do main por default — rodar `prisma migrate deploy` após criar
- Admin endpoints em `/api/admin/*` (login em `/api/admin/login`)
