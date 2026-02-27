# UC-17: Analytics Plausible (Cookieless)

## Objetivo
Implementar analytics cookieless via Plausible para rastrear funil de conversão sem violar LGPD, eliminando necessidade de banner de cookies.

## Escopo
**Inclui**:
- Script Plausible no `layout.tsx` (head)
- Eventos customizados: `input_submitted`, `teaser_viewed`, `checkout_started`, `payment_confirmed`, `report_accessed`
- Função `trackEvent()` em `/src/lib/analytics.ts`
- Variável de ambiente `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- Configuração de domínio no dashboard Plausible

**Não inclui**:
- Google Analytics (usa cookies)
- Pixel do Facebook/Meta (usa cookies)
- Hotjar ou similares (podem usar cookies)
- A/B testing (fora do escopo)

## Atores
- **Desenvolvedor**: Implementa tracking de eventos
- **Marketing/Growth**: Analisa funil de conversão no dashboard Plausible
- **Usuário Final**: Navegação rastreada sem cookies (LGPD friendly)

## Regras de Negócio
1. **[RN-01]** Plausible NÃO usa cookies (cookieless analytics)
2. **[RN-02]** Não requer banner de consentimento (LGPD Art. 7)
3. **[RN-03]** Rastrear 5 eventos principais do funil de conversão
4. **[RN-04]** Script deve carregar de forma assíncrona (não bloquear render)
5. **[RN-05]** Domínio configurado: `somoseopix.com.br`
6. **[RN-06]** Eventos devem incluir metadata relevante (ex: valor da compra)

## Contrato de Configuração

### 1. Script Plausible - layout.tsx
**Arquivo**: `/src/app/layout.tsx`
```typescript
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Plausible Analytics - Cookieless */}
        <Script
          defer
          data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'somoseopix.com.br'}
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### 2. Função trackEvent - analytics.ts
**Arquivo**: `/src/lib/analytics.ts`
```typescript
declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, string | number> }) => void
  }
}

export type AnalyticsEvent =
  | 'input_submitted'
  | 'teaser_viewed'
  | 'checkout_started'
  | 'payment_confirmed'
  | 'report_accessed'

interface EventProps {
  [key: string]: string | number
}

export function trackEvent(event: AnalyticsEvent, props?: EventProps) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined)
  } else {
    console.warn('[Analytics] Plausible not loaded, skipping event:', event)
  }
}
```

### 3. Uso nos Componentes

**Homepage - Input Submitted**
```typescript
// src/app/page.tsx
import { trackEvent } from '@/lib/analytics'

function handleSubmit(cpfCnpj: string) {
  // ... validação e criação de SearchResult
  trackEvent('input_submitted', { document_type: cpfCnpj.length === 11 ? 'cpf' : 'cnpj' })
  router.push(`/teaser?code=${code}`)
}
```

**Teaser - Viewed**
```typescript
// src/app/teaser/page.tsx
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function TeaserPage() {
  useEffect(() => {
    trackEvent('teaser_viewed', { has_processes: processCount > 0 })
  }, [])

  // ... resto do componente
}
```

**Checkout - Started**
```typescript
// src/app/checkout/page.tsx
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function CheckoutPage() {
  useEffect(() => {
    trackEvent('checkout_started', { amount: 39.90 })
  }, [])

  // ... resto do componente
}
```

**Webhook - Payment Confirmed**
```typescript
// src/app/api/webhooks/asaas/route.ts
import { trackEvent } from '@/lib/analytics'

if (event === 'PAYMENT_CONFIRMED') {
  // ... atualizar Purchase
  trackEvent('payment_confirmed', { amount: payment.value, payment_method: payment.billingType })
}
```

**Relatório - Accessed**
```typescript
// src/app/relatorio/[id]/page.tsx
import { useEffect } from 'react'
import { trackEvent } from '@/lib/analytics'

export default function RelatorioPage() {
  useEffect(() => {
    trackEvent('report_accessed', { search_result_id: params.id })
  }, [])

  // ... resto do componente
}
```

### 4. Variável de Ambiente
**Arquivo**: `.env.local`
```bash
NEXT_PUBLIC_PLAUSIBLE_DOMAIN="somoseopix.com.br"
```

## Status Implementação
- **Backend**: `pending` (função trackEvent - a criar)
- **Frontend**: `pending` (Script + eventos - a adicionar)
- **Banco**: `na`

## Dependências
- **depends_on**: Nenhuma
- **blocks**: Nenhuma

## Paralelização
- **parallel_group**: H1 (pode ser executado em paralelo com UC-16)

## Estratégia Técnica
- **[Adicionar]** Script Plausible no `layout.tsx` usando `next/script` com `defer`
- **[Criar]** Função `trackEvent()` em `/src/lib/analytics.ts`
- **[Instrumentar]** 5 pontos principais do funil com `trackEvent()`
- **[Configurar]** Variável `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` em `.env.local`
- **[Criar conta]** Plausible.io e adicionar domínio `somoseopix.com.br`
- **[Validar]** Eventos chegando no dashboard Plausible em tempo real

## Critérios de Aceite (Given/When/Then)

```gherkin
GIVEN usuário acessa homepage
WHEN página carrega
THEN script Plausible é carregado de forma assíncrona
AND window.plausible está disponível
AND pageview é rastreado automaticamente

GIVEN usuário submete CPF/CNPJ
WHEN clica em "Consultar"
THEN evento "input_submitted" é disparado
AND props { document_type: "cpf" } é enviado

GIVEN usuário visualiza teaser
WHEN página /teaser carrega
THEN evento "teaser_viewed" é disparado
AND props { has_processes: true } é enviado

GIVEN usuário inicia checkout
WHEN página /checkout carrega
THEN evento "checkout_started" é disparado
AND props { amount: 39.90 } é enviado

GIVEN webhook Asaas confirma pagamento
WHEN evento PAYMENT_CONFIRMED é processado
THEN evento "payment_confirmed" é disparado
AND props { amount: 39.90, payment_method: "PIX" } é enviado

GIVEN usuário acessa relatório
WHEN página /relatorio/[id] carrega
THEN evento "report_accessed" é disparado
AND props { search_result_id: "sr_123" } é enviado

GIVEN desenvolvedor acessa dashboard Plausible
WHEN filtra por eventos customizados
THEN visualiza funil de conversão
AND métricas de cada etapa estão disponíveis
```

## Testes Obrigatórios
- [ ] Script Plausible carrega sem erros
- [ ] window.plausible está disponível após load
- [ ] Evento input_submitted dispara corretamente
- [ ] Evento teaser_viewed dispara corretamente
- [ ] Evento checkout_started dispara corretamente
- [ ] Evento payment_confirmed dispara corretamente
- [ ] Evento report_accessed dispara corretamente
- [ ] Eventos aparecem no dashboard Plausible

## Checklist DoR
- [x] Regras de negócio claras e sem ambiguidade
- [x] Eventos customizados especificados
- [x] Pontos de instrumentação mapeados
- [x] Critérios de aceite testáveis

## Checklist DoD
- [ ] Script Plausible adicionado em layout.tsx
- [ ] Função trackEvent implementada
- [ ] 5 eventos instrumentados (input, teaser, checkout, payment, report)
- [ ] Variável NEXT_PUBLIC_PLAUSIBLE_DOMAIN configurada
- [ ] Conta Plausible criada e domínio adicionado
- [ ] Eventos validados no dashboard Plausible
- [ ] Testes manuais passando
- [ ] Documentação atualizada (este arquivo)
- [ ] Lint + typecheck passando
- [ ] Build sem erros

## Evidências de Conclusão

```bash
# Build do projeto
npm run build
# → ✓ Compiled successfully
# → No errors

# Inspecionar no browser (Dev Tools Console)
# → window.plausible
# → ƒ plausible(event, options) { ... }

# Dashboard Plausible (https://plausible.io/somoseopix.com.br)
# → Pageviews: 150 (últimas 24h)
# → Custom Events:
#   - input_submitted: 80
#   - teaser_viewed: 75
#   - checkout_started: 45
#   - payment_confirmed: 12
#   - report_accessed: 10
# → Funil de conversão: 10/80 = 12.5% conversion rate

# Teste manual - Funil completo
# 1. Acessar homepage → pageview rastreado
# 2. Submeter CPF → input_submitted disparado
# 3. Ver teaser → teaser_viewed disparado
# 4. Ir para checkout → checkout_started disparado
# 5. Confirmar pagamento → payment_confirmed disparado (via webhook)
# 6. Acessar relatório → report_accessed disparado

# Validar no Plausible Real-time (https://plausible.io/somoseopix.com.br/realtime)
# → Todos os 5 eventos aparecem em tempo real ✓
```

## Arquivos a Criar/Modificar
- **Modificar**: `/src/app/layout.tsx` (adicionar Script Plausible)
- **Criar**: `/src/lib/analytics.ts` (função trackEvent)
- **Modificar**: `/src/app/page.tsx` (adicionar trackEvent)
- **Modificar**: `/src/app/teaser/page.tsx` (adicionar trackEvent)
- **Modificar**: `/src/app/checkout/page.tsx` (adicionar trackEvent)
- **Modificar**: `/src/app/api/webhooks/asaas/route.ts` (adicionar trackEvent)
- **Modificar**: `/src/app/relatorio/[id]/page.tsx` (adicionar trackEvent)
- **Criar**: `.env.local` (adicionar NEXT_PUBLIC_PLAUSIBLE_DOMAIN)
- **Commit**: `feat(uc-17): implementar analytics plausible (cookieless)`
- **Deploy**: Vercel (rebuild para incluir script)
