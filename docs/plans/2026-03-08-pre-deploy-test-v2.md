# Pre-Deploy Validation v2

> **For Claude:** This is an operational test plan, not a code implementation plan. Execute tasks sequentially using Chrome MCP for browser steps and Neon MCP for DB verification. Do NOT enter plan mode — execute immediately.

**Goal:** Validar o fluxo completo EOPIX (registro → compra → processamento → relatório → admin) com APIs reais antes do deploy.

**Ambiente:** `npm run dev:live` (Next.js + Inngest dev server via concurrently), `TEST_MODE=true`, `BYPASS_PAYMENT=true`, Neon develop branch.

**Design:** `docs/plans/2026-03-08-pre-deploy-test-v2-design.md`

---

## Part A: Setup (3 tasks)

### Task 1: Limpar ambiente

**Step 1:** Matar processos em portas 3000 e 8288:
```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8288 | xargs kill -9 2>/dev/null
```

**Step 2:** Verificar `.env.local` tem os flags corretos:
```
MOCK_MODE=false
TEST_MODE=true
BYPASS_PAYMENT=true
```
File: `/.env.local` (linhas 38-40)

**Step 3:** Verificar que `.env.production.local` NÃO existe (apenas `.bak`):
```bash
ls .env.production.local 2>/dev/null && echo "PROBLEMA: arquivo existe" || echo "OK: não existe"
```

### Task 2: Limpar dados de teste anteriores

**Step 1:** Via Neon MCP (branch develop `br-jolly-union-aiu70ein`), deletar dados órfãos:
```sql
DELETE FROM "Purchase" WHERE code = 'SJK5KA';
DELETE FROM "User" WHERE email LIKE '%@eopix.test';
```

**Step 2:** Verificar que não há purchases de teste:
```sql
SELECT code, status, term FROM "Purchase" WHERE term = '01208628240' ORDER BY "createdAt" DESC LIMIT 5;
```
Expected: 0 rows.

### Task 3: Iniciar servidores

**Step 1:** Rodar `npm run dev:live` (sobe Next.js + Inngest):
```bash
npm run dev:live
```
Este comando roda via `concurrently` — ambos processos ficam gerenciados juntos.

**Step 2:** Esperar ~10s e verificar:
- Next.js respondendo: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → `200` ou `404`
- Inngest respondendo: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8288` → `200`

**Step 3:** Verificar Inngest dashboard em `http://localhost:8288` — deve mostrar funções registradas (search/process + 5 crons).

---

## Part B: Teste CPF 012.086.282-40 (8 tasks)

### Task 4: Landing page

Via Chrome MCP:
1. Navegar para `http://localhost:3000`
2. Verificar: logo EOPIX carrega, hero section visível, CTA "DESBLOQUEAR" presente
3. Screenshot para evidência

### Task 5: Página de consulta

Via Chrome MCP:
1. Navegar para `http://localhost:3000/consulta/01208628240`
2. Verificar: CPF formatado como `012.086.282-40`, badge "Varredura em 6 bases", botão "DESBLOQUEAR AGORA POR R$ 29,90"
3. Screenshot

### Task 6: Registro + Compra

Via Chrome MCP:
1. Clicar em "DESBLOQUEAR AGORA POR R$ 29,90"
2. Modal de registro abre
3. Preencher:
   - Nome: `Teste PreDeploy`
   - Email: `teste-predeploy@eopix.test`
   - Celular: `11999998888`
   - CPF/CNPJ: `01208628240`
   - Senha: `TesteSenha123!`
   - Confirmar Senha: `TesteSenha123!`
4. Submeter
5. Verificar: redirecionou para `/compra/confirmacao?code=XXXXXX`
6. Anotar o code da purchase

### Task 7: Monitorar processamento

**Critério de sucesso principal:** Purchase vai de PAID → PROCESSING → COMPLETED automaticamente.

Via Chrome MCP na página de confirmação:
1. Verificar que mostra "Compra aprovada!" com código
2. Observar progresso avançando (6 etapas):
   - Etapa 1: Dados cadastrais
   - Etapa 2: Dados financeiros
   - Etapa 3: Processos judiciais
   - Etapa 4: Buscas na web
   - Etapa 5: Análise IA
   - Etapa 6: Relatório final
3. Aguardar até completar (pode levar 30-60s com APIs reais)
4. Se travar: verificar terminal `npm run dev:live` para erros do Inngest

**Fallback se travar:**
- Verificar no terminal se Inngest recebeu o evento
- Se Inngest não recebeu: verificar se `inngest.send()` logou erro
- Se Inngest recebeu mas travou em algum step: verificar logs de erro da API

Via Neon MCP, verificar estado:
```sql
SELECT code, status, "processingStep", "searchResultId" FROM "Purchase" WHERE term = '01208628240' ORDER BY "createdAt" DESC LIMIT 1;
```
Expected: `status = 'COMPLETED'`, `searchResultId` preenchido.

### Task 8: Relatório

Via Chrome MCP:
1. Após confirmação completar, verificar redirecionamento para `/relatorio/[id]`
2. Se não redirecionou, navegar para `/minhas-consultas` e clicar no relatório
3. Verificar conteúdo do relatório:
   - Nome da pessoa consultada
   - Seção de dados cadastrais
   - Seção financeira
   - Seção de processos judiciais (se houver)
   - Seção de menções na web
   - Veredicto (sol ou chuva)
4. Screenshot

### Task 9: Minhas Consultas

Via Chrome MCP:
1. Navegar para `http://localhost:3000/minhas-consultas`
2. Verificar: purchase aparece na lista com status "Concluído"
3. Verificar: botão para ver relatório funciona
4. Se user é admin (`luanacrdl@gmail.com` no ADMIN_EMAILS): verificar se aparece botão "Painel Admin"

### Task 10: Admin Panel

Via Chrome MCP:
1. Navegar para `http://localhost:3000/admin`
2. Login com admin: email `admin@eopix.com.br` (ou o admin configurado)
3. Verificar dashboard carrega

**Nota:** Se admin não está configurado no DB, criar via Neon MCP:
```sql
-- Verificar se existe admin
SELECT * FROM "AdminUser" LIMIT 5;
```
Se não existir, orientar criação manual.

4. Verificar na lista de purchases: a compra de teste aparece com status COMPLETED
5. Navegar para Monitor (`/admin/monitor`): verificar que pipeline mostra purchase processada
6. Navegar para Health (`/admin/health`): verificar status dos serviços (APIFull, Serper, OpenAI, Inngest)

### Task 11: Verificação final

1. Terminal `npm run dev:live`: verificar que não há erros/warnings críticos nos logs
2. Neon MCP: confirmar estado final da purchase
```sql
SELECT p.code, p.status, p."processingStep", p."searchResultId",
       sr.term, sr.type, sr.name, length(sr.data::text) as data_size
FROM "Purchase" p
LEFT JOIN "SearchResult" sr ON p."searchResultId" = sr.id
WHERE p.term = '01208628240'
ORDER BY p."createdAt" DESC LIMIT 1;
```
Expected: status=COMPLETED, data_size > 1000 (dados reais da APIFull)

3. Resumo: listar o que funcionou e o que não funcionou

---

## Part C: Teste CNPJ (a definir)

### Task 12: CNPJ — Repetir fluxo

Mesmo fluxo das Tasks 5-11, mas com CNPJ fornecido pela Luana:
1. Nova conta ou mesma conta
2. Compra do CNPJ
3. Processamento (Inngest usa dossie + financeiro em vez de cadastral + processos)
4. Relatório CNPJ renderiza corretamente
5. Admin verifica

---

## Part D: Cleanup

### Task 13: Encerrar

1. Parar `npm run dev:live` (Ctrl+C no terminal)
2. Restaurar `.env.local` se necessário:
   ```
   MOCK_MODE=true
   TEST_MODE=false
   BYPASS_PAYMENT=false
   ```
3. Documentar resultado em `docs/status.md`
4. Commit das mudanças (fix do fallback + design doc + plano)
