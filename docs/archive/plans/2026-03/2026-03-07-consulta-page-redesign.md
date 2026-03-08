# Consulta Page Redesign + Auth Modal Fullscreen — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the `/consulta/[term]` page and `RegisterModal` with a fullscreen mobile modal (yellow bg + dark form) and improved page hierarchy/styling.

**Architecture:** RegisterModal gets a dark-themed fullscreen layout on mobile (yellow pattern header + dark form with border-radius). Desktop gets a centered card with yellow header. The consulta page gets reorganized hero, improved preview cards, dark pricing section, and migrates from inline styles to CSS classes using existing design tokens.

**Tech Stack:** Next.js 14, Radix Dialog, CSS custom properties (tokens.css), IBM Plex Mono + Zilla Slab

**Design doc:** `docs/plans/2026-03-07-consulta-page-redesign.md` (this file, design section below)

---

## E2E Selectors to Preserve (CRITICAL)

These selectors are used by Playwright E2E tests and MUST NOT change:
- `.rm-content` — modal visibility check
- `.rm-submit` — submit button
- `.rm-toggle-btn` — register/login toggle
- `#reg-name`, `#reg-email`, `#reg-password`, `#reg-confirm-password` — form field IDs
- `button:has-text("DESBLOQUEAR")` — CTA button text

---

## Task 1: Rewrite RegisterModal CSS (dark theme + responsive layout)

**Files:**
- Modify: `src/components/RegisterModal.tsx` (lines 301-559 — the `<style jsx global>` block)

**Step 1: Replace the entire `<style jsx global>` block**

The new CSS changes:
- `.rm-overlay`: same (backdrop blur)
- `.rm-content`: fullscreen dark bg on mobile, centered card on desktop
- NEW: `.rm-yellow-header` — yellow area with dot pattern
- NEW: `.rm-form-area` — dark form container with border-radius top on mobile
- All `.rm-*` form elements: dark theme (bg #2A2A2A, text white, etc.)
- All existing class names preserved for E2E compatibility

Replace the `<style jsx global>` content (lines 301-559) with:

```css
/* === OVERLAY === */
.rm-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(26, 26, 26, 0.7);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: rm-fade-in 0.2s ease;
}

/* === CONTENT (mobile: fullscreen, desktop: centered card) === */
.rm-content {
  position: fixed;
  z-index: 201;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--primitive-yellow-500);
  overflow: hidden;
  animation: rm-fade-in 0.2s ease;
}
@media (min-width: 640px) {
  .rm-content {
    inset: unset;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 460px;
    max-height: 92vh;
    border-radius: 16px;
    overflow: hidden;
    animation: rm-scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* === YELLOW HEADER with dot pattern === */
.rm-yellow-header {
  position: relative;
  min-height: 20vh;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background:
    radial-gradient(circle, rgba(26,26,26,0.08) 1px, transparent 1px);
  background-size: 16px 16px;
}
@media (min-width: 640px) {
  .rm-yellow-header {
    min-height: 80px;
  }
}
.rm-yellow-header img,
.rm-yellow-header svg {
  max-height: 48px;
  width: auto;
}

/* === CLOSE BUTTON (on yellow header) === */
.rm-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primitive-black-900);
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.rm-close:hover {
  background: rgba(26, 26, 26, 0.1);
}

/* === FORM AREA (dark, slides up on mobile) === */
.rm-form-area {
  flex: 1;
  background: var(--primitive-black-900);
  border-radius: 24px 24px 0 0;
  overflow-y: auto;
  padding: 0 20px 40px;
  animation: rm-slide-up 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  scrollbar-width: thin;
  scrollbar-color: #444 transparent;
}
@media (min-width: 640px) {
  .rm-form-area {
    border-radius: 0;
    padding: 0 32px 32px;
    animation: none;
  }
}
.rm-form-area::-webkit-scrollbar { width: 5px; }
.rm-form-area::-webkit-scrollbar-track { background: transparent; }
.rm-form-area::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }

/* === DRAG INDICATOR (mobile only, visual) === */
.rm-drag-indicator {
  width: 40px;
  height: 4px;
  background: #444;
  border-radius: 2px;
  margin: 16px auto 20px;
}
@media (min-width: 640px) {
  .rm-drag-indicator { display: none; }
}

/* === INNER CONTENT === */
.rm-inner {
  max-width: 380px;
  margin: 0 auto;
}

/* === HEADER TEXT === */
.rm-header { text-align: center; margin-bottom: 20px; }
.rm-badge {
  display: inline-block;
  font-family: var(--font-family-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--primitive-black-900);
  background: var(--primitive-yellow-500);
  padding: 3px 10px;
  border-radius: 2px;
  margin-bottom: 12px;
}
.rm-title {
  font-family: var(--font-family-heading);
  font-size: 22px;
  font-weight: 700;
  color: #FFFFFF;
  line-height: 1.2;
  margin-bottom: 6px;
}
.rm-subtitle {
  font-family: var(--font-family-body);
  font-size: 12px;
  color: #999;
}

/* === FORM === */
.rm-form { display: flex; flex-direction: column; gap: 10px; }
.rm-field { flex: 1; }
.rm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.rm-label {
  display: block;
  text-align: left;
  margin-bottom: 4px;
  color: #999;
  font-weight: 600;
  font-family: var(--font-family-body);
  font-size: 10px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.rm-input {
  width: 100%;
  padding: 12px 14px;
  background: var(--primitive-black-800);
  border: 1px solid var(--primitive-black-700);
  border-radius: 8px;
  color: #FFFFFF;
  font-family: var(--font-family-body);
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.rm-input:focus {
  border-color: var(--primitive-yellow-500);
  box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
}
.rm-input::placeholder { color: #666; }
.rm-input--has-icon { padding-right: 42px; }

.rm-input-wrap { position: relative; }
.rm-eye {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
}
.rm-eye:hover { color: #999; }

/* === ERROR === */
.rm-error {
  color: var(--primitive-red-500);
  font-size: 12px;
  text-align: center;
  font-family: var(--font-family-body);
  padding: 8px 12px;
  background: rgba(204, 51, 51, 0.1);
  border: 1px solid rgba(204, 51, 51, 0.2);
  border-radius: 8px;
}

/* === DIVIDER === */
.rm-divider { height: 1px; background: var(--primitive-black-700); margin: 2px 0; }

/* === SUBMIT BUTTON === */
.rm-submit {
  width: 100%;
  padding: 14px 20px;
  font-family: var(--font-family-body);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--primitive-black-900);
  background: var(--primitive-yellow-500);
  border: 2px solid var(--primitive-black-900);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 3px 3px 0 0 rgba(255, 214, 0, 0.4);
}
.rm-submit:hover:not(:disabled) {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 0 rgba(255, 214, 0, 0.4);
}
.rm-submit:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 0 rgba(255, 214, 0, 0.4);
}
.rm-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* === TOGGLE & LEGAL === */
.rm-toggle {
  text-align: center;
  font-family: var(--font-family-body);
  font-size: 12px;
  color: #666;
  margin: 0;
}
.rm-toggle-btn {
  background: none;
  border: none;
  color: var(--primitive-yellow-500);
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  border-bottom: 1.5px solid var(--primitive-yellow-500);
}
.rm-toggle-btn:hover { color: #FFF; border-color: #FFF; }
.rm-legal {
  text-align: center;
  font-family: var(--font-family-body);
  font-size: 10px;
  color: #555;
  line-height: 1.5;
  margin: 0;
  padding-bottom: 4px;
}
.rm-legal a { color: #888; text-decoration: underline; }

/* === ANIMATIONS === */
@keyframes rm-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes rm-slide-up {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes rm-scale-in {
  from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
  to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}
```

**Step 2: Update the JSX structure to include yellow header + form area**

Replace the JSX inside `<DialogPrimitive.Content>` (lines 116-561) with:

```tsx
<DialogPrimitive.Content className="rm-content" aria-describedby="register-modal-desc">
  {/* Yellow header with pattern + logo */}
  <div className="rm-yellow-header">
    <DialogPrimitive.Close className="rm-close" aria-label="Fechar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </DialogPrimitive.Close>
    <LogoFundoPreto />
  </div>

  {/* Dark form area */}
  <div className="rm-form-area">
    <div className="rm-drag-indicator" />
    <div className="rm-inner">
      {/* ... existing header + form JSX unchanged ... */}
    </div>
  </div>

  <style jsx global>{`...new CSS...`}</style>
</DialogPrimitive.Content>
```

Note: `LogoFundoPreto` needs to be imported.

**Step 3: Run tsc and verify no type errors**

Run: `npx tsc --noEmit`
Expected: clean (0 errors)

**Step 4: Commit**

```bash
git add src/components/RegisterModal.tsx
git commit -m "style: redesign RegisterModal — dark theme + fullscreen mobile + yellow header"
```

---

## Task 2: Redesign consulta page — Hero section

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (lines 234-432 — hero section)

**Step 1: Rewrite the hero section**

Replace the hero `<section>` (lines 276-432) with cleaner markup:

```tsx
<section style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
  {/* Document type pill */}
  <span className="consulta-doc-pill">
    {isMaintenance ? 'SISTEMA EM MANUTENCAO' : documentType}
  </span>

  {/* Document number — big and prominent */}
  {!isMaintenance && (
    <p className="consulta-doc-number">{formattedTerm}</p>
  )}

  {/* Title */}
  <h1 className="display-lg" style={{ marginBottom: '16px' }}>
    {isMaintenance
      ? 'Sistema temporariamente indisponivel'
      : <>Encontramos <span className="section-header__highlight">6 fontes</span> sobre este {documentType.toLowerCase()}</>
    }
  </h1>

  {/* Maintenance callouts */}
  {isMaintenance && <MaintenanceCallout />}
  {isMaintenance && <LeadCaptureForm />}

  {/* CTA Button */}
  {isLoggedIn === null ? (
    <div style={{ padding: '20px 0' }}>
      <div className="consulta-spinner" />
    </div>
  ) : isLoggedIn ? (
    <form onSubmit={handlePurchaseLoggedIn}>
      <button
        type="submit"
        disabled={isMaintenance || isLoading}
        className="btn btn--primary btn--lg consulta-cta"
      >
        {isLoading ? 'Processando...' : isMaintenance ? 'Indisponivel' : 'DESBLOQUEAR RELATORIO \u00B7 R$ 29,90'}
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      disabled={isMaintenance || isLoading}
      className="btn btn--primary btn--lg consulta-cta"
    >
      {isMaintenance ? 'Indisponivel' : 'DESBLOQUEAR RELATORIO \u00B7 R$ 29,90'}
    </button>
  )}

  {/* Trust badges */}
  <div className="consulta-trust-row">
    <span className="consulta-trust-badge">🔒 Pagamento seguro</span>
    <span className="consulta-trust-badge">⚡ Instantaneo</span>
  </div>

  {/* Terms */}
  <p className="caption text-muted" style={{ fontStyle: 'italic', lineHeight: 1.5 }}>
    Ao prosseguir com a compra, voce aceita os{' '}
    <a href="#termos" style={{ textDecoration: 'underline', color: 'var(--color-text-primary)' }}>Termos de Uso</a>
    {' '}e a{' '}
    <a href="#privacidade" style={{ textDecoration: 'underline', color: 'var(--color-text-primary)' }}>Politica de Privacidade</a>
  </p>
</section>
```

**Step 2: Add new CSS classes at the bottom of the page (in the `<style jsx global>` block)**

```css
/* === CONSULTA PAGE === */
.consulta-doc-pill {
  display: inline-block;
  font-family: var(--font-family-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--primitive-yellow-500);
  background: var(--primitive-black-900);
  padding: 4px 14px;
  border-radius: 9999px;
  margin-bottom: 16px;
}
.consulta-doc-number {
  font-family: var(--font-family-heading);
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: 1px;
  margin-bottom: 8px;
}
@media (min-width: 640px) {
  .consulta-doc-number { font-size: 40px; }
}
.consulta-cta {
  width: 100%;
  max-width: 480px;
  font-size: 18px;
  padding: 18px 32px;
  margin-bottom: 12px;
}
.consulta-cta:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.consulta-trust-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
}
.consulta-trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--color-bg-subtle);
  border: 1px solid var(--color-border-subtle);
  border-radius: 9999px;
  font-family: var(--font-family-body);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
}
.consulta-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-subtle);
  border-top-color: var(--primitive-yellow-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}
```

**Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "style: redesign consulta hero — doc number prominent, dark pill, cleaner CTA"
```

---

## Task 3: Redesign consulta page — Preview cards section

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (lines ~437-551 — preview cards section)

**Step 1: Rewrite the preview cards section**

Replace the preview cards `<section>` with:

```tsx
<section style={{ maxWidth: '800px', margin: '0 auto 48px', padding: '0 24px' }}>
  <h2 className="display-lg" style={{ marginBottom: '32px', textAlign: 'center' }}>
    O que voce <span className="section-header__highlight">recebe</span>
  </h2>

  <div className="consulta-card-grid">
    {blurredCards.map((card, index) => (
      <div key={index} className="consulta-preview-card">
        <div className="consulta-preview-card__header">
          <span style={{ fontSize: '20px' }}>{card.icon}</span>
          <h3 className="consulta-preview-card__title">{card.title}</h3>
          <span className="consulta-preview-card__lock">🔒</span>
        </div>
        <p className="consulta-preview-card__content">
          {card.content}
        </p>
        {card.risk && (
          <div className="consulta-preview-card__risk">
            {getRiskBadge(card.risk)}
          </div>
        )}
      </div>
    ))}
  </div>
</section>
```

**Step 2: Add CSS classes for the cards**

```css
.consulta-card-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
@media (max-width: 479px) {
  .consulta-card-grid { grid-template-columns: 1fr; }
}
.consulta-preview-card {
  background: var(--color-bg-subtle, #F0EFEB);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}
.consulta-preview-card:hover {
  border-color: var(--primitive-yellow-500);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.consulta-preview-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.consulta-preview-card__title {
  font-family: var(--font-family-heading);
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
}
.consulta-preview-card__lock { font-size: 12px; opacity: 0.4; }
.consulta-preview-card__content {
  font-family: var(--font-family-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin: 0;
  filter: blur(6px);
  user-select: none;
  line-height: 1.5;
}
.consulta-preview-card__risk {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-subtle);
}
```

**Step 3: Remove the floating "BLOQUEADO" overlay** (the absolutely positioned element that was at lines ~452-473)

**Step 4: Run tsc**

Run: `npx tsc --noEmit`
Expected: clean

**Step 5: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "style: redesign consulta preview cards — 12px radius, yellow hover, responsive grid"
```

---

## Task 4: Redesign consulta page — Pricing section (dark card)

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (lines ~556-675 — pricing section)

**Step 1: Rewrite the pricing section as a dark card**

```tsx
{!isMaintenance && (
  <section style={{ maxWidth: '640px', margin: '0 auto 48px', padding: '0 24px' }}>
    <div className="consulta-pricing-card">
      <h2 className="consulta-pricing-title">
        Por que <span style={{ color: 'var(--primitive-yellow-500)' }}>R$ 29,90</span> e justo?
      </h2>

      <div className="consulta-pricing-checklist">
        {[
          'Relatorio completo em ate 3 minutos',
          '6 bases publicas cruzadas por IA',
          'Dados da Receita Federal + Tribunais',
          'Reclame Aqui + Noticias agregadas',
          'Resumo inteligente gerado por IA',
        ].map((text, i) => (
          <div key={i} className="consulta-pricing-check">
            <svg viewBox="0 0 20 20" width="20" height="20" style={{ flexShrink: 0 }}>
              <circle cx="10" cy="10" r="8" fill="var(--primitive-yellow-500)" />
              <polyline points="6,10 9,13 14,7" fill="none" stroke="var(--primitive-black-900)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="consulta-pricing-compare">
        <p className="consulta-pricing-compare__values">
          <strong style={{ color: 'var(--primitive-yellow-500)', fontSize: '22px', fontFamily: 'var(--font-family-heading)' }}>R$ 29,90</strong>
          <span style={{ color: '#666', margin: '0 8px' }}>vs</span>
          <strong style={{ color: 'var(--primitive-red-500)', fontSize: '22px', fontFamily: 'var(--font-family-heading)' }}>R$ 500/mes</strong>
        </p>
        <p className="consulta-pricing-compare__sub">
          Consulta avulsa · Sem mensalidade · Sem fidelidade
        </p>
      </div>
    </div>
  </section>
)}
```

**Step 2: Add CSS for dark pricing card**

```css
.consulta-pricing-card {
  background: var(--primitive-black-900);
  border-radius: 16px;
  padding: 32px;
}
.consulta-pricing-title {
  font-family: var(--font-family-heading);
  font-size: 24px;
  font-weight: 700;
  color: #FFFFFF;
  text-align: center;
  margin-bottom: 24px;
}
.consulta-pricing-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}
.consulta-pricing-check {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-family-body);
  font-size: 13px;
  color: #CCC;
}
.consulta-pricing-compare {
  background: var(--primitive-black-800);
  border: 1px solid var(--primitive-black-700);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}
.consulta-pricing-compare__values {
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.consulta-pricing-compare__sub {
  font-family: var(--font-family-body);
  font-size: 11px;
  color: #666;
  font-style: italic;
  margin: 0;
}
```

**Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: clean

**Step 4: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "style: redesign consulta pricing — dark card with yellow accents"
```

---

## Task 5: Redesign consulta page — Bottom CTA + cleanup

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (lines ~680-716 — bottom CTA + footer note + global style)

**Step 1: Simplify the bottom CTA section**

```tsx
{!isMaintenance && (
  <section style={{ maxWidth: '640px', margin: '0 auto 48px', padding: '0 24px', textAlign: 'center' }}>
    <div className="callout callout--info" style={{ marginBottom: '20px' }}>
      <p className="callout__body">
        Nao perca tempo. Os dados ja estao prontos e esperando por voce.
      </p>
    </div>

    <button
      onClick={() => isLoggedIn ? handlePurchaseLoggedIn() : setModalOpen(true)}
      disabled={isLoading}
      className="btn btn--primary btn--lg consulta-cta"
    >
      {isLoading ? 'Processando...' : 'DESBLOQUEAR AGORA POR R$ 29,90'}
    </button>

    <p className="caption text-muted" style={{ marginTop: '12px', fontStyle: 'italic' }}>
      Pagamento 100% seguro • Relatorio disponivel em ate 3 minutos
    </p>
  </section>
)}
```

**Step 2: Consolidate all the consulta CSS into one `<style jsx global>` block at the end of the component**

Ensure only one `<style jsx global>` block exists with all `.consulta-*` classes + the spin keyframe.

**Step 3: Clean up remaining inline styles — replace with CSS classes where possible**

Go through the file and replace any remaining verbose inline style objects with the new CSS classes or existing utility classes.

**Step 4: Run tsc and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: both clean

**Step 5: Commit**

```bash
git add src/app/consulta/[term]/page.tsx
git commit -m "style: redesign consulta bottom CTA + consolidate CSS classes"
```

---

## Task 6: Visual verification + E2E

**Files:** No code changes — testing only

**Step 1: Run E2E mock tests to verify nothing broke**

Run: `MOCK_MODE=true npx playwright test`
Expected: 26/26 passing — especially `purchase-flow-cpf`, `purchase-flow-cnpj`, `auth-purchase-flow` which interact with the modal

**Step 2: Manual visual check with Chrome**

Run: `npm run dev` and navigate to `/consulta/00678080933` (or any valid CPF)

Check:
- [ ] Page loads with light/paper background
- [ ] Document pill shows "CPF" in dark pill with yellow text
- [ ] Document number shows large (32px+)
- [ ] CTA button says "DESBLOQUEAR RELATORIO · R$ 29,90"
- [ ] Clicking CTA opens the modal
- [ ] **Mobile (resize < 640px):** modal is fullscreen with yellow header (dot pattern + logo) and dark form sliding up with border-radius 24px
- [ ] **Desktop (>= 640px):** modal is centered card with yellow header and dark form below
- [ ] Form fields work (name, email, cellphone, CPF/CNPJ, password, confirm)
- [ ] Toggle "Ja possui conta? / Faca login" switches between register/login
- [ ] Preview cards grid shows 2 columns (1 on very narrow screens)
- [ ] Cards have yellow border on hover
- [ ] Pricing section is dark card with yellow accents
- [ ] Bottom CTA works

**Step 3: Commit any fixes if needed**

**Step 4: Run vitest to confirm unit tests unaffected**

Run: `npx vitest run`
Expected: all passing (66/66 or similar)

---

## Design Reference

See the **Design** section in this same file (appended below) for ASCII wireframes, exact color values, and specs.

---

## Design Specs (from brainstorming)

### Modal Mobile (< 640px) — Fullscreen
- Container: `position: fixed; inset: 0; z-index: 201; background: #FFD600; flex-direction: column`
- Yellow header: `min-height: 20vh; flex-shrink: 0` with dot pattern `radial-gradient(circle, rgba(26,26,26,0.08) 1px, transparent 1px) / 16px 16px`
- Logo: `LogoFundoPreto`, max-height 48px, centered
- Form area: `bg: #1A1A1A; border-radius: 24px 24px 0 0; flex: 1; overflow-y: auto; padding: 0 20px 40px`
- Drag indicator: `width: 40px; height: 4px; bg: #444; border-radius: 2px; margin: 16px auto 20px`
- Animation: form slides up (translateY 40px → 0), 300ms

### Modal Desktop (>= 640px) — Centered Card
- Overlay: backdrop blur 6px, rgba(26,26,26,0.7)
- Card: `width: 460px; max-height: 92vh; border-radius: 16px; overflow: hidden`
- Yellow header: `height: ~80px` (min-height) with same dot pattern + logo
- Form area: `bg: #1A1A1A; padding: 0 32px 32px; border-radius: 0`
- Close: `top: 12px; right: 12px` on yellow header, color #1A1A1A
- Animation: scale-in (0.95 → 1), 250ms

### Form Colors (dark theme)
- Inputs: `bg: #2A2A2A; border: 1px #333; color: #FFF; placeholder: #666; focus border: #FFD600`
- Labels: `color: #999; font-size: 10px; uppercase`
- Submit: `bg: #FFD600; color: #1A1A1A; border: 2px solid #1A1A1A; shadow: 3px 3px 0 rgba(255,214,0,0.4)`
- Toggle: `color: #666; link: #FFD600`
- Legal: `color: #555; link: #888`

### Consulta Page
- Background: `var(--color-bg-primary)` (#F0EFEB) — light/paper, unchanged
- Hero: doc pill (dark bg, yellow text, pill shape) → doc number (Zilla Slab 32-40px) → title → CTA → trust badges
- Preview cards: 12px radius, 20px padding, yellow border hover, 2-col grid (1-col < 480px), no floating overlay
- Pricing: dark card (#1A1A1A), 16px radius, 32px padding, yellow checkmarks, compare box (#2A2A2A)
- Bottom CTA: callout + same CTA button + caption

### Breakpoints
- < 480px: 1-col cards, doc number 28px, padding 16px
- 480-640px: 2-col cards, doc number 32px
- >= 640px: 2-col cards, doc number 40px, max-width 800px content
