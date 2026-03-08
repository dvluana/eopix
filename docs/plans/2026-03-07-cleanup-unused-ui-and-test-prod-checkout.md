# Cleanup Dead UI Components + Test Prod Checkout

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove 40 unused shadcn/ui components and 27 unused packages to fix dev server bloat (2.4GB RAM, 139% CPU), then test AbacatePay production mode checkout via Chrome MCP.

**Architecture:** Delete dead `src/components/ui/` files, uninstall corresponding Radix + extra packages, verify build/lint/tests, then swap API key to prod and test customer data flow on checkout page.

**Tech Stack:** Next.js 14, shadcn/ui, Radix UI, AbacatePay v1 API

---

## Context

### Root Cause
Dev server uses 2.4GB RAM / 139% CPU for a 197-file project. Investigation found **40 of 46 shadcn/ui components are dead code**, each importing a Radix package. Turbopack compiles all files in dev mode regardless of usage.

### Components to KEEP (6)
| Component | Used by | Radix dep |
|---|---|---|
| `button.tsx` | 7 files | `@radix-ui/react-slot` |
| `input.tsx` | 3 files | none |
| `dialog.tsx` | 3 files | `@radix-ui/react-dialog` |
| `select.tsx` | 2 files | `@radix-ui/react-select` |
| `label.tsx` | 1 file | `@radix-ui/react-label` |
| `badge.tsx` | 1 file | `@radix-ui/react-slot` |

Note: `@radix-ui/react-toast` is used directly by `src/app/admin/_components/Toast.tsx` (not via ui/).

### Components to DELETE (40)
accordion, alert-dialog, alert, aspect-ratio, avatar, breadcrumb, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

### Radix packages to REMOVE (22)
```
@radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio
@radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible
@radix-ui/react-context-menu @radix-ui/react-dropdown-menu @radix-ui/react-hover-card
@radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover
@radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area
@radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch
@radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group
@radix-ui/react-tooltip
```

### Extra packages to REMOVE (5)
```
recharts cmdk vaul input-otp sonner
```

### Radix packages to KEEP (5)
```
@radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-label
@radix-ui/react-select @radix-ui/react-toast
```

---

## Task 1: Delete unused UI component files

**Files:**
- Delete: 40 files in `src/components/ui/` (list above)

**Step 1: Delete all 40 unused component files**

```bash
cd src/components/ui && rm -f \
  accordion.tsx alert-dialog.tsx alert.tsx aspect-ratio.tsx avatar.tsx \
  breadcrumb.tsx calendar.tsx card.tsx carousel.tsx chart.tsx \
  checkbox.tsx collapsible.tsx command.tsx context-menu.tsx drawer.tsx \
  dropdown-menu.tsx form.tsx hover-card.tsx input-otp.tsx menubar.tsx \
  navigation-menu.tsx pagination.tsx popover.tsx progress.tsx \
  radio-group.tsx resizable.tsx scroll-area.tsx separator.tsx \
  sheet.tsx sidebar.tsx skeleton.tsx slider.tsx sonner.tsx \
  switch.tsx table.tsx tabs.tsx textarea.tsx toggle.tsx \
  toggle-group.tsx tooltip.tsx
```

**Step 2: Verify only 6 files remain**

```bash
ls src/components/ui/
# Expected: badge.tsx button.tsx dialog.tsx input.tsx label.tsx select.tsx utils.ts
```

**Step 3: Run tsc to verify no broken imports**

```bash
npx tsc --noEmit
# Expected: clean (no errors)
```

If tsc finds broken imports, it means a file we thought was unused actually IS used — add it back.

**Step 4: Commit**

```bash
git add -A src/components/ui/
git commit -m "chore: delete 40 unused shadcn/ui components"
```

---

## Task 2: Uninstall unused packages

**Files:**
- Modify: `package.json`

**Step 1: Uninstall 22 Radix packages + 5 extra**

```bash
npm uninstall \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dropdown-menu @radix-ui/react-hover-card \
  @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover \
  @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area \
  @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch \
  @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group \
  @radix-ui/react-tooltip \
  recharts cmdk vaul input-otp sonner
```

**Step 2: Verify KEEP packages still installed**

```bash
node -e "const p=require('./package.json').dependencies; ['@radix-ui/react-slot','@radix-ui/react-dialog','@radix-ui/react-label','@radix-ui/react-select','@radix-ui/react-toast'].forEach(d => console.log(d, p[d] || 'MISSING!'))"
# Expected: all 5 show version numbers, none say MISSING
```

**Step 3: Run tsc + lint**

```bash
npx tsc --noEmit && npm run lint
# Expected: both clean
```

**Step 4: Run vitest**

```bash
npx vitest run
# Expected: all tests pass (72/72 or similar)
```

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: uninstall 27 unused packages (22 Radix + 5 extra)"
```

---

## Task 3: Verify dev server performance improvement

**Step 1: Clear stale cache**

```bash
rm -rf .next/cache/webpack/client-production .next/cache/webpack/server-production .next/cache/webpack/edge-server-production
```

**Step 2: Start dev server and measure**

```bash
MOCK_MODE=true npm run dev &
sleep 20
# Check RSS and CPU
ps aux | grep next-server | grep -v grep | awk '{printf "CPU=%.0f%% RSS=%dMB\n", $3, $6/1024}'
curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost:3000/
kill %1
```

**Expected:** RSS < 800MB, CPU drops to <10% after initial compile, HTTP 200.
**Before:** RSS=2483MB, CPU=139% after 14s, HTTP timeout.

**Step 3: Commit if needed (no code change, just verification)**

---

## Task 4: Test AbacatePay production checkout via Chrome MCP

**Goal:** Verify customer data (name, email, cellphone, taxId) appears correctly on AbacatePay checkout page when using production API key.

**Step 1: Swap API key to production**

In `.env.local`, replace `ABACATEPAY_API_KEY=abc_dev_*` with the production key from `.env.production.local`.

**Step 2: Restart dev server**

```bash
# Kill existing, start with prod key + mock APIs + real payment
MOCK_MODE=true BYPASS_PAYMENT=false npm run dev
```

**Step 3: Clear cookies and navigate**

Via Chrome MCP:
1. Navigate to `http://localhost:3000/consulta/12345678909`
2. Clear `eopix_session` cookie
3. Reload page

**Step 4: Fill registration modal with unique test data**

Click "DESBLOQUEAR", fill:
- Nome: `Teste Producao EOPIX`
- Email: `teste-prod-checkout@eopix.test`
- Celular: `21987654321`
- CPF/CNPJ: use a **new CPF never used before** (e.g. `52998224725`)
- Senha: `senhateste123`
- Confirmar senha: `senhateste123`

Submit the form.

**Step 5: Verify on AbacatePay checkout page**

Take screenshot. Expected customer data:
- Nome: `Teste Producao EOPIX`
- Email: `teste-prod-checkout@eopix.test`
- Telefone: `(21) 98765-4321`
- CPF/CNPJ: `529.982.247-25`

If shows correct data → confirms prod mode works. If shows "Test User" → sandbox was the issue.

**Step 6: DO NOT PAY — just verify the data, then close the tab.**

**Step 7: Revert API key to dev**

```bash
cp .env.local.bak .env.local
# or manually swap back to abc_dev_* key
```

**Step 8: Restart dev server with dev key**

```bash
# Kill and restart with normal dev setup
npm run dev
```

---

## Summary

| Task | What | Risk |
|---|---|---|
| 1 | Delete 40 dead UI files | Low — verified zero imports |
| 2 | Uninstall 27 packages | Low — tsc + vitest catch breaks |
| 3 | Verify perf improvement | Zero — read-only measurement |
| 4 | Test prod checkout | Low — don't pay, just verify data |
