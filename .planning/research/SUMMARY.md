# Project Research Summary

**Project:** Hansung Todo (GSD Demo)
**Domain:** No-build vanilla JS static web app — date-based todos with month-grid calendar + localStorage
**Researched:** 2026-05-03
**Confidence:** HIGH

## Executive Summary

Hansung Todo is a deliberately tiny, date-bound todo app: a month-grid calendar where clicking a day reveals that day's todo list, with all CRUD persisted to `localStorage`. The combination of hard constraints in `PROJECT.md` (no build tools, no framework, single `index.html`, localStorage-only) plus the demo's pedagogical purpose pushes the design to a single, well-supported answer: **zero runtime dependencies, native ES modules, vanilla CSS Grid for the calendar, and `localStorage` accessed through a thin wrapper.** Every Active requirement is achievable with the platform alone, and the demo's value is highest when students can read every line.

The recommended approach is a four-layer architecture (`storage` → `store` → `views` → bootstrap) with a single store + render-on-change pattern, persistence wired as a `subscribe` listener, and views built with `createElement` + `textContent` (never `innerHTML` for user data). The expert build order is **storage/date helpers first → state store → todo list view → calendar view → polish**, because the date-key contract and storage failure handling are load-bearing for everything downstream and cheap to verify in isolation.

The dominant risks are not technical complexity — they are subtle correctness traps in three areas: (1) **date keys** (`toISOString()` causes silent UTC drift; only local-`Date` accessors are safe), (2) **delivery** (ES modules over `file://` break double-click delivery; pick a documented path before writing the first script tag), and (3) **localStorage failure modes** (null on first run, corruption, `QuotaExceededError`, Safari Private Mode). Each is well-known, has a one-helper fix, and must be addressed in the earliest phases — retrofitting is expensive.

## Key Findings

### Recommended Stack

The stack is the browser. No npm, no bundler, no framework, no CDN runtime deps. Native `Date` + `Intl.DateTimeFormat('ko-KR')` covers month math and Korean labels; `<dialog>` covers modals if needed; `crypto.randomUUID()` covers IDs. Temporal API is Stage 4 as of March 2026 but not in shipping Safari yet — defer.

**Core technologies:**
- **HTML5 (single `index.html`)**: entry point with one mount node and one `<script type="module">` — minimum surface, maximum readability.
- **CSS3 (one `styles.css`, CSS Grid + custom properties)**: 7×N month grid is canonical CSS Grid; design tokens at `:root` give one-line theming.
- **Vanilla JS (ES2023, native ES modules)**: `import`/`export` works in all current browsers without a build; matches the "no build tools" hard constraint.
- **`localStorage` (Web Storage API)**: synchronous key/value, ~5MB quota — far more than needed; wrap in try/catch for Safari Private Mode and quota errors.
- **Native `Date`**: sufficient for first-of-month, days-in-month, and "today" comparisons in a single-timezone local app. No date library.

**Explicitly avoided:** React/Vue/Svelte, TypeScript, Tailwind, Sass, jQuery, Moment, IndexedDB, Service Workers, runtime CDN deps for required functionality, Vitest/Jest (require Node).

See `STACK.md` for the full rationale and alternatives matrix.

### Expected Features

The domain is mature; conventions are well-established (Apple Calendar, Google Calendar, TeuxDeux, Todoist). The v1 scope in `PROJECT.md` already maps cleanly to "table stakes."

**Must have (table stakes — match `PROJECT.md` Active):**
- Month grid (7×5–6) with prev/next/Today navigation
- "Today" highlight + selected-day highlight (visually distinct)
- Day cell shows todo count badge
- Click day → renders that day's todo list
- Add (text + Enter), toggle complete (checkbox + strikethrough), inline edit, delete
- Todo shape `{ id, text, done, createdAt }` persisted to `localStorage` on every mutation
- Empty state for days with no todos
- Stable ordering by `createdAt` ascending
- Human-readable date header in day panel
- Auto-focus add input on day select
- Modern/polished styling (subtle shadows, transitions, weekday headers)

**Should have (post-v1 polish, not blocking launch):**
- JSON export / import (manual backup path — replaces "no sync" complaint)
- Hide-completed toggle
- Keyboard navigation on calendar (arrows + Enter, roving tabindex)
- ARIA grid roles + labels
- `prefers-color-scheme` dark mode, `prefers-reduced-motion` respect
- "Saved ✓" indicator after writes (especially when surfacing quota errors)

**Defer (v2+ — explicitly out of scope per `PROJECT.md`):**
- Recurring tasks, reminders/notifications, week/day views
- Labels/categories, subtasks, search, drag-to-reschedule
- Cross-device sync / accounts (use JSON export instead)
- Undo/redo, encryption

See `FEATURES.md` for the full landscape and competitor matrix.

### Architecture Approach

Four-layer vanilla architecture with a single-store + render-on-change pattern. Views are pure render functions (`render(root, state, handlers)`); they never mutate state directly — they call handlers passed in by the bootstrap, which is the only place that calls `store.setState`. Persistence is a `store.subscribe` listener, so it's impossible to forget to save. localStorage stores one JSON blob under `hansung-todo:v1`, shaped as `{ schemaVersion, todosByDate: { [YYYY-MM-DD]: Todo[] } }` for O(1) per-day lookup.

**Major components:**
1. **`storage.js`** — `loadAll()` / `saveAll()` wrapping `localStorage` with try/catch + JSON guards.
2. **`store.js`** — `createStore({ todosByDate, selectedDate, viewMonth })` with `getState`/`setState`/`subscribe`.
3. **`models/todo.js`** — `createTodo(text)` factory (id via `crypto.randomUUID()`, `createdAt = Date.now()`).
4. **`utils/date.js`** — `dateKey(date)` (local-time, never `toISOString`), `monthMatrix(year, monthIndex)`, `today()`.
5. **`views/calendar.js`** — month grid render, prev/next/today nav, emits `selectDate(ymd)` and `navigateMonth(delta)`.
6. **`views/todoList.js`** — selected-day list render, emits `add/toggle/edit/remove`.
7. **`main.js`** — bootstrap: load → seed store → wire handlers → subscribe views and persistence → initial paint.

See `ARCHITECTURE.md` for diagrams, contracts, and code skeletons.

### Critical Pitfalls

1. **UTC drift in date keys** — `new Date().toISOString().slice(0,10)` returns the UTC date and silently buckets late-night todos under the wrong day. Define one `dateKey(d)` helper using local `getFullYear/getMonth/getDate`; forbid `toISOString` and `new Date('YYYY-MM-DD')` (parses as UTC) anywhere in the codebase.
2. **`innerHTML` XSS for todo text** — A todo of `<img src=x onerror=localStorage.clear()>` wipes data. Use `createElement` + `textContent` for all user-controlled strings; reserve `innerHTML` for static markup.
3. **localStorage failure modes treated as impossible** — first-run `null`, corrupted JSON, `QuotaExceededError`, Safari Private Mode `SecurityError`. Wrap every read/write in try/catch with a fallback; surface save failure as a UI toast rather than pretending it persisted.
4. **ES modules broken over `file://`** — `<script type="module">` + `import` fails when students double-click `index.html`. `PROJECT.md` says "double-click works." Either (a) drop `type="module"` and use ordered global scripts, or (b) document `python3 -m http.server` as the official run command. Decide before the first commit of `index.html`.
5. **Calendar grid edge cases** — leap February, `setMonth` overflowing Jan 31 → Mar 3, mis-keyed filler cells from prev/next month. Always anchor navigation to day 1 (`new Date(y, m+delta, 1)`); compute days via `new Date(y, m+1, 0).getDate()`; each cell carries its own true `dateKey`.

See `PITFALLS.md` for the full "looks done but isn't" checklist and recovery strategies.

## Implications for Roadmap

Based on research, the suggested phase structure follows a strict data-then-UI ordering. Each phase is independently verifiable and adds one user-visible capability (P1/P2 are foundation, verifiable from the console).

### Phase 1: Skeleton, Date Helpers, and Delivery Decision
**Rationale:** The date-key contract and the script-loading strategy are load-bearing for every later phase and cheap to retrofit only if caught now. This phase locks both.
**Delivers:** `index.html` shell, `js/utils/date.js` (`dateKey`, `monthMatrix`, `today`), `js/models/todo.js`, project layout, and a documented answer to "double-click vs. local server."
**Addresses:** Project setup; date utilities feature dependency for the calendar.
**Avoids:** Pitfall 1 (UTC drift), Pitfall 4 (file:// modules), Pitfall 5 (calendar edge-case math).

### Phase 2: Persistence Layer
**Rationale:** Storage is the second foundation. Building it before any view forces the failure-mode discipline (try/catch, schema version, fallback) into the API surface from day one.
**Delivers:** `js/storage.js` with `loadAll()`/`saveAll()`, `STORAGE_KEY = 'hansung-todo:v1'`, `schemaVersion: 1` field, console-verifiable round-trip.
**Uses:** `localStorage`, `JSON`, `dateKey` from Phase 1.
**Implements:** Persistence layer of the architecture.
**Avoids:** Pitfall 3 (localStorage failure modes), tech-debt pattern of scattered `localStorage` calls.

### Phase 3: Store and Todo List View (CRUD against hardcoded date)
**Rationale:** Todo CRUD is the harder data-bound view; building it first against `selectedDate = today()` isolates CRUD complexity from calendar complexity. The store + render-on-change + persistence-as-subscriber pattern gets exercised end-to-end with the simplest possible UI.
**Delivers:** `js/store.js`, `js/main.js` bootstrap, `js/views/todoList.js` with add/toggle/edit/delete, persistence wired as `store.subscribe(state => saveAll(state.todosByDate))`.
**Addresses:** Add (text + Enter), toggle, inline edit, delete, empty state, stable `createdAt` ordering, auto-focus add input, persistence across reload.
**Avoids:** Pitfall 2 (innerHTML XSS — set the `textContent`-only rule with the first list render), focus-loss-on-rerender UX trap (commit edits on blur/Enter, not per-keystroke).

### Phase 4: Calendar View and Date Selection
**Rationale:** With CRUD already working against today, adding the calendar reduces to "wire `selectedDate` and render counts." The hardest correctness work (UTC, persistence, XSS) is already past.
**Delivers:** `js/views/calendar.js` (month grid, prev/next/Today nav, selected/today highlights), per-cell todo count badges, integration with the store so clicking a date refreshes the todo list and adds update the badge.
**Uses:** `monthMatrix` from Phase 1, store from Phase 3.
**Implements:** Calendar view of the architecture.
**Avoids:** Pitfall 5 (anchored month nav, leap-year handling, filler-cell dateKey correctness).

### Phase 5: Modern/Polished Styling and UX Polish
**Rationale:** Visual polish is required by `PROJECT.md` but should land last so it isn't repeatedly thrashed by structural changes. CSS-only changes can iterate quickly once the markup is stable.
**Delivers:** `css/styles.css` design-token system at `:root`, subtle shadows and hover/selection transitions, weekday headers (Korean via `Intl.DateTimeFormat('ko-KR', { weekday: 'short' })`), human-readable date header, save-failure toast, optional weekend tint.
**Addresses:** Modern/polished styling requirement; surfaces the storage error path from Phase 2.

### Phase Ordering Rationale

- **Foundations first (date keys, delivery, storage):** All three are correctness-critical and far cheaper to get right at the start than to retrofit. Pitfalls 1, 3, and 4 are catastrophic if caught after launch.
- **Todo list before calendar:** Isolates CRUD/state/persistence concerns from grid/navigation/date-math concerns.
- **Polish last:** CSS work iterates quickly and shouldn't be re-done as structure changes.
- **Persistence as a `subscribe` listener (decided in Phase 3):** prevents the most common technical debt pattern (scattered `setItem` calls).

### Research Flags

- **None likely.** The domain is mature, the stack is fixed by constraint, and the architecture patterns are well-documented in `ARCHITECTURE.md`.
- Phases 1–5 all use well-established vanilla JS patterns. Phase planners can rely on `ARCHITECTURE.md` and `PITFALLS.md` directly.
- Optional: Phase 5 design-direction pass if "Modern/Polished" is interpreted as a full design system.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Constraints fully determine the answer; verified against MDN baseline data and 2026 browser status. |
| Features | HIGH | Mature domain; conventions cross-checked; v1 scope already maps to table stakes. |
| Architecture | HIGH | Standard single-store + render-on-change pattern. |
| Pitfalls | HIGH | All five critical pitfalls are well-documented with one-helper mitigations. |

**Overall confidence:** HIGH

### Gaps to Address

- **Delivery decision (file:// vs. local server):** test double-click on the demo machine in Phase 1.
- **Cross-tab `storage` event behavior:** defer to Phase 5; either listen+rehydrate or document "single-tab only."
- **"Modern/Polished" interpretation:** pick a reference (Things 3 / TeuxDeux baseline) during Phase 5 planning.

## Sources

- `.planning/PROJECT.md` — authoritative scope and constraints.
- MDN — `localStorage`, `textContent` vs `innerHTML`, ES modules + `file://`, `Date`, `crypto.randomUUID()`, `Intl.DateTimeFormat`.
- TC39 — Temporal Stage 4 (Mar 2026); Baseline Newly Available expected late 2026.
- Apple/Google Calendar, TeuxDeux, Todoist, Things — UX conventions for month grids and inline edit.

---
*Research completed: 2026-05-03*
*Ready for roadmap: yes*
