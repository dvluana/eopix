# Admin Panel Refactor — MCP Local Test Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify all admin panel refactor corrections work correctly on localhost using MCP tools (chrome-devtools for UI, Neon for DB).

**Architecture:** Start local dev server with `MOCK_MODE=true`, seed a test admin user with known password, then systematically test each fix using browser automation (chrome-devtools MCP) and database inspection (Neon MCP against develop branch `br-jolly-union-aiu70ein`).

**Tech Stack:** chrome-devtools MCP, Neon MCP (project `sweet-haze-72592464`, branch `br-jolly-union-aiu70ein`), Next.js dev server

---

## Pre-requisites

- Branch: `develop` (all refactor commits already committed)
- Neon develop branch: `br-jolly-union-aiu70ein`
- Chrome browser running with DevTools protocol enabled
- No process on port 3000

---

## Task 1: Setup — seed admin + start dev server

**Step 1: Seed test admin user in Neon develop**

Use Neon MCP `run_sql` against project `sweet-haze-72592464`, branch `br-jolly-union-aiu70ein`:

```sql
-- Check if test admin already exists
SELECT id, email FROM "AdminUser" WHERE email = 'test-admin@eopix.test';
```

If not found, generate a bcrypt hash locally and insert:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TestAdmin!2026', 10).then(h => console.log(h))"
```

```sql
INSERT INTO "AdminUser" (id, email, name, "passwordHash", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'test-admin@eopix.test', 'Test Admin', '<bcrypt_hash>', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
```

**Step 2: Start dev server with MOCK_MODE**

```bash
# Kill any existing process on port 3000
lsof -ti :3000 | xargs kill -9 2>/dev/null

# Start dev server (background)
cd /Users/luana/Documents/Code\ Projects/eopix
MOCK_MODE=true npm run dev &
```

Wait for server to be ready:

```bash
# Poll until health responds
curl -s http://localhost:3000/api/health | head -1
```

**Step 3: Verify health endpoint via curl**

```bash
curl -s http://localhost:3000/api/health | python3 -m json.tool
```

Expected: JSON with `mode: "mock"`, services array includes `inngest`, does NOT include `brevo`.

---

## Task 2: Test health endpoint (API structure)

**Step 1: Navigate to health API in browser**

Use chrome-devtools MCP:

```
navigate_page → http://localhost:3000/api/health
```

**Step 2: Parse and verify response**

Use `evaluate_script`:

```js
(() => {
  const data = JSON.parse(document.body.innerText);
  const serviceNames = data.services.map(s => s.service);
  return {
    status: data.status,
    mode: data.mode,
    paymentProvider: data.paymentProvider,
    services: serviceNames,
    hasInngest: serviceNames.includes('inngest'),
    hasBrevo: serviceNames.includes('brevo'),
    apifull: data.services.find(s => s.service === 'apifull'),
    serper: data.services.find(s => s.service === 'serper'),
  };
})()
```

**Verify:**
1. `services` contains: `database`, `apifull`, `serper`, `openai`, `inngest`, `payment`
2. `services` does NOT contain `brevo`
3. `apifull.balance.current` > 0 (mock returns 150)
4. `apifull.balance.unit` = `"BRL"`
5. `serper.balance.current` > 0 (mock returns 2500)
6. `serper.balance.unit` = `"credits"`
7. `inngest.status` = `"up"`
8. `paymentProvider` = `"abacatepay"`

**Step 3: Screenshot the health JSON**

```
take_screenshot
```

---

## Task 3: Test admin login + session security

**Step 1: Navigate to admin login**

```
navigate_page → http://localhost:3000/admin/login
take_screenshot
```

Verify: login form renders with email and password fields.

**Step 2: Login with test admin**

Use chrome-devtools MCP `take_snapshot` to get UIDs, then:

```
fill → email input → test-admin@eopix.test
fill → password input → TestAdmin!2026
click → submit button
```

Verify: redirects to `/admin` (dashboard page).

**Step 3: Verify session cookie**

Use `evaluate_script`:

```js
(() => {
  const cookies = document.cookie.split(';').map(c => c.trim());
  const session = cookies.find(c => c.startsWith('eopix_session='));
  return {
    hasSession: !!session,
    allCookies: cookies
  };
})()
```

Verify: `eopix_session` cookie exists.

**Step 4: Screenshot dashboard**

```
take_screenshot
```

Verify: dashboard renders with revenue stats, purchase counts, recent purchases using StatusBadge components.

---

## Task 4: Test admin health page (UI)

**Step 1: Navigate to health page**

```
navigate_page → http://localhost:3000/admin/health
```

**Step 2: Screenshot and verify**

```
take_screenshot
```

Verify:
1. APIFull shows balance in R$ format (mock: "R$ 150,00" or similar)
2. Serper shows credits count (mock: "2500 credits" or similar)
3. Inngest service is listed and shows healthy status
4. No "Brevo" service listed anywhere
5. No "Stripe" text anywhere on the page
6. No AdminError component (red error state) visible

**Step 3: Check for Stripe/Brevo text**

Use `evaluate_script`:

```js
(() => {
  const text = document.body.innerText.toLowerCase();
  return {
    hasStripe: text.includes('stripe'),
    hasBrevo: text.includes('brevo'),
  };
})()
```

Expected: both `false`.

---

## Task 5: Test compras page (toasts, refund UX, Stripe removal)

**Step 1: Navigate to compras**

```
navigate_page → http://localhost:3000/admin/compras
```

```
take_screenshot
```

Verify: purchase list renders (may be empty in dev). StatusBadge components visible if purchases exist.

**Step 2: Override alert() to detect browser alerts**

Use `evaluate_script`:

```js
(() => {
  window._alertCalled = false;
  window._alertMessages = [];
  window._origAlert = window.alert;
  window.alert = (msg) => {
    window._alertCalled = true;
    window._alertMessages.push(msg);
  };
  window._confirmCalled = false;
  window._origConfirm = window.confirm;
  window.confirm = (msg) => {
    window._confirmCalled = true;
    return false;
  };
  return 'Alert/confirm intercepted';
})()
```

**Step 3: Verify no Stripe references**

Use `evaluate_script`:

```js
(() => {
  const text = document.body.innerText;
  return {
    hasStripe: text.toLowerCase().includes('stripe'),
    hasStripePII: text.includes('stripePaymentIntentId'),
  };
})()
```

Expected: both `false`.

**Step 4: Test purchase actions (if purchases exist)**

If there are purchases visible, use `take_snapshot` to find action buttons, then:

1. Click the three-dot menu (MoreVertical icon) on any purchase
2. Screenshot the dropdown menu
3. If "Reembolsar" option exists, click it
4. Verify dialog text contains "AbacatePay" (not Stripe)
5. Verify button text is "Marcar como Reembolsado"
6. Screenshot dialog
7. Close dialog

**Step 5: Verify no alerts were triggered**

```js
(() => {
  return {
    alertCalled: window._alertCalled,
    alertMessages: window._alertMessages,
    confirmCalled: window._confirmCalled,
  };
})()
```

Expected: all false/empty.

---

## Task 6: Test blocklist page (Zod validation, toast)

**Step 1: Navigate to blocklist**

```
navigate_page → http://localhost:3000/admin/blocklist
take_screenshot
```

**Step 2: Override alert() again (new page load resets it)**

Same `evaluate_script` as Task 5 Step 2.

**Step 3: Test empty submission**

Use `take_snapshot` to get UIDs, then click the add/submit button without filling fields.

Verify: error toast appears (not browser alert). Check `window._alertCalled` is still `false`.

**Step 4: Test invalid document**

Fill the document input with `"12345"` and submit.

Verify: toast error message appears (e.g., "Documento invalido" or Zod error). No browser alert.

**Step 5: Screenshot showing toast error**

```
take_screenshot
```

---

## Task 7: Test leads page (filter, CSV export)

**Step 1: Navigate to leads**

```
navigate_page → http://localhost:3000/admin/leads
take_screenshot
```

**Step 2: Verify filter is free-text input**

Use `evaluate_script`:

```js
(() => {
  // Check for text input (not select dropdown)
  const inputs = Array.from(document.querySelectorAll('input'));
  const filterInput = inputs.find(i =>
    i.placeholder?.toLowerCase().includes('motivo') ||
    i.placeholder?.toLowerCase().includes('filtrar') ||
    i.placeholder?.toLowerCase().includes('reason')
  );
  const selects = Array.from(document.querySelectorAll('select'));
  const filterSelect = selects.find(s =>
    s.name?.includes('reason') || s.id?.includes('reason')
  );
  return {
    hasFilterInput: !!filterInput,
    filterInputPlaceholder: filterInput?.placeholder,
    hasFilterSelect: !!filterSelect,
  };
})()
```

Expected: `hasFilterInput: true`, `hasFilterSelect: false`.

**Step 3: Test CSV export button**

Use `take_snapshot` to find the export button, click it.

Verify: no browser alert, button works (download triggers or "no data" toast if empty).

---

## Task 8: Verify Stripe fully removed (DB + routes)

**Step 1: Check Prisma default via Neon**

Use Neon MCP `run_sql`:

```sql
SELECT column_default FROM information_schema.columns
WHERE table_name = 'Purchase' AND column_name = 'paymentProvider';
```

Expected: `'abacatepay'::text` (not `'stripe'::text`).

**Step 2: Check Stripe webhook route returns 404**

```
navigate_page → http://localhost:3000/api/webhooks/stripe
```

Expected: 404 page (route file was deleted).

**Step 3: Verify no Stripe in health response**

Use `evaluate_script` on health API:

```
navigate_page → http://localhost:3000/api/health
```

```js
(() => {
  const data = JSON.parse(document.body.innerText);
  return {
    paymentProvider: data.paymentProvider,
    hasStripeService: data.services.some(s => s.service === 'stripe'),
  };
})()
```

Expected: `paymentProvider: "abacatepay"`, `hasStripeService: false`.

---

## Task 9: Final summary

**Step 1: Screenshots of all admin pages**

Navigate and screenshot each:
1. `/admin` (dashboard)
2. `/admin/health`
3. `/admin/compras`
4. `/admin/blocklist`
5. `/admin/leads`

**Step 2: Cleanup**

Kill dev server:

```bash
lsof -ti :3000 | xargs kill -9 2>/dev/null
```

Delete test admin from Neon develop:

```sql
DELETE FROM "AdminUser" WHERE email = 'test-admin@eopix.test';
```

**Step 3: Create summary checklist**

| Fix | Status | Evidence |
|-----|--------|----------|
| Health: APIFull balance parsing (mock R$150) | | evaluate_script |
| Health: Serper credits parsing (mock 2500) | | evaluate_script |
| Health: Inngest check added | | evaluate_script |
| Health: Brevo removed | | evaluate_script |
| Security: 8h admin session cookie | | cookie inspection |
| Security: JWT no dev fallback | | (app runs = env var present) |
| Stripe: webhook route 404 | | browser navigation |
| Stripe: DB default = abacatepay | | Neon SQL query |
| Stripe: no UI references anywhere | | JS text search |
| Toast: no browser alert() calls | | alert override test |
| Refund: shows AbacatePay message | | screenshot (if purchases exist) |
| Blocklist: Zod validation errors | | toast screenshot |
| Leads: free-text filter input | | DOM inspection |
| Leads: CSV export works | | button click |
| Shared: StatusBadge renders | | visual on compras |
| Shared: AdminError (visible only on failure) | | (not visible = healthy) |
