# Roadmap: Hansung Todo (GSD Demo)

**Created:** 2026-05-03
**Granularity:** coarse (4 phases)
**Core Value:** 사용자가 캘린더에서 날짜를 골라 그 날의 todo를 손쉽게 관리할 수 있고, 새로고침 후에도 데이터가 유지된다.

## Phases

- [ ] **Phase 1: Foundation** — Static shell, date helpers, todo model, persistence layer, README run-instructions
- [ ] **Phase 2: Todo CRUD (against today)** — Store + todo list view with add/toggle/edit/delete persisted across reload
- [ ] **Phase 3: Calendar Integration** — Month-grid calendar with date selection, today/selected highlights, count badges
- [ ] **Phase 4: Modern Polish & Failure UX** — Modern/polished visual style + graceful save-failure surfacing

## Phase Details

### Phase 1: Foundation
**Goal**: A no-build static site loads in the browser, exposes safe date + storage primitives, and is runnable per a documented method.
**Depends on**: Nothing (first phase)
**Requirements**: DEL-01, DEL-02, DEL-03, PERS-01, PERS-02, PERS-05
**Success Criteria** (what must be TRUE):
  1. Opening the project per the README's documented method (double-click `index.html` or `python3 -m http.server`) loads the page without console errors.
  2. The repository ships as `index.html` + `css/` + `js/` static assets — no build step, no bundler, no framework, GitHub Pages compatible.
  3. From the browser console, calling the storage helpers round-trips a `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": [...] } }` blob through `localStorage` under key `hansung-todo:v1`.
  4. The `dateKey()` helper produces a local-time `YYYY-MM-DD` string for any `Date` (including 23:55 local on a UTC-offset day) and `toISOString` is absent from the codebase.
  5. README documents how to run the app locally and on GitHub Pages.
**Plans**: TBD

### Phase 2: Todo CRUD (against today)
**Goal**: A user can manage today's todos end-to-end with full persistence across reloads, with no calendar UI yet.
**Depends on**: Phase 1
**Requirements**: TODO-01, TODO-02, TODO-03, TODO-04, TODO-05, TODO-06, TODO-07, PERS-03, STYL-02
**Success Criteria** (what must be TRUE):
  1. User can add a new todo by typing text and pressing Enter (or clicking the add button); it appears in the list immediately.
  2. User can toggle a todo's completion via checkbox (with a visible completed-state distinction), edit its text, and delete it.
  3. After a page reload, every previously added/toggled/edited todo is still there in stable `createdAt`-ascending order.
  4. A day with no todos shows an empty-state message instead of a blank list.
  5. Entering a todo with text like `<img src=x onerror=alert(1)>` renders as literal text — never as HTML — confirming `textContent`-only rendering for user input.
**Plans**: 4 plans
  - [x] 02-01-PLAN.md — js/todos.js: pure immutable state helpers + renderTodoList
  - [ ] 02-02-PLAN.md — app.js bootstrap: TODAY 캡처 + DOM 마운트 + form submit (add)
  - [ ] 02-03-PLAN.md — app.js 위임 이벤트 4종 + 인라인 편집 라이프사이클 (toggle/edit/remove)
  - [ ] 02-04-PLAN.md — css/styles.css 미니멀 3룰 + phase-gate 검증 (grep + 16 시나리오)
**UI hint**: yes

### Phase 3: Calendar Integration
**Goal**: A user can navigate a month-grid calendar and pick any date to view and manage that date's todos.
**Depends on**: Phase 2
**Requirements**: CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07, TODO-08
**Success Criteria** (what must be TRUE):
  1. The page shows a 7×N month grid with weekday headers; prev/next buttons and a "Today" button move the view correctly across month boundaries (including Jan→Feb from day 31, leap-year February, year-end wrap).
  2. Today's date and the currently selected date are each visually distinct from each other and from normal cells.
  3. Each date cell with one or more todos shows that count; cells with zero todos show no badge, and the badge updates immediately when todos are added/deleted.
  4. Clicking any date cell selects it, the selected-day human-friendly header (e.g. "2026년 5월 3일 일요일") updates, and the todo list re-renders for that date.
  5. CRUD operations performed on the selected date persist and re-appear on that exact date after reload — no UTC drift between cell, key, and stored data.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Modern Polish & Failure UX
**Goal**: The app looks polished and degrades gracefully when storage fails, completing the v1 user experience.
**Depends on**: Phase 3
**Requirements**: STYL-01, PERS-04
**Success Criteria** (what must be TRUE):
  1. The calendar and todo list show the modern/polished visual style: refined typography, subtle shadows, smooth hover/selection transitions, consistent spacing — recognizable as "polished" on first glance.
  2. When `localStorage.setItem` fails (quota exceeded, Safari Private Mode, storage disabled), the app does not crash; the user sees a visible failure notice (e.g. toast) instead of a silent fake-save.
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/0 | Not started | - |
| 2. Todo CRUD | 0/0 | Not started | - |
| 3. Calendar Integration | 0/0 | Not started | - |
| 4. Modern Polish & Failure UX | 0/0 | Not started | - |

## Coverage

- v1 requirements: 25 / 25 mapped ✓
- Orphans: 0
- Duplicates: 0

## Phase Ordering Rationale

- **Foundation first** locks the load-bearing correctness contracts (date keys, schema, delivery) before any UI calcifies on top of them — these are the cheapest pitfalls to avoid early and the most expensive to retrofit (Pitfalls 1, 3, 4 from `research/PITFALLS.md`).
- **Todo CRUD before Calendar** isolates state/persistence/render mechanics from grid/date-math complexity by hardcoding `selectedDate = today()` in Phase 2; the `textContent`-only rule (Pitfall 2) is established with the first user-data render.
- **Calendar after CRUD** reduces calendar work to "wire `selectedDate`, render badges" rather than co-debugging two new subsystems.
- **Polish + failure UX last** because CSS iterates fast on stable markup, and the storage error surface depends on having visible UI to surface it through.

---
*Roadmap created: 2026-05-03*
