# VitePress to Mintlify Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace VitePress with Mintlify as the documentation engine, using the globally-installed `mint` CLI.

**Architecture:** Mintlify is a standalone docs platform that reads `docs.json` config + markdown/MDX files. It cannot be installed as a project dev dependency (React conflict with Next.js), so it uses the global `mint` CLI (`npm i -g mint`, already installed v4.2.415). The `npm run docs` script will `cd` into `docs/` and run `mint dev`. All existing markdown content stays as-is — only config and the homepage need changes.

**Tech Stack:** Mintlify CLI (global), MDX/Markdown, docs.json config

**Key constraint:** Mintlify must run from *inside* the `docs/` directory (not as argument). The `docs.json` file goes in `docs/`, not project root.

---

### Task 1: Remove VitePress

**Files:**
- Delete: `docs/.vitepress/config.mts`
- Delete: `docs/.vitepress/` (entire directory)
- Modify: `package.json` (remove vitepress devDependency)

**Step 1: Uninstall VitePress**

Run: `cd "/Users/luana/Documents/Code Projects/eopix" && npm uninstall vitepress`
Expected: `removed N packages` — no errors

**Step 2: Delete VitePress config directory**

Run: `rm -rf "/Users/luana/Documents/Code Projects/eopix/docs/.vitepress"`
Expected: directory removed

**Step 3: Verify removal**

Run: `ls docs/.vitepress 2>&1`
Expected: `No such file or directory`

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove vitepress dependency"
```

---

### Task 2: Create Mintlify config (docs.json)

**Files:**
- Create: `docs/docs.json`

**Step 1: Create docs.json**

Create `docs/docs.json` with this exact content:

```json
{
  "$schema": "https://mintlify.com/docs.json",
  "theme": "venus",
  "name": "EOPIX Docs",
  "colors": {
    "primary": "#7C3AED",
    "light": "#A78BFA",
    "dark": "#5B21B6"
  },
  "navigation": {
    "tabs": [
      {
        "tab": "Wiki",
        "groups": [
          {
            "group": "Wiki",
            "pages": [
              "wiki/index",
              "wiki/setup",
              "wiki/testing",
              "wiki/deploy",
              "wiki/admin",
              "wiki/inngest",
              "wiki/claude-workflow"
            ]
          }
        ]
      },
      {
        "tab": "Specs",
        "groups": [
          {
            "group": "Specs de Produto",
            "pages": [
              "specs/purchase-flow",
              "specs/report-pipeline",
              "specs/auth"
            ]
          }
        ]
      },
      {
        "tab": "Referencia",
        "groups": [
          {
            "group": "Referencia",
            "pages": [
              "architecture",
              "custos-e-fluxo-processamento",
              "modos-de-execucao",
              "status"
            ]
          },
          {
            "group": "API Contracts",
            "pages": [
              "api-contracts/cpf-cadastral",
              "api-contracts/cpf-financeiro",
              "api-contracts/cpf-processos",
              "api-contracts/cnpj-dossie",
              "api-contracts/cnpj-financeiro"
            ]
          }
        ]
      }
    ]
  }
}
```

**Step 2: Verify JSON is valid**

Run: `cd "/Users/luana/Documents/Code Projects/eopix" && node -e "JSON.parse(require('fs').readFileSync('docs/docs.json','utf8')); console.log('valid')"`
Expected: `valid`

---

### Task 3: Create .mintignore

**Files:**
- Create: `docs/.mintignore`

**Step 1: Create .mintignore**

Create `docs/.mintignore` to exclude non-doc files from Mintlify processing:

```
# Archived/legacy docs
archive/

# Implementation plans (internal)
plans/

# External crawled docs (reference only)
external/

# README files in subdirectories
api-contracts/README.md
```

---

### Task 4: Convert homepage (index.md)

**Files:**
- Modify: `docs/index.md`

**Step 1: Replace VitePress frontmatter with Mintlify MDX**

Replace the entire content of `docs/index.md` with:

```markdown
---
title: EOPIX Docs
description: Documentacao operacional e specs do EOPIX
---

<CardGroup cols={2}>
  <Card title="Setup" icon="gear" href="/wiki/setup">
    Scripts, env vars, como rodar
  </Card>
  <Card title="Testing" icon="flask" href="/wiki/testing">
    Modos, credenciais, E2E, CI
  </Card>
  <Card title="Deploy" icon="rocket" href="/wiki/deploy">
    Workflow develop → main → Vercel
  </Card>
  <Card title="Admin" icon="shield" href="/wiki/admin">
    Painel admin, endpoints, operacoes
  </Card>
  <Card title="Inngest" icon="clock" href="/wiki/inngest">
    Jobs, debug, como adicionar
  </Card>
  <Card title="Claude Workflow" icon="robot" href="/wiki/claude-workflow">
    Hooks, skills, como interagir
  </Card>
</CardGroup>
```

---

### Task 5: Add frontmatter to wiki pages that lack title

**Files:**
- Modify: `docs/wiki/index.md` (add frontmatter if missing `title`)
- Check: all wiki/*.md and specs/*.md pages

**Step 1: Check which pages already have frontmatter**

Run: `head -3 docs/wiki/*.md docs/specs/*.md`

Mintlify uses the first `# Heading` as page title if no frontmatter `title` is set, so standard markdown headings work fine. Only add frontmatter if the page has no heading AND no frontmatter.

**Step 2: If any page has neither a `# Heading` nor `title:` frontmatter, add a frontmatter block:**

```yaml
---
title: "Page Title Here"
---
```

Most wiki pages already start with `# Heading` so this step is likely a no-op.

---

### Task 6: Update package.json scripts and .gitignore

**Files:**
- Modify: `package.json` (scripts)
- Modify: `.gitignore`

**Step 1: Update docs script in package.json**

Change:
```json
"docs": "vitepress dev docs",
"docs:build": "vitepress build docs",
```
To:
```json
"docs": "cd docs && mint dev --port 3333",
```

Remove `docs:build` — Mintlify handles builds via its platform (not needed locally).

**Step 2: Update .gitignore**

Replace:
```
# vitepress
docs/.vitepress/dist/
docs/.vitepress/cache/
```
With:
```
# mintlify
.mintlify/
```

---

### Task 7: Test Mintlify dev server

**Step 1: Start dev server**

Run: `cd "/Users/luana/Documents/Code Projects/eopix/docs" && mint dev --port 3333`

Expected: Server starts at `http://localhost:3333` with hot reload.

**Important:** First run downloads ~900 packages via npx-like mechanism. Give it 30-60 seconds.

**Step 2: Verify pages load**

Open in browser (or use Chrome MCP):
- `http://localhost:3333` — homepage with cards
- `http://localhost:3333/wiki/setup` — wiki page
- `http://localhost:3333/specs/purchase-flow` — spec page
- `http://localhost:3333/architecture` — reference page

**Step 3: If any page errors, check:**
- Page path in `docs.json` matches actual file path (without `.md` extension)
- File has valid markdown (no VitePress-specific syntax remaining)
- `.mintignore` isn't excluding wanted files

**Step 4: Stop server**

Ctrl+C

---

### Task 8: Commit

**Step 1: Stage and commit all changes**

```bash
git add docs/docs.json docs/.mintignore docs/index.md package.json package-lock.json .gitignore
git status
git commit -m "feat: migrate docs from VitePress to Mintlify

- docs.json with tabs (Wiki, Specs, Referencia)
- .mintignore excludes archive/, plans/, external/
- Homepage converted to Mintlify CardGroup
- npm run docs now uses mint CLI (global, port 3333)
- VitePress removed"
```

---

## Notes

- **Why global install:** Mintlify as `devDependency` conflicts with Next.js (both ship React, they collide in shared `node_modules`). Global install or `npx mint` runs in isolated environment.
- **Markdown compatibility:** Mintlify reads standard `.md` files. No need to rename to `.mdx` unless using JSX components beyond built-in ones (Card, CardGroup, etc).
- **Mermaid:** Mintlify supports Mermaid diagrams natively in code blocks (same as VitePress), so `architecture.md` diagrams should render without changes.
- **No hosted deployment needed:** This plan is for local dev preview only (`mint dev`). Mintlify's hosted platform is optional.
- **Theme options:** `venus` chosen for clean look. Alternatives: `mint`, `maple`, `palm`, `willow`, `linden`, `almond`, `aspen`, `sequoia`, `luma`.
