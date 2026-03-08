# Landing Page Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Componentize the monolithic 1066-line `page.tsx`, eliminate duplications, migrate inline styles to CSS classes, add animated SVG illustrations, and add scroll animations — while keeping the existing visual identity (black/yellow/mono).

**Architecture:** Extract 12 components from the monolithic page into `src/components/landing/`. Shared UI (SearchBar, CheckIcon, XIcon) eliminates 6 duplications. New animated SVG illustrations in `src/components/landing/illustrations/`. CSS-only animations (SMIL + CSS keyframes + `animation-timeline: view()`).

**Tech Stack:** Next.js 14 App Router, React, CSS custom properties (tokens.css), SMIL SVG animations, CSS keyframes

---

## Task 1: Create SearchBar shared component

**Files:**
- Create: `src/components/landing/SearchBar.tsx`

**Step 1: Create the SearchBar component**

Extract the search bar JSX that appears at lines 279-315 (hero) and 1014-1050 (CTA final). They share the same state: `searchTerm`, `hasError`, `searchError`, `placeholderText`, `isValidating`, `handleInputChange`, `handleSearch`, `getButtonText`.

```tsx
// src/components/landing/SearchBar.tsx
"use client"

import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
  style?: React.CSSProperties;
}

export default function SearchBar({
  searchTerm,
  placeholderText,
  hasError,
  searchError,
  isValidating,
  onInputChange,
  onSearch,
  buttonText,
  style,
}: SearchBarProps) {
  return (
    <>
      <div className={`search-bar ${hasError ? 'search-bar--error' : ''}`} role="search" style={style}>
        <div className="search-bar__icon" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="7"/>
            <line x1="15.5" y1="15.5" x2="21" y2="21"/>
          </svg>
        </div>
        <input
          className="search-bar__input"
          type="text"
          placeholder={placeholderText}
          aria-label="Consultar CNPJ ou nome da empresa"
          value={searchTerm}
          onChange={onInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
        />
        <button
          className="search-bar__button"
          type="submit"
          onClick={onSearch}
          disabled={isValidating}
        >
          {buttonText}
        </button>
      </div>
      {searchError && (
        <p className="caption text-danger mt-3" style={{ textAlign: 'center' }}>
          {searchError}
        </p>
      )}
    </>
  );
}
```

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/landing/SearchBar.tsx
git commit -m "feat(landing): extract SearchBar shared component"
```

---

## Task 2: Create CheckIcon and XIcon shared components

**Files:**
- Create: `src/components/landing/illustrations/CheckIcon.tsx`
- Create: `src/components/landing/illustrations/XIcon.tsx`

**Step 1: Create CheckIcon**

The check-circle SVG appears 3x in PRA QUEM É (lines 361-364, 368-371, 375-378). Extract into a reusable component.

```tsx
// src/components/landing/illustrations/CheckIcon.tsx
export default function CheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size}>
      <circle cx="10" cy="10" r="8" fill="#FFFDE6" stroke="#FFD600" strokeWidth="1.5"/>
      <polyline points="6,10 9,13 14,7" fill="none" stroke="#1A1A1A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
```

**Step 2: Create XIcon**

The x-circle SVG appears 3x in PRA QUEM É (lines 389-393, 397-401, 405-409).

```tsx
// src/components/landing/illustrations/XIcon.tsx
export default function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size}>
      <circle cx="10" cy="10" r="8" fill="#FFF0F0" stroke="#CC3333" strokeWidth="1.5"/>
      <line x1="6" y1="6" x2="14" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="14" y1="6" x2="6" y2="14" stroke="#CC3333" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
```

**Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/landing/illustrations/
git commit -m "feat(landing): extract CheckIcon and XIcon shared SVG components"
```

---

## Task 3: Extract Nav component

**Files:**
- Create: `src/components/landing/Nav.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create Nav component**

Extract lines 156-224 from page.tsx. Nav needs `userEmail`, `mobileMenuOpen`, `setMobileMenuOpen`, `closeMobileMenu`, and a `scrollToHero` callback.

```tsx
// src/components/landing/Nav.tsx
"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';

interface NavProps {
  userEmail: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Nav({ userEmail, mobileMenuOpen, setMobileMenuOpen }: NavProps) {
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="nav" aria-label="Menu principal">
      <div className="nav__inner">
        <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
          <LogoFundoPreto />
        </Link>

        <button
          className="nav__hamburger"
          aria-label="Abrir menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
          <span className={`nav__hamburger-line ${mobileMenuOpen ? 'nav__hamburger-line--open' : ''}`}></span>
        </button>

        <ul className={`nav__links ${mobileMenuOpen ? 'nav__links--open' : ''}`} role="navigation">
          <li><a href="#como-funciona" className="nav__link" onClick={closeMobileMenu}>Como funciona</a></li>
          <li><a href="#consulta" className="nav__link" onClick={closeMobileMenu}>O que consulta</a></li>
          <li><a href="#precos" className="nav__link" onClick={closeMobileMenu}>Preços</a></li>
          <li><a href="#faq" className="nav__link" onClick={closeMobileMenu}>FAQ</a></li>
          {userEmail ? (
            <li className="nav__auth-logged">
              <span className="nav__user-email">{userEmail}</span>
              <Link href="/minhas-consultas" onClick={closeMobileMenu} className="nav__auth-btn">
                Minhas Consultas
              </Link>
            </li>
          ) : (
            <li>
              <Link href="/minhas-consultas" className="nav__link nav__auth-btn-guest" onClick={closeMobileMenu}>
                Entrar
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
```

**Step 2: Add CSS classes to replace inline styles**

Add to `src/styles/components.css` (after the existing nav section):

```css
.nav__auth-logged {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nav__user-email {
  font-family: var(--font-family-body);
  font-size: 12px;
  color: var(--color-text-muted);
}

.nav__auth-btn {
  border: 1px solid var(--color-text-muted);
  padding: 6px 12px;
  border-radius: 4px;
  color: var(--color-text-muted);
  font-family: var(--font-family-body);
  font-size: 12px;
  text-decoration: none;
}

.nav__auth-btn-guest {
  border: 1px solid #888888;
  padding: 8px 16px;
  border-radius: 6px;
}
```

**Step 3: Replace Nav in page.tsx**

Replace lines 156-224 with:
```tsx
<Nav userEmail={userEmail} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
```

Add import:
```tsx
import Nav from '@/components/landing/Nav';
```

**Step 4: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 5: Commit**

```bash
git add src/components/landing/Nav.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract Nav component, migrate inline styles to CSS"
```

---

## Task 4: Extract HeroSection component

**Files:**
- Create: `src/components/landing/HeroSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create HeroSection**

Extract lines 230-321 (hero section with collage SVGs + search bar). HeroSection receives search-related props and renders `<SearchBar />`.

```tsx
// src/components/landing/HeroSection.tsx
"use client"

import React from 'react';
import SearchBar from './SearchBar';

interface HeroSectionProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function HeroSection(props: HeroSectionProps) {
  return (
    <section className="hero hero--landing" id="hero" aria-label="Consulta comercial de empresas e pessoas">
      {/* Collage background elements */}
      <div className="hero-collage">
        {/* Contract doc */}
        <svg className="float hero-collage__contract" width="140" height="160" viewBox="0 0 140 160" xmlns="http://www.w3.org/2000/svg">
          {/* ... exact same SVG content from lines 235-244 ... */}
        </svg>
        {/* WhatsApp bubble */}
        <svg className="float hero-collage__whatsapp" width="180" height="60" viewBox="0 0 180 60" xmlns="http://www.w3.org/2000/svg">
          {/* ... exact same SVG content from lines 247-251 ... */}
        </svg>
        {/* Post-it */}
        <svg className="float hero-collage__postit" width="80" height="70" viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg">
          {/* ... exact same SVG content from lines 254-258 ... */}
        </svg>
        {/* Reclame Aqui snippet */}
        <svg className="float hero-collage__reclame" width="140" height="80" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
          {/* ... exact same SVG content from lines 261-267 ... */}
        </svg>
      </div>

      <div className="hero-content">
        <div className="section-header__tag section-header__tag--accent">Consulta comercial sob demanda</div>
        <h1 className="display-xl text-inverse mb-4">
          Pesquise qualquer empresa ou pessoa antes de <em className="text-accent-em">fechar contrato</em>.
        </h1>
        <p className="body text-inverse-muted mb-8 max-w-narrow">
          Processos, dívidas, reclamações e notícias, tudo cruzado por IA num único relatório. Digita o CPF ou CNPJ e descobre em minutos.
        </p>

        <SearchBar {...props} />

        <p className="caption text-inverse-subtle mt-4 italic">
          O que o Google não te mostra, a gente cruza, resume e entrega.
        </p>
      </div>
    </section>
  );
}
```

Note: When implementing, copy the FULL SVG content from the original — the snippet above abbreviates with comments for brevity. The actual implementation MUST include every SVG element verbatim.

**Step 2: Replace in page.tsx**

Replace the entire hero section (lines 230-321) with:
```tsx
<HeroSection
  searchTerm={searchTerm}
  placeholderText={placeholderText}
  hasError={hasError}
  searchError={searchError}
  isValidating={isValidating}
  onInputChange={handleInputChange}
  onSearch={handleSearch}
  buttonText={getButtonText()}
/>
```

Add import.

**Step 3: Verify**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 4: Visual check**

Run dev server, verify hero renders identically.

**Step 5: Commit**

```bash
git add src/components/landing/HeroSection.tsx src/app/page.tsx
git commit -m "refactor(landing): extract HeroSection component"
```

---

## Task 5: Extract ImpactStrip component

**Files:**
- Create: `src/components/landing/ImpactStrip.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create ImpactStrip**

Extract lines 326-341. This is a pure presentational component with no props.

```tsx
// src/components/landing/ImpactStrip.tsx
export default function ImpactStrip() {
  return (
    <aside className="impact" aria-label="Dados de impacto">
      <div className="impact__inner">
        <div className="impact__item">
          <div className="impact__num">8,9M</div>
          <p className="impact__text">de empresas inadimplentes no Brasil. A sua próxima parceria é uma delas?</p>
        </div>
        <div className="impact__item">
          <div className="impact__num">R$ 29,90</div>
          <p className="impact__text">custa uma consulta. Um processo custa quanto mesmo?</p>
        </div>
        <div className="impact__item">
          <div className="impact__num">3 min</div>
          <p className="impact__text">pra consultar. 3 anos pra se arrepender.</p>
        </div>
      </div>
    </aside>
  );
}
```

**Step 2: Replace in page.tsx and verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/landing/ImpactStrip.tsx src/app/page.tsx
git commit -m "refactor(landing): extract ImpactStrip component"
```

---

## Task 6: Extract ForWhoSection component (with CheckIcon/XIcon)

**Files:**
- Create: `src/components/landing/ForWhoSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create ForWhoSection**

Extract lines 346-431. Use `<CheckIcon />` and `<XIcon />` instead of the duplicated SVGs. Migrate the inline style on the callout (line 419) and the MEI footer paragraph (line 413) to CSS classes.

```tsx
// src/components/landing/ForWhoSection.tsx
import CheckIcon from './illustrations/CheckIcon';
import XIcon from './illustrations/XIcon';

interface ForWhoSectionProps {
  onCtaClick: () => void;
}

export default function ForWhoSection({ onCtaClick }: ForWhoSectionProps) {
  return (
    <section className="section section--primary" id="pra-quem">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">PRA QUEM É</div>
          <h2 className="section-header__title">
            Quem mais toma calote é quem menos tem <span className="section-header__highlight">defesa</span>.
          </h2>
        </div>

        <div className="grid-2">
          <div className="card card--accent-top">
            <h3 className="card__title">Grandes Empresas</h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex align-center gap-3 caption"><CheckIcon /> Serasa Experian</div>
              <div className="flex align-center gap-3 caption"><CheckIcon /> Equipes de Compliance</div>
              <div className="flex align-center gap-3 caption"><CheckIcon /> Software de R$ 500/mês</div>
            </div>
          </div>

          <div className="card card--danger-top">
            <h3 className="card__title">MEI / Freelancer</h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex align-center gap-3 caption text-danger"><XIcon /> &quot;Confia&quot;</div>
              <div className="flex align-center gap-3 caption text-danger"><XIcon /> Esperança</div>
              <div className="flex align-center gap-3 caption text-danger"><XIcon /> Zero Ferramentas</div>
            </div>
            <p className="card-footer-divider caption">
              Agora tem. Uma IA que pesquisa por você em 5 bases públicas por R$ 29,90.
            </p>
          </div>
        </div>

        <div className="callout callout--info callout--centered">
          <p className="callout__body">
            &quot;Para comprar carro usado, existe histórico veicular. Para fechar contrato de serviço, só existe a sorte.&quot;
          </p>
        </div>

        <div className="cta-container">
          <button className="btn btn--primary btn--lg" onClick={onCtaClick}>
            Consultar agora
          </button>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add `.callout--centered` to components.css**

```css
.callout--centered {
  max-width: 840px;
  margin: var(--primitive-space-6) auto 0;
}
```

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/ForWhoSection.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract ForWhoSection, use CheckIcon/XIcon, migrate inline styles"
```

---

## Task 7: Extract HowItWorksSection component

**Files:**
- Create: `src/components/landing/HowItWorksSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create HowItWorksSection**

Extract lines 436-566. Contains the 3 animated step cards (already animated from previous session). Migrate the inline CTA container style (line 560) to the existing `.cta-container` class.

```tsx
// src/components/landing/HowItWorksSection.tsx
interface HowItWorksSectionProps {
  onCtaClick: () => void;
}

export default function HowItWorksSection({ onCtaClick }: HowItWorksSectionProps) {
  return (
    <section className="section section--secondary" id="como-funciona">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">COMO FUNCIONA</div>
          <h2 className="section-header__title">
            Simples assim. Difícil é explicar pro contador o calote que você <span className="section-header__highlight">levou</span>.
          </h2>
        </div>

        <div className="steps-grid">
          {/* Step 1 — search bar animation (copy full SVG from lines 449-478) */}
          <div className="step">
            <div className="step__icon">
              {/* FULL SVG here — implementer must copy verbatim from page.tsx lines 449-478 */}
            </div>
            <div className="step__num">Passo 1</div>
            <div className="step__title">Digita o nome ou CNPJ</div>
            <p className="step__desc">Sem cadastro. Sem login. Só digitar e clicar.</p>
          </div>

          {/* Step 2 — radar animation (copy full SVG from lines 488-514) */}
          <div className="step">
            <div className="step__icon">
              {/* FULL SVG here — implementer must copy verbatim from page.tsx lines 488-514 */}
            </div>
            <div className="step__num">Passo 2</div>
            <div className="step__title">A gente busca nas fontes públicas</div>
            <p className="step__desc">Cruzamos várias bases de dados públicas. Receita Federal, tribunais, Reclame Aqui, notícias, tudo consultado e cruzado automaticamente. Sem você abrir uma aba sequer.</p>
          </div>

          {/* Step 3 — report animation (copy full SVG from lines 524-552) */}
          <div className="step">
            <div className="step__icon">
              {/* FULL SVG here — implementer must copy verbatim from page.tsx lines 524-552 */}
            </div>
            <div className="step__num">Passo 3</div>
            <div className="step__title">Você recebe o relatório completo</div>
            <p className="step__desc">Tudo numa tela: dados cadastrais, processos, reclamações, notícias, cruzados pelo nosso motor de consulta e resumidos com inteligência artificial.</p>
          </div>
        </div>

        <div className="cta-container">
          <button className="btn btn--primary btn--lg" onClick={onCtaClick}>
            Fazer minha primeira consulta
          </button>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/HowItWorksSection.tsx src/app/page.tsx
git commit -m "refactor(landing): extract HowItWorksSection component"
```

---

## Task 8: Extract ConsultaTimeline component

**Files:**
- Create: `src/components/landing/ConsultaTimeline.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create ConsultaTimeline**

Extract lines 571-628. The timeline CSS was already refactored in the previous session. Migrate inline styles on callout (line 616) and CTA div (line 622) to CSS classes.

```tsx
// src/components/landing/ConsultaTimeline.tsx
interface ConsultaTimelineProps {
  onCtaClick: () => void;
}

const TIMELINE_ITEMS = [
  { num: '01', title: 'Dados cadastrais do CNPJ', desc: 'Situação, data de abertura, sócios, CNAE. Direto da Receita Federal.' },
  { num: '02', title: 'Processos cíveis', desc: 'Existem? Quantos? De que tipo? A gente mostra, você interpreta.' },
  { num: '03', title: 'Plataformas de reclamação', desc: 'Link direto pro Reclame Aqui. A reputação tá lá, a gente só encurta o caminho.' },
  { num: '04', title: 'Notícias e menções públicas', desc: 'Se saiu no jornal, a gente encontra. Se saiu no YouTube, também.' },
  { num: '05', title: 'Busca por nome', desc: 'Encontrou mais de uma pessoa? A gente agrupa por contexto pra você identificar quem é quem.' },
];

export default function ConsultaTimeline({ onCtaClick }: ConsultaTimelineProps) {
  return (
    <section className="consulta-section" id="consulta">
      <div className="section-inner">
        <div className="section-header__tag section-header__tag--accent">O QUE A GENTE CONSULTA</div>
        <h2 className="section-header__title section-header__title--inverse mb-8 section-header--full-width">
          Tudo que já era público e você não <span className="section-header__highlight">pesquisou</span>.
        </h2>

        <div className="consulta-timeline">
          {TIMELINE_ITEMS.map((item) => (
            <div key={item.num} className="consulta-step">
              <div className="consulta-node">{item.num}</div>
              <div className="consulta-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="callout callout--info callout--centered-lg">
          <p className="callout__body text-inverse">
            &quot;A gente não acusa, não conclui, não dá nota, não cria score moral e definitivamente não chama ninguém de pilantra. Isso fica por sua conta.&quot;
          </p>
        </div>

        <div className="cta-container">
          <button className="btn btn--primary btn--lg" onClick={onCtaClick}>
            Fazer minha primeira consulta
          </button>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add `.callout--centered-lg` to components.css**

```css
.callout--centered-lg {
  max-width: 840px;
  margin: var(--primitive-space-10) auto 0;
}
```

Note: The `.section-header--full-width .section-header__title { max-width: none; }` rule already exists in components.css — used to override the default `max-width: 700px` on the title. The inline `style={{ maxWidth: 'none' }}` on line 574 is replaced by this class.

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/ConsultaTimeline.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract ConsultaTimeline, data-drive items, migrate inline styles"
```

---

## Task 9: Extract PreviewSection component (with `.preview-icon` class)

**Files:**
- Create: `src/components/landing/PreviewSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create PreviewSection**

Extract lines 633-809. Replace the 6 duplicated inline icon container styles (each 8 lines of `style={{...}}`) with the existing `.preview-icon` class (already in components.css at line 1515). Remove the duplicated callout (same text as ConsultaTimeline's callout).

```tsx
// src/components/landing/PreviewSection.tsx
interface PreviewSectionProps {
  onCtaClick: () => void;
}

export default function PreviewSection({ onCtaClick }: PreviewSectionProps) {
  return (
    <section className="preview-section section section--primary" id="preview">
      <div className="section-inner">
        <div className="section-header section-header--centered">
          <div className="section-header__tag section-header__tag--muted">O QUE VOCÊ RECEBE</div>
          <h2 className="section-header__title mx-auto">
            Um relatório completo em <span className="section-header__highlight">3 minutos</span>.
          </h2>
          <p className="body text-muted preview-section__subtitle">
            Tudo numa única tela. Sem juridiquês, sem planilha, sem precisar abrir 15 abas no navegador.
          </p>
        </div>

        <div className="grid-3 mb-8">
          {/* 6 cards — each uses .preview-icon instead of inline styles */}
          <div className="card card--accent-top">
            <div className="preview-icon">
              {/* SVG: document icon — copy from lines 660-665 */}
            </div>
            <h3 className="body font-bold mb-3">Dados cadastrais oficiais</h3>
            <p className="caption text-muted">CNPJ, razão social, situação, data de abertura, endereço e quadro societário. Direto da Receita Federal.</p>
          </div>

          {/* ... 5 more cards with same pattern, each using <div className="preview-icon"> ... */}
        </div>

        <div className="cta-container">
          <button className="btn btn--primary btn--lg" onClick={onCtaClick}>
            Fazer minha primeira consulta
          </button>
        </div>
      </div>
    </section>
  );
}
```

Note: The implementer MUST copy all 6 card SVGs verbatim. The key change is replacing the 6x inline `style={{width:'48px',height:'48px',...}}` divs with `<div className="preview-icon">`.

**Step 2: Add CSS for subtitle**

```css
.preview-section__subtitle {
  max-width: 680px;
  margin: 24px auto 0;
}
```

**Step 3: Remove duplicated callout**

The callout at lines 797-801 ("A gente não acusa...") is identical to the one in ConsultaTimeline. Per the design doc, remove it from PreviewSection.

**Step 4: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/PreviewSection.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract PreviewSection, use .preview-icon class, remove duplicate callout"
```

---

## Task 10: Extract TestimonialsSection component

**Files:**
- Create: `src/components/landing/TestimonialsSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create TestimonialsSection**

Extract lines 814-888. Migrate inline styles on the gradient overlay (lines 867-876) and the toggle wrapper (line 878) to CSS classes. The `depoExpanded` state moves into this component.

```tsx
// src/components/landing/TestimonialsSection.tsx
"use client"

import React from 'react';

const TESTIMONIALS = [
  { emoji: '💀', quote: 'Pesquisei depois do calote. Tava tudo lá. TUDO.', author: 'Designer freelancer, SP' },
  { emoji: '🎤', quote: 'Ele mandou áudio de 7 minutos explicando por que ia atrasar o pagamento. Eu devia ter consultado antes.', author: 'Dev backend, RJ' },
  { emoji: '🤡', quote: 'A empresa tinha 47 processos. QUARENTA E SETE. E eu aceitei cheque.', author: 'Dono de agência, MG' },
  { emoji: '🙏', quote: "O cara me disse 'confia'. Agora eu confio no E o Pix.", author: 'Social media, PR' },
  { emoji: '😴', quote: 'Minha mãe falou: pesquisa antes. Eu não ouvi. Agora pago R$ 29,90 por consulta e durmo em paz.', author: 'Arquiteta, SC' },
  { emoji: '📅', quote: 'Ele disse que pagava na sexta. Estamos em março. A sexta era de novembro.', author: 'Fotógrafo, CE' },
  { emoji: '📰', quote: 'Fui a consulta e apareceu até matéria no jornal. O Google que eu deveria ter feito.', author: 'Consultora de RH, DF' },
  { emoji: '⚖️', quote: 'Descobri que meu fornecedor tinha mais processo que cliente. Obrigada, E o Pix.', author: 'Dona de e-commerce, BA' },
];

export default function TestimonialsSection() {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <section className="section section--secondary section--relative" id="depoimentos">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">DEPOIMENTOS</div>
          <h2 className="section-header__title">
            Gente que pesquisou. E gente que deveria ter <span className="section-header__highlight">pesquisado</span>.
          </h2>
        </div>

        <div className="depo-wrapper">
          <div className={`depo-grid ${expanded ? 'depo-grid--expanded' : ''}`}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card card--accent-top">
                <span className="depo-emoji">{t.emoji}</span>
                <p className="body-sm mb-12px">&quot;{t.quote}&quot;</p>
                <p className="caption text-muted">— {t.author}</p>
              </div>
            ))}
          </div>
          {!expanded && <div className="depo-fade" />}
          <div className="depo-toggle-wrapper">
            <button className="btn btn--ghost" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Ver menos' : 'Ler mais depoimentos'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Note: This uses the existing `.depo-grid`, `.depo-grid--expanded`, `.depo-fade`, `.depo-toggle-wrapper` classes from components.css (lines 1318-1357). The gradient overlay inline styles (lines 867-876) are replaced by the existing `.depo-fade` class. If `.depo-fade` background doesn't match exactly (it uses `var(--color-bg-secondary)` which is `#FFFFFF`, but inline used `#F0EFEB`), update `.depo-fade` background to match:

```css
.depo-fade {
  background: linear-gradient(to top, var(--color-bg-secondary) 0%, var(--color-bg-secondary) 10%, rgba(240,239,235,0.95) 30%, rgba(240,239,235,0.8) 50%, rgba(240,239,235,0.4) 75%, rgba(240,239,235,0) 100%);
}
```

Wait — `--color-bg-secondary` is `#FFFFFF` while the section uses `section--secondary` which has bg `#FFFFFF`. But the inline gradient used `#F0EFEB` which is `--primitive-paper-100` = `--color-bg-primary`. Since the section is `section--secondary` (white), the gradient should fade to white. The existing `.depo-fade` uses `var(--color-bg-secondary)` which IS white. So the inline version was actually wrong (used the wrong color). The CSS class is correct. Leave as-is.

**Step 2: Remove `depoExpanded` state from page.tsx** (it moves into the component)

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/TestimonialsSection.tsx src/app/page.tsx
git commit -m "refactor(landing): extract TestimonialsSection, data-drive testimonials"
```

---

## Task 11: Extract PricingSection component

**Files:**
- Create: `src/components/landing/PricingSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create PricingSection**

Extract lines 893-942. Migrate inline styles on the callout (line 936) and the featured button (line 922).

```tsx
// src/components/landing/PricingSection.tsx
interface PricingSectionProps {
  onCtaClick: () => void;
}

export default function PricingSection({ onCtaClick }: PricingSectionProps) {
  return (
    <section className="section section--primary" id="precos">
      <div className="section-inner">
        <div className="section-header">
          <div className="section-header__tag section-header__tag--muted">PREÇOS</div>
          <h2 className="section-header__title">
            Mais barato que a sessão de terapia depois do <span className="section-header__highlight">calote</span>.
          </h2>
        </div>

        <div className="grid-3">
          <div className="pricing-card">
            <div className="pricing-card__label">Pacote 5 consultas</div>
            <p className="pricing-card__audience">Para freelancers e pequenos escritórios</p>
            <div className="pricing-card__value">R$ 119<span className="pricing-card__value-small">,90</span></div>
            <p className="pricing-card__desc">&quot;Pra quem trabalha com vários clientes e já aprendeu que gente boa também dá calote.&quot;</p>
            <p className="pricing-card__includes">5 relatórios · R$ 23,98 por consulta</p>
            <button className="pricing-card__cta" disabled>Em breve</button>
          </div>

          <div className="pricing-card pricing-card--featured">
            <div className="pricing-card__label">Consulta avulsa</div>
            <p className="pricing-card__audience">Para autônomos e freelancers</p>
            <div className="pricing-card__value">R$ 29<span className="pricing-card__value-small">,90</span></div>
            <p className="pricing-card__desc">&quot;Pra aquele contrato que você tá quase fechando com um pressentimento estranho.&quot;</p>
            <p className="pricing-card__includes">Relatório completo · Fontes linkadas · Válido por 7 dias</p>
            <button className="btn btn--primary btn--lg pricing-card__cta-featured" onClick={onCtaClick}>Comprar agora</button>
          </div>

          <div className="pricing-card">
            <div className="pricing-card__label">Pacote 15 consultas</div>
            <p className="pricing-card__audience">Para agências, escritórios e estúdios</p>
            <div className="pricing-card__value">R$ 299<span className="pricing-card__value-small">,90</span></div>
            <p className="pricing-card__desc">&quot;Pra agência, escritório ou qualquer um que já cansou de ouvir &apos;semana que vem eu pago&apos;.&quot;</p>
            <p className="pricing-card__includes">15 relatórios · R$ 19,99 por consulta</p>
            <button className="pricing-card__cta" disabled>Em breve</button>
          </div>
        </div>

        <div className="callout callout--info callout--centered">
          <p className="callout__body text-center italic">
            Sem assinatura. Sem fidelidade. Sem letras miúdas. Irônico, né?
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Add CSS for featured CTA button**

```css
.pricing-card__cta-featured {
  width: 100%;
}
```

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/PricingSection.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract PricingSection component"
```

---

## Task 12: Extract FaqSection component

**Files:**
- Create: `src/components/landing/FaqSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create FaqSection**

Extract lines 947-1002. Move FAQ data array to a constant. Move `openFaq` state into this component.

```tsx
// src/components/landing/FaqSection.tsx
"use client"

import React from 'react';

const FAQ_ITEMS = [
  { question: 'Vocês são detetive particular?', answer: 'Não. A gente organiza informação pública que já existe na internet. O Google faz isso de graça, a gente só faz melhor e mais rápido.' },
  { question: 'Como a IA gera o resumo?', answer: 'Nossa inteligência artificial lê todos os dados encontrados e gera um resumo factual em linguagem clara. Ela não dá opinião, não acusa ninguém e não inventa dados. Só resume o que é público.' },
  { question: 'Posso processar alguém com base no relatório?', answer: 'A gente é espelho, não advogado. O relatório mostra fontes públicas. O que você faz com isso é responsabilidade sua. Pra ações legais, consulte um advogado de verdade.' },
  { question: 'E se o relatório não encontrar nada?', answer: 'Ótimo! Mas a gente não é vidente. Não encontrar nada não é a mesma coisa que garantir que tá tudo bem. Reforce o contrato mesmo assim.' },
  { question: 'Vocês guardam os dados de quem eu pesquiso?', answer: 'Não. Cada consulta é ao vivo. A gente não monta perfil permanente de ninguém. Consultou, recebeu, acabou.' },
  { question: 'Posso pesquisar meu próprio nome?', answer: 'Pode e deveria. Melhor você descobrir o que tá público do que seu próximo cliente descobrir primeiro.' },
  { question: 'Vocês chamam alguém de pilantra?', answer: 'Jamais. A gente só mostra informação pública com fonte. Se o reflexo incomodar, o problema não é o espelho.' },
];

export default function FaqSection() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <section className="section section--secondary" id="faq">
      <div className="section-inner">
        <div className="section-header section-header--centered-full">
          <div className="section-header__tag section-header__tag--muted">FAQ</div>
          <h2 className="section-header__title section-header__title--auto-margin">
            Perguntas que você deveria ter feito antes do <span className="section-header__highlight">contrato</span>.
          </h2>
        </div>

        <div className="faq-container">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className={`faq ${openFaq === i ? 'faq--open' : ''}`}>
              <button
                className="faq__question"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {item.question}
              </button>
              <div className="faq__answer">
                <p className="faq__answer-text">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Remove `openFaq`/`toggleFaq` from page.tsx**

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/FaqSection.tsx src/app/page.tsx
git commit -m "refactor(landing): extract FaqSection, data-drive FAQ items"
```

---

## Task 13: Extract CtaSection component

**Files:**
- Create: `src/components/landing/CtaSection.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create CtaSection**

Extract lines 1007-1056. Uses `<SearchBar />` to eliminate the second duplicated search bar.

```tsx
// src/components/landing/CtaSection.tsx
"use client"

import SearchBar from './SearchBar';

interface CtaSectionProps {
  searchTerm: string;
  placeholderText: string;
  hasError: boolean;
  searchError: string;
  isValidating: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch: () => void;
  buttonText: string;
}

export default function CtaSection(props: CtaSectionProps) {
  return (
    <section className="hero hero--landing hero--cta">
      <div className="hero-content">
        <h2 className="display-lg text-inverse mb-4">
          Contrato reforçado custa R$ 29,90.<br/>
          <em className="text-accent-em">Processo custa sua paz.</em>
        </h2>

        <SearchBar {...props} style={{ marginTop: '40px' }} />

        <p className="caption text-accent mt-5 italic">
          &quot;Não é fofoca. É fonte.&quot;
        </p>
      </div>
    </section>
  );
}
```

**Step 2: Add CSS for CTA hero height**

```css
.hero--cta {
  min-height: 70vh;
}
```

**Step 3: Replace in page.tsx, verify, commit**

```bash
git add src/components/landing/CtaSection.tsx src/styles/components.css src/app/page.tsx
git commit -m "refactor(landing): extract CtaSection, reuse SearchBar component"
```

---

## Task 14: Verify the refactored page.tsx is ~80 lines

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Verify page.tsx structure**

After all extractions, page.tsx should look approximately like:

```tsx
"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { maskDocument, cleanDocument } from '@/lib/validators';
import Footer from '@/components/Footer';
import Nav from '@/components/landing/Nav';
import HeroSection from '@/components/landing/HeroSection';
import ImpactStrip from '@/components/landing/ImpactStrip';
import ForWhoSection from '@/components/landing/ForWhoSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import ConsultaTimeline from '@/components/landing/ConsultaTimeline';
import PreviewSection from '@/components/landing/PreviewSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import PricingSection from '@/components/landing/PricingSection';
import FaqSection from '@/components/landing/FaqSection';
import CtaSection from '@/components/landing/CtaSection';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [placeholderText, setPlaceholderText] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  const [searchError, setSearchError] = React.useState('');
  const [documentType, setDocumentType] = React.useState<'cpf' | 'cnpj' | 'unknown'>('unknown');
  const [hasError, setHasError] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState('');

  // ... useEffect for auth check ...
  // ... useEffect for typewriter ...
  // ... helper functions (detectTypeFromLength, getButtonText, handleInputChange, handleSearch, scrollToHero) ...

  const searchProps = {
    searchTerm, placeholderText, hasError, searchError,
    isValidating, onInputChange: handleInputChange,
    onSearch: handleSearch, buttonText: getButtonText(),
  };

  return (
    <div>
      <Nav userEmail={userEmail} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <main>
        <HeroSection {...searchProps} />
        <ImpactStrip />
        <ForWhoSection onCtaClick={scrollToHero} />
        <HowItWorksSection onCtaClick={scrollToHero} />
        <ConsultaTimeline onCtaClick={scrollToHero} />
        <PreviewSection onCtaClick={scrollToHero} />
        <TestimonialsSection />
        <PricingSection onCtaClick={scrollToHero} />
        <FaqSection />
        <CtaSection {...searchProps} />
      </main>
      <Footer />
    </div>
  );
}
```

**Step 2: Full verification**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean (only pre-existing warning allowed)

**Step 3: Visual verification**

Start dev server and verify every section renders identically via Chrome MCP screenshots:
- Hero with collage + search bar
- Impact strip metrics
- PRA QUEM É cards with check/x icons
- COMO FUNCIONA animated step cards
- O QUE A GENTE CONSULTA timeline with energy pulse
- O QUE VOCÊ RECEBE 6 cards
- DEPOIMENTOS expand/collapse
- PREÇOS 3 cards
- FAQ accordion
- CTA final with search bar

**Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor(landing): finalize componentization — page.tsx from 1066 to ~80 lines"
```

---

## Task 15: Animate hero collage SVGs

**Files:**
- Modify: `src/components/landing/HeroSection.tsx`

**Step 1: Add SMIL animations to Contract SVG**

Add stroke-dashoffset line-drawing animation to document lines, yellow highlight reveal, and signature drawing animation.

```xml
<!-- Contract lines: stroke-dasharray + dashoffset animation -->
<line x1="12" y1="40" x2="128" y2="40" stroke="#E8E7E3" strokeWidth="1.5"
  strokeDasharray="116" strokeDashoffset="116">
  <animate attributeName="stroke-dashoffset" values="116;0" dur="1.5s" begin="0.5s" fill="freeze"/>
</line>
<!-- ... similar for lines at y=52 and y=64, with staggered begin values ... -->
<!-- Yellow highlight appears -->
<rect x="12" y="80" width="40" height="6" rx="2" fill="#FFD600" opacity="0">
  <animate attributeName="opacity" values="0;0.4" dur="0.5s" begin="2s" fill="freeze"/>
</rect>
<!-- Signature line draws -->
<line x1="12" y1="100" x2="60" y2="100" stroke="#1A1A1A" strokeWidth=".8"
  strokeDasharray="48" strokeDashoffset="48">
  <animate attributeName="stroke-dashoffset" values="48;0" dur="1s" begin="2.5s" fill="freeze"/>
</line>
```

**Step 2: Add SMIL animations to WhatsApp SVG**

Add typing reveal via clipPath (same technique as step 1 card), ticks color animation.

```xml
<!-- Text reveal with clipPath -->
<defs>
  <clipPath id="whatsClip">
    <rect x="14" y="10" width="0" height="40">
      <animate attributeName="width" values="0;160" dur="2s" begin="0.3s" fill="freeze"/>
    </rect>
  </clipPath>
</defs>
<g clipPath="url(#whatsClip)">
  <text x="14" y="24" ...>Tranquilo, pago na</text>
  <text x="14" y="40" ...>sexta sem falta 👍</text>
</g>
<!-- Ticks: gray → blue -->
<text x="166" y="52" ... fill="#888">14:32 ✓✓
  <animate attributeName="fill" values="#888;#34B7F1" dur="0.5s" begin="2.5s" fill="freeze"/>
</text>
```

**Step 3: Add SMIL animations to Post-it SVG**

Subtle wobble/float and emoji pulse.

```xml
<!-- Wobble -->
<animateTransform attributeName="transform" type="rotate" values="8;10;6;8" dur="4s" repeatCount="indefinite"/>
<!-- Emoji pulse -->
<text x="40" y="58" fontSize="14" textAnchor="middle">⚠️
  <animate attributeName="font-size" values="14;16;14" dur="2s" repeatCount="indefinite"/>
</text>
```

**Step 4: Add SMIL animations to ReclameAqui SVG**

Counter animation (0→2.1) and "Não Recomendada" slide-in.

```xml
<!-- Number counts up: use opacity trick with pre-rendered frames -->
<text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333" opacity="0">0.0
  <animate attributeName="opacity" values="1;0" dur="0.1s" begin="0s" fill="freeze"/>
</text>
<text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333" opacity="0">1.0
  <animate attributeName="opacity" values="0;1;0" dur="0.1s" begin="0.5s" fill="freeze"/>
</text>
<text x="10" y="42" fontFamily="'Zilla Slab',serif" fontSize="22" fontWeight="700" fill="#CC3333" opacity="0">2.1
  <animate attributeName="opacity" values="0;1" dur="0.3s" begin="1s" fill="freeze"/>
</text>
<!-- Bar slide-in -->
<g transform="translate(-80, 0)">
  <rect x="10" y="54" width="70" height="12" rx="3" fill="#CC3333" opacity=".15"/>
  <text x="45" y="63" ... fill="#CC3333" textAnchor="middle">Não Recomendada</text>
  <animateTransform attributeName="transform" type="translate" values="-80,0;0,0" dur="0.5s" begin="1.3s" fill="freeze"/>
</g>
```

Note: The exact SMIL implementation will need tuning. The implementer should test each animation in isolation and adjust timing values. The key constraint is: SMIL + CSS only, no JS animation libraries.

**Step 5: Verify animations render**

Start dev server, check hero section. All 4 SVGs should animate on page load.

**Step 6: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat(landing): animate hero collage SVGs — contract, whatsapp, postit, reclameaqui"
```

---

## Task 16: Create PRA QUEM É illustrations

**Files:**
- Create: `src/components/landing/illustrations/ForWhoIllustrations.tsx`
- Modify: `src/components/landing/ForWhoSection.tsx`

**Step 1: Create corporate building SVG**

~160x100px, monocromático com accent amarelo, linhas finas. Represents "Grandes Empresas".

```tsx
export function CorporateIllustration() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
      {/* Building with windows */}
      <rect x="50" y="15" width="60" height="80" rx="2" fill="none" stroke="#D5D4D0" strokeWidth="1.5"/>
      {/* Windows grid (3x5) */}
      <rect x="58" y="22" width="10" height="8" rx="1" fill="#E8E7E3"/>
      <rect x="75" y="22" width="10" height="8" rx="1" fill="#E8E7E3"/>
      <rect x="92" y="22" width="10" height="8" rx="1" fill="#E8E7E3"/>
      {/* ... more rows ... */}
      {/* Yellow accent on door */}
      <rect x="70" y="78" width="20" height="17" rx="1" fill="none" stroke="#FFD600" strokeWidth="1.5"/>
      {/* Desk + monitor */}
      <rect x="10" y="65" width="30" height="2" fill="#D5D4D0"/>
      <rect x="18" y="50" width="14" height="12" rx="1" fill="none" stroke="#D5D4D0" strokeWidth="1"/>
      {/* Chart on monitor */}
      <polyline points="22,58 25,54 28,56" fill="none" stroke="#FFD600" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  );
}
```

**Step 2: Create laptop chaos SVG**

~160x100px, laptop solo with post-its/chaos. Represents "MEI / Freelancer".

```tsx
export function FreelancerIllustration() {
  return (
    <svg viewBox="0 0 160 100" width="160" height="100" xmlns="http://www.w3.org/2000/svg">
      {/* Laptop */}
      <rect x="40" y="30" width="80" height="50" rx="3" fill="none" stroke="#D5D4D0" strokeWidth="1.5"/>
      <rect x="30" y="80" width="100" height="5" rx="2" fill="#E8E7E3"/>
      {/* Screen content: question marks */}
      <text x="80" y="60" fontFamily="'IBM Plex Mono',monospace" fontSize="20" fill="#D5D4D0" textAnchor="middle">???</text>
      {/* Post-its scattered */}
      <rect x="5" y="10" width="25" height="25" rx="1" fill="#FFD600" opacity="0.6" transform="rotate(-8, 17, 22)"/>
      <rect x="130" y="5" width="22" height="22" rx="1" fill="#FFD600" opacity="0.4" transform="rotate(12, 141, 16)"/>
      {/* Coffee ring */}
      <circle cx="135" y="75" r="10" fill="none" stroke="#D5D4D0" strokeWidth="0.8" strokeDasharray="3 2"/>
    </svg>
  );
}
```

**Step 3: Add illustrations to ForWhoSection**

Place above each card's title, inside the card.

**Step 4: Verify, commit**

```bash
git add src/components/landing/illustrations/ForWhoIllustrations.tsx src/components/landing/ForWhoSection.tsx
git commit -m "feat(landing): add PRA QUEM É SVG illustrations — corporate + freelancer"
```

---

## Task 17: Create animated PREVIEW illustrations

**Files:**
- Create: `src/components/landing/illustrations/FeatureIcons.tsx`
- Modify: `src/components/landing/PreviewSection.tsx`

**Step 1: Create 6 animated SVG illustrations**

Each ~80x80px with SMIL animations, replacing the current 24x24 generic icons.

1. **Dados cadastrais** — mini-document with fields filling in (animated clipPath reveal)
2. **Processos judiciais** — stylized gavel with strike animation
3. **Reclame Aqui** — review card with stars appearing
4. **Notícias** — newspaper with headlines appearing
5. **Resumo inteligente** — brain/circuit with pulse
6. **Indicador de clima** — sun with rays animating

Each is an exported named component: `CadastralIcon`, `ProcessosIcon`, `ReclameIcon`, `NoticiasIcon`, `ResumoIcon`, `ClimaIcon`.

Design pattern for each:
- viewBox `0 0 80 80`
- Monocromático (#1A1A1A lines) com accent amarelo (#FFD600)
- 1-2 subtle SMIL animations (scale, opacity, stroke-dashoffset)
- Same visual vocabulary as COMO FUNCIONA step cards

**Step 2: Replace icons in PreviewSection**

Replace the 24x24 SVGs inside `.preview-icon` with the new 80x80 animated illustrations. Update `.preview-icon` dimensions to accommodate larger illustrations:

```css
.preview-icon--lg {
  width: 80px;
  height: 80px;
  background: none;
  border: none;
}
```

**Step 3: Verify, commit**

```bash
git add src/components/landing/illustrations/FeatureIcons.tsx src/components/landing/PreviewSection.tsx src/styles/components.css
git commit -m "feat(landing): animated SVG illustrations for PREVIEW section — 6 new icons"
```

---

## Task 18: Create PREÇOS illustrations

**Files:**
- Create: `src/components/landing/illustrations/PricingIllustrations.tsx`
- Modify: `src/components/landing/PricingSection.tsx`

**Step 1: Create SOL shield/badge SVG**

For the featured card (R$29,90). Pulsating shield with "SOL" badge.

```tsx
export function SolBadge() {
  return (
    <svg viewBox="0 0 80 90" width="80" height="90" xmlns="http://www.w3.org/2000/svg">
      {/* Shield shape */}
      <path d="M40,5 L70,20 L70,50 C70,70 40,85 40,85 C40,85 10,70 10,50 L10,20 Z"
        fill="none" stroke="#FFD600" strokeWidth="2"/>
      {/* SOL text */}
      <text x="40" y="50" fontFamily="'IBM Plex Mono',monospace" fontSize="12" fontWeight="700"
        fill="#1A1A1A" textAnchor="middle">SOL</text>
      {/* Pulse animation on shield */}
      <path d="M40,5 L70,20 L70,50 C70,70 40,85 40,85 C40,85 10,70 10,50 L10,20 Z"
        fill="#FFD600" opacity="0">
        <animate attributeName="opacity" values="0;0.15;0" dur="2s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}
```

**Step 2: Create package/box SVG**

For the "Em breve" cards. Box with yellow ribbon.

```tsx
export function PackageIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
      {/* Box */}
      <rect x="15" y="25" width="50" height="40" rx="2" fill="none" stroke="#D5D4D0" strokeWidth="1.5"/>
      {/* Lid */}
      <path d="M10,25 L40,10 L70,25" fill="none" stroke="#D5D4D0" strokeWidth="1.5"/>
      {/* Yellow ribbon */}
      <line x1="40" y1="10" x2="40" y2="65" stroke="#FFD600" strokeWidth="2"/>
      <line x1="15" y1="45" x2="65" y2="45" stroke="#FFD600" strokeWidth="2"/>
    </svg>
  );
}
```

**Step 3: Add illustrations to PricingSection**

Place inside each pricing card, above the label.

**Step 4: Verify, commit**

```bash
git add src/components/landing/illustrations/PricingIllustrations.tsx src/components/landing/PricingSection.tsx
git commit -m "feat(landing): add PREÇOS SVG illustrations — SOL badge + package"
```

---

## Task 19: Add scroll animations

**Files:**
- Modify: `src/styles/components.css`

**Step 1: Add CSS `animation-timeline: view()` for section fade-in**

Uses progressive enhancement — Chrome 115+ gets animations, older browsers see static content.

```css
/* ===== SCROLL ANIMATIONS ===== */
@supports (animation-timeline: view()) {
  .section,
  .consulta-section,
  .preview-section,
  .impact {
    animation: sectionFadeIn linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 30%;
  }

  @keyframes sectionFadeIn {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Staggered card reveals */
  .grid-2 > *,
  .grid-3 > *,
  .steps-grid > * {
    animation: cardFadeIn linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 40%;
  }

  .grid-2 > *:nth-child(2),
  .grid-3 > *:nth-child(2),
  .steps-grid > *:nth-child(2) {
    animation-range: entry 5% entry 45%;
  }

  .grid-3 > *:nth-child(3),
  .steps-grid > *:nth-child(3) {
    animation-range: entry 10% entry 50%;
  }

  @keyframes cardFadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Timeline items stagger */
  .consulta-step {
    animation: timelineItemIn linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 50%;
  }

  @keyframes timelineItemIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
```

**Step 2: Verify**

Run dev server in Chrome, scroll through page. Sections and cards should fade in on scroll. In Safari/Firefox, content should be visible immediately (no animation).

**Step 3: Commit**

```bash
git add src/styles/components.css
git commit -m "feat(landing): add CSS scroll animations with animation-timeline: view()"
```

---

## Task 20: Add hover enhancements

**Files:**
- Modify: `src/styles/components.css`

**Step 1: Add enhanced hover effects**

```css
/* PREVIEW cards: lift + glow + border-color */
.preview-section .card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(255, 214, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: rgba(255, 214, 0, 0.3);
}

/* Pricing cards: shadow expansion */
.pricing-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(255, 214, 0, 0.2);
}

/* Testimonial cards: subtle tilt */
.depo-grid .card:hover {
  transform: translateY(-3px) rotate(-0.5deg);
}
```

**Step 2: Verify, commit**

```bash
git add src/styles/components.css
git commit -m "style(landing): add hover enhancements — preview glow, pricing shadow, testimonial tilt"
```

---

## Task 21: QA visual — full page verification

**Step 1: Run full build**

Run: `npx tsc --noEmit && npm run lint && npx vitest run`
Expected: All clean

**Step 2: Desktop verification (Chrome MCP)**

Take screenshots at 1440px width of every section. Compare mentally with original page.

**Step 3: Mobile verification (Chrome MCP)**

Resize to 375px width (mobile). Check:
- Hamburger menu works
- Search bar stacks vertically
- Grid columns collapse to 1
- Timeline nodes hide, cards get yellow left border
- Pricing cards stack vertically
- FAQ accordion works

**Step 4: Animation verification**

- Hero collage: 4 SVGs animate on load
- COMO FUNCIONA: 3 step card SVGs animate
- Timeline: energy pulse travels down, nodes glow
- Scroll: sections fade in on scroll (Chrome only)
- Hover: cards lift, glow, tilt

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat(landing): complete refactor — componentize, illustrations, animations, QA verified"
```

---

## Summary

| Task | Description | Files | Estimated Size |
|------|-------------|-------|----------------|
| 1 | SearchBar shared component | 1 new | ~50 lines |
| 2 | CheckIcon + XIcon | 2 new | ~30 lines |
| 3 | Nav component | 1 new, 2 modified | ~60 lines |
| 4 | HeroSection component | 1 new, 1 modified | ~80 lines |
| 5 | ImpactStrip component | 1 new, 1 modified | ~20 lines |
| 6 | ForWhoSection component | 1 new, 1 modified | ~60 lines |
| 7 | HowItWorksSection component | 1 new, 1 modified | ~80 lines |
| 8 | ConsultaTimeline component | 1 new, 2 modified | ~60 lines |
| 9 | PreviewSection component | 1 new, 2 modified | ~80 lines |
| 10 | TestimonialsSection component | 1 new, 1 modified | ~60 lines |
| 11 | PricingSection component | 1 new, 2 modified | ~60 lines |
| 12 | FaqSection component | 1 new, 1 modified | ~60 lines |
| 13 | CtaSection component | 1 new, 2 modified | ~40 lines |
| 14 | Verify refactored page.tsx | 1 modified | validation |
| 15 | Animate hero collage SVGs | 1 modified | ~80 lines SVG |
| 16 | PRA QUEM É illustrations | 1 new, 1 modified | ~80 lines |
| 17 | PREVIEW animated illustrations | 1 new, 2 modified | ~200 lines |
| 18 | PREÇOS illustrations | 1 new, 1 modified | ~60 lines |
| 19 | Scroll animations | 1 modified | ~50 lines CSS |
| 20 | Hover enhancements | 1 modified | ~20 lines CSS |
| 21 | QA visual verification | validation | — |

## Constraints

- CSS puro (no Tailwind migration)
- SVGs inline (no external files)
- SMIL + CSS animations only (no framer-motion/GSAP)
- Existing design tokens in `tokens.css` (no new tokens unless necessary)
- No textual content changes
- No functionality changes (search, auth, routing)
