# Frontend Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Componentize navbar, add login modal to landing nav, refactor minhas-consultas visually (timeline processing), refactor admin login, fix admin button reload bug, update PT-BR labels.

**Architecture:** Extract shared `UserNav` component from 3 duplicated navbars. Add RegisterModal (login-only mode) to landing page nav. Refactor minhas-consultas with CSS classes and vertical timeline for processing. Restyle admin login with EOPIX design tokens. Update PROCESSING_STEPS labels to PT-BR classe C.

**Tech Stack:** React, Next.js 14, Radix Dialog, CSS custom properties (design tokens from `tokens.css`), IBM Plex Mono + Zilla Slab fonts.

---

### Task 1: Update PROCESSING_STEPS labels and SCAN_SOURCES terms

**Files:**
- Modify: `src/types/domain.ts:47-54`
- Modify: `src/app/consulta/[term]/page.tsx:23-30`

**Step 1: Update PROCESSING_STEPS labels in domain.ts**

```typescript
export const PROCESSING_STEPS = [
  { step: 1, label: 'Consultando Receita Federal' },
  { step: 2, label: 'Verificando situacao financeira' },
  { step: 3, label: 'Buscando processos judiciais' },
  { step: 4, label: 'Analisando noticias e reputacao' },
  { step: 5, label: 'Gerando analise inteligente' },
  { step: 6, label: 'Montando seu relatorio' },
] as const
```

**Step 2: Update SCAN_SOURCES in consulta page**

In `src/app/consulta/[term]/page.tsx`, replace:
```typescript
const SCAN_SOURCES = [
  { icon: '🏛️', name: 'Receita Federal', status: 'Dados localizados' },
  { icon: '⚖️', name: 'Tribunais de Justica', status: 'Registros encontrados' },
  { icon: '📊', name: 'Serasa / SPC', status: 'Score disponivel' },
  { icon: '📰', name: 'Noticias na Midia', status: 'Mencoes localizadas' },
  { icon: '⭐', name: 'Reclamacoes Online', status: 'Dados disponiveis' },
  { icon: '🤖', name: 'Analise Inteligente', status: 'Analise concluida' },
];
```

Also update the details grid in the same file (around line 341):
```typescript
{ icon: '📰', name: 'Noticias na Midia', desc: 'Noticias recentes, mencoes em midia e exposicao publica' },
{ icon: '⭐', name: 'Reclamacoes Online', desc: 'Historico de reclamacoes, resolucao e nota de reputacao' },
{ icon: '🤖', name: 'Analise Inteligente', desc: 'Cruzamento automatico de todas as fontes com parecer consolidado' },
```

**Step 3: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 4: Commit**

```
feat: update processing labels and scan sources to PT-BR classe C
```

---

### Task 2: Extract shared UserNav component

**Files:**
- Create: `src/components/UserNav.tsx`
- Modify: `src/styles/components.css` (add `nav__user-actions` styles)

**Step 1: Create UserNav component**

Create `src/components/UserNav.tsx`:

```tsx
"use client"

import React from 'react'
import Link from 'next/link'

interface UserNavProps {
  email: string
  isAdmin?: boolean
  showLogout?: boolean
  onLogout?: () => void
  onLoginClick?: () => void
}

export default function UserNav({ email, isAdmin, showLogout, onLogout, onLoginClick }: UserNavProps) {
  if (!email && onLoginClick) {
    return (
      <button
        type="button"
        onClick={onLoginClick}
        className="nav__link nav__auth-btn-guest"
      >
        Entrar
      </button>
    )
  }

  if (!email) {
    return (
      <Link href="/minhas-consultas" className="nav__link nav__auth-btn-guest">
        Entrar
      </Link>
    )
  }

  return (
    <div className="nav__auth-logged">
      <span className="nav__user-email">{email}</span>
      {isAdmin && (
        <Link href="/admin" className="nav__admin-btn">
          Painel Admin
        </Link>
      )}
      {showLogout && onLogout ? (
        <button type="button" onClick={onLogout} className="nav__auth-btn nav__logout-btn">
          Sair
        </button>
      ) : (
        <Link href="/minhas-consultas" className="nav__auth-btn">
          Minhas Consultas
        </Link>
      )}
    </div>
  )
}
```

**Step 2: Add CSS for admin button and logout**

In `src/styles/components.css`, after `.nav__auth-btn-guest` (line ~386), add:

```css
.nav__admin-btn {
  background: var(--primitive-yellow-500);
  color: var(--primitive-black-900);
  font-family: var(--font-family-body);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 6px 12px;
  border-radius: 4px;
  text-decoration: none;
  border: none;
  transition: background var(--transition-fast);
}

.nav__admin-btn:hover {
  background: var(--color-interactive-primary-hover);
}

.nav__logout-btn {
  background: transparent;
  cursor: pointer;
  border-color: var(--color-text-inverse-muted);
  color: var(--color-text-inverse-muted);
}

.nav__logout-btn:hover {
  border-color: var(--color-text-inverse);
  color: var(--color-text-inverse);
}
```

**Step 3: Run tsc**

Run: `npx tsc --noEmit`
Expected: Clean

**Step 4: Commit**

```
feat: extract shared UserNav component
```

---

### Task 3: Integrate UserNav into landing Nav.tsx

**Files:**
- Modify: `src/components/landing/Nav.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Update Nav.tsx to use UserNav**

Replace `src/components/landing/Nav.tsx`:

```tsx
"use client"

import React from 'react';
import Link from 'next/link';
import LogoFundoPreto from '@/components/LogoFundoPreto';
import UserNav from '@/components/UserNav';

interface NavProps {
  userEmail: string;
  isAdmin?: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onLoginClick?: () => void;
}

export default function Nav({ userEmail, isAdmin, mobileMenuOpen, setMobileMenuOpen, onLoginClick }: NavProps) {
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
          <li onClick={closeMobileMenu}>
            <UserNav
              email={userEmail}
              isAdmin={isAdmin}
              onLoginClick={onLoginClick}
            />
          </li>
        </ul>
      </div>
    </nav>
  );
}
```

**Step 2: Update landing page.tsx to manage login modal state**

In `src/app/page.tsx`, add:
1. Import `RegisterModal` and its type
2. Add state for `loginModalOpen`, `isLoginLoading`, `isAdmin`
3. Check admin status in the existing auth check effect
4. Add `handleLoginClick` and `handleLoginSubmit` handlers
5. Pass `onLoginClick` and `isAdmin` to `Nav`
6. Render `RegisterModal` with `initialMode="login"` and `hideToggle`

Changes to `src/app/page.tsx`:
- Add imports: `RegisterModal, { type RegisterData }` from `@/components/RegisterModal`
- Add imports: `{ useRouter }` is already imported
- Add state: `const [loginModalOpen, setLoginModalOpen] = React.useState(false)`
- Add state: `const [isLoginLoading, setIsLoginLoading] = React.useState(false)`
- Add state: `const [isAdmin, setIsAdmin] = React.useState(false)`
- In the existing `checkSession` effect, after `setUserEmail`, add admin check:
  ```tsx
  if (data.isAdmin) setIsAdmin(true);
  ```
  Note: `/api/auth/me` may not return `isAdmin`. Check the endpoint — if not, we add it.
- Add handler:
  ```tsx
  const handleNavLoginSubmit = async (data: RegisterData) => {
    setIsLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro ao fazer login')
      setLoginModalOpen(false)
      router.push('/minhas-consultas')
    } catch (err) {
      throw err
    } finally {
      setIsLoginLoading(false)
    }
  }
  ```
- Update Nav rendering:
  ```tsx
  <Nav
    userEmail={userEmail}
    isAdmin={isAdmin}
    mobileMenuOpen={mobileMenuOpen}
    setMobileMenuOpen={setMobileMenuOpen}
    onLoginClick={() => setLoginModalOpen(true)}
  />
  ```
- Add RegisterModal before closing `</div>`:
  ```tsx
  <RegisterModal
    open={loginModalOpen}
    onOpenChange={setLoginModalOpen}
    onSubmit={handleNavLoginSubmit}
    isLoading={isLoginLoading}
    initialMode="login"
    hideToggle
  />
  ```

**Step 3: Add `initialMode` and `hideToggle` props to RegisterModal**

In `src/components/RegisterModal.tsx`:
- Add to interface: `initialMode?: 'register' | 'login'` and `hideToggle?: boolean`
- Change `useState` default: `const [mode, setMode] = useState<'register' | 'login'>(initialMode ?? 'register')`
- Wrap toggle paragraph with: `{!hideToggle && ( ... )}`
- When `hideToggle` is true and mode is 'login', change submit button text to just `'ENTRAR'` (without price)

**Step 4: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`

**Step 5: Commit**

```
feat: integrate login modal into landing nav via UserNav
```

---

### Task 4: Integrate UserNav into consulta/[term] and minhas-consultas navs

**Files:**
- Modify: `src/app/consulta/[term]/page.tsx` (nav section ~210-224)
- Modify: `src/app/minhas-consultas/page.tsx` (both nav sections)

**Step 1: Update consulta/[term] nav**

Replace the nav section (~lines 210-224) with:

```tsx
<nav className="nav" aria-label="Menu principal">
  <div className="nav__inner">
    <Link href="/" className="nav__logo" aria-label="E o Pix? — Pagina inicial">
      <LogoFundoPreto />
    </Link>
    <UserNav email={userEmail} />
  </div>
</nav>
```

Add import: `import UserNav from '@/components/UserNav'`

Remove the inline CSS classes `c-nav-email` and `c-nav-link` from the `<style jsx global>` block since they're no longer used.

**Step 2: Update minhas-consultas unauthenticated nav**

The unauthenticated view (~line 396-402) just has logo, keep as-is (no UserNav needed since user isn't logged in).

**Step 3: Update minhas-consultas authenticated nav**

Replace the authenticated nav (~lines 492-545) with:

```tsx
<nav className="nav" aria-label="Menu principal">
  <div className="nav__inner">
    <Link href="/" className="nav__logo" aria-label="E o Pix? — Página inicial">
      <LogoFundoPreto />
    </Link>
    <UserNav
      email={userEmail}
      isAdmin={isAdmin}
      showLogout
      onLogout={handleLogout}
    />
  </div>
</nav>
```

Remove the inline style blocks that were previously used for nav buttons.

**Step 4: Fix admin button reload bug**

In `minhas-consultas/page.tsx`, the `handleLoginSuccess` function:

```tsx
const handleLoginSuccess = async () => {
  setIsAuthenticated(true);
  try {
    const res = await fetch('/api/purchases');
    if (res.ok) {
      const data = await res.json();
      setPurchases(data.purchases || []);
      if (data.email) setUserEmail(data.email);
      if (data.isAdmin) setIsAdmin(true);
    }
  } catch {
    // ignore
  }
};
```

This replaces the old version that only called `fetchPurchases()` (which didn't return isAdmin).

**Step 5: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`

**Step 6: Commit**

```
feat: use UserNav across all pages, fix admin button reload bug
```

---

### Task 5: Refactor minhas-consultas page visually

**Files:**
- Modify: `src/app/minhas-consultas/page.tsx` (major rewrite of CardConsulta + main layout)
- Modify: `src/styles/components.css` (add `mc-*` classes)

**Step 1: Add CSS classes to components.css**

Add at the end of `src/styles/components.css`:

```css
/* ===== MINHAS CONSULTAS (mc-*) ===== */

.mc-page {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.mc-page--authed {
  background: var(--color-bg-secondary);
}

.mc-main {
  max-width: 800px;
  margin: 0 auto;
  padding: calc(64px + 40px) 24px 40px;
}

.mc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.mc-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mc-header__badge {
  display: inline-block;
  font-family: var(--font-family-body);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--primitive-black-900);
  background: var(--primitive-yellow-500);
  padding: 3px 10px;
  border-radius: 2px;
  align-self: flex-start;
  margin-bottom: 8px;
}

.mc-header__title {
  font-family: var(--font-family-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.mc-header__sub {
  font-family: var(--font-family-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.mc-new-btn {
  background: var(--primitive-yellow-500);
  color: var(--primitive-black-900);
  font-family: var(--font-family-body);
  font-size: 13px;
  font-weight: 700;
  padding: 12px 24px;
  border-radius: 6px;
  border: 2px solid var(--primitive-black-900);
  cursor: pointer;
  box-shadow: 3px 3px 0 0 var(--primitive-black-900);
  transition: all 0.15s ease;
}

.mc-new-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0 0 var(--primitive-black-900);
}

.mc-new-btn:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 0 var(--primitive-black-900);
}

.mc-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Card base */
.mc-card {
  background: var(--primitive-paper-50);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  border-left: 3px solid var(--color-border-subtle);
  padding: 20px 24px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mc-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.mc-card--completed { border-left-color: var(--primitive-green-500); }
.mc-card--processing { border-left-color: var(--primitive-yellow-500); }
.mc-card--pending { border-left-color: var(--primitive-yellow-500); }
.mc-card--failed { border-left-color: var(--primitive-red-500); }

.mc-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mc-card__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mc-card__badge {
  display: inline-block;
  font-family: var(--font-family-body);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 3px;
  letter-spacing: 0.3px;
  align-self: flex-start;
}

.mc-card__badge--completed {
  background: rgba(102, 204, 102, 0.15);
  color: #339933;
}

.mc-card__badge--processing {
  background: rgba(255, 214, 0, 0.15);
  color: #B87700;
}

.mc-card__badge--pending {
  background: rgba(255, 214, 0, 0.15);
  color: #B87700;
}

.mc-card__badge--failed {
  background: rgba(204, 51, 51, 0.15);
  color: #CC3333;
}

.mc-card__doc {
  font-family: var(--font-family-heading);
  font-size: 15px;
  font-weight: 700;
  color: var(--primitive-black-900);
  margin-top: 6px;
}

.mc-card__date {
  font-family: var(--font-family-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: 2px;
}

.mc-card__action-btn {
  background: var(--primitive-paper-50);
  color: var(--primitive-black-900);
  border: 2px solid var(--primitive-black-900);
  font-family: var(--font-family-body);
  font-size: 12px;
  font-weight: 700;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 2px 2px 0 0 var(--primitive-black-900);
  transition: all 0.15s ease;
}

.mc-card__action-btn:hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 0 var(--primitive-black-900);
}

/* Timeline (processing state) */
.mc-timeline {
  margin-top: 20px;
  padding: 20px 24px;
  background: var(--primitive-black-900);
  border-radius: 8px;
  position: relative;
}

.mc-timeline__list {
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
}

.mc-timeline__item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 10px 0;
  position: relative;
}

.mc-timeline__item:first-child { padding-top: 0; }
.mc-timeline__item:last-child { padding-bottom: 0; }

/* Vertical line connecting dots */
.mc-timeline__item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 24px;
  bottom: -2px;
  width: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.mc-timeline__item--done:not(:last-child)::after {
  background: rgba(102, 204, 102, 0.3);
}

.mc-timeline__item--active:not(:last-child)::after {
  background: rgba(255, 214, 0, 0.2);
}

/* Dots */
.mc-timeline__dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-timeline__dot--done {
  background: rgba(102, 204, 102, 0.2);
}

.mc-timeline__dot--done svg {
  width: 10px;
  height: 10px;
}

.mc-timeline__dot--active {
  background: var(--primitive-yellow-500);
  animation: mc-pulse 1.5s ease infinite;
}

.mc-timeline__dot--pending {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

@keyframes mc-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 214, 0, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(255, 214, 0, 0); }
}

.mc-timeline__label {
  font-family: var(--font-family-body);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  line-height: 1.4;
}

.mc-timeline__label--done {
  color: rgba(255, 255, 255, 0.6);
}

.mc-timeline__label--active {
  color: var(--primitive-yellow-500);
  font-weight: 600;
}

.mc-timeline__footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-family: var(--font-family-body);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
}

/* Empty state */
.mc-empty {
  background: var(--primitive-paper-50);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 60px 40px;
  text-align: center;
}

.mc-empty__icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.4;
}

.mc-empty__text {
  font-family: var(--font-family-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 20px;
}

/* Login card (unauthenticated state) */
.mc-login {
  padding-top: calc(64px + var(--primitive-space-10));
  padding-bottom: var(--primitive-space-12);
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mc-login__card {
  max-width: 440px;
  width: 100%;
  margin: 0 var(--primitive-space-6);
  background: var(--primitive-paper-50);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--primitive-radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  padding: 40px;
}

.mc-login__title {
  font-family: var(--font-family-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--primitive-black-900);
  text-align: center;
  margin: 0 0 8px;
}

.mc-login__sub {
  font-family: var(--font-family-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0 0 24px;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .mc-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .mc-card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .mc-main {
    padding-left: 16px;
    padding-right: 16px;
  }

  .mc-timeline {
    padding: 16px 18px;
  }
}
```

**Step 2: Rewrite CardConsulta component**

Replace the `CardConsulta` component in `src/app/minhas-consultas/page.tsx` with:

```tsx
function CardConsulta({ purchase, onViewReport }: CardConsultaProps) {
  const isProcessing = purchase.status === 'PROCESSING' || purchase.status === 'PAID';
  const currentStep = purchase.processingStep || 0;

  const getStatusKey = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'PROCESSING': case 'PAID': return 'processing';
      case 'PENDING': return 'pending';
      case 'FAILED': case 'REFUND_PENDING': return 'failed';
      default: return 'pending';
    }
  };

  const getBadgeLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'CONCLUIDO';
      case 'PROCESSING': case 'PAID': return 'PROCESSANDO';
      case 'PENDING': return 'AGUARDANDO PAGAMENTO';
      case 'FAILED': return 'FALHOU';
      case 'REFUND_PENDING': return 'REEMBOLSO PENDENTE';
      case 'EXPIRED': return 'EXPIRADO';
      default: return status;
    }
  };

  const statusKey = getStatusKey(purchase.status);

  return (
    <div className={`mc-card mc-card--${statusKey}`}>
      <div className="mc-card__header">
        <div className="mc-card__left">
          <span className={`mc-card__badge mc-card__badge--${statusKey}`}>
            {getBadgeLabel(purchase.status)}
          </span>
          <div className="mc-card__doc">
            {purchase.type}: {purchase.term}
          </div>
          <div className="mc-card__date">
            {new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>
        </div>

        <div>
          {purchase.status === 'COMPLETED' && purchase.hasReport && purchase.reportId && (
            <button
              type="button"
              onClick={() => onViewReport(purchase.reportId!)}
              className="mc-card__action-btn"
            >
              Ver Relatorio
            </button>
          )}
        </div>
      </div>

      {/* Processing Timeline */}
      {isProcessing && (
        <div className="mc-timeline">
          <div className="mc-timeline__list">
            {PROCESSING_STEPS.map((s) => {
              const isDone = currentStep > s.step;
              const isActive = currentStep === s.step;
              const itemClass = isDone ? 'mc-timeline__item--done' : isActive ? 'mc-timeline__item--active' : '';
              const labelClass = isDone ? 'mc-timeline__label--done' : isActive ? 'mc-timeline__label--active' : '';

              return (
                <div key={s.step} className={`mc-timeline__item ${itemClass}`}>
                  <div className={`mc-timeline__dot ${
                    isDone ? 'mc-timeline__dot--done' :
                    isActive ? 'mc-timeline__dot--active' :
                    'mc-timeline__dot--pending'
                  }`}>
                    {isDone && (
                      <svg viewBox="0 0 10 10" fill="none">
                        <polyline points="2,5 4,7.5 8,2.5" stroke="#66CC66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`mc-timeline__label ${labelClass}`}>
                    {s.label}
                    {isActive && ' ...'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mc-timeline__footer">
            Tempo estimado: ~2 min
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Rewrite main page layout**

Replace the authenticated return block of the main `Page` component to use CSS classes instead of inline styles. Key changes:
- Root: `<div className="mc-page mc-page--authed">`
- Main: `<main className="mc-main">`
- Header with badge: add `<span className="mc-header__badge">MEUS RELATORIOS</span>`
- "Nova Consulta" button: `className="mc-new-btn"`
- List: `<div className="mc-list">`
- Empty state: use `mc-empty` classes with SVG icon

Replace the unauthenticated return block to use CSS classes:
- Main: `<main className="mc-login">`
- Card: `<div className="mc-login__card">`
- Title: `<h1 className="mc-login__title">`
- Subtitle: `<p className="mc-login__sub">`

**Step 4: Remove all inline `style={{}}` from the page**

All inline styles should be replaced by the `mc-*` CSS classes above. Also remove the `<style jsx>` block that had the `@keyframes spin`.

**Step 5: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`

**Step 6: Commit**

```
feat: refactor minhas-consultas with CSS classes and vertical timeline
```

---

### Task 6: Refactor admin login page

**Files:**
- Modify: `src/app/admin/login/page.tsx`

**Step 1: Rewrite admin login with EOPIX design tokens**

Replace `src/app/admin/login/page.tsx`:

```tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import LogoFundoPreto from '@/components/LogoFundoPreto'

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao fazer login')
      }

      router.push('/admin')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="adm-login">
        <div className="adm-login__logo">
          <LogoFundoPreto />
        </div>

        <div className="adm-login__card">
          <div className="adm-login__badge">ADMIN</div>
          <h1 className="adm-login__title">Painel Administrativo</h1>
          <p className="adm-login__sub">Acesso restrito a administradores</p>

          <form onSubmit={handleSubmit} className="adm-login__form">
            {error && <div className="adm-login__error">{error}</div>}

            <div className="adm-login__field">
              <label htmlFor="adm-email" className="adm-login__label">E-mail</label>
              <input
                id="adm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@eopix.com"
                className="adm-login__input"
              />
            </div>

            <div className="adm-login__field">
              <label htmlFor="adm-password" className="adm-login__label">Senha</label>
              <div className="adm-login__input-wrap">
                <input
                  id="adm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimo 8 caracteres"
                  className="adm-login__input adm-login__input--has-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="adm-login__eye"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="adm-login__submit"
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
        </div>
      </div>

      <style jsx global>{`
        .adm-login {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 7px,
              rgba(255, 214, 0, 0.04) 7px,
              rgba(255, 214, 0, 0.04) 8px
            ),
            var(--primitive-black-900);
        }

        .adm-login__logo {
          margin-bottom: 32px;
        }

        .adm-login__card {
          width: 100%;
          max-width: 400px;
          background: var(--primitive-black-800);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
        }

        .adm-login__badge {
          display: inline-block;
          font-family: var(--font-family-body);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 2px;
          color: var(--primitive-black-900);
          background: var(--primitive-yellow-500);
          padding: 3px 12px;
          border-radius: 2px;
          margin-bottom: 16px;
        }

        .adm-login__title {
          font-family: var(--font-family-heading);
          font-size: 22px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 6px;
          line-height: 1.2;
        }

        .adm-login__sub {
          font-family: var(--font-family-body);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.4);
          margin: 0 0 24px;
        }

        .adm-login__form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .adm-login__field {
          text-align: left;
        }

        .adm-login__label {
          display: block;
          margin-bottom: 4px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          font-family: var(--font-family-body);
          font-size: 10px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .adm-login__input {
          width: 100%;
          padding: 10px 12px;
          background: var(--primitive-black-700);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #FFFFFF;
          font-family: var(--font-family-body);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .adm-login__input:focus {
          border-color: var(--primitive-yellow-500);
          box-shadow: 0 0 0 3px rgba(255, 214, 0, 0.15);
        }

        .adm-login__input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }

        .adm-login__input--has-icon {
          padding-right: 38px;
        }

        .adm-login__input-wrap {
          position: relative;
        }

        .adm-login__eye {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
        }

        .adm-login__eye:hover {
          color: rgba(255, 255, 255, 0.7);
        }

        .adm-login__error {
          color: var(--primitive-red-500);
          font-size: 12px;
          text-align: center;
          font-family: var(--font-family-body);
          padding: 8px 12px;
          background: rgba(204, 51, 51, 0.1);
          border: 1px solid rgba(204, 51, 51, 0.2);
          border-radius: 6px;
        }

        .adm-login__submit {
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
          box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.3);
          margin-top: 4px;
        }

        .adm-login__submit:hover:not(:disabled) {
          transform: translate(-1px, -1px);
          box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 0.3);
        }

        .adm-login__submit:active:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0 0 rgba(0, 0, 0, 0.3);
        }

        .adm-login__submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}
```

**Step 2: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`

**Step 3: Commit**

```
feat: refactor admin login with EOPIX branding and design tokens
```

---

### Task 7: Run E2E tests + final verification

**Step 1: Run tsc + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: Clean

**Step 2: Run vitest**

Run: `npx vitest run`
Expected: All passing

**Step 3: Run E2E (mock)**

Run: `npm run test:e2e:mock`
Expected: 26/26 passing. If any test references removed CSS classes or old selectors, update E2E tests.

**Step 4: Visual check via dev server**

Run: `npm run dev`
Check:
1. Landing page: "Entrar" opens login modal (no cadastro toggle)
2. Landing page: logged-in shows email + "Minhas Consultas" (+ "Painel Admin" if admin)
3. `/consulta/[term]`: nav shows UserNav with email
4. `/minhas-consultas`: processing cards show vertical timeline on dark bg
5. `/minhas-consultas`: completed cards have green left border + "Ver Relatorio" btn
6. `/minhas-consultas`: admin button shows without page reload after login
7. `/admin/login`: EOPIX branded dark login
8. Labels say "Noticias na Midia", "Reclamacoes Online", etc.

**Step 5: Final commit (if any E2E fixes needed)**

```
fix: update E2E tests for frontend refactor
```
