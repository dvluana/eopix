---
globs: src/lib/callmebot.ts
---

# Callmebot WhatsApp Alert Module

Callmebot WhatsApp alert module for pipeline notifications.

## Key details

- Fire-and-forget pattern — callers use `.catch()`, never `await` in critical paths
- 3 recipients via env vars: `CALLMEBOT_PHONE`/`CALLMEBOT_API_KEY`, `_2`, `_3`
- Recipients with missing phone or apiKey are skipped silently (no throw)
- Uses `Sentry.captureException` for individual recipient failures
- `encodeURIComponent` required for phone, text, and apikey params

## After editing

Update `docs/status.md` with any changes to behavior or env var requirements.
