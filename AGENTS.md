# AGENTS.md

This file defines mandatory operating rules for contributors and coding agents in this repository.

## 1. Branch And Commit Policy

- Active working branch is `develop`.
- Commits must be created on `develop`.
- Do not commit directly to `main`.

## 2. Neon Database Policy

- For development and testing, always use Neon branch `develop`.
- Neon branch `main` is production-only.
- Never run development migrations/seeds against Neon `main`.

## 3. MCP Usage Policy

When available, prefer MCP tools over ad-hoc/manual flows:

- `neon` MCP for project/branch/database inspection and connection details.
- `vercel` MCP for deployment/runtime checks.
- `stripe` MCP for account/product/price/runtime support tasks.
- `chrome` MCP for browser diagnostics and end-to-end investigation.

## 4. API Documentation Source Of Truth

- Canonical API reference: `docs/valores apis e dados.md`.
- Postman collections are auxiliary artifacts only.
- Any endpoint/contract change must update `docs/valores apis e dados.md` in the same change set.

## 5. Documentation Hygiene

- Keep canonical docs small and current.
- Move outdated docs to `docs/archive/legacy-2026/` instead of deleting history.
- Do not reference archived docs as current product behavior.
