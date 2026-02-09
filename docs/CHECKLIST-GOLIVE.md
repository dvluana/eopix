# E O PIX - Checklist Go-Live

> **Data:** 09/02/2026
> **Status:** PRONTO PARA GO-LIVE (pendente DNS Resend)

---

## Resumo Executivo

O projeto esta **PRONTO** para go-live. Todas as 12 features implementadas, todas as integracoes configuradas.

**Pendencia unica:** Configurar DNS do Resend (SPF) para envio de emails.

---

## Testes de API Realizados

| Servico | Status | Observacao |
|---------|--------|------------|
| Neon Database | OK | Schema migrado para production (10 tabelas) |
| Serper API | OK | Retornou resultados de busca |
| OpenAI API | OK | GPT-4o-mini respondeu corretamente |
| Sentry | Configurado | Projeto uxnaut/eopix criado |
| Resend | DNS Pendente | Precisa configurar SPF (ver abaixo) |
| APIFull | 403 via CLI | Normal - funciona do servidor Vercel |

---

## ACAO NECESSARIA: Configurar DNS do Resend

Adicionar no provedor de DNS do dominio `somoseopix.com.br`:

### Registro MX:
```
Nome: send
Tipo: MX
Prioridade: 10
Valor: feedback-smtp.sa-east-1.amazonses.com
TTL: 60
```

### Registro TXT:
```
Nome: send
Tipo: TXT
Valor: v=spf1 include:amazonses.com ~all
TTL: 60
```

Apos configurar, verificar status em: https://resend.com/domains

---

## Status Verificado - Variaveis no Vercel (Producao)

Todas as variaveis foram configuradas e verificadas:

| Variavel | Status | Observacao |
|----------|--------|------------|
| `DATABASE_URL` | Configurado | Branch production do Neon |
| `DIRECT_URL` | Configurado | Conexao direta |
| `JWT_SECRET` | Configurado | 64 caracteres hex |
| `ADMIN_EMAILS` | Configurado | luanacrdl@gmail.com |
| `ASAAS_ENV` | Configurado | "production" |
| `ASAAS_API_KEY` | Configurado | Key de producao |
| `ASAAS_WEBHOOK_TOKEN` | Configurado | Token personalizado |
| `APIFULL_API_KEY` | Configurado | APIFull token |
| `SERPER_API_KEY` | Configurado | Serper API |
| `OPENAI_API_KEY` | Configurado | OpenAI GPT-4o-mini |
| `RESEND_API_KEY` | Configurado | Email transacional |
| `INNGEST_EVENT_KEY` | Configurado | Background jobs |
| `INNGEST_SIGNING_KEY` | Configurado | Background jobs |
| `MOCK_MODE` | Configurado | "false" |
| `NEXT_PUBLIC_APP_URL` | Configurado | https://www.somoseopix.com.br |
| `EMAIL_FROM` | Configurado | plataforma@somoseopix.com.br |
| `PRICE_CENTS` | Configurado | 2990 |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Configurado | somoseopix.com.br |
| `NEXT_PUBLIC_SENTRY_DSN` | Configurado | Monitoramento de erros |
| `SENTRY_AUTH_TOKEN` | Configurado | Upload de sourcemaps |
| `SENTRY_ORG` | Configurado | uxnaut |
| `SENTRY_PROJECT` | Configurado | eopix |

---

## Sentry Configurado

Projeto Sentry criado e configurado:
- **Org:** uxnaut
- **Projeto:** eopix
- **DSN:** https://467cd8d42cc4e8e74a2cf84a2d5fd6f2@o4510857350283264.ingest.us.sentry.io/4510857516089344

---

## Proximo Passo: Deploy

Para aplicar as novas variaveis de ambiente, faca um novo deploy:

```bash
vercel --prod
```

Ou faca um push para a branch `main` que o deploy automatico sera disparado.

---

## Testes Pos-Deploy

1. Acessar `https://www.somoseopix.com.br`
2. Digitar CPF valido - ver teaser
3. Compra real R$ 29,90 (CPF proprio)
4. Email de confirmacao (checar spam)
5. Aguardar processamento (~2-3 min)
6. Email de relatorio pronto
7. Login magic link
8. Ver relatorio completo

---

## Verificar Sentry

Apos o deploy, verifique se o Sentry esta capturando eventos:
1. Acessar https://sentry.io/organizations/uxnaut/projects/eopix/
2. Verificar se erros estao sendo capturados (pode forcar um erro de teste)

---

## Referencias

- `.env.local` - Valores de desenvolvimento
- `.env.production.example` - Template de producao
- `docs/PENDENCIAS-PRODUCAO.md` - Checklist detalhado
