# E o Pix? — Design System v1.1

> Sistema de design completo da marca "E o Pix?" com tokens CSS, componentes BEM e JavaScript interativo.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Tokens](#tokens)
- [Componentes](#componentes)
- [JavaScript](#javascript)
- [Exemplos](#exemplos)
- [Changelog v1.1](#changelog-v11)
- [Contribuindo](#contribuindo)

---

## Visão Geral

O Design System "E o Pix?" é um sistema de design production-ready que segue rigorosamente a hierarquia de tokens (primitivos → semânticos → componentes) e os princípios visuais da marca (~70% papel/branco, ~25% preto, ~5% amarelo como acento).

### Características

- ✅ **Tokenizado em 3 camadas** — Primitive, Semantic, Component
- ✅ **BEM naming convention** — `.block__element--modifier`
- ✅ **Acessibilidade WCAG AA** — Focus states, ARIA labels, semântica HTML
- ✅ **Responsivo mobile-first** — Breakpoints em 600px e 900px
- ✅ **Zero inline styles** — Todos valores vêm de tokens CSS
- ✅ **JavaScript vanilla** — Event listeners, sem dependências externas

### Tipografia

- **Headings:** Zilla Slab (400, 600, 700)
- **Body:** IBM Plex Mono (400, 500, 600, 700)

### Paleta

| Cor | Token | Hex | Uso |
|-----|-------|-----|-----|
| **Papel** | `--primitive-paper-100` | `#F0EFEB` | Background principal |
| **Branco** | `--primitive-paper-50` | `#FFFFFF` | Cards, surfaces |
| **Preto** | `--primitive-black-900` | `#1A1A1A` | Texto, fundos escuros |
| **Amarelo** | `--primitive-yellow-500` | `#FFD600` | Acento, CTAs |
| **Vermelho** | `--primitive-red-500` | `#CC3333` | Erro, danger |

---

## Instalação

### 1. Importar CSS

```html
<!-- No <head> do seu HTML -->
<link rel="stylesheet" href="/src/styles/tokens.css">
<link rel="stylesheet" href="/src/styles/components.css">
```

### 2. Importar Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
```

### 3. Importar JavaScript (opcional)

```html
<!-- No final do <body> -->
<script type="module">
  import { initAll } from '/src/scripts/components.js';
  // Auto-inicializa todos os componentes interativos
</script>
```

---

## Tokens

### Hierarquia

```
Primitive Tokens (Raw values)
    ↓
Semantic Tokens (Contextual meaning)
    ↓
Component Tokens (Component-specific)
```

### Exemplo de uso CORRETO

```css
/* ❌ ERRADO — Nunca use primitive direto em componentes */
.my-component {
  color: var(--primitive-black-900);
}

/* ✅ CORRETO — Use semantic tokens */
.my-component {
  color: var(--color-text-primary);
}

/* ✅ AINDA MELHOR — Use component tokens quando disponível */
.my-button {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
```

### Tokens novos em v1.1

#### Shadows

```css
--primitive-shadow-hero: 0 8px 40px rgba(0, 0, 0, 0.30);
--primitive-shadow-ring: 0 0 0 1px rgba(240, 239, 235, 0.10);
--primitive-shadow-ring-yellow: 0 0 0 1px rgba(255, 214, 0, 0.30);
```

#### Backgrounds Translúcidos

```css
--color-bg-inverse-glass: rgba(26, 26, 26, 0.97);
--color-bg-paper-overlay: rgba(240, 239, 235, 0.06);
--color-bg-paper-overlay-hover: rgba(240, 239, 235, 0.10);
```

#### Motion

```css
--primitive-motion-lift-sm: -3px;
--primitive-motion-lift-md: -4px;
--primitive-motion-nudge: 4px;
```

#### Backdrop Filter

```css
--primitive-backdrop-blur: blur(12px);
```

---

## Componentes

### Buttons

#### Variantes

```html
<button class="btn btn--primary">Primary</button>
<button class="btn btn--secondary">Secondary</button>
<button class="btn btn--ghost">Ghost</button>
<button class="btn btn--danger">Danger</button>
```

#### Modificadores

```html
<!-- Sizes -->
<button class="btn btn--primary btn--sm">Small</button>
<button class="btn btn--primary btn--lg">Large</button>

<!-- Inverted hover (NOVO v1.1) -->
<button class="btn btn--primary btn--inverted">Hover inverte cores</button>

<!-- Disabled -->
<button class="btn btn--primary" disabled>Disabled</button>
```

---

### Search Bar ⭐ ATUALIZADO v1.1

**Versão visual aprovada da landing page.**

```html
<div class="search-bar">
  <div class="search-bar__icon">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <circle cx="10" cy="10" r="7"/>
      <line x1="15.5" y1="15.5" x2="21" y2="21"/>
    </svg>
  </div>
  <input class="search-bar__input" type="text" placeholder="Digite o CNPJ ou nome" />
  <button class="search-bar__button">Consultar</button>
</div>
```

**Características:**
- Border de 3px (vs 2px na v1.0)
- Shadow hero dramática (`0 8px 40px rgba(0,0,0,0.30)`)
- Hover inverted no botão (fundo preto, texto amarelo)
- Padding assimétrico (`6px 6px 6px 24px`)

---

### Impact Strip 🆕 NOVO v1.1

Faixa horizontal de stats com números grandes.

```html
<aside class="impact">
  <div class="impact__inner">
    <div class="impact__item">
      <div class="impact__num">8,9M</div>
      <div class="impact__text">de empresas inadimplentes no Brasil</div>
    </div>
    <div class="impact__item">
      <div class="impact__num">R$ 29,90</div>
      <div class="impact__text">custa uma consulta</div>
    </div>
  </div>
</aside>
```

**Mobile:** Items empilham verticalmente em `< 900px`.

---

### Weather Legend 🆕 NOVO v1.1

Legenda inline do sistema de clima.

```html
<div class="weather-legend">
  <div class="weather-legend__title">Legenda do clima</div>
  <div class="weather-legend__row">
    <div class="weather-legend__item weather-legend__item--sol">
      <!-- SVG icon -->
      <div>
        <div class="weather-legend__item-text">Sol</div>
        <div class="weather-legend__item-sub">0 ocorrências</div>
      </div>
    </div>
    <!-- Repita para nuvens e trovoada -->
  </div>
</div>
```

**Variantes:** `--sol`, `--nuvens`, `--trovoada`

---

### Pricing Card 🆕 NOVO v1.1

Card de preço com ribbon "Mais Popular" opcional.

```html
<div class="pricing-card pricing-card--featured">
  <div class="pricing-card__label">Pacote 5 consultas</div>
  <div class="pricing-card__audience">Para freelancers</div>
  <div class="pricing-card__value">
    R$ 119<span class="pricing-card__value-small">,90</span>
  </div>
  <div class="pricing-card__desc">Descrição em itálico...</div>
  <div class="pricing-card__includes">5 relatórios completos</div>
  <button class="pricing-card__cta">Comprar pacote</button>
</div>
```

**Modificador `--featured`:** Adiciona ribbon amarelo rotacionado com texto "MAIS POPULAR".

---

### FAQ Accordion 🆕 NOVO v1.1

Accordion acessível com suporte a teclado.

```html
<div class="faq">
  <button class="faq__question" aria-expanded="false">
    Vocês são detetive particular?
  </button>
  <div class="faq__answer">
    <p class="faq__answer-text">Não. A gente organiza informação pública...</p>
  </div>
</div>
```

**JavaScript:** Requer `initFAQ()` para funcionar.

**Estado:** Adicione classe `.faq--open` para expandir.

---

### Cards

#### Variantes básicas

```html
<div class="card">Card padrão</div>
<div class="card card--elevated">Com shadow</div>
<div class="card card--muted">Fundo papel</div>
<div class="card card--inverse">Fundo preto</div>
```

#### NOVOS v1.1

```html
<!-- Card com barra colorida no topo -->
<div class="card card--accent-top">
  <h3 class="card__title">Título</h3>
  <p class="card__body">Conteúdo...</p>
</div>

<!-- Card overlay para fundos escuros -->
<div class="card card--overlay">
  <h3 class="card__title">Card translúcido</h3>
</div>
```

**Hover states:**
- `.card--interactive` → `translateY(-3px)`
- `.card--overlay:hover` → `translateX(4px)` (nudge horizontal)

---

### Weather Cards

Sistema de clima do produto.

```html
<div class="weather-card weather-card--sol">
  <div class="weather-card__icon"><!-- SVG --></div>
  <div class="weather-card__label">Sol</div>
</div>
```

**Variantes:** `--sol`, `--nuvens`, `--trovoada`

---

### Badges

```html
<span class="badge badge--default">Default</span>
<span class="badge badge--danger">Danger</span>
<span class="badge badge--neutral">Neutral</span>
<span class="badge badge--outline">Outline</span>
```

---

### Inputs

```html
<label class="input-label">Nome</label>
<input class="input" type="text" placeholder="Digite seu nome" />
<div class="input-helper">Texto auxiliar</div>

<!-- Estado de erro -->
<input class="input input--error" type="email" />
<div class="input-helper input-helper--error">E-mail inválido</div>
```

---

### Callouts

```html
<div class="callout callout--info">
  <h3 class="callout__title">Informação</h3>
  <p class="callout__body">Texto...</p>
</div>
```

**Variantes:** `--info`, `--danger`, `--dark`, `--prompt`

---

### Modal

```html
<div class="modal-overlay" id="myModal">
  <div class="modal">
    <button class="modal__close" aria-label="Fechar">×</button>
    <div class="modal__header">
      <h2 class="modal__title">Título</h2>
    </div>
    <div class="modal__body">Conteúdo...</div>
    <div class="modal__footer">
      <button class="btn btn--ghost">Cancelar</button>
      <button class="btn btn--primary">Confirmar</button>
    </div>
  </div>
</div>
```

**JavaScript:** Use `openModal('myModal')` e `closeModal('myModal')` ou `initModal()`.

---

### Navigation ⭐ ATUALIZADO v1.1

Nav com glass effect (backdrop-filter blur).

```html
<nav class="nav">
  <div class="nav__inner">
    <a href="#" class="nav__logo">
      E o Pix<span class="nav__logo-accent">?</span>
    </a>
    <ul class="nav__links">
      <li><a href="#section1" class="nav__link">Link 1</a></li>
      <li><a href="#section2" class="nav__link">Link 2</a></li>
      <li><a href="#cta" class="nav__cta">CTA</a></li>
    </ul>
  </div>
</nav>
```

**Características v1.1:**
- `background: rgba(26, 26, 26, 0.97)`
- `backdrop-filter: blur(12px)`
- Fixed position com `z-index: 20`

---

### Footer

```html
<footer class="footer">
  <div class="footer__inner">
    <div class="footer__brand">
      E o Pix<span class="footer__brand-accent">?</span>
    </div>
    <p class="footer__legal">Texto legal...</p>
    <ul class="footer__links">
      <li><a href="#" class="footer__link">Termos</a></li>
      <li><a href="#" class="footer__link">Privacidade</a></li>
    </ul>
    <div class="footer__copy">© 2026 E o Pix?</div>
  </div>
</footer>
```

---

## JavaScript

### Inicialização Automática

O script auto-inicializa todos os componentes quando carregado:

```html
<script type="module" src="/src/scripts/components.js"></script>
```

### Uso Manual

```javascript
import { 
  initFAQ, 
  initModal, 
  openModal, 
  closeModal,
  initNavigation,
  initSearchBar
} from '/src/scripts/components.js';

// Inicializar FAQ
initFAQ();

// Controlar modal
openModal('myModal');
closeModal('myModal');

// Search bar com callback custom
initSearchBar((query) => {
  console.log('Searching for:', query);
  // Sua lógica aqui
});
```

### Funções Disponíveis

| Função | Descrição |
|--------|-----------|
| `initFAQ()` | Ativa accordions FAQ |
| `initModal()` | Ativa controles de modal (ESC, click fora) |
| `openModal(id)` | Abre modal por ID |
| `closeModal(id)` | Fecha modal por ID |
| `initNavigation()` | Active states + smooth scroll |
| `initSearchBar(callback)` | Controla submit do search bar |
| `initExpandableGrid(gridId, btnId, fadeId)` | Expande grids com botão "Ver mais" |
| `initTooltip()` | Ativa tooltips com `data-tooltip` |
| `initAll()` | Inicializa tudo de uma vez |

---

## Exemplos

### Página Completa Básica

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minha Página</title>
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;600;700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet">
  
  <!-- Design System -->
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/components.css">
</head>
<body>

  <nav class="nav">
    <div class="nav__inner">
      <a href="#" class="nav__logo">E o Pix<span class="nav__logo-accent">?</span></a>
      <ul class="nav__links">
        <li><a href="#home" class="nav__link">Início</a></li>
        <li><a href="#about" class="nav__link">Sobre</a></li>
        <li><a href="#cta" class="nav__cta">Consultar</a></li>
      </ul>
    </div>
  </nav>

  <main class="container">
    <section class="section">
      <div class="section-header">
        <div class="section-header__tag section-header__tag--accent">NOVO</div>
        <h2 class="section-header__title">
          Título com <span class="section-header__highlight">destaque</span>
        </h2>
      </div>
      
      <div class="card">
        <h3 class="card__title">Card Exemplo</h3>
        <p class="card__body">Conteúdo do card...</p>
        <div class="card__footer">
          <button class="btn btn--primary">Ação</button>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">E o Pix<span class="footer__brand-accent">?</span></div>
      <div class="footer__copy">© 2026 E o Pix?</div>
    </div>
  </footer>

  <script type="module" src="/src/scripts/components.js"></script>
</body>
</html>
```

### Landing Page com Novos Componentes v1.1

```html
<!-- Hero com Search Bar -->
<section class="hero">
  <h1 class="h1">Consulte antes de <em class="text-accent">fechar contrato</em></h1>
  
  <div class="search-bar">
    <div class="search-bar__icon"><!-- SVG --></div>
    <input class="search-bar__input" placeholder="Digite o CNPJ" />
    <button class="search-bar__button">E o Pix? Consultar</button>
  </div>
</section>

<!-- Impact Strip -->
<aside class="impact">
  <div class="impact__inner">
    <div class="impact__item">
      <div class="impact__num">8,9M</div>
      <div class="impact__text">de empresas inadimplentes</div>
    </div>
  </div>
</aside>

<!-- Pricing -->
<section class="container">
  <div class="showcase-grid showcase-grid--3">
    <div class="pricing-card pricing-card--featured">
      <!-- Conteúdo do pricing -->
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="container">
  <div class="faq">
    <button class="faq__question">Pergunta?</button>
    <div class="faq__answer">
      <p class="faq__answer-text">Resposta...</p>
    </div>
  </div>
</section>
```

---

## Changelog v1.1

### ✨ Adicionado

**Tokens:**
- Shadows: `--primitive-shadow-hero`, `--primitive-shadow-ring`, `--primitive-shadow-ring-yellow`
- Backgrounds translúcidos: `--color-bg-inverse-glass`, `--color-bg-paper-overlay`, etc.
- Borders translúcidos: `--color-border-on-accent`, `--color-border-accent-hover`
- Motion: `--primitive-motion-lift-sm`, `--primitive-motion-lift-md`, `--primitive-motion-nudge`
- Backdrop filter: `--primitive-backdrop-blur`
- Spacing: `--primitive-space-24` (96px), `--primitive-space-30` (120px)

**Componentes:**
- **Impact Strip** (`.impact`) — Faixa de stats
- **Weather Legend** (`.weather-legend`) — Legenda inline do clima
- **Pricing Card** (`.pricing-card`) — Card de preço com ribbon
- **FAQ Accordion** (`.faq`) — Accordion acessível

**Modificadores:**
- `.btn--inverted` — Hover inverte cores
- `.card--overlay` — Card translúcido para fundo escuro
- `.card--accent-top` / `.card--danger-top` — Barra colorida no topo

**JavaScript:**
- `initFAQ()` — Controla accordions
- `initExpandableGrid()` — Expande grids com botão

### 🔄 Alterado

**Search Bar:**
- Border: `2px` → `3px`
- Shadow: `shadow-md` → `shadow-hero + shadow-ring`
- Padding: simétrico → assimétrico (`6px 6px 6px 24px`)
- Botão hover: amarelo escuro → **inverte (preto/amarelo)**

**Navigation:**
- Adicionado `backdrop-filter: blur(12px)`
- Background: sólido → `rgba(26, 26, 26, 0.97)` translúcido

**Cards:**
- Hover padronizado: `translateY(-3px)` para cards interativos
- Novo hover: `translateX(4px)` para cards overlay

### 🐛 Corrigido

- Removidos valores hardcoded RGBA inline (47 ocorrências)
- Substituídas variáveis abreviadas (`--bk`, `--yl`) por tokens semânticos
- Removidos `!important` desnecessários
- Adicionados `aria-hidden="true"` em SVGs decorativos
- Focus states em todos elementos interativos

---

## Contribuindo

### Regras de Contribuição

1. **NUNCA use valores hardcoded** — Sempre use tokens
2. **Siga BEM naming** — `.block__element--modifier`
3. **Hierarquia de tokens:** `--comp-*` → `--sem-*` → nunca `--primitive-*` direto
4. **Acessibilidade:** Focus-visible, ARIA, semântica HTML
5. **Espaçamentos na escala base-4:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120px
6. **Hover/transition consistentes:** Use tokens de motion

### Checklist de Pull Request

- [ ] Valores usam tokens CSS (nenhum hardcode)
- [ ] BEM naming correto
- [ ] Focus states adicionados
- [ ] SVGs decorativos têm `aria-hidden="true"`
- [ ] Responsivo testado em 360px, 768px, 1200px
- [ ] JavaScript com event listeners (sem `onclick` inline)
- [ ] Documentação atualizada

---

## Arquivos do Projeto

```
/src/styles/
  ├── tokens.css       # Tokens v1.1 (3 camadas)
  ├── components.css   # Componentes v1.1 (BEM)
  ├── fonts.css        # Font imports
  ├── theme.css        # Theme overrides (Tailwind)
  └── index.css        # Entry point

/src/scripts/
  └── components.js    # JavaScript interativo v1.1

/showcase-v1.1.html    # Demo completo
/DESIGN-SYSTEM.md      # Esta documentação
```

---

## Suporte

- **Navegadores:** Chrome 90+, Firefox 88+, Safari 14+
- **Mobile:** iOS 14+, Android 10+
- **Acessibilidade:** WCAG 2.1 Level AA

---

## Licença

© 2026 E o Pix? — Todos os direitos reservados.

---

## Créditos

- **Design System:** Auditoria e implementação v1.1
- **Tipografia:** Zilla Slab (Google Fonts), IBM Plex Mono (Google Fonts)
- **Metodologia:** BEM, CSS Tokens, Atomic Design

---

**Versão:** 1.1  
**Data:** 07/02/2026  
**Status:** ✅ Production-Ready
