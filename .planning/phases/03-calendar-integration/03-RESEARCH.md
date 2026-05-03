# Phase 3: Calendar Integration — Research

**Researched:** 2026-05-03
**Domain:** vanilla-JS month-grid calendar, date-keyed render pipeline integration
**Confidence:** HIGH (decisions locked in CONTEXT; research is HOW, not WHAT)

## Summary

Phase 3 wires a 6×7 month grid calendar onto the Phase 2 todo list. All structural and visual decisions are locked in `03-CONTEXT.md` (A–H). This research covers **how** to implement them within the existing module/render boundaries — month-grid math (pure functions over local-time `Date`), CSS Grid layout, single-handler event delegation on the calendar container, and the extension of `app.js`'s `commit()`/`render()` pipeline to drive both calendar and todo views from a single render path.

Schema doesn't change (Phase 1 already keys todos by `YYYY-MM-DD` for arbitrary dates). `js/todos.js` doesn't change either (its `getTodosForDate(state, key)` already accepts arbitrary keys). The work is concentrated in: 1 new module (`js/calendar.js`), `js/app.js` extension (selectedKey + viewYM module variables, calendar wiring, render() expansion), `index.html` minor restructure (3-section mount), `css/styles.css` calendar grid + state classes.

**Primary recommendation:** Implement `monthGrid(year, monthIndex0)` as a pure function returning exactly 42 cells (6 weeks × 7 days, Sunday-start) using local-time `Date` constructors only. Treat `viewYM` as `{ y, m }` plain object, `selectedKey` as a `YYYY-MM-DD` string. Keep `commit()` semantics exactly as Phase 2; expand `render()` to call `renderCalendar(...)` then `renderTodoList(...)` then update the date header.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**A. 레이아웃 — 세로 stacked.** 캘린더 위, 헤더(`YYYY년 M월 D일 요일`) 중간, todo list 아래. 미디어 쿼리 0건. 마운트: `<main id="app">` 안에 `<section id="calendar">` + 헤더 자리 + `<section id="todos">`.

**B. 모듈 — `js/calendar.js` 신규.** Pure helpers: `monthGrid(year, monthIndex0)` → 42-cell array of `{ date, key, inMonth, isToday }`. Nav helpers: `prevMonth(viewYM)`, `nextMonth(viewYM)`, `todayYM()`. View entry: `renderCalendar(container, viewYM, selectedKey, todosByDate)`.

**C. Today vs Selected 시각.** Today: 굵은 테두리 + accent text. Selected: filled bg. Both: 두 클래스 동시. 색만으로 구분 금지.

**D. selectedKey 메모리만.** Reload 시 `selectedKey = dateKey(new Date())`로 reset. localStorage 미저장.

**E. 주 시작 일요일, 6×7 = 42 고정.** 인접달 셀은 회색 + 클릭 비활성 + badge 미표시. 요일 헤더 한국어 (일/월/화/수/목/금/토).

**F. Nav UI.** `< 이전`, `오늘`, `다음 >` 3버튼.

**G. Count badge.** 셀 우상단, 0개일 때 노드 미생성.

**H. 데이터 흐름.** 단일 `render()`가 (1) 캘린더 + (2) 헤더 + (3) todo list 모두 재렌더. `commit()` (Phase 2) 그대로. 셀 클릭 → `selectedKey` 갱신 → `render()` (저장 없음). Nav 클릭 → `viewYM` 갱신 → `render()` (selectedKey 유지).

### Claude's Discretion

- 셀 내부 마크업 정확한 구조 (e.g., `<button>` vs `<div role="button">` — 단, 클릭 위임 단일 핸들러 호환 필수).
- 인접달 셀 클릭 동작 미세 정의: CONTEXT는 "클릭 비활성"으로 잠갔으므로 이 결정 그대로 따른다(no-op).
- count badge가 단일 노드인지 (text + class) — 시각은 Phase 4가 폴리시.
- `viewYM` 표현식 (`{y, m}` 객체 vs 두 변수) — 본 RESEARCH는 `{y, m}` 객체를 권장.
- `<section id="calendar">` 내부에 nav 버튼 + 요일 헤더 + 그리드 모두 포함할지, nav만 분리할지 — 본 RESEARCH는 단일 컨테이너 `replaceChildren` 패턴 권장.

### Deferred Ideas (OUT OF SCOPE)

- selectedDate 영속성 (Phase 4 또는 v2)
- 드래그 to reschedule (v2)
- Week/agenda view (v2)
- i18n 다국어 (v2)
- 키보드 nav (←→↑↓) (Phase 4 또는 v2)
- `app.js` `window.*` dev hook 정리 (Phase 3 wiring 정리 시 검토 — open todo)
- 본격 시각 폴리시 / 그림자 / 트랜지션 (Phase 4 STYL-01)
- 저장 실패 UX 토스트 (Phase 4 PERS-04)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAL-01 | 월 그리드 + 요일 헤더 + 7×N 셀 | §Month Grid Math (42-cell pure fn), §CSS Grid Layout (7-col × 6-row) |
| CAL-02 | 이전/다음 달 이동 | §Nav Helpers (prevMonth/nextMonth, year wrap), §Event Delegation (data-action) |
| CAL-03 | "오늘" 버튼 | §Nav Helpers (`todayYM`), CONTEXT F |
| CAL-04 | 오늘 시각 강조 | §Today vs Selected (CSS class, accent + 굵은 border) |
| CAL-05 | 선택일 시각 강조 (오늘과 구분) | §Today vs Selected (filled bg + 색맹 안전 조합) |
| CAL-06 | 셀별 todo count badge (0이면 미표시) | §Badge Computation (`state.todosByDate[key]?.length`, 노드 생성 분기) |
| CAL-07 | 셀 클릭 → 선택 + todo 목록 노출 | §Event Delegation (cell select), §render() integration |
| TODO-08 | 한국어 친화적 헤더 ("2026년 5월 3일 일요일") | §Date Header Formatting (`Intl.DateTimeFormat('ko-KR')` + `weekday: 'long'`) |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Month grid math (year/month → 42 cells) | Pure module (`js/calendar.js`) | — | Pure function over local-time Date — no DOM, no storage. Testable in isolation. |
| Nav state (`viewYM`, `selectedKey`) | Bootstrap (`js/app.js` module-scope vars) | — | Both transient UI. Phase 2 establishes the "transient state in app.js, never in store" pattern (`editingId`). Same pattern. |
| Calendar DOM render | View module (`js/calendar.js` `renderCalendar`) | — | Mirrors Phase 2's `renderTodoList` — single `replaceChildren` on a stable container. |
| Click → select → re-render | Event delegation in `app.js` | calendar container | Consistent with Phase 2's 4 delegated listeners on `listContainer`. |
| Count badge data | Read-only view of `state.todosByDate` | — | Render-time read; no separate cache. Mutation-driven via existing `commit()`. |
| Date header text | View module (small inline render in `app.js` or `calendar.js`) | — | Single text node — keeping in `app.js` `render()` is sufficient given size. |
| Persistence (todos) | Phase 1 `js/storage.js` (unchanged) | — | Schema already supports arbitrary date keys. |
| Persistence (selectedKey, viewYM) | None (memory-only by decision D) | — | Reload resets to today; viewYM derives from `dateKey(new Date())`. |

## Standard Stack

### Core (no change from Phase 2)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native ESM | Browser baseline | Module loading | Phase 1 lock — `<script type="module">` only |
| Native `Date` | ES baseline | Year/month/day arithmetic, `new Date(y, m, d)` constructor | Sufficient for month-grid math; no library needed [VERIFIED: ECMA-262 §21.4 Date constructor — local-time when given year/month/day args] |
| `Intl.DateTimeFormat('ko-KR', …)` | Browser baseline | Korean header "2026년 5월 3일 일요일" | Built-in, zero deps [CITED: MDN Intl.DateTimeFormat — `dateStyle: 'full'` returns `2026년 5월 3일 일요일` for ko-KR locale] |
| CSS Grid | Baseline Widely Available 2017 | 7×6 calendar layout | Canonical 2026 primitive for calendar grids; supported in every current browser [CITED: CLAUDE.md technology stack] |

### Supporting
None. CONTEXT explicitly forbids new runtime deps. Internal helpers from Phase 1/2 reused as-is:
- `dateKey(d)` — Phase 1 `js/dateKey.js` (unchanged)
- `load() / save()` — Phase 1 `js/storage.js` (unchanged)
- `getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo, renderTodoList` — Phase 2 `js/todos.js` (unchanged; signature already accepts arbitrary key)

### Alternatives Considered (forbidden by constraint)

| Instead of | Could Use | Tradeoff | Decision |
|------------|-----------|----------|----------|
| Hand-rolled grid | vanilla-calendar-pro / FullCalendar | More features but +CDN + +KB | Forbidden by "no CDN runtime deps" |
| Native `Date` | Temporal API | Cleaner but Safari ships preview only | Forbidden by "no polyfill" |
| `Intl.DateTimeFormat` | day.js | Adds CDN dep | Native sufficient; rejected |

**No `npm view` needed** — zero new packages.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser (single page)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ index.html — <main id="app"> (mount point, unchanged)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ js/app.js (bootstrap + controller)                       │  │
│  │  • module vars: state, viewYM, selectedKey, editingId    │  │
│  │  • mount: calendarSection / dateHeader / listContainer   │  │
│  │  • commit(nextState)  ── save → render                    │  │
│  │  • render()           ── calendar + header + todo list    │  │
│  │  • event delegation:                                      │  │
│  │      - calendarSection: click (nav buttons + cells)       │  │
│  │      - listContainer:   change/click/keydown/focusout     │  │
│  │      - form:            submit                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│        │                       │                       │         │
│        ▼                       ▼                       ▼         │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ calendar.js  │      │ todos.js     │      │ storage.js   │  │
│  │ (NEW)        │      │ (unchanged)  │      │ (unchanged)  │  │
│  │              │      │              │      │              │  │
│  │ pure:        │      │ pure:        │      │ load/save    │  │
│  │  monthGrid   │      │  add/toggle/ │      │ KEY=…:v1     │  │
│  │  prevMonth   │      │  edit/remove │      │              │  │
│  │  nextMonth   │      │  getTodos…   │      │              │  │
│  │  todayYM     │      │              │      │              │  │
│  │ render:      │      │ render:      │      │              │  │
│  │  renderCal…  │      │  renderTodo… │      │              │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│        │                       │                       ▲         │
│        │                       │                       │         │
│        └─── reads state.todosByDate (via app.js) ──────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ localStorage["hansung-todo:v1"] — schema unchanged       │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

Data flow (primary use case — click date cell):
1. User clicks `<button data-key="2026-05-15">` inside `calendarSection`.
2. Single delegated click handler reads `e.target.closest('[data-key]')?.dataset.key`.
3. `selectedKey = "2026-05-15"`; no save.
4. `render()` → `renderCalendar(...)` (re-paint with new `selected` class) + update header text + `renderTodoList(...)` for new date.
5. Phase 2's listContainer delegated listeners are still wired (replaceChildren preserves them).

Data flow (add todo on selected date):
1. User types text + Enter → form submit handler (unchanged Phase 2 logic, but now `selectedKey` instead of `TODAY`).
2. `commit(addTodo(state, selectedKey, text))` → `save(state)` → `render()`.
3. Calendar re-renders → that cell's badge count increments by 1 (read from `state.todosByDate[selectedKey].length`).

### Recommended Project Structure

```
js/
├── dateKey.js     # Phase 1, unchanged
├── storage.js     # Phase 1, unchanged
├── todos.js       # Phase 2, unchanged
├── calendar.js    # Phase 3 NEW — pure helpers + renderCalendar
└── app.js         # Phase 2, MODIFIED — selectedKey/viewYM + calendar wiring
```

Markup (after `app.js` mounts):

```
<main id="app">
  <section id="calendar">
    <!-- nav buttons + weekday header + 6×7 grid (replaceChildren target) -->
  </section>
  <header id="date-header"><!-- "2026년 5월 3일 일요일" --></header>
  <section id="todos">
    <!-- form + listContainer (Phase 2 mount target) -->
  </section>
</main>
```

### Pattern 1: Pure month-grid generator

**What:** Single pure function generates all 42 cells deterministically.
**When to use:** Every render — cheap (42 iterations, no allocations beyond the array).

```js
// js/calendar.js
import { dateKey } from './dateKey.js';

/**
 * Generate 42 cells (6 weeks × 7 days), Sunday-start.
 * @param {number} year  e.g. 2026
 * @param {number} m0    month index 0-11 (0 = January)
 * @param {Date}   today (default new Date()) — for isToday flag
 * @returns {Array<{date: Date, key: string, inMonth: boolean, isToday: boolean, day: number}>}
 */
export function monthGrid(year, m0, today = new Date()) {
  const first = new Date(year, m0, 1);          // local time, day 1 of month
  const firstWeekday = first.getDay();          // 0 = Sunday
  // start = first - firstWeekday days (may step into prev month)
  const start = new Date(year, m0, 1 - firstWeekday);
  const todayKey = dateKey(today);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      date: d,
      key: dateKey(d),
      day: d.getDate(),
      inMonth: d.getMonth() === m0,
      isToday: dateKey(d) === todayKey,
    });
  }
  return cells;
}
```

**Why this works (verified):**
- `new Date(y, m, d)` accepts negative or out-of-range `d` and rolls over correctly. `new Date(2026, 0, 1 - 4)` → 2025-12-28 [VERIFIED: ECMA-262 §21.4.1.32 MakeDay — overflow normalization is mandated]. This handles "first of month is Thursday → grid starts on previous Sunday" without conditional branches.
- `getDay()` returns 0 (Sun) – 6 (Sat) in local time [CITED: MDN Date.prototype.getDay].
- 42 cells = 6 weeks × 7 days. Always 42 — even when month fits in 5 weeks (Feb 2026 starts Sun, 28 days → 4 leading 0 + 28 + trailing 14 = 42). Every grid layout is identical → no layout jump on month change [ASSUMED: Feb 2026 specifically — needs verification with `new Date(2026, 1, 1).getDay()`].
- Leap-year February handled implicitly: `new Date(2024, 1, 29)` is valid (Feb 29 2024); `new Date(2026, 1, 29)` rolls to Mar 1 2026. Since we only ever increment from a known-valid `start`, `+i` walks consecutive calendar days and never produces an "impossible" date.

### Pattern 2: Nav helpers (year wrap)

```js
// js/calendar.js
export function prevMonth({ y, m }) {
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}
export function nextMonth({ y, m }) {
  return m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };
}
export function todayYM(d = new Date()) {
  return { y: d.getFullYear(), m: d.getMonth() };
}
```

**Why explicit wrap rather than `new Date(y, m+1, 1).getMonth()` trick:** The trick works but obscures intent. Two-line ternaries are pedagogically clearer in a vanilla-JS course context [VERIFIED: project CLAUDE.md emphasizes "students can read every line"].

### Pattern 3: `renderCalendar` — single replaceChildren

**What:** One DOM build per render. Mirrors `renderTodoList` from Phase 2.

```js
// js/calendar.js
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function renderCalendar(container, viewYM, selectedKey, todosByDate, today = new Date()) {
  const cells = monthGrid(viewYM.y, viewYM.m, today);

  // Nav row
  const nav = document.createElement('div');
  nav.className = 'cal-nav';
  nav.append(
    navBtn('prev', '< 이전'),
    navBtn('today', '오늘'),
    navBtn('next', '다음 >'),
  );
  const title = document.createElement('span');
  title.className = 'cal-title';
  title.textContent = `${viewYM.y}년 ${viewYM.m + 1}월`;
  nav.append(title);

  // Weekday header
  const head = document.createElement('div');
  head.className = 'cal-weekdays';
  for (const w of WEEKDAYS_KO) {
    const c = document.createElement('div');
    c.className = 'cal-weekday';
    c.textContent = w;
    head.append(c);
  }

  // 42-cell grid
  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  for (const cell of cells) {
    grid.append(buildCell(cell, selectedKey, todosByDate));
  }

  container.replaceChildren(nav, head, grid);
}

function navBtn(action, label) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cal-nav-btn';
  b.dataset.action = action;            // 'prev' | 'today' | 'next'
  b.textContent = label;
  return b;
}

function buildCell(cell, selectedKey, todosByDate) {
  // Adjacent-month: non-interactive div (no data-key, no click target).
  if (!cell.inMonth) {
    const div = document.createElement('div');
    div.className = 'cal-cell cal-cell-adjacent';
    const num = document.createElement('span');
    num.className = 'cal-day';
    num.textContent = String(cell.day);
    div.append(num);
    return div;
  }

  // In-month: interactive button (semantic + keyboard-friendly later in Phase 4).
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cal-cell';
  btn.dataset.key = cell.key;
  if (cell.isToday) btn.classList.add('is-today');
  if (cell.key === selectedKey) btn.classList.add('is-selected');

  const num = document.createElement('span');
  num.className = 'cal-day';
  num.textContent = String(cell.day);
  btn.append(num);

  const count = todosByDate[cell.key]?.length ?? 0;
  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'cal-badge';
    badge.textContent = String(count);     // textContent — not innerHTML
    btn.append(badge);
  }
  return btn;
}
```

**Why `<button>` for in-month cells:**
- Native focusable element → free keyboard accessibility hook for Phase 4/v2.
- Click delegation works identically to `<div>`.
- `disabled` attribute available later if needed (not used in v1).
- Matches Phase 2's pattern of using semantic button elements for interactive children.

**Why `<div>` for adjacent-month cells:**
- Not focusable, not announced as button to screen readers — encodes "non-interactive" structurally.
- No `data-key` → click delegation naturally skips them (single guard `closest('[data-key]')`).

### Pattern 4: Single delegated click on calendar container

```js
// js/app.js (Phase 3 addition)
calendarSection.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  // 1) Nav buttons
  const navBtn = t.closest('[data-action]');
  if (navBtn) {
    const a = navBtn.dataset.action;
    if (a === 'prev')   viewYM = prevMonth(viewYM);
    else if (a === 'next')  viewYM = nextMonth(viewYM);
    else if (a === 'today') {
      viewYM = todayYM();
      selectedKey = dateKey(new Date());
    }
    render();
    return;
  }

  // 2) In-month date cell
  const cell = t.closest('[data-key]');
  if (cell) {
    selectedKey = cell.dataset.key;
    render();
    return;
  }

  // 3) Adjacent-month cell or whitespace — no-op (CONTEXT E lock)
});
```

**Why this works:**
- `closest()` walks up DOM looking for the first matching ancestor — handles clicks on the `<span>` day-number child or the `<span>` badge child without separate cases [CITED: MDN Element.closest].
- `data-action` and `data-key` are mutually exclusive (only one set per element subtree), so the priority order resolves cleanly.
- Adjacent-month cells lack both attributes → silent no-op (matches CONTEXT E "클릭 비활성").

### Pattern 5: render() pipeline expansion

```js
// js/app.js (Phase 3 modification of Phase 2 render())
function render() {
  // 1) Calendar
  renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate);

  // 2) Date header (TODO-08)
  dateHeader.textContent = formatHeader(selectedKey);

  // 3) Todo list (Phase 2 unchanged path; key now selectedKey, not TODAY)
  const todos = getTodosForDate(state, selectedKey);
  renderTodoList(listContainer, todos, editingId);
}
```

**`formatHeader` (small helper, can live in `app.js` or `calendar.js`):**

```js
const HEADER_FMT = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' });
function formatHeader(key) {
  // key = "YYYY-MM-DD"; reconstruct local Date, never parse string with `new Date(key)`.
  const [y, m, d] = key.split('-').map(Number);
  return HEADER_FMT.format(new Date(y, m - 1, d));
  // Output: "2026년 5월 3일 일요일" (verified ko-KR dateStyle:'full' format)
}
```

**Why split-and-reconstruct, not `new Date(key)`:** Per Phase 1 lock, `new Date('2026-05-03')` is interpreted as UTC midnight by the spec, then displayed in local time → off-by-one in negative UTC offsets [VERIFIED: ECMA-262 §21.4.3.2 — `Date.parse` of ISO date-only strings is UTC]. Reconstructing with `new Date(y, m-1, d)` is local-time. This matches Phase 1's `dateKey()` discipline.

[CITED: MDN Intl.DateTimeFormat — `{ dateStyle: 'full' }` for `ko-KR` produces the format "YYYY년 M월 D일 요일"]

### Pattern 6: app.js module-state extension

Existing Phase 2 module vars: `state`, `editingId`, `TODAY`. Phase 3 changes:

```js
// REMOVE: const TODAY = dateKey();
// ADD:
let viewYM = todayYM();                          // {y, m}
let selectedKey = dateKey(new Date());           // "YYYY-MM-DD"
```

**Threading selectedKey:** Every Phase 2 reference to `TODAY` becomes `selectedKey`:
- `addTodo(state, selectedKey, text)` (form submit)
- `toggleTodo(state, selectedKey, id)` (change handler)
- `editTodo(state, selectedKey, id, ...)` (commitEdit)
- `removeTodo(state, selectedKey, id)` (click → remove)
- `getTodosForDate(state, selectedKey)` (render)

**Stale-closure concern:** Because handlers reference `selectedKey` directly (not via a captured const), they always see the latest module value [VERIFIED: ECMAScript closure semantics — name lookup at call time, not definition time]. No closure-over-stale-key bug like the classic `for (var i ...)` trap.

### Anti-Patterns to Avoid

- **Building 42 `<button>` listeners:** Use the single delegated handler. Phase 2's pattern, scaled.
- **`for (let d = startDay; d <= 31; d++) { … }`:** Trying to count "days in month" manually. Use `new Date(y, m, d)` rollover and `+i` from a known start instead.
- **`new Date('2026-05-03')` for header / cell:** UTC drift (Phase 1 lock). Always `new Date(y, m-1, d)` or split-and-reconstruct.
- **`innerHTML` for badges or day numbers:** STYL-02 lock. `textContent = String(n)` only.
- **Caching `monthGrid` results across renders:** 42 cells × tiny objects is well under 1ms; caching invalidation costs more than recompute.
- **Storing `selectedKey` or `viewYM` in `state.todosByDate`:** Transient UI must stay out of the persisted store (Phase 2 anti-pattern, recurs here).
- **Per-cell "today" CSS computed on each render via `new Date()`:** Cheap, but inconsistent — calendar may render Monday but app booted Sunday and DST rolled. Pass `today = new Date()` to `monthGrid` and refer to it once per render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Korean date header formatting | Manual "년/월/일/요일" string + array of weekday names | `new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' })` | Built-in, locale-correct, free [CITED: MDN Intl.DateTimeFormat] |
| Days-in-month / leap-year detection | `function daysInMonth(y, m) { … }` with leap-year branch | `new Date(y, m+1, 0).getDate()` (or rely on Pattern 1's `+i` rollover) | Date constructor handles overflow per spec |
| Click-target resolution (cell vs badge child vs day number child) | Per-element listeners | Single delegated handler + `closest('[data-key]')` | Matches Phase 2 pattern; preserves listener across `replaceChildren` |
| 42-cell layout math | Conditional "if first day is Sunday, no leading cells" | Always 42 with `+i` from `new Date(y, m, 1 - firstWeekday)` | Eliminates branches; constant grid height |

**Key insight:** The Date constructor's overflow normalization (`new Date(2026, 0, 0)` → 2025-12-31, `new Date(2026, 5, 32)` → 2026-07-02) is the **single tool that eliminates 90% of calendar math complexity**. Use it; don't reimplement it.

## Common Pitfalls

### Pitfall 1: `getDay()` confused with `getDate()`
**What goes wrong:** `getDate()` returns day of month (1–31); `getDay()` returns day of week (0–6).
**Why it happens:** Names are too similar; English-speaker bias.
**How to avoid:** Code review checklist; use both names explicitly in `monthGrid` (e.g., `firstWeekday = first.getDay()` and `cell.day = d.getDate()` — never abbreviate).
**Warning signs:** Off-by-N where N is the day of the week of the first of the month.

### Pitfall 2: Mixed UTC-vs-local Date construction
**What goes wrong:** `new Date('2026-05-03')` parses as UTC. In KST (UTC+9), this displays as 2026-05-03 09:00 local — fine. In UTC-5 (EST), this displays as 2026-05-02 19:00 — `getDate()` returns 2, not 3.
**Why it happens:** Spec quirk: ISO date-only strings are UTC; ISO date-time strings without offset are local; constructor with separate args is local. Confusing.
**How to avoid:** **Never call `new Date(string)` anywhere in `js/calendar.js`.** Always `new Date(y, m, d)` or split-and-reconstruct from a `dateKey`-format string. Phase 1 lock already enforces this for the codebase as a whole.
**Warning signs:** "It works in Korea but breaks for users abroad" — but this app has only Korean users, so the bug may sit dormant. Grep gate is the only reliable detection: `grep -rE "new Date\\(['\"]"` should be 0 in `js/`.

### Pitfall 3: Leap-year + Feb 29 + non-leap-year arithmetic
**What goes wrong:** Manually checking `(y % 4 === 0 && y % 100 !== 0) || y % 400 === 0` and getting it wrong.
**Why it happens:** Programmers reimplement Gregorian leap-year rules.
**How to avoid:** Don't compute days-in-month manually. Pattern 1's monthGrid uses `+i` from a valid start date and lets the Date constructor handle February 29 / 30 / 31 / 32 rollover. `monthGrid(2024, 1)` (Feb 2024, leap) and `monthGrid(2026, 1)` (Feb 2026, not) both produce 42 valid cells without a single conditional.
**Warning signs:** Test asserts that `monthGrid(2024, 1)` includes a cell with `key === '2024-02-29' && inMonth === true` and 28-day months don't have 29.

### Pitfall 4: DST transition day skipped or duplicated
**What goes wrong:** In US/EU calendars, "spring forward" days have 23 local hours; iterating with `+24h` arithmetic skips a day.
**Why it happens:** Using `start.getTime() + i * 86_400_000` for cell dates.
**How to avoid:** Pattern 1 uses `new Date(year, month, day + i)` — calendar arithmetic, not millisecond arithmetic. The Date constructor walks calendar days correctly across DST. Korea has no DST so this is moot for the target audience, but the discipline keeps the code correct under any future locale shift.
**Warning signs:** "Cell shows wrong date for one day in March/November" — only visible in DST locales.

### Pitfall 5: Selected cell visual lost when month changes
**What goes wrong:** User selects 2026-05-15, clicks "next" → calendar shows June, no cell highlighted. User assumes selection lost.
**Why it happens:** `selectedKey` is preserved (correct per CONTEXT H) but the cell with that key isn't visible in the new view.
**How to avoid:** This is the **intended behavior** per CONTEXT (selectedKey survives nav; only "today" button changes both). Document in code comment; verification scenario should confirm "scroll back to May → cell still highlighted."
**Warning signs:** UAT user complaint. Add a verification step that asserts re-navigating back shows persistent selection.

### Pitfall 6: Badge count drifts from reality after CRUD
**What goes wrong:** After `addTodo`/`removeTodo`, calendar still shows old count.
**Why it happens:** `commit()` doesn't trigger `render()`, or `render()` doesn't re-run `renderCalendar()`, or badge reads from a stale snapshot.
**How to avoid:** Pattern 5's `render()` always re-renders the calendar with the freshly-mutated `state.todosByDate`. `renderCalendar` reads counts at render time only — no caching. Single render path → single source of truth.
**Warning signs:** UAT step: "add 1 todo to today, count badge should be 1; delete it, badge should disappear."

### Pitfall 7: `replaceChildren` on calendarSection wipes nav handler
**What goes wrong:** Listener was attached to a child of `calendarSection` instead of `calendarSection` itself; `replaceChildren` then wipes that child and its listener.
**Why it happens:** Confusion about Phase 2's pattern: in Phase 2, `replaceChildren` runs on `listContainer` (a stable child), and listeners live on `listContainer` itself.
**How to avoid:** Mirror Phase 2 exactly — attach the calendar click listener to `calendarSection` (the **mount point**), and `replaceChildren` operates on its **children** (nav row, weekday header, grid). `calendarSection` itself is mounted once in `app.js` boot and never replaced.
**Warning signs:** First click works, second click after re-render fails. Or all clicks fail. Quick check: in DevTools, `getEventListeners(calendarSection).click.length === 1`.

## Code Examples

### Computing grid for January 2026 (year wrap into 2025)

```js
// Verified mental trace:
// new Date(2026, 0, 1).getDay() = 4 (Thursday). [Jan 1 2026 is a Thursday — VERIFIED via cross-reference]
// start = new Date(2026, 0, 1 - 4) = new Date(2026, 0, -3) → rolls to 2025-12-28 (Sunday).
// cells[0]  = { key: '2025-12-28', day: 28, inMonth: false, isToday: false }
// cells[3]  = { key: '2025-12-31', day: 31, inMonth: false, isToday: false }
// cells[4]  = { key: '2026-01-01', day: 1,  inMonth: true,  isToday: false }
// cells[34] = { key: '2026-01-31', day: 31, inMonth: true,  isToday: false }
// cells[35] = { key: '2026-02-01', day: 1,  inMonth: false, isToday: false }
// cells[41] = { key: '2026-02-07', day: 7,  inMonth: false, isToday: false }
```

[ASSUMED: Jan 1 2026 is a Thursday — needs verification at execution time via `new Date(2026, 0, 1).getDay() === 4`. The grid math works regardless of the actual weekday; this is just an example trace.]

### CSS Grid layout (single rule set)

```css
/* Phase 3: calendar grid. Visual polish (radius, shadows, transitions) → Phase 4 (STYL-01). */
#calendar { /* container only */ }

.cal-nav {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.cal-title {
  margin-left: auto;
  font-weight: 600;
}

.cal-weekdays,
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.cal-weekday {
  text-align: center;
  font-size: 0.875rem;
  color: #666;
  padding: 0.25rem 0;
}
.cal-cell {
  /* button reset */
  background: none;
  border: 1px solid #ddd;
  padding: 0.25rem;
  min-height: 3rem;
  position: relative;             /* anchor for badge */
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.cal-cell-adjacent {
  border: 1px solid #eee;
  color: #ccc;                    /* greyed out, no click target */
  min-height: 3rem;
  padding: 0.25rem;
  text-align: left;
}
.cal-cell.is-today {
  border: 2px solid #2563eb;       /* accent border, COLOR + WIDTH (not color-only) */
  color: #2563eb;
  font-weight: 600;
}
.cal-cell.is-selected {
  background: #2563eb;
  color: #fff;
}
.cal-cell.is-today.is-selected {
  /* both classes compose: filled bg + thicker border */
  background: #2563eb;
  color: #fff;
  border: 2px solid #1e40af;
}
.cal-badge {
  position: absolute;
  top: 0.125rem;
  right: 0.25rem;
  font-size: 0.75rem;
  color: inherit;
  font-weight: 600;
}
#date-header {
  margin: 1rem 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
}
```

**Why no media queries:** Single `repeat(7, 1fr)` adapts naturally — each cell is `viewport / 7 - gap`. On phones the cells get smaller; on desktop they get bigger. `min-height: 3rem` keeps them tappable on mobile. CONTEXT A explicitly forbids media queries in this phase.

**Why color encoding is not color-only:**
- Today: blue text + 2px border + bold. Three signals.
- Selected: white-on-blue background + (no text-decoration so it's distinguishable from today which is text-color signal). Two signals.
- Both: 2px darker border + filled bg. Border thickness alone differentiates from selected-only.

### Date header in `app.js` `render()`

```js
import { formatHeader } from './calendar.js';   // or inline in app.js
// …
function render() {
  renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate);
  dateHeader.textContent = formatHeader(selectedKey);
  const todos = getTodosForDate(state, selectedKey);
  renderTodoList(listContainer, todos, editingId);
}
```

## Runtime State Inventory

This is a **rename/refactor-adjacent** change (replacing `TODAY` with `selectedKey` throughout `app.js`), so this inventory is included.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — `state.todosByDate` schema unchanged. Existing dateKey-keyed entries are forward-compatible (Phase 1 already supports arbitrary dates). | None |
| Live service config | None — no external services. | None |
| OS-registered state | None — pure browser app. | None |
| Secrets / env vars | None. | None |
| Build artifacts | None — no build pipeline. | None |
| **Code references to `TODAY`** | `js/app.js` lines 20, 60, 68, 79, 88, 121, 135 (all `state, TODAY, …` calls + `getTodosForDate(state, TODAY)`) | Replace with `selectedKey`; keep `TODAY` only if needed for `is-today` highlight (delegated to `monthGrid` `today` parameter) |
| **Window dev hooks** | `window.dateKey/defaultState/load/save/STORAGE_KEY` (Phase 2 carry-over); STATE.md flags review | Optional cleanup this phase per open todo; not blocking |

**Verification grep (post-implementation):**
- `grep -n "TODAY" js/app.js` → 0 hits (after rename), or only inside a comment if retained for context.
- `grep -nE "selectedKey|viewYM" js/app.js` → multiple hits showing usage in handlers + render.

## Project Constraints (from CLAUDE.md)

| Directive | Phase 3 application |
|-----------|--------------------|
| Vanilla HTML/CSS/JS only — no build, no framework, no CDN runtime deps | `calendar.js` is plain ESM. No `import` from CDN. |
| `localStorage` persistence only (key `hansung-todo:v1`) | Schema unchanged. selectedKey/viewYM not persisted (CONTEXT D). |
| Single `index.html` entry point, GitHub Pages compatible | Only minor tweak: maybe nothing changes (app.js still owns mount). |
| ES modules via `<script type="module">` | New `calendar.js` follows same pattern. Imported by `app.js`. |
| `textContent`-only DOM rendering | All cell labels, badges, headers use `textContent` / `String(n)`. |
| Local-time `dateKey()` only — `toISOString` forbidden | `monthGrid` uses constructor-with-args; `formatHeader` reconstructs from `dateKey` parts. Grep gate maintained. |
| Storage boundary: only `js/storage.js` calls `localStorage.*` | `calendar.js` doesn't import storage at all. |
| GSD workflow gate before edits | Phase 3 plan must drive any edits — confirmed. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual leap-year branches | Date-constructor overflow rollover | ECMAScript 1 (1997); always available | Use `new Date(y, m, d+i)` instead of conditionals |
| Hand-rolled Korean weekday strings | `Intl.DateTimeFormat('ko-KR')` for full-format header | Intl baseline since ~2017 | Free locale data; no library |
| Per-cell event listeners | Single delegated listener + `closest()` | DOM Level 3 baseline | Pattern already used in Phase 2 |
| `<table>`-based calendar layout | CSS Grid `repeat(7, 1fr)` | Grid baseline 2017 | Cleaner markup, responsive without media queries |

**Deprecated/outdated:**
- `<table>` calendars — fine semantically but harder to make responsive without media queries [ASSUMED: weak preference; both work, CSS Grid wins on simplicity].
- Moment.js / Date-fns for any of this — overkill at this scale and forbidden by constraint.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Feb 2026 fits in exactly 4+28+10 = 42 cells (starts Sun) | Pattern 1 explanation | None — Pattern 1 produces 42 cells regardless; comment is illustrative |
| A2 | Jan 1 2026 is Thursday (used in trace example) | Code Examples | None — example only; production code computes via `getDay()` at runtime |
| A3 | `<table>` calendar is "less preferred" in 2026 | State of the Art | Low — CSS Grid is mainstream; `<table>` would still work if planner prefers |
| A4 | Korean speakers expect Sunday-start week | CONTEXT E (already locked) | Already user-decided |
| A5 | A single `min-height: 3rem` is mobile-tappable | CSS example | Low — Phase 4 polishes; v1 just needs functional |

**If this table is empty:** N/A — 5 assumptions noted, all low-impact (A1/A2 illustrative, A3/A5 cosmetic, A4 user-locked).

## Open Questions

1. **Should `formatHeader` live in `calendar.js` or `app.js`?**
   - What we know: It's date-formatting logic that pairs with calendar concerns.
   - What's unclear: Module ownership boundary — `calendar.js` is "view + math for the grid"; the header is *not* the grid.
   - Recommendation: Put it in `calendar.js` as a named export. Reasoning: it shares the "given a key, produce a UI string" concern with the grid renderer, and keeps `app.js` thin. Planner may decide otherwise; either is defensible.

2. **Should the calendar `<button>` cells be `disabled` when adjacent-month?**
   - What we know: CONTEXT E says clicks are disabled.
   - What's unclear: Implementation choice — `disabled` attribute on `<button>` vs render `<div>` (Pattern 3 chose `<div>`).
   - Recommendation: Use `<div>` (Pattern 3). `disabled` `<button>` still focusable in some browsers via tab; `<div>` is structurally non-interactive and cleaner for delegation guard.

3. **Should `state.todosByDate` ever be empty for a key after `removeTodo` empties the array?**
   - What we know: Phase 2's `removeTodo` returns `prev.filter(...)`, which produces `[]` for emptied dates — leaving the key in the object.
   - What's unclear: Does this matter for badge logic? `state.todosByDate[key]?.length` returns 0 either way (key absent → undefined → `?.length` undefined → `?? 0`).
   - Recommendation: No-op. Pattern 3's `count > 0` guard handles both cases. Planner doesn't need to add cleanup logic. (Future v2 could prune empty arrays for storage hygiene.)

4. **Cleanup of `window.*` dev hooks (open todo from STATE.md / Phase 2 SUMMARY).**
   - What we know: `window.dateKey/defaultState/load/save/STORAGE_KEY` still exposed.
   - What's unclear: Phase 3 scope explicitly mentions this as carry-over; CONTEXT doesn't lock either way.
   - Recommendation: Defer to planner / user. Removing them is one commit; keeping them is one comment. Doesn't block CAL-01..07 / TODO-08 verification.

## Environment Availability

Skipping — no external dependencies. Pure browser app, no new tools.

## Validation Architecture

Skipping — `workflow.nyquist_validation: false` per `.planning/config.json`.

Verification approach for Phase 3 will follow the established Phase 2 pattern: grep gates + manual UAT scenarios. Recommended verification scenarios for the planner to consider:

- **Grep gates (must remain 0):**
  - `grep -rE "innerHTML\\s*=" js/` → 0
  - `grep -rE "toISOString|\\.toJSON\\(|Date\\.UTC" js/` → 0
  - `grep -rE "localStorage\\." js/ | grep -v js/storage.js` → 0
  - `grep -rE "new Date\\(['\"]" js/` → 0 (string-arg Date construction forbidden)
- **Grep gates (must be present):**
  - `grep -E "function monthGrid|function prevMonth|function nextMonth|function todayYM|function renderCalendar" js/calendar.js` → 5 hits
  - `grep -E "selectedKey|viewYM" js/app.js` → multiple hits
- **Manual UAT scenarios:**
  1. 캘린더 진입 시 오늘 = 굵은 테두리 + accent text. (CAL-04)
  2. 오늘이 selected 시작 → filled bg + 두 클래스 동시 시각. (CAL-04 + CAL-05 동시)
  3. 다른 날 클릭 → selected 이동 + 헤더 변경 + todo list 변경. (CAL-05, CAL-07, TODO-08)
  4. "다음" 클릭 → 6월; selected는 5월에 남아있고 다시 "이전" 시 selected 셀 강조 유지.
  5. 5월 31일 → "다음" → 6월; "이전" → 다시 5월. 1월 ↔ 12월 wrap.
  6. 2024-02 (윤년) → 29일 표시, inMonth=true.
  7. "오늘" 버튼 → viewYM도 selectedKey도 오늘로.
  8. 인접달 셀 클릭 → 변화 없음 (no-op).
  9. 5월 15일에 todo 3개 추가 → 셀에 "3" 배지. 모두 삭제 → 배지 사라짐. (CAL-06)
  10. F5 reload → selectedKey가 오늘로 reset (CONTEXT D 확인).
  11. F5 reload → 추가했던 todo가 그 날짜에 그대로 (PERS-03 회귀).
  12. `<img src=x onerror=alert(1)>` 입력 → 텍스트만, alert 미발생 (STYL-02 회귀).

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No accounts, no auth |
| V3 Session Management | no | No sessions |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | yes | `text.trim()` guard in `addTodo`/`editTodo` (Phase 2); calendar adds no new user-text input |
| V6 Cryptography | no | No secrets, no signatures, no encryption |
| V14 Configuration | partial | Static asset; no env config; CSP could be added but out of scope |

### Known Threat Patterns for vanilla-JS-static

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via user-supplied todo text rendered into a calendar cell | Tampering | `textContent`-only render; no `innerHTML`. Phase 2 lock continues. Calendar cells render only badges (numbers from `.length`) and day numbers (from `Date.prototype.getDate()`) — neither path touches user input. |
| XSS via `data-key` attribute injection | Tampering | `data-key` is set from `dateKey()` output ("YYYY-MM-DD" — only digits + `-`). Read back via `closest('[data-key]').dataset.key` — read is a string, never `eval`'d, never inserted as HTML. Safe by construction. |
| Storage tampering (DevTools-modified `hansung-todo:v1`) | Tampering | Phase 1 `load()` already validates schema and falls back to `defaultState()` on malformed data. Calendar's `renderCalendar` reads `todosByDate[key]?.length ?? 0` — `?? 0` handles missing/undefined; the array-shape validation in `load()` handles non-array values. |
| ReDoS via user input | DoS | No regex against user input in `calendar.js`. `key.split('-').map(Number)` is O(n) and bounded to 3-4 chars per part. Safe. |
| Click-jacking | Tampering | Static GitHub Pages site. Out of scope for v1. Phase 4 could add `X-Frame-Options` if hosting headers allow. |

**Phase 3-specific check:** `data-key` attribute values come exclusively from `dateKey()` output, whose codomain is `\d{4}-\d{2}-\d{2}`. There's no path for user input to land in `data-key`, so the attribute is intrinsically safe. The grep gate `grep -rE "innerHTML\\s*=" js/ → 0` continues to be the load-bearing XSS defense.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/03-calendar-integration/03-CONTEXT.md` — locked decisions A–H.
- `.planning/REQUIREMENTS.md` — CAL-01..07, TODO-08, STYL-02 spec.
- `.planning/ROADMAP.md` — Phase 3 success criteria.
- `.planning/phases/01-foundation/01-CONTEXT.md` + `01-01-SUMMARY.md` — dateKey/storage interface.
- `.planning/phases/02-todo-crud/02-CONTEXT.md` + `02-PATTERNS.md` + `02-{01..04}-SUMMARY.md` — Phase 2 patterns reused.
- `js/dateKey.js`, `js/storage.js`, `js/todos.js`, `js/app.js`, `index.html`, `css/styles.css` — current source state.
- `CLAUDE.md` (project) — hard constraints + recommended stack.
- ECMA-262 §21.4 (Date) — constructor overflow normalization, `getDay`/`getDate` semantics.
- MDN: `Date.prototype.getDay`, `Element.closest`, `Intl.DateTimeFormat`, `Element.replaceChildren` — confirmed during research.

### Secondary (MEDIUM confidence)
- ASVS L1 mapping for static-site vanilla-JS — applied via judgment; no official mapping document exists for "no-backend single-page app" beyond V5/V14 guidance.

### Tertiary (LOW confidence)
- A1, A2, A5 in Assumptions Log — stylistic / illustrative, not load-bearing.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; Phase 2 stack carries through.
- Architecture: HIGH — every pattern has a Phase 2 analog.
- Pitfalls: HIGH — drawn from ECMA-262 spec semantics and Phase 1/2 lock truths.

**Research date:** 2026-05-03
**Valid until:** 2026-06-02 (~30 days; stable since stack is platform-only).

## RESEARCH COMPLETE
