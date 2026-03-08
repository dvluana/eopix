# Landing Page Refactor — Design Document

**Data:** 2026-03-13
**Status:** Aprovado
**Branch:** develop

## Contexto

O `src/app/page.tsx` é um arquivo monolítico de 1066 linhas com 10 seções, zero componentização, inline styles repetidos, SVGs duplicados, e seções sem ilustrações. O refactor visa: componentizar, eliminar duplicações, polir visual mantendo a identidade (preto/amarelo/mono), e adicionar ilustrações SVG animadas.

## Escopo

- **Full refactor**: componentizar + visual + ilustrações
- **Identidade visual**: manter (preto, amarelo #FFD600, Zilla Slab + IBM Plex Mono)
- **Ilustrações novas/animadas**: hero collage, PRA QUEM É, PREVIEW, PREÇOS
- **Seções que ficam como estão (conteúdo)**: FAQ, DEPOIMENTOS, COMO FUNCIONA, TIMELINE

## Parte 1: Arquitetura de Componentes

### Estrutura de arquivos

```
src/components/landing/
├── Nav.tsx                  ← nav + hamburger + auth state
├── SearchBar.tsx            ← shared entre hero + CTA (elimina duplicação)
├── HeroSection.tsx          ← hero + collage SVGs animados
├── ImpactStrip.tsx          ← faixa amarela com 3 métricas
├── ForWhoSection.tsx        ← PRA QUEM É + nova ilustração
├── HowItWorksSection.tsx    ← COMO FUNCIONA (3 step cards animados)
├── ConsultaTimeline.tsx     ← O QUE CONSULTA (timeline vertical moderna)
├── PreviewSection.tsx       ← O QUE VOCÊ RECEBE (cards redesenhados)
├── TestimonialsSection.tsx  ← DEPOIMENTOS (expand/collapse)
├── PricingSection.tsx       ← PREÇOS + ilustrações
├── FaqSection.tsx           ← FAQ accordion (data como constante)
├── CtaSection.tsx           ← CTA final (reutiliza SearchBar)
└── illustrations/
    ├── HeroCollage.tsx      ← 4 SVGs flutuantes animados
    ├── StepIcons.tsx        ← 3 SVGs animados (search, radar, report)
    ├── CheckIcon.tsx        ← check-circle reutilizável
    ├── XIcon.tsx            ← x-circle reutilizável
    └── FeatureIcons.tsx     ← SVGs maiores/animados pro PREVIEW
```

### page.tsx resultante (~50 linhas)

```tsx
// Imports de seções
// State management mínimo (searchTerm, auth)
// Composição:
<Nav />
<HeroSection />
<ImpactStrip />
<ForWhoSection />
<HowItWorksSection />
<ConsultaTimeline />
<PreviewSection />
<TestimonialsSection />
<PricingSection />
<FaqSection />
<CtaSection />
<Footer />
```

## Parte 2: Eliminação de Duplicações

| Duplicação | Ocorrências | Solução |
|---|---|---|
| Search bar completo | hero + CTA final (2x ~30 linhas) | `<SearchBar />` componente shared |
| Check-circle SVG | 3x em PRA QUEM É | `<CheckIcon />` |
| X-circle SVG | 3x em PRA QUEM É | `<XIcon />` |
| Icon container 48x48 | 6x em PREVIEW (8 linhas cada) | CSS class `.feature-icon-box` |
| Callout "não acusa..." | 2x (CONSULTA + PREVIEW) | Remover duplicata do PREVIEW |
| CTA button "Fazer minha primeira consulta" | 4x | Componente ou helper |
| FAQ data array | Inline no render | Constante `FAQ_ITEMS` |

## Parte 3: Ilustrações & Animações

### Hero Collage (animar os 4 SVGs existentes)

1. **Contrato**: linhas se "escrevem" via `stroke-dashoffset` animado, highlight amarelo aparece, assinatura se desenha
2. **WhatsApp**: mensagem "digita" com clip-path reveal (igual step 1 do COMO FUNCIONA), ticks ✓✓ animam de cinza→azul
3. **Post-it**: emoji ⚠️ pulsa, nota tem subtle wobble/float
4. **ReclameAqui**: número conta de 0→2.1, barra "Não Recomendada" faz slide-in

Todos os 4 já têm class `float` com positioning absoluto — manter e adicionar SMIL/CSS animations.

### PRA QUEM É (novas ilustrações)

- Card "Grandes Empresas": SVG estilizado de prédio/desk corporativo (linhas finas, monocromático com accent amarelo)
- Card "MEI/Freelancer": SVG de laptop solo com post-its/caos ao redor (mesmo estilo)
- Tamanho: ~160x100px, mesmo vocabulário visual dos step cards

### PREVIEW — O Que Você Recebe (redesenhar)

Trocar ícones genéricos 24x24 por ilustrações maiores (~80x100px) no estilo das ilustras do COMO FUNCIONA:

1. **Dados cadastrais**: mini-documento com campos preenchendo (animado)
2. **Processos judiciais**: martelo/balança estilizado com batida
3. **Reclame Aqui**: card de review com estrelas aparecendo
4. **Notícias**: jornal com manchetes aparecendo
5. **Resumo inteligente**: cérebro/circuito com pulso
6. **Indicador de clima**: sol/nuvem com transição animada

### PREÇOS (novas ilustrações)

- Card featured (R$29,90): SVG escudo/selo com badge "SOL" pulsante
- Cards laterais ("Em breve"): SVG de pacote/caixa com fita amarela

### Scroll Animations

- CSS `animation-timeline: view()` para fade-in de seções (Chrome 115+, fallback: elementos já visíveis)
- Staggered reveals nos grids de cards (animation-delay progressivo)

## Parte 4: Polimento CSS

### Inline styles → Classes

Migrar TODOS os `style={{}}` para classes CSS em `components.css`:
- Nav auth links (lines 180-220)
- PRA QUEM É callout (line 413)
- Icon containers PREVIEW (6x)
- Depoimentos gradient overlay
- CTA containers
- Section-specific overrides

### Novas classes CSS

```css
.feature-icon-box        /* substitui os 6 inline icon containers */
.cta-container           /* substitui os divs com textAlign center */
.callout--centered       /* substitui inline margin auto */
```

### Hover enhancements

- Cards do PREVIEW: lift + glow sutil + border-color transition
- Cards de depoimentos: subtle tilt
- Pricing cards: shadow expansion

## Ordem de Implementação Sugerida

1. **Componentizar** — extrair componentes sem mudar visual (safe refactor)
2. **Eliminar duplicações** — SearchBar, icons, callouts
3. **Migrar inline styles** — para classes CSS
4. **Animar hero collage** — SMIL animations nos 4 SVGs
5. **Criar ilustrações PRA QUEM É** — 2 novos SVGs
6. **Redesenhar PREVIEW** — 6 novos SVGs animados
7. **Adicionar ilustrações PREÇOS** — 2 novos SVGs
8. **Scroll animations** — CSS animation-timeline
9. **QA visual** — verificar todos os breakpoints, testar animações

## Constraints

- Manter CSS puro (sem Tailwind migration)
- SVGs inline (sem arquivos externos) para manter o padrão atual
- SMIL + CSS animations only (sem framer-motion/GSAP)
- Design tokens existentes em `tokens.css` (não criar novos sem necessidade)
- Não alterar conteúdo textual
- Não alterar funcionalidade (search, auth, routing)
