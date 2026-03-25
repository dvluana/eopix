---
phase: 01-admin-purchase-timeline
plan: 01
subsystem: ui
tags: [admin, timeline, dialog, react, next14, searchparams]

requires: []
provides:
  - Unified vertical timeline in PurchaseDetailsDialog replacing fragmented progress/timeline/failure boxes
  - URL-driven auto-open (?search=code) for admin compras page
affects: [02-observability, admin-panel]

tech-stack:
  added: []
  patterns:
    - buildTimeline() function composing status transitions + pipeline steps into a single TimelineEvent array
    - URL param -> state pre-fill -> auto-open dialog on single result

key-files:
  created: []
  modified:
    - src/app/admin/_components/PurchaseDetailsDialog.tsx
    - src/app/admin/(protected)/compras/page.tsx

key-decisions:
  - "Use inline styles with adm-tl- class prefixes (no admin CSS file exists in project)"
  - "Auto-open only when exactly one purchase matches search; multiple results let operator choose"

patterns-established:
  - "Timeline events typed as TimelineEvent { key, label, timestamp, status, detail, detailExpanded } for extensibility"

requirements-completed: [OBS-01]

duration: 20min
completed: 2026-03-25
---

# Phase 01 Plan 01: Admin Purchase Timeline Summary

**Unified vertical timeline dialog with inline pipeline steps, errors, and buyer info — plus URL ?search=code auto-open for direct purchase investigation.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-03-25T14:00:00Z
- **Completed:** 2026-03-25T14:20:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- PurchaseDetailsDialog rewritten with a single vertical timeline replacing three separate sections (progress, timeline, failure box)
- Buyer name and report link (FileText icon) now visible in info header per D-10
- Errors appear inline in timeline with Portuguese messages and expandable technical details
- URL ?search=code auto-opens the details dialog when exactly one purchase matches

## Task Commits

1. **Task 1: Rewrite PurchaseDetailsDialog with unified timeline** - `ae60372` (feat)
2. **Task 2: Add URL-driven auto-open in compras page** - `2497db0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `src/app/admin/_components/PurchaseDetailsDialog.tsx` - Unified timeline with buildTimeline(), buyer name, report link, inline errors
- `src/app/admin/(protected)/compras/page.tsx` - useSearchParams pre-fill + autoOpenDone ref + auto-open useEffect

## Decisions Made

- Used inline styles with `adm-tl-` CSS class prefixes since no admin.css file exists in project
- Auto-open triggers only when exactly one purchase matches (multiple results require manual selection)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin investigation of individual purchases now works from a single screen
- URL linking (/admin/compras?search=CODE) enables direct deeplinks from alerts or emails
- Ready for Phase 02 (Sentry observability) which will add structured error context

## Self-Check: PASSED

- `src/app/admin/_components/PurchaseDetailsDialog.tsx` - exists, verified
- `src/app/admin/(protected)/compras/page.tsx` - exists, verified
- Commit ae60372 - exists in git log
- Commit 2497db0 - exists in git log
- tsc --noEmit - zero errors
- npm run lint - no warnings or errors
- npx vitest run - 108/108 tests pass

---
*Phase: 01-admin-purchase-timeline*
*Completed: 2026-03-25*
