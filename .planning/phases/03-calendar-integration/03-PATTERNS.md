# Phase 3: Calendar Integration — Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 5 (1 new, 4 modified)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `js/calendar.js` (NEW) | domain module (pure helpers + view renderer) | request-response (state → DOM) | `js/todos.js` | exact — same shape: pure helpers + `render*(container, ...)` |
| `js/app.js` (MODIFY) | bootstrap / wiring (mount + delegated events + commit/render) | event-driven (UI events → commit → render) | `js/app.js` (Phase 2 self) | exact — extend in place |
| `index.html` (MODIFY) | entry point markup | static — module script bootstraps | `index.html` (Phase 2 self) | exact — only `<main id="app">` internals change |
| `css/styles.css` (MODIFY) | minimal stylesheet (state classes only) | static | `css/styles.css` (Phase 2 self, lines 6-16) | exact — same minimalism budget |
| `tests.html` + JS test imports | test harness | request-response | (none) | no analog — repo has no test harness today |

## Pattern Assignments

### `js/calendar.js` (NEW — domain module: pure helpers + view)

**Analog:** `js/todos.js` (entire file is the template)

**Module header pattern** (`js/todos.js` lines 1-2):
```javascript
// Phase 2: todos 도메인 모듈 — 순수 immutable state 헬퍼 5종 + DOM 렌더 (renderTodoList/renderTodoItem).
// localStorage I/O와 dateKey 변환은 하지 않는다 (storage.js 경계 + 호출처가 key 전달 패턴 유지).
```
Apply: `js/calendar.js` opens with the same comment shape — name the role, explicitly disclaim I/O. Calendar must `import { dateKey } from './dateKey.js'` only (no `storage.js` access; `todosByDate` is passed in).

**Pure helper export pattern** (`js/todos.js` lines 4-8):
```javascript
export function getTodosForDate(state, key) {
  const list = state.todosByDate[key] ?? [];
  return [...list].sort((a, b) => a.createdAt - b.createdAt);
}
```
Apply: `monthGrid(year, monthIndex0)`, `prevMonth(viewYM)`, `nextMonth(viewYM)`, `todayYM()` are all named `export function` declarations, no default export, immutable inputs/outputs. `viewYM` is `{ year, month }` (month = 0..11) — match the existing `getMonth()` 0-based convention from `dateKey.js` line 6.

**dateKey reuse — no UTC API** (`js/dateKey.js` lines 3-8):
```javascript
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```
Apply: every cell's `key` field MUST come from `dateKey(new Date(year, monthIndex0, dayNum))`. NEVER use `toISOString()`, `Date.UTC()`, `setUTCDate()`. The 6×7 grid loop must construct dates with the local-time `Date(y, m, d)` constructor, then run them through `dateKey()`.

**View renderer pattern — full subtree replace, textContent-only** (`js/todos.js` lines 68-82):
```javascript
export function renderTodoList(container, todos, editingId) {
  if (todos.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '아직 할 일이 없습니다.';
    container.replaceChildren(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'todo-list';
  for (const t of todos) {
    ul.append(renderTodoItem(t, t.id === editingId));
  }
  container.replaceChildren(ul);
}
```
Apply: `renderCalendar(container, viewYM, selectedKey, todosByDate)` builds the full subtree (nav row + weekday header row + 6×7 cell grid) then `container.replaceChildren(...)` once. Each cell uses `textContent` for the day number and badge count (XSS guard carried from Phase 2). For per-cell construction follow the same `renderTodoItem` style (lines 84-119): `document.createElement`, set `dataset.key = cellKey`, push state via `classList.add('today' | 'selected' | 'out-of-month')`, append children, return the node.

**dataset id → click delegation hook** (`js/todos.js` lines 86-87):
```javascript
const li = document.createElement('li');
li.dataset.id = t.id;
```
Apply: `cell.dataset.key = cell.key` so `app.js` delegated handler reads `e.target.closest('[data-key]')?.dataset.key`. For nav buttons use a parallel `dataset.nav = 'prev' | 'next' | 'today'` so the same delegated `click` listener can branch.

---

### `js/app.js` (MODIFY — bootstrap / wiring)

**Analog:** `js/app.js` (current Phase 2 file — extend, do not rewrite)

**Module-variable state pattern** (lines 20-22):
```javascript
const TODAY = dateKey();
let state = load();
let editingId = null; // transient UI state — store 외부 (02-03에서 사용)
```
Apply: ADD two transient module vars next to `editingId`:
```javascript
let selectedKey = dateKey();           // decision D — memory only, reset to today on reload
let viewYM = { year: new Date().getFullYear(), month: new Date().getMonth() }; // decision B
```
Do NOT persist either through `commit/save`. They are pure UI state, same lifetime as `editingId`.

REMOVE the `const TODAY = dateKey();` capture (line 20) — every read becomes `selectedKey`. All four delegated handlers currently passing `TODAY` (lines 68, 79, 88, 121, 135) must switch to `selectedKey`. This is the single highest-risk edit; grep `TODAY` and replace each call site individually.

**Mount node guard** (lines 47-49):
```javascript
const root = document.getElementById('app');
if (!root) throw new Error('[hansung-todo] #app 마운트 노드가 없습니다. ...');
root.replaceChildren(form, listContainer);
```
Apply: BEFORE the `replaceChildren`, build three section containers (`calendarContainer`, `headerContainer`, `listContainer`) and mount them in order: `root.replaceChildren(calendarContainer, headerContainer, form, listContainer)`. Match the existing `buildForm()` / `buildListContainer()` factory style (lines 24-43) — add `buildCalendarContainer()` and `buildHeaderContainer()` returning bare `<section id="calendar">` / `<section id="date-header">`.

**commit/render funnel** (lines 51-62):
```javascript
function commit(nextState) {
  state = nextState;
  if (!save(state)) {
    console.warn('[hansung-todo] save failed; mutation kept in memory');
  }
  render();
}

function render() {
  const todos = getTodosForDate(state, TODAY);
  renderTodoList(listContainer, todos, editingId);
}
```
Apply: `commit` is unchanged — every mutation still funnels through it (decision H). Extend `render()` to fan out three subviews:
```javascript
function render() {
  renderCalendar(calendarContainer, viewYM, selectedKey, state.todosByDate);
  renderHeader(headerContainer, selectedKey);
  const todos = getTodosForDate(state, selectedKey);
  renderTodoList(listContainer, todos, editingId);
}
```
The single `render()` invariant from Phase 2 (called at the bottom of every event handler via `commit`, plus the bootstrap call on line 143) is preserved verbatim — just the body fans out.

**Delegated event pattern** (lines 83-93):
```javascript
listContainer.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.closest('li')?.dataset.id;
  if (!id) return;
  if (t.matches('.todo-remove')) commit(removeTodo(state, TODAY, id));
  ...
});
```
Apply: ONE delegated `click` listener on `calendarContainer` that branches on:
1. Nav button: `t.closest('[data-nav]')?.dataset.nav` → `'prev'|'next'|'today'` → mutate `viewYM` (and `selectedKey` for `'today'`) → `render()` (no `commit` — no state mutation, no save).
2. Cell click: `t.closest('[data-key]')?.dataset.key` → reject if cell has class `out-of-month` (decision E: 인접 셀 클릭 비활성) → set `selectedKey = key` → `render()`.

Mirror the `instanceof HTMLElement` + `closest()?.dataset.X` guard pattern verbatim — same shape Phase 2 uses for click/change/keydown/focusout.

**Final bootstrap call** (line 143):
```javascript
render();
```
Unchanged — initial render still happens once at end of module.

**Remove `window.*` dev exposure?** Lines 6-10 export to `window` for Phase 1 console testing. Decision deferred per CONTEXT `<deferred>` ("Phase 3 wiring 정리 시 같이 검토"). Default: leave as-is unless STATE.md says otherwise. If removed, do it as a separate diff hunk.

---

### `index.html` (MODIFY — entry markup)

**Analog:** current `index.html` (Phase 2 file)

**Current state** (lines 9-12):
```html
<body>
  <main id="app"><!-- Phase 2/3에서 캘린더와 todo 리스트가 여기에 렌더됨 --></main>
  <script type="module" src="./js/app.js"></script>
</body>
```
Apply: NO STRUCTURAL CHANGES. The `<main id="app">` mount + module script tag stays intact — `js/app.js` builds the three sections in JS (per existing `buildForm()`/`buildListContainer()` precedent in `app.js` lines 24-43). The HTML comment may be updated to reflect the 3-section internal layout, but that's cosmetic.

Pitfall: do NOT pre-render `<section id="calendar">` etc. in HTML and then have JS query for them — that splits mount logic across two files. Phase 2's pattern is "HTML provides a single empty mount; JS owns all subtree construction." Preserve it.

---

### `css/styles.css` (MODIFY — minimal calendar styles)

**Analog:** current `css/styles.css` lines 6-16 (Phase 2 minimal style block)

**Phase 2 minimalism budget** (lines 1-16):
```css
/* Phase 1: 정적 자산 구조(DEL-02) 충족용 골격. 본격 스타일은 Phase 4 (STYL-01). */
:root {
  /* design tokens placeholder — Phase 4에서 채움 */
}

/* Phase 2: todo 행 상태 시각 구분 (미니멀). 본격 폴리시는 Phase 4 (STYL-01). */
.todo-list .done .todo-text {
  text-decoration: line-through;
  color: #999;
}
.empty {
  color: #999;
}
.editing .todo-text {
  display: none;
}
```
Apply: Add a `/* Phase 3: ... */` comment header, then the minimum-viable rules:
1. `#calendar` grid container — `display: grid; grid-template-columns: repeat(7, 1fr); grid-template-rows: auto auto repeat(6, 1fr);` (1 nav row + 1 weekday header row + 6 fixed week rows per decision E).
2. `.cal-cell` base + state classes: `.today` (border weight per decision C), `.selected` (filled bg), `.out-of-month` (gray text + `pointer-events: none` per decision E), `.cal-cell` containing `.cal-badge` (small count node, omitted entirely when 0 per decision G).
3. NO gradients, shadows, transitions, animations — those belong to Phase 4 (scope_guardrail).

Style budget guideline: target ≤ 25 new lines. If the diff exceeds that, push polish to Phase 4.

**Color choice constraint** (decision C): today + selected differ by **shape, not just color** — use border-weight for today, filled background for selected. Combined state stacks both classes. The Phase 2 `#999` gray is the only existing color — keep `.out-of-month` consistent with it.

---

### `tests.html` + JS test imports (OPTIONAL — no analog)

The repo currently has **no `tests.html`** (verified: `ls` of repo root shows only `index.html`). CONTEXT does not require introducing one in Phase 3.

Decision for planner: **skip** unless Phase 3 plan explicitly elects to add one. If added, follow STACK.md section "Plain `console.assert` test harness in `tests.html`" — a sibling HTML file that imports the same ES modules and runs assertions against the pure helpers (`monthGrid`, `prevMonth`, `nextMonth`, `todayYM`). Pure-helper testability is the reason these are exported separately from `renderCalendar`.

## Shared Patterns

### Local-time-only date math
**Source:** `js/dateKey.js` lines 3-8
**Apply to:** `js/calendar.js` (every Date construction in `monthGrid`, `prevMonth`, `nextMonth`, `todayYM`)
```javascript
const y = d.getFullYear();
const m = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
```
Forbidden: `toISOString`, `Date.UTC`, `setUTCFullYear`, `getUTCDate`, etc. (Phase 1 lock — `<carried_forward>` row 1).

### XSS-safe rendering
**Source:** `js/todos.js` lines 100, 104
```javascript
body.value = t.text;        // value는 attribute가 아니라 property — XSS 안전
body.textContent = t.text;  // XSS 안전
```
**Apply to:** `js/calendar.js` — every cell day-number, weekday header, badge count, header text uses `textContent` (or `value` for inputs). Never `innerHTML`, never template strings concatenated into HTML.

### Module-variable transient UI state
**Source:** `js/app.js` line 22 (`let editingId = null`)
**Apply to:** `js/app.js` Phase 3 additions — `selectedKey` and `viewYM` follow the same lifecycle: scoped to module, never written to `state`, never persisted via `save()`. Reset semantics on reload come from re-initialization at module load (`let selectedKey = dateKey()`), matching how `editingId` resets to `null` on reload.

### Single `render()` funnel
**Source:** `js/app.js` lines 59-62 + line 143 (bootstrap call)
**Apply to:** `js/app.js` — every code path that mutates `selectedKey`, `viewYM`, `editingId`, or `state` ends with one `render()` call (directly, or via `commit()` for state mutations). No partial subtree updates. This is the Phase 2 lock that makes the calendar's "live badge update on todo CRUD" free — `commit` already calls `render`, which now also re-renders the calendar.

### Delegated events with `closest()?.dataset.X` guard
**Source:** `js/app.js` lines 74-93 (change + click delegation)
**Apply to:** `js/app.js` calendar listener — same `instanceof HTMLElement` + `closest()?.dataset.key` shape. Single listener on the calendar container; branch on `data-nav` vs `data-key`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `tests.html` | test harness | request-response | Repo has no existing test harness; planner should treat as optional and reference STACK.md if elected. |

## Metadata

**Analog search scope:** repo root, `js/`, `css/`
**Files scanned:** 6 (`js/app.js`, `js/todos.js`, `js/storage.js`, `js/dateKey.js`, `index.html`, `css/styles.css`)
**Pattern extraction date:** 2026-05-03
