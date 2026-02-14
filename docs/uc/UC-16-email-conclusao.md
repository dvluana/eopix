# UC-16: Email de Conclusão (Brevo)

## Objetivo
Enviar email automático via Brevo quando relatório de pesquisa estiver pronto, incluindo link direto para acesso ao relatório completo.

## Escopo
**Inclui**:
- Adicionar step 7 em `processSearch` (inngest.ts) após step 6 (finalização)
- Criar função `sendCompletionEmail()` em `/src/lib/email.ts`
- Template HTML com link para `/relatorio/{searchResultId}?token={jwt}`
- Enviar APENAS quando status = COMPLETED
- Aviso para verificar pasta de spam
- Subject line otimizado para deliverability

**Não inclui**:
- Email de confirmação de compra (já enviado por Asaas)
- Email de reembolso (separado)
- Notificações push/SMS

## Atores
- **Sistema (Inngest)**: Dispara email após conclusão do processamento
- **Brevo (SMTP)**: Provedor de envio de emails
- **Comprador**: Recebe email com link do relatório

## Regras de Negócio
1. **[RN-01]** Enviar APENAS quando `SearchResult.status = COMPLETED`
2. **[RN-02]** NÃO enviar para status `FAILED` ou `REFUNDED`
3. **[RN-03]** Link deve incluir JWT válido por 24h
4. **[RN-04]** Email deve incluir aviso para verificar spam
5. **[RN-05]** Subject line: "Seu relatório está pronto! 📄" (emoji para destacar)
6. **[RN-06]** Incluir link direto sem necessidade de login
7. **[RN-07]** Garantir deliverability (SPF, DKIM configurados no Brevo)

## Contrato HTTP

### Modificação: `inngest.ts` - Step 7
```typescript
import { inngest } from './inngest'
import { db } from './db'
import { sendCompletionEmail } from './email'
import { createJWT } from './jwt'

export const processSearch = inngest.createFunction(
  { id: 'process-search' },
  { event: 'search/process' },
  async ({ event, step }) => {
    const { searchResultId } = event.data

    // ... steps 1-6 existentes ...

    // Step 7: Enviar email de conclusão
    await step.run('send-completion-email', async () => {
      const search = await db.searchResult.findUnique({
        where: { id: searchResultId },
      })

      if (!search) {
        throw new Error('SearchResult not found')
      }

      // Enviar apenas se COMPLETED
      if (search.status !== 'COMPLETED') {
        return { skipped: true, reason: `Status is ${search.status}` }
      }

      // Criar JWT para acesso ao relatório
      const token = createJWT({
        searchId: search.id,
        code: search.code,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24h
      })

      await sendCompletionEmail({
        to: search.email,
        code: search.code,
        searchResultId: search.id,
        token,
      })

      return { sent: true, to: search.email }
    })
  }
)
```

### Nova Função: `email.ts` - sendCompletionEmail
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendCompletionEmailParams {
  to: string
  code: string
  searchResultId: string
  token: string
}

export async function sendCompletionEmail({
  to,
  code,
  searchResultId,
  token,
}: SendCompletionEmailParams) {
  const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/relatorio/${searchResultId}?token=${token}`

  await resend.emails.send({
    from: 'Eopix <noreply@somoseopix.com.br>',
    to,
    subject: 'Seu relatório está pronto! 📄',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #111827; font-size: 24px; margin-bottom: 20px;">Seu relatório está pronto!</h1>

            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              Olá! Finalizamos o processamento do seu relatório de processos judiciais.
            </p>

            <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              <strong>Código de acesso:</strong> ${code}
            </p>

            <a href="${reportUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Acessar Relatório Completo
            </a>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px; margin-bottom: 10px;">
              Este link é válido por 24 horas. Após esse período, você precisará solicitar um novo acesso.
            </p>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
              <strong>⚠️ Importante:</strong> Verifique sua pasta de spam caso não encontre este email na caixa de entrada.
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin-bottom: 0;">
              Eopix - Consulta de Processos Judiciais<br>
              Este é um email automático. Por favor, não responda.
            </p>
          </div>
        </body>
      </html>
    `,
  })
}
```

## Status Implementação
- **Backend**: `pending` (arquivo: `/src/lib/inngest.ts` - modificar, `/src/lib/email.ts` - criar função)
- **Frontend**: `na`
- **Banco**: `na`

## Dependências
- **depends_on**: [UC-07, UC-08] (Inngest processSearch já implementado)
- **blocks**: Nenhuma

## Paralelização
- **parallel_group**: H1 (pode ser executado em paralelo com UC-17)

## Estratégia Técnica
- **[Modificar]** `/src/lib/inngest.ts` - adicionar step 7 após step 6
- **[Criar]** Função `sendCompletionEmail()` em `/src/lib/email.ts`
- **[Criar]** Template HTML responsivo com CTA clara
- **[Validar]** JWT com expiração de 24h
- **[Testar]** Envio em ambiente de dev (usar email de teste)
- **[Configurar]** SPF/DKIM no Brevo para evitar spam

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN processamento do SearchResult foi concluído com sucesso
WHEN Inngest executa step 7 (send-completion-email)
THEN email é enviado para SearchResult.email
AND subject é "Seu relatório está pronto! 📄"
AND body contém link para /relatorio/{searchResultId}?token={jwt}
AND JWT é válido por 24h

GIVEN SearchResult tem status FAILED
WHEN Inngest executa step 7
THEN email NÃO é enviado
AND step retorna { skipped: true, reason: "Status is FAILED" }

GIVEN SearchResult tem status REFUNDED
WHEN Inngest executa step 7
THEN email NÃO é enviado
AND step retorna { skipped: true, reason: "Status is REFUNDED" }

GIVEN comprador recebe email
WHEN clica no link "Acessar Relatório Completo"
THEN é redirecionado para /relatorio/{searchResultId}?token={jwt}
AND relatório completo é exibido
AND download PDF está disponível

GIVEN JWT expirou (> 24h)
WHEN comprador clica no link
THEN erro "Link expirado" é exibido
AND opção de solicitar novo link é apresentada
```

## Testes Obrigatórios
- [ ] Envio de email quando status = COMPLETED
- [ ] Skip de envio quando status = FAILED ou REFUNDED
- [ ] JWT válido por 24h
- [ ] Link de acesso funcionando
- [ ] Template HTML renderizando corretamente
- [ ] Deliverability (verificar spam score)

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Template de email especificado
- [x] Dependências mapeadas (UC-07, UC-08)
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Step 7 adicionado em inngest.ts
- [ ] Função sendCompletionEmail implementada
- [ ] Template HTML criado e testado
- [ ] JWT com expiração configurada
- [ ] Email enviado com sucesso em teste
- [ ] SPF/DKIM configurados no Brevo
- [ ] Testes unitários passando
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Teste de envio (criar script de teste)
npm run inngest:dev
# Disparar evento de teste:
# curl -X POST http://localhost:8288/api/inngest \
#   -H "Content-Type: application/json" \
#   -d '{"event": "search/process", "data": {"searchResultId": "sr_test123"}}'

# Logs do Inngest
# → Step 1-6: Completed
# → Step 7 (send-completion-email): Running...
# → Email sent to: teste@example.com
# → { sent: true, to: 'teste@example.com' }

# Verificar email recebido
# → Subject: "Seu relatório está pronto! 📄"
# → Link: https://somoseopix.com.br/relatorio/sr_test123?token=eyJ...
# → Clicar no link → Relatório exibido ✓

# Testar skip para status FAILED
# → { skipped: true, reason: 'Status is FAILED' }

# Testar JWT expirado
# → Erro: "Link expirado. Solicite um novo acesso."
```

## Arquivos a Modificar/Criar
- **Modificar**: `/src/lib/inngest.ts` (adicionar step 7)
- **Criar função**: `/src/lib/email.ts` (sendCompletionEmail)
- **Commit**: `feat(uc-16): enviar email de conclusão via brevo`
- **Deploy**: N/A (executado via Inngest)
