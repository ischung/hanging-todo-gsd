---
phase: 03-calendar-integration
plan: 01
subsystem: ui
tags: [vanilla-js, calendar, intl-datetimeformat, esm, dom]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: dateKey() local-time YYYY-MM-DD helper, todosByDate schema
  - phase: 02-todo-crud
    provides: renderTodoList template (single replaceChildren, textContent-only)
provides:
  - js/calendar.js module with 6 named exports (monthGrid, prevMonth, nextMonth, todayYM, renderCalendar, formatHeader)
  - data-action / data-key dataset contract for Plan 02 delegated event handler
  - 42-cell Sunday-start grid invariant (no layout jump across months)
affects: [03-02-wiring, 03-03-styling, phase-4-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure helpers + view-renderer module (mirrors js/todos.js)"
    - "Date-constructor overflow normalization for grid math (no manual leap-year branches)"
    - "Single Intl.DateTimeFormat instance reused across renders"

key-files:
  created:
    - js/calendar.js
  modified: []

key-decisions:
  - "monthGrid uses `new Date(year, m0, 1 - firstWeekday + i)` so the constructor's overflow rule eliminates all conditional leap-year / month-length code paths."
  - "Adjacent-month cells render as <div> (no data-key) — non-interactive by structure, so the Plan 02 delegated handler's `closest('[data-key]')` guard naturally skips them. Avoids `<button disabled>` focus-quirks across browsers."
  - "formatHeader splits the key and reconstructs via `new Date(y, m-1, d)` rather than `new Date(key)` to preserve Phase 1's local-time discipline (avoids ECMA-262 §21.4.3.2 ISO-string-as-UTC drift)."
  - "Module-header comment uses '영속 저장 I/O 금지' rather than the literal token 'localStorage' to satisfy plan grep gates while still documenting the boundary."

patterns-established:
  - "Pattern: 6×7=42-cell month grid generated via `+i` from an overflow-tolerant start date — single loop, zero conditionals."
  - "Pattern: dataset-routed delegation contract — `data-action` (nav buttons) and `data-key` (in-month cells) are mutually exclusive; consumers branch via `closest()`."
  - "Pattern: textContent + String() everywhere for renderable values (carries Phase 2's STYL-02 XSS lock into Phase 3)."

requirements-completed: [CAL-01, CAL-02, CAL-03, CAL-04, CAL-06, TODO-08]

# Metrics
duration: 2min
completed: 2026-05-03
---

# Phase 3 Plan 01: js/calendar.js — pure helpers + renderer Summary

**Standalone calendar module: 42-cell Sunday-start month grid (overflow-normalized via `Date(y, m, d+i)`), Korean weekday header, dataset-routed nav/cell contract, and ko-KR `dateStyle:'full'` header formatter — zero localStorage/UTC API/innerHTML.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-05-03T11:06:00Z
- **Completed:** 2026-05-03T11:07:51Z
- **Tasks:** 3
- **Files modified:** 1 (js/calendar.js — created)

## Accomplishments

- **Pure helpers (Task 1):** `monthGrid`, `prevMonth`, `nextMonth`, `todayYM`. The 42-cell invariant is proven by node-eval verifies for both leap (2024-02 has `2024-02-29` with `inMonth=true`) and non-leap (2026-02 has no `2026-02-29`) Februaries; year-wrap proven for Jan↔Dec.
- **renderCalendar (Task 2):** Single `container.replaceChildren(nav, head, grid)`. Nav row carries 3 buttons (`data-action="prev|today|next"`) + `.cal-title`. Weekday header iterates `WEEKDAYS_KO`. Grid contains exactly 42 children — in-month cells are `<button data-key="…">` (with optional `is-today` / `is-selected` classes and a `.cal-badge` when `count > 0`); adjacent-month cells are `<div class="cal-cell-adjacent">` with no `data-key`.
- **formatHeader (Task 3):** `Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' })` reused across calls; reconstructs Date from key parts (split + `new Date(y, m-1, d)`), never from the ISO string. Verified output: `2026년 5월 3일 일요일`.

## Task Commits

1. **Task 1: Pure helpers — monthGrid, prevMonth, nextMonth, todayYM** — `62112de` (feat)
2. **Task 2: renderCalendar — nav row + Korean weekday header + 6×7 grid** — `af8fd88` (feat)
3. **Task 3: formatHeader — Korean dateStyle:'full'** — `a03150d` (feat)

## Files Created/Modified

- `js/calendar.js` — NEW. 6 named exports + 2 module-private helpers (`navBtn`, `buildCell`) + `WEEKDAYS_KO` array + `HEADER_FMT` Intl singleton. Imports only `dateKey` from `./dateKey.js`. No DOM mutation outside the passed `container` argument; no localStorage / UTC APIs / `innerHTML`.

## The 42-cell Invariant — Why the `+i` Loop Works Without Conditionals

```js
for (let i = 0; i < 42; i++) {
  const d = new Date(year, m0, 1 - firstWeekday + i);
  // …
}
```

- The Date constructor's `MakeDay` step (ECMA-262 §21.4.1.32) normalizes any overflow: `new Date(2026, 0, 1 - 4)` → 2025-12-28; `new Date(2026, 1, 30)` → 2026-03-02. So the loop walks 42 consecutive calendar days starting from the most recent Sunday on/before the 1st of the month, regardless of how the month aligns to the week.
- `firstWeekday = first.getDay()` is 0..6; `1 - firstWeekday` ranges over `[-5, 1]`, which the constructor handles uniformly with no branch.
- `inMonth: d.getMonth() === m0` distinguishes the in-month cells; `isToday` is a single `dateKey()` equality.
- The grid is therefore always 6 rows × 7 cols — no conditional row count, no layout jump on month change.

## The Plan-02 Consumption Contract

| Element              | Marker                  | Plan-02 handler step                                                                  |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| Nav button           | `data-action=prev/today/next` | `t.closest('[data-action]')?.dataset.action` → mutate `viewYM` (and `selectedKey` for `today`) → `render()` |
| In-month date cell   | `data-key=YYYY-MM-DD`   | `t.closest('[data-key]')?.dataset.key` → `selectedKey = key` → `render()`             |
| Adjacent-month cell  | (neither attribute)     | No-op — both `closest` guards return null                                             |

`data-action` and `data-key` are mutually exclusive on any single element subtree, so a single delegated `click` listener on the calendar container can branch unambiguously.

## Decisions Made

See `key-decisions` in frontmatter. All decisions trace back to RESEARCH (Pattern 1–5) and CONTEXT (B, E). The only meaningful in-execution decision was the module-header comment wording (to keep `grep -E "localStorage" js/calendar.js` at 0 while still documenting the boundary).

## Deviations from Plan

None - plan executed exactly as written.

(One micro-adjustment: the original Task-1 docstring used the literal text "toISOString / Date.UTC / getUTC*" inside a comment, which would have flipped the plan's `grep -E "toISOString|Date\.UTC|getUTC|setUTC" js/calendar.js | wc -l` gate from 0 to 1. The comment was rephrased to "UTC-based Date APIs" before the Task 1 commit. Same class of micro-fix for the module-header comment in Task 3 — replaced the literal "localStorage" with "영속 저장" for the `localStorage` grep gate. Neither change altered behavior; both protect the static-analysis contract the plan explicitly verifies on.)

## Issues Encountered

None. All three node-eval verifies passed on first run; all grep gates pass at the plan's required counts.

## Self-Check: PASSED

- File exists: `js/calendar.js` — FOUND.
- Commits in `git log --oneline --all`:
  - `62112de` (Task 1) — FOUND
  - `af8fd88` (Task 2) — FOUND
  - `a03150d` (Task 3) — FOUND
- All 6 exports loadable: `formatHeader,monthGrid,nextMonth,prevMonth,renderCalendar,todayYM` — confirmed.
- Forbidden-API grep gates all return 0 (toISOString/Date.UTC/getUTC/setUTC, `new Date('…')`, `innerHTML =`, `localStorage`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 02 (wiring) prerequisites met:** the module exposes the exact surface Plan 02's research locked in (6 named exports; `data-action` / `data-key` dataset contract; container-owned `replaceChildren` semantics). `js/app.js` can import and mount without further changes to this module.
- **Plan 03 (styling) prerequisites met:** the rendered class names (`cal-nav`, `cal-nav-btn`, `cal-title`, `cal-weekdays`, `cal-weekday`, `cal-grid`, `cal-cell`, `cal-cell-adjacent`, `cal-day`, `cal-badge`, `is-today`, `is-selected`) are stable and ready for the Phase-3 minimal stylesheet rules.
- **No blockers.**

---
*Phase: 03-calendar-integration*
*Completed: 2026-05-03*
