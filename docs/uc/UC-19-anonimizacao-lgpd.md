# UC-19: Job de Anonimização LGPD (2 anos)

## Objetivo
Implementar job mensal automatizado via Inngest para anonimizar dados pessoais de compras após 2 anos, em compliance com LGPD Art. 16 (prazo de retenção).

## Escopo
**Inclui**:
- Função Inngest `anonymizePurchases` com cron mensal (`0 0 1 * *`)
- Anonização de `buyerName` e `buyerCpfCnpj` em `Purchase` com `createdAt < now - 2 anos`
- Preservação de `searchId` (relatório permanece acessível)
- Log de quantos registros foram anonimizados
- Registro de auditoria para compliance

**Não inclui**:
- Exclusão física de dados (apenas anonimização)
- Anonimização de `SearchResult` (dados técnicos, não pessoais)
- Anonimização sob demanda (usuário solicitando)
- GDPR compliance (apenas LGPD)

## Atores
- **Sistema (Inngest Cron)**: Executa job mensalmente no dia 1º à meia-noite
- **DPO (Data Protection Officer)**: Audita logs de anonimização
- **Comprador (titular dos dados)**: Tem dados anonimizados após 2 anos

## Regras de Negócio
1. **[RN-01]** Anonimizar APENAS `Purchase` com `createdAt < now() - 2 anos`
2. **[RN-02]** Anonimizar campos: `buyerName` → "ANONIMIZADO", `buyerCpfCnpj` → "ANONIMIZADO"
3. **[RN-03]** Preservar `searchId` (relatório permanece acessível por código)
4. **[RN-04]** Executar job mensalmente no dia 1º às 00:00 UTC
5. **[RN-05]** Registrar log com quantidade de registros anonimizados
6. **[RN-06]** NÃO anonimizar se `Purchase.status = REFUNDED` (pode haver disputa)
7. **[RN-07]** Compliance com LGPD Art. 16 (prazo de retenção de 2 anos)

## Contrato de Função Inngest

### 1. Função anonymizePurchases - inngest.ts
**Arquivo**: `/src/lib/inngest.ts`
```typescript
import { inngest } from './inngest'
import { db } from './db'

export const anonymizePurchases = inngest.createFunction(
  {
    id: 'anonymize-purchases',
    name: 'Anonymize Purchases (LGPD Compliance)',
  },
  {
    // Cron: todo dia 1º do mês, meia-noite UTC
    cron: '0 0 1 * *',
  },
  async ({ step }) => {
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    // Step 1: Buscar purchases elegíveis para anonimização
    const eligiblePurchases = await step.run('find-eligible-purchases', async () => {
      return await db.purchase.findMany({
        where: {
          createdAt: {
            lt: twoYearsAgo,
          },
          // Não anonimizar se dados já estão anonimizados
          buyerName: {
            not: 'ANONIMIZADO',
          },
          // Não anonimizar REFUNDED (pode haver disputa)
          status: {
            not: 'REFUNDED',
          },
        },
        select: {
          id: true,
          buyerName: true,
          buyerCpfCnpj: true,
          createdAt: true,
        },
      })
    })

    console.log(`[LGPD] Found ${eligiblePurchases.length} purchases to anonymize`)

    if (eligiblePurchases.length === 0) {
      return {
        anonymized: 0,
        message: 'No purchases to anonymize',
      }
    }

    // Step 2: Anonimizar em batch
    const result = await step.run('anonymize-data', async () => {
      const updated = await db.purchase.updateMany({
        where: {
          id: {
            in: eligiblePurchases.map((p) => p.id),
          },
        },
        data: {
          buyerName: 'ANONIMIZADO',
          buyerCpfCnpj: 'ANONIMIZADO',
        },
      })

      return updated.count
    })

    // Step 3: Registrar auditoria
    await step.run('log-audit', async () => {
      await db.auditLog.create({
        data: {
          action: 'ANONYMIZE_PURCHASES',
          details: {
            count: result,
            cutoffDate: twoYearsAgo.toISOString(),
            purchaseIds: eligiblePurchases.map((p) => p.id),
          },
          timestamp: new Date(),
        },
      })
    })

    console.log(`[LGPD] Anonymized ${result} purchases`)

    return {
      anonymized: result,
      cutoffDate: twoYearsAgo.toISOString(),
      purchaseIds: eligiblePurchases.map((p) => p.id),
    }
  }
)
```

### 2. Migration - Adicionar AuditLog
**Arquivo**: `prisma/migrations/XXX_add_audit_log/migration.sql`
```sql
-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");
```

**Schema**: `prisma/schema.prisma`
```prisma
model AuditLog {
  id        String   @id @default(cuid())
  action    String   // Ex: "ANONYMIZE_PURCHASES"
  details   Json     // Dados do evento
  timestamp DateTime @default(now())

  @@index([action])
  @@index([timestamp])
}
```

### 3. Registro de Função no Inngest
**Arquivo**: `/src/app/api/inngest/route.ts`
```typescript
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest'
import { processSearch, anonymizePurchases } from '@/lib/inngest'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processSearch,
    anonymizePurchases, // ← Adicionar função
  ],
})
```

## Status Implementação
- **Backend**: `pending` (função Inngest + migration - a criar)
- **Frontend**: `na`
- **Banco**: `pending` (migration AuditLog - a criar)

## Dependências
- **depends_on**: [UC-05] (Inngest já configurado)
- **blocks**: Nenhuma

## Paralelização
- **parallel_group**: I1 (pode ser executado em paralelo com UC-18)

## Estratégia Técnica
- **[Criar]** Migration para tabela `AuditLog`
- **[Executar]** `npx prisma migrate dev --name add_audit_log`
- **[Implementar]** Função `anonymizePurchases` em `/src/lib/inngest.ts`
- **[Registrar]** Função no `/src/app/api/inngest/route.ts`
- **[Testar]** Execução manual do job (forçar trigger)
- **[Validar]** Logs de auditoria sendo criados

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN é dia 1º do mês às 00:00 UTC
WHEN Inngest executa cron job "anonymize-purchases"
THEN busca todas as Purchase com createdAt < now - 2 anos
AND exclui Purchase com status = REFUNDED
AND exclui Purchase com buyerName = "ANONIMIZADO"
AND atualiza buyerName e buyerCpfCnpj para "ANONIMIZADO"
AND registra auditoria no AuditLog
AND retorna quantidade de registros anonimizados

GIVEN há 10 purchases com createdAt < 2 anos
WHEN job executa
THEN 10 purchases são anonimizados
AND log exibe "[LGPD] Anonymized 10 purchases"
AND AuditLog contém registro com action = "ANONYMIZE_PURCHASES"

GIVEN há 0 purchases elegíveis
WHEN job executa
THEN retorna { anonymized: 0, message: "No purchases to anonymize" }
AND AuditLog NÃO é criado

GIVEN Purchase tem status = REFUNDED
WHEN job executa
THEN Purchase NÃO é anonimizado
AND permanece com dados originais

GIVEN desenvolvedor força execução do job manualmente
WHEN chama Inngest API para trigger
THEN job executa imediatamente (fora do cron)
AND anonimiza registros elegíveis
```

## Testes Obrigatórios
- [ ] Migration executada com sucesso
- [ ] Tabela AuditLog criada
- [ ] Função anonymizePurchases registrada no Inngest
- [ ] Job executa e anonimiza registros elegíveis
- [ ] Purchase com status REFUNDED não é anonimizado
- [ ] AuditLog registra execução corretamente
- [ ] Log exibe quantidade de registros anonimizados

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Migration especificada
- [x] Função Inngest especificada
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Migration criada e executada
- [ ] Tabela AuditLog criada
- [ ] Função anonymizePurchases implementada
- [ ] Função registrada no Inngest
- [ ] Cron configurado (0 0 1 * *)
- [ ] Testes manuais passando
- [ ] AuditLog registrando corretamente
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Migration
npx prisma migrate dev --name add_audit_log
# → Migration applied successfully
# → ✓ Generated Prisma Client

# Criar purchases de teste (com createdAt < 2 anos)
npx prisma db seed
# → Created 10 test purchases (createdAt: 2023-01-01)

# Forçar execução manual do job
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"name": "inngest/scheduled.timer", "data": {"function_id": "anonymize-purchases"}}'

# Logs do Inngest
# → [LGPD] Found 10 purchases to anonymize
# → Step 1 (find-eligible-purchases): 10 purchases
# → Step 2 (anonymize-data): Updated 10 records
# → Step 3 (log-audit): Audit log created
# → [LGPD] Anonymized 10 purchases

# Consultar Purchase anonimizado
npx prisma studio
# → Purchase {
#     id: "pur_123",
#     buyerName: "ANONIMIZADO", ✓
#     buyerCpfCnpj: "ANONIMIZADO", ✓
#     searchResultId: "sr_456", ✓ (preservado)
#     status: "PAID",
#     createdAt: 2023-01-01T00:00:00.000Z,
#   }

# Consultar AuditLog
npx prisma studio
# → AuditLog {
#     id: "audit_789",
#     action: "ANONYMIZE_PURCHASES",
#     details: {
#       count: 10,
#       cutoffDate: "2024-02-13T00:00:00.000Z",
#       purchaseIds: ["pur_123", "pur_124", ...]
#     },
#     timestamp: 2026-02-13T00:00:00.000Z,
#   }

# Validar cron schedule no Inngest dashboard
# → Function: anonymize-purchases
# → Trigger: Cron (0 0 1 * *)
# → Next run: 2026-03-01 00:00:00 UTC
```

## Arquivos a Criar/Modificar
- **Criar**: `prisma/migrations/XXX_add_audit_log/migration.sql`
- **Modificar**: `prisma/schema.prisma` (adicionar AuditLog)
- **Modificar**: `/src/lib/inngest.ts` (adicionar anonymizePurchases)
- **Modificar**: `/src/app/api/inngest/route.ts` (registrar função)
- **Commit**: `feat(uc-19): implementar job de anonimização lgpd (2 anos)`
- **Deploy**: Vercel (rebuild + migration em produção)
