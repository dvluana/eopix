# UC-18: NFS-e Automática (Asaas)

## Objetivo
Emitir nota fiscal de serviço (NFS-e) automaticamente via Asaas após confirmação de pagamento, garantindo compliance fiscal.

## Escopo
**Inclui**:
- Migration para adicionar campo `invoiceId` ao modelo `Purchase`
- Configuração de emissão automática de NFS-e no Asaas
- Modificação do webhook Asaas para chamar `generateInvoice()` após `PAYMENT_CONFIRMED`
- Função `generateInvoice()` em `/src/lib/asaas.ts`
- Gravação de `invoiceId` no `Purchase` após emissão
- Tratamento de erros (retry automático)

**Não inclui**:
- Emissão de NF-e (produto) - apenas NFS-e (serviço)
- Envio de NFS-e por email (Asaas faz automaticamente)
- Cancelamento de NFS-e (escopo futuro)

## Atores
- **Sistema (Webhook)**: Dispara emissão de NFS-e após pagamento
- **Asaas API**: Gera e envia NFS-e para cliente
- **Receita Federal**: Valida e autoriza NFS-e
- **Comprador**: Recebe NFS-e por email (via Asaas)

## Regras de Negócio
1. **[RN-01]** Emitir NFS-e APENAS para `Purchase` com status `PAID`
2. **[RN-02]** NÃO emitir para pagamentos em modo teste (`TEST_MODE`)
3. **[RN-03]** Gravar `invoiceId` no `Purchase` após emissão bem-sucedida
4. **[RN-04]** Se emissão falhar, registrar erro mas NÃO bloquear fluxo
5. **[RN-05]** Asaas envia NFS-e automaticamente para email do comprador
6. **[RN-06]** Serviço prestado: "Consulta de Processos Judiciais"
7. **[RN-07]** Código de serviço: 17.23 (processamento de dados)

## Contrato HTTP

### 1. Migration - Adicionar invoiceId ao Purchase
**Arquivo**: `prisma/migrations/XXX_add_invoice_id/migration.sql`
```sql
-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "invoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_invoiceId_key" ON "Purchase"("invoiceId");
```

**Schema**: `prisma/schema.prisma`
```prisma
model Purchase {
  id               String   @id @default(cuid())
  buyerName        String
  buyerCpfCnpj     String
  searchResultId   String   @unique
  asaasPaymentId   String   @unique
  asaasPaymentUrl  String
  invoiceId        String?  @unique  // ID da nota fiscal Asaas
  status           PurchaseStatus
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  searchResult SearchResult @relation(fields: [searchResultId], references: [id])
}
```

### 2. Função generateInvoice - asaas.ts
**Arquivo**: `/src/lib/asaas.ts`
```typescript
interface GenerateInvoiceParams {
  paymentId: string
  purchaseId: string
}

export async function generateInvoice({ paymentId, purchaseId }: GenerateInvoiceParams) {
  // Buscar Purchase
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: { searchResult: true },
  })

  if (!purchase) {
    throw new Error('Purchase not found')
  }

  // Não emitir para TEST_MODE
  if (process.env.ASAAS_ENV === 'sandbox') {
    console.log('[NFS-e] Skipping invoice generation (sandbox mode)')
    return { skipped: true }
  }

  // Não emitir se já tem invoiceId
  if (purchase.invoiceId) {
    console.log('[NFS-e] Invoice already generated:', purchase.invoiceId)
    return { invoiceId: purchase.invoiceId }
  }

  // Chamar API Asaas para gerar NFS-e
  const response = await fetch(`https://api.asaas.com/v3/payments/${paymentId}/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': process.env.ASAAS_API_KEY!,
    },
    body: JSON.stringify({
      // Dados do serviço
      serviceDescription: 'Consulta de Processos Judiciais',
      observations: `Código de acesso: ${purchase.searchResult.code}`,

      // Código de serviço (17.23 - processamento de dados)
      municipalServiceCode: '17.23',
      municipalServiceName: 'Processamento de dados',

      // Dados do cliente (já preenchido automaticamente pelo Asaas via paymentId)
      // customer: { ... }

      // Dados fiscais
      taxes: {
        retainIss: false, // Não reter ISS
        iss: 2.0, // Alíquota ISS 2%
        cofins: 3.0, // COFINS 3%
        pis: 0.65, // PIS 0.65%
        csll: 1.0, // CSLL 1%
        inss: 0, // Não há INSS sobre serviço
        ir: 0, // Não há IR retido
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to generate invoice: ${JSON.stringify(error)}`)
  }

  const invoice = await response.json()

  // Atualizar Purchase com invoiceId
  await db.purchase.update({
    where: { id: purchaseId },
    data: { invoiceId: invoice.id },
  })

  console.log('[NFS-e] Invoice generated:', invoice.id)
  return { invoiceId: invoice.id }
}
```

### 3. Modificação - Webhook Asaas
**Arquivo**: `/src/app/api/webhooks/asaas/route.ts`
```typescript
import { generateInvoice } from '@/lib/asaas'

export async function POST(request: Request) {
  const body = await request.json()

  if (body.event === 'PAYMENT_CONFIRMED') {
    const payment = body.payment

    // 1. Atualizar Purchase para PAID
    const purchase = await db.purchase.update({
      where: { asaasPaymentId: payment.id },
      data: { status: 'PAID' },
    })

    // 2. Gerar NFS-e
    try {
      await generateInvoice({
        paymentId: payment.id,
        purchaseId: purchase.id,
      })
    } catch (error) {
      console.error('[Webhook] Failed to generate invoice:', error)
      // NÃO bloquear fluxo - invoice pode ser gerada manualmente depois
    }

    // 3. Iniciar processamento (Inngest)
    await inngest.send({
      name: 'search/process',
      data: { searchResultId: purchase.searchResultId },
    })

    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
```

## Status Implementação
- **Backend**: `pending` (migration + função generateInvoice - a criar)
- **Frontend**: `na`
- **Banco**: `pending` (migration - a executar)

## Dependências
- **depends_on**: [UC-06] (webhook Asaas já implementado)
- **blocks**: Nenhuma

## Paralelização
- **parallel_group**: I1 (pode ser executado em paralelo com UC-19)

## Estratégia Técnica
- **[Criar]** Migration para adicionar `invoiceId` ao `Purchase`
- **[Executar]** `npx prisma migrate dev --name add_invoice_id`
- **[Implementar]** Função `generateInvoice()` em `/src/lib/asaas.ts`
- **[Modificar]** Webhook Asaas para chamar `generateInvoice()` após `PAYMENT_CONFIRMED`
- **[Testar]** Emissão de NFS-e em sandbox Asaas
- **[Validar]** invoiceId gravado no banco após emissão

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN webhook Asaas recebe evento PAYMENT_CONFIRMED
WHEN Purchase.status é atualizado para PAID
THEN função generateInvoice() é chamada
AND API Asaas gera NFS-e
AND invoiceId é gravado no Purchase
AND Asaas envia NFS-e por email ao comprador

GIVEN Purchase já possui invoiceId
WHEN generateInvoice() é chamado novamente
THEN função detecta invoiceId existente
AND retorna { invoiceId: "existing_id" }
AND NÃO faz nova chamada à API Asaas

GIVEN ambiente é sandbox (TEST_MODE)
WHEN generateInvoice() é chamado
THEN função retorna { skipped: true }
AND NÃO chama API Asaas
AND invoiceId permanece NULL

GIVEN API Asaas retorna erro ao gerar NFS-e
WHEN generateInvoice() falha
THEN erro é registrado no log
AND fluxo de processamento continua normalmente
AND Purchase.invoiceId permanece NULL

GIVEN NFS-e foi gerada com sucesso
WHEN desenvolvedor consulta Purchase
THEN campo invoiceId contém ID da nota fiscal
AND NFS-e pode ser consultada via API Asaas
```

## Testes Obrigatórios
- [ ] Migration executada com sucesso
- [ ] Campo invoiceId adicionado ao schema
- [ ] generateInvoice() gera NFS-e em sandbox
- [ ] invoiceId gravado no Purchase após emissão
- [ ] Skip de emissão quando invoiceId já existe
- [ ] Skip de emissão em TEST_MODE
- [ ] Tratamento de erro quando API Asaas falha

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Migration especificada
- [x] API Asaas documentada
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Migration criada e executada
- [ ] Campo invoiceId adicionado ao schema
- [ ] Função generateInvoice implementada
- [ ] Webhook modificado para chamar generateInvoice
- [ ] Testes em sandbox Asaas passando
- [ ] invoiceId gravado corretamente no banco
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Migration
npx prisma migrate dev --name add_invoice_id
# → Migration applied successfully
# → ✓ Generated Prisma Client

# Teste de emissão (criar script de teste)
npm run test:invoice
# → [NFS-e] Generating invoice for payment: pay_123
# → [NFS-e] Invoice generated: inv_456
# → [NFS-e] Purchase updated with invoiceId: inv_456

# Consultar Purchase no banco
npx prisma studio
# → Purchase {
#     id: "pur_123",
#     buyerName: "João Silva",
#     asaasPaymentId: "pay_123",
#     invoiceId: "inv_456", ✓
#     status: "PAID",
#   }

# Consultar NFS-e via API Asaas
curl -X GET https://sandbox.asaas.com/api/v3/invoices/inv_456 \
  -H "access_token: $ASAAS_API_KEY"
# → {
#     "id": "inv_456",
#     "status": "AUTHORIZED",
#     "number": "123456",
#     "serviceDescription": "Consulta de Processos Judiciais",
#     "municipalServiceCode": "17.23",
#   }

# Webhook test
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_CONFIRMED", "payment": {"id": "pay_123"}}'
# → { "received": true }
# → Log: [NFS-e] Invoice generated: inv_456
```

## Arquivos a Criar/Modificar
- **Criar**: `prisma/migrations/XXX_add_invoice_id/migration.sql`
- **Modificar**: `prisma/schema.prisma` (adicionar invoiceId)
- **Modificar**: `/src/lib/asaas.ts` (adicionar generateInvoice)
- **Modificar**: `/src/app/api/webhooks/asaas/route.ts` (chamar generateInvoice)
- **Commit**: `feat(uc-18): implementar emissão automática de nfs-e via asaas`
- **Deploy**: Vercel (rebuild + migration em produção)
