# Architecture Research

**Domain:** No-build vanilla JS single-page app (calendar + per-day todos, localStorage persistence)
**Researched:** 2026-05-03
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       index.html (shell)                     │
│   <header>  <main id="app">  <script type="module">         │
├─────────────────────────────────────────────────────────────┤
│                       View Layer (DOM)                       │
│  ┌──────────────────┐         ┌──────────────────────┐      │
│  │ CalendarView     │         │ TodoListView         │      │
│  │ (month grid)     │         │ (selected-day list)  │      │
│  └────────┬─────────┘         └──────────┬───────────┘      │
│           │ click(date)                  │ add/toggle/edit/del
├───────────┴──────────────────────────────┴──────────────────┤
│                     Controller / App Glue                    │
│   main.js: wires events → store actions → re-render          │
├─────────────────────────────────────────────────────────────┤
│                       State Layer                            │
│   store.js: { todosByDate, selectedDate, viewMonth }         │
│              subscribe(listener) / setState(patch)           │
├─────────────────────────────────────────────────────────────┤
│                     Persistence Layer                        │
│   storage.js: load() / save() ↔ window.localStorage          │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `index.html` | Single entry point, mount nodes, loads `main.js` as module | Static HTML with `<div id="calendar-root">` and `<div id="todo-root">` |
| `main.js` | Bootstrap: load state, wire views to store, initial render | ES module, imports everything |
| `store.js` | Single source of truth for app state, pub/sub | Plain object + `setState`/`subscribe` closure |
| `storage.js` | localStorage read/write with namespace + JSON parse/stringify guard | Pure functions `load(key)` / `save(key, val)` |
| `models/todo.js` | Todo factory + id generation + shape validation | `createTodo(text)` returning `{id,text,done,createdAt}` |
| `views/calendar.js` | Render month grid, emit `date-selected` | Function `renderCalendar(root, state, handlers)` |
| `views/todoList.js` | Render todos for selected date, emit add/toggle/edit/delete | Function `renderTodoList(root, state, handlers)` |
| `utils/date.js` | Date helpers: `formatYMD(date)`, `monthMatrix(year,month)`, `today()` | Pure functions, no Date mutation |

## Recommended Project Structure

```
hansung-todo-gsd/
├── index.html                # Single entry point, no build
├── css/
│   └── styles.css            # All styles (calendar grid, todo list, modern polish)
├── js/
│   ├── main.js               # Bootstrap + wire-up
│   ├── store.js              # State + subscribe/setState
│   ├── storage.js            # localStorage adapter
│   ├── models/
│   │   └── todo.js           # Todo factory, id gen
│   ├── views/
│   │   ├── calendar.js       # Month grid render + date select
│   │   └── todoList.js       # Day's todo list render + CRUD events
│   └── utils/
│       └── date.js           # YYYY-MM-DD helpers, month matrix
└── .planning/                # GSD artifacts
```

### Structure Rationale

- **Flat top-level (`index.html`, `css/`, `js/`):** Matches "open in browser" mental model. Students/instructors can find everything in 3 folders.
- **`js/` modules with subfolders:** Folder-per-role (`models/`, `views/`, `utils/`) scales to ~10-20 files cleanly without forcing premature abstractions. For this app's size (~6-8 modules) the subfolders are still worth it because they signal *what kind* of module each is.
- **No `components/` framework-style folder:** There is no component framework. Views are render-functions, not classes/components.
- **Single CSS file:** Modern/polished styling fits comfortably in one file at this scope; splitting would add cognitive overhead with no payoff.

## Architectural Patterns

### Pattern 1: ES Modules via `<script type="module">`

**What:** Use native ES modules. `index.html` loads exactly one module entry; everything else is `import`/`export`.
**When to use:** Always, for any modern no-build vanilla project. All evergreen browsers (Chrome, Firefox, Safari, Edge) ship native module support.
**Trade-offs:**
- Pros: Real `import`/`export`, scoped variables (no globals), tree of dependencies obvious from imports, matches what students will see in any modern codebase.
- Cons: Requires being served over `http://` or `file://` with module support (modern browsers handle `file://` for modules in most cases; if blocked, a one-line `python3 -m http.server` gets around it). No IIFE boilerplate required.

**Example:**
```html
<!-- index.html -->
<script type="module" src="./js/main.js"></script>
```

```js
// js/main.js
import { createStore } from './store.js';
import { loadAll, saveAll } from './storage.js';
import { renderCalendar } from './views/calendar.js';
import { renderTodoList } from './views/todoList.js';
import { formatYMD } from './utils/date.js';
```

> Note for instructor demo: if double-clicking `index.html` causes module CORS errors on a given browser, document `python3 -m http.server` as the one-liner fallback.

### Pattern 2: Single Store + Render-on-Change

**What:** One plain-object state container with `getState()`, `setState(patch)`, `subscribe(fn)`. Every state change triggers all subscribers, which re-render their slice of the DOM. Persistence is a subscriber that writes to localStorage.
**When to use:** Any vanilla app where multiple views reflect overlapping state (here: calendar shows todo counts per day, todo list shows todos for selected day — both depend on the same data).
**Trade-offs:**
- Pros: One source of truth, no event-bus spaghetti, debugging is "what's in state?" not "who fired what?", trivially testable, persistence is one subscriber line.
- Cons: Re-rendering whole views on every change is wasteful at scale — but at month-grid (42 cells) + ~tens of todos/day, well below any perceptible cost.

**Example:**
```js
// js/store.js
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    setState(patch) {
      state = { ...state, ...patch };
      listeners.forEach(fn => fn(state));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
```

```js
// js/main.js
const store = createStore({
  todosByDate: loadAll(),
  selectedDate: formatYMD(new Date()),
  viewMonth: { year: 2026, month: 5 }, // 1-indexed for human readability
});

store.subscribe(state => saveAll(state.todosByDate));         // persistence
store.subscribe(state => renderCalendar(calRoot, state, h));  // view 1
store.subscribe(state => renderTodoList(todoRoot, state, h)); // view 2
// initial paint
renderCalendar(calRoot, store.getState(), h);
renderTodoList(todoRoot, store.getState(), h);
```

### Pattern 3: Pure Render Functions (DOM Building, not innerHTML for user content)

**What:** Each view is `render(rootElement, state, handlers)`. It clears the root and rebuilds children using `document.createElement` + `textContent`. `<template>` element is used only for repeated complex sub-fragments (optional optimization).
**When to use:** Vanilla apps with user-provided text content (todos). Avoids XSS without needing escaping.
**Trade-offs:**
- Pros: No XSS risk (user text goes through `textContent`, never `innerHTML`). No string-template footguns. Easy to attach event listeners during creation.
- Cons: More verbose than `innerHTML = \`...\``. Naive "clear + rebuild" loses focus/scroll on inputs — mitigated by re-focusing the active edit input after render, or by surgically updating only changed nodes (defer until/if needed).

**Example:**
```js
// js/views/todoList.js
export function renderTodoList(root, state, h) {
  root.replaceChildren(); // clear
  const list = document.createElement('ul');
  for (const t of state.todosByDate[state.selectedDate] ?? []) {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = t.done;
    cb.addEventListener('change', () => h.toggle(t.id));
    const span = document.createElement('span');
    span.textContent = t.text; // safe
    li.append(cb, span);
    list.append(li);
  }
  root.append(list);
}
```

### Pattern 4: localStorage as a Subscriber (write-through)

**What:** Persistence is not called from action handlers; it's a `store.subscribe(state => save(state.todosByDate))`. State mutation always implies persistence.
**When to use:** Whenever the entire persistable state is small enough to serialize on every change (true here — at 1KB/day × 365 days = ~365KB worst case, well under localStorage's 5MB limit).
**Trade-offs:**
- Pros: Impossible to forget to save. Single line. No "did I save?" bugs.
- Cons: Serializes everything on every keystroke if edit mode binds keystrokes to state — fix by debouncing edits (commit on blur/Enter) rather than per-keystroke state writes.

## Data Model & localStorage Schema

### Todo Shape

```ts
interface Todo {
  id: string;          // crypto.randomUUID() — built-in, no deps
  text: string;        // user content
  done: boolean;       // checkbox state
  createdAt: number;   // Date.now() epoch ms — sortable, locale-free
}
```

### localStorage Schema

**Single key, single JSON blob** (chosen over per-day keys for atomicity and simpler load):

- **Key:** `hansung-todo:v1`
- **Value:** JSON string of `{ todosByDate: { [YYYY-MM-DD]: Todo[] } }`

Date keys are `YYYY-MM-DD` (ISO 8601 short form) — sortable as strings, locale-independent, matches `<input type="date">` natively.

### Example JSON

```json
{
  "todosByDate": {
    "2026-05-03": [
      {
        "id": "a1b2c3d4-e5f6-4789-abcd-ef0123456789",
        "text": "Write ARCHITECTURE.md",
        "done": true,
        "createdAt": 1746230400000
      },
      {
        "id": "b2c3d4e5-f6a7-4890-bcde-f01234567890",
        "text": "Review research synthesis",
        "done": false,
        "createdAt": 1746234000000
      }
    ],
    "2026-05-10": [
      {
        "id": "c3d4e5f6-a7b8-4901-cdef-012345678901",
        "text": "Sunday planning",
        "done": false,
        "createdAt": 1746489600000
      }
    ]
  }
}
```

### Schema Rationale

- **Versioned key (`:v1`)**: lets future shape changes coexist or migrate without colliding with old data.
- **Date-keyed map (not flat array with `date` field)**: O(1) lookup per day; calendar count is `state.todosByDate[ymd]?.length ?? 0`.
- **Empty-day pruning**: when a day's array becomes empty (last todo deleted), delete the key to keep the blob small.
- **Single blob vs per-date keys**: single blob is atomic (no half-saved state) and simpler for `Object.keys()` iteration when rendering counts. Cost is re-stringifying the whole blob on save — negligible at this scale.

## Data Flow

### Action Flow (e.g. add todo)

```
[User types text + clicks Add]
     ↓
[todoList view] onClick → handlers.add(text)
     ↓
[main.js handler]
   const todo = createTodo(text);
   const day = state.selectedDate;
   const next = { ...state.todosByDate, [day]: [...(state.todosByDate[day] ?? []), todo] };
   store.setState({ todosByDate: next });
     ↓
[store] notifies all subscribers
     ↓
[storage subscriber] save(state.todosByDate)  → localStorage
[calendar subscriber] re-render (count badge updates)
[todoList subscriber] re-render (new li appears)
```

### State Management

```
            ┌────────────────────────────┐
            │           store            │
            │  { todosByDate,            │
            │    selectedDate, viewMonth}│
            └───┬─────────────┬──────────┘
   subscribe(fn)│             │ setState(patch)
                ↓             ↑
   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
   │ renderCal    │    │ handlers     │ ←──│ DOM events   │
   │ renderTodo   │    │ (add/toggle/ │    │ (click/input)│
   │ saveAll      │    │  edit/del/   │    └──────────────┘
   └──────────────┘    │  selectDate/ │
                       │  navigateMo) │
                       └──────────────┘
```

### Key Data Flows

1. **App boot**: `main.js` → `loadAll()` reads localStorage → seeds store → first render of both views.
2. **Date selection**: calendar cell click → `setState({ selectedDate })` → todoList re-renders for new day; calendar re-renders to highlight selected cell.
3. **Month navigation**: prev/next button → `setState({ viewMonth })` → calendar re-renders new month grid; todoList unchanged unless selected date is also changed.
4. **Todo CRUD**: view event → handler builds new `todosByDate` immutably → `setState` → storage subscriber persists + both views re-render.
5. **Refresh**: page reload → boot flow re-hydrates from localStorage; selectedDate defaults to today.

## Suggested Build / Phase Order

This ordering minimizes rework by establishing data + state foundations before UI polish.

| Phase | Goal | Modules Built | Verifiable |
|-------|------|---------------|------------|
| **P1: Skeleton + Storage** | Static `index.html`, `storage.js`, `models/todo.js`, `utils/date.js`. No UI yet. | `storage.js`, `models/todo.js`, `utils/date.js` | Open browser console, manually call `save`/`load`/`createTodo`; round-trip a todo through localStorage. |
| **P2: Store + Wiring** | `store.js`, `main.js` boot. Console-driven actions only. | `store.js`, `main.js` | `store.setState({selectedDate:'2026-05-03'})` from console, see subscriber log fire and localStorage update. |
| **P3: Todo List View** | `views/todoList.js` with add/toggle/edit/delete. Hardcoded `selectedDate=today`. No calendar yet. | `views/todoList.js` | All 4 CRUD operations visible in DOM and persisted across reload. |
| **P4: Calendar View** | `views/calendar.js` month grid + date click + month nav. Wires `selectedDate` to store. | `views/calendar.js`, calendar handlers in `main.js` | Click a date → todoList shows that date's todos. Add todo → calendar count badge updates. |
| **P5: Polish** | `css/styles.css` modern look (shadows, transitions, typography), per-cell todo count badges, empty states, keyboard affordances. | `css/styles.css` updates, minor view tweaks | Visual review against "Modern/Polished" requirement. |

**Dependency rationale:** storage → store → views → styling. Each phase is independently verifiable and adds one user-visible capability (except P1/P2 which are foundation). P3 before P4 because the todoList is the harder data-bound view; getting it right against a hardcoded date isolates calendar complexity from CRUD complexity.

## Component Boundaries & Contracts

### `store.js` contract

```js
createStore(initialState) → {
  getState(): State,
  setState(patch: Partial<State>): void,   // shallow merge, notifies all
  subscribe(fn: (state) => void): () => void  // returns unsubscribe
}
```

### `storage.js` contract

```js
loadAll(): { [YYYY-MM-DD]: Todo[] }   // returns {} if empty/corrupt
saveAll(todosByDate): void            // serializes + writes
STORAGE_KEY = 'hansung-todo:v1'
```

### View contract

```js
renderCalendar(rootEl, state, handlers)
  // handlers: { selectDate(ymd), navigateMonth(delta) }

renderTodoList(rootEl, state, handlers)
  // handlers: { add(text), toggle(id), edit(id, newText), remove(id) }
```

Views are **pure of state mutation** — they only call handlers. Handlers (defined in `main.js`) are the only place that calls `store.setState`. This keeps the action surface auditable in one file.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| view ↔ main.js | handler callbacks (passed in render args) | Views never import `store` directly |
| main.js ↔ store | `setState` (write), `subscribe` (read) | Single mutation site |
| store ↔ storage | `subscribe` callback writes; boot reads once | No two-way binding; localStorage is downstream |
| view ↔ DOM | `createElement` + `textContent`; never `innerHTML` for user data | XSS-safe by construction |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Demo / single user | Current design is sufficient. No changes needed. |
| 1 year of daily use (~365 days, ~10 todos/day) | Still fine. ~3,650 todos × ~100 bytes = ~365KB, well under 5MB localStorage cap. Full re-render of 42 cells + visible day's list is sub-millisecond. |
| Power user (1000s of todos per day, multi-year) | First bottleneck would be localStorage 5MB cap, not render perf. Mitigation: prune empty days (already in design); if cap is hit, migrate to IndexedDB — but this is far outside v1 scope. |

### Scaling Priorities (in order they'd matter)

1. **localStorage size cap (5MB)**: only concern if data grows to thousands of days × dozens of todos. Out of scope.
2. **Render cost of full month grid on every state change**: not measurable at this scale. If it ever mattered, render only changed cells.
3. **Editing UX (focus loss on re-render)**: real concern even at small scale — handle by committing edits on blur/Enter rather than per-keystroke `setState`.

## Anti-Patterns

### Anti-Pattern 1: Sprinkling `localStorage.setItem` Throughout Handlers

**What people do:** Each CRUD handler calls `localStorage.setItem(...)` directly after mutating state.
**Why it's wrong:** Easy to forget one path; state and storage drift; can't change storage backend without touching every handler.
**Do this instead:** Make persistence a single `store.subscribe(state => saveAll(state.todosByDate))` line in `main.js`. Handlers only call `setState`.

### Anti-Pattern 2: `innerHTML` with User-Provided Text

**What people do:** `el.innerHTML = \`<li>${todo.text}</li>\`` to keep templating concise.
**Why it's wrong:** A todo with text `<img src=x onerror=alert(1)>` executes script. Even single-user localStorage apps shouldn't ship XSS sinks (data syncs across devices someday, copy-paste vectors, instructor demo machines).
**Do this instead:** Build elements with `createElement` and assign text via `textContent`. Use `innerHTML` only for fully-static markup you authored.

### Anti-Pattern 3: Globals Instead of Modules

**What people do:** Skip `type="module"`, attach everything to `window`, rely on `<script>` ordering.
**Why it's wrong:** Implicit dependencies, name collisions, no clear "entry point", students learn the wrong patterns.
**Do this instead:** One `<script type="module" src="./js/main.js">` and explicit `import`/`export` everywhere.

### Anti-Pattern 4: Storing `Date` Objects or Locale-Formatted Strings as Keys

**What people do:** Use `new Date().toLocaleDateString()` or store `Date` objects (which serialize unpredictably).
**Why it's wrong:** Locale strings differ between users/browsers (`"5/3/2026"` vs `"3/5/2026"` vs `"2026/5/3"`); keys collide or miss; `Date` round-trips through JSON as strings anyway.
**Do this instead:** Always use `YYYY-MM-DD` strings as the canonical date key. Convert to/from `Date` only at the rendering edge.

### Anti-Pattern 5: jQuery / Mini-Framework Smuggled In via CDN

**What people do:** "It's not a build tool, it's just a CDN" → add jQuery/Alpine/htmx.
**Why it's wrong:** Violates the "no framework" constraint, hides the vanilla-JS learning, adds a network dependency that breaks offline `file://` usage.
**Do this instead:** Stay vanilla. The app is small enough that DOM APIs are not painful.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| `window.localStorage` | Synchronous `getItem`/`setItem` wrapped in `storage.js` | 5MB cap; throws `QuotaExceededError` if full — wrap saves in try/catch and surface to user. JSON parse must handle corruption (return `{}` on failure). |
| `crypto.randomUUID()` | Direct call in `models/todo.js` | Available in all modern browsers + Node; no polyfill needed. |

No network/server integrations — this is a fully local static app.

## Sources

- MDN: [JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) — `type="module"` semantics
- MDN: [Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) — 5MB limit, synchronous API, QuotaExceededError
- MDN: [Crypto.randomUUID()](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — built-in UUID generation, broad support
- MDN: [Element.textContent vs innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent) — XSS safety
- Project context: `.planning/PROJECT.md` (no-build constraint, localStorage persistence, monthly grid scope)

---
*Architecture research for: no-build vanilla JS calendar todo app*
*Researched: 2026-05-03*
