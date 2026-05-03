# Pitfalls Research

**Domain:** No-build vanilla JS date-based todo app with localStorage + monthly calendar grid
**Researched:** 2026-05-03
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: UTC drift in `YYYY-MM-DD` date keys

**What goes wrong:**
A todo created on May 3 (local) gets stored under key `2026-05-02` because `new Date().toISOString().slice(0,10)` returns the UTC date. After midnight UTC, every selected day silently maps to the wrong bucket for users west of UTC. Todos "disappear" or appear on the previous/next day.

**Why it happens:**
`Date.prototype.toISOString()` always serializes in UTC. Developers reach for it because it's the shortest path to a `YYYY-MM-DD` string and don't realize the calendar grid renders local-day cells while the key is UTC-day.

**How to avoid:**
Define one helper and use it everywhere — both for "today's key" and for calendar cell keys:

```js
// dateKey.js — single source of truth
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```
Never call `.toISOString()`, `.toJSON()`, or `Date.UTC(...)` for keys. Construct calendar cell `Date`s with the local constructor `new Date(year, monthIndex, day)` (not the string parser, which has historical UTC vs local ambiguity for `YYYY-MM-DD`).

**Warning signs:**
- A late-night manual test shows a todo on the wrong day
- `toISOString` appears anywhere outside debug logs
- `new Date('2026-05-03')` is used (parses as UTC midnight in most engines)

**Phase to address:**
Earliest data-model phase, before any persistence or rendering — the key format is load-bearing for storage, calendar cells, and the selected-day query.

---

### Pitfall 2: `innerHTML` XSS when rendering todo text

**What goes wrong:**
User enters `<img src=x onerror="localStorage.clear()">` as a todo. Renderer does `li.innerHTML = todo.text`. On next render the script runs and wipes all data. Even without malicious intent, `&`, `<`, `>` corrupt display.

**Why it happens:**
`innerHTML` is the most ergonomic way to build markup; tutorials use it freely. Devs assume "it's just my own browser" and forget that paste, shared exports, or future sync can introduce hostile strings.

**How to avoid:**
- Use `textContent` for all user-controlled strings (todo text, edit fields).
- Build structure with `document.createElement` + `append`, not template literal `innerHTML`.
- If a template literal renderer is used for static structure, interpolate user text via a placeholder + post-render `el.textContent = todo.text`.
- Add a lint check: grep CI step that fails if `innerHTML\s*=` appears next to a variable in `src/`.

**Warning signs:**
- Any line of the form `el.innerHTML = \`...${userInput}...\``
- A todo containing `<` renders as a tag instead of literal text
- Reviewer says "let's just use innerHTML for speed"

**Phase to address:**
Render/UI phase — establish the "no innerHTML for user data" rule with the very first list render, before patterns calcify.

---

### Pitfall 3: localStorage failure modes treated as impossible

**What goes wrong:**
App calls `JSON.parse(localStorage.getItem('todos'))` directly. Four scenarios crash the app:
1. **First run** — key is `null` → `JSON.parse(null)` returns `null`, then `.forEach` throws.
2. **Corrupted value** — user edits storage in DevTools, or a half-written value from a previous crash → `SyntaxError`.
3. **Quota exceeded** — `setItem` throws `QuotaExceededError` (~5MB cap, lower in some browsers); the new todo silently isn't saved.
4. **Storage disabled** — Safari Private Browsing historically threw on `setItem`; some embedded WebViews and strict cookie/storage settings disable it. Accessing `window.localStorage` itself can throw a `SecurityError`.

**Why it happens:**
Happy-path coding. localStorage looks synchronous and infallible, and the dev's own browser never hits these states.

**How to avoid:**
Wrap every read and write:

```js
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback; // corrupted or unavailable
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // QuotaExceededError or SecurityError — surface to UI
    return false;
  }
}
```
- Probe availability once at boot (`try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); } catch {}`) and show a banner if unavailable instead of failing silently.
- On `save() === false`, show a toast "데이터를 저장하지 못했습니다" rather than pretending the todo persisted.

**Warning signs:**
- `JSON.parse(localStorage.getItem(...))` appears un-wrapped
- No fallback value for first-run state
- Manually clearing storage in DevTools breaks the app

**Phase to address:**
Persistence phase — define `load`/`save` helpers as the only allowed storage API and forbid raw `localStorage.*` calls in feature code.

---

### Pitfall 4: ES modules over `file://` — broken double-click open

**What goes wrong:**
PROJECT.md states "빌드 도구 없이 `index.html`을 브라우저로 열어 동작한다." If the code uses `<script type="module" src="app.js">` and `import` statements, opening `index.html` from the filesystem fails: Chrome/Edge/Firefox/Safari block module loading over the `file://` scheme with a CORS error. The page silently renders an empty calendar with no obvious cause for a non-developer student.

**Why it happens:**
Modern JS instinctively uses `import`/`export`. The `file://` CORS restriction on modules is a 2018+ browser security policy and isn't obvious until you test the actual delivery mechanism.

**How to avoid:**
Pick one and document it in README:
- **Option A (recommended for "double-click works"):** No `type="module"`. Use plain `<script src="...">` tags with a documented load order (utilities → state → render → bootstrap). Expose a single namespace (e.g. `window.App`) instead of imports.
- **Option B:** Keep modules but ship a one-liner in README: `python3 -m http.server` or `npx serve`, and acknowledge double-click won't work.

The PROJECT.md constraint ("빌드 없이 동작") + "정적 호스팅(파일 더블클릭 또는 GitHub Pages 수준)" leans toward Option A. GitHub Pages serves over `http(s)://` so modules work there — the breaking case is local double-click.

**Warning signs:**
- README says "open index.html" but code has `import` statements
- Console error: "Access to script at 'file:///...' from origin 'null' has been blocked by CORS policy"
- Tested only via Live Server / local HTTP

**Phase to address:**
Project bootstrap / first-render phase — choose the loading strategy in the same commit that creates `index.html`. Verify by literally double-clicking the file in Finder/Explorer.

---

### Pitfall 5: Calendar grid edge cases (first-weekday, leap year, prev/next month fill)

**What goes wrong:**
- Grid starts on the wrong column because dev hard-codes Sunday-first or Monday-first without picking a convention; leading blank cells misalign weekdays.
- February in leap years renders 28 days instead of 29 because of `new Date(year, 2, 0)` confusion (`monthIndex` is 0-based; "last day of month N" = `new Date(year, N+1, 0).getDate()` is correct, but devs frequently get the off-by-one wrong).
- "Days from previous/next month" filler cells (the greyed-out leading/trailing days) get clicked and create todos under wildly wrong keys because the cell's `Date` was constructed with the displayed month rather than the actual month of the date.
- Month navigation `setMonth(m+1)` on Jan 31 → March 3 (skips Feb) because `Date` overflows day-of-month into the next month.

**Why it happens:**
JS `Date` arithmetic is famously full of edge cases; calendar code is rarely tested against month boundaries; the grid is built visually first and dates are bolted on.

**How to avoid:**
- Always compute the grid from `firstOfMonth = new Date(year, monthIndex, 1)` and `daysInMonth = new Date(year, monthIndex + 1, 0).getDate()`.
- For navigation, do `new Date(year, monthIndex + delta, 1)` (anchor to day 1) — never `setMonth` on an arbitrary date.
- Each cell stores its own `dateKey` derived from the actual `Date` it represents, including filler cells. Clicking a filler cell either (a) navigates to that month and selects the date, or (b) is disabled — pick one.
- Pick first-weekday explicitly (start with Sunday-first to match Korean calendar convention; document it).
- Test with: Feb 2024 (leap, starts Thu), Feb 2025 (28 days, starts Sat), Mar 2026 (starts Sun = no leading fill), Dec→Jan navigation.

**Warning signs:**
- Calendar code uses `setMonth` or `setDate` on a stored date
- Fillers from prev month don't grey out, or clicking them does nothing visible
- Manual test of Feb in a leap year shows 28 cells

**Phase to address:**
Calendar render phase — write the four boundary tests (leap Feb, year-end navigation, first-of-month-on-Sunday, last-of-month-on-Saturday) before considering the phase done.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| `innerHTML` for user text | Fast list rendering | XSS, breakage on `<`/`&`, hard to retrofit | Never for user-controlled strings |
| Raw `localStorage.getItem`/`setItem` everywhere | Less code | No corruption recovery, no quota handling, scattered key strings | Throwaway prototypes only |
| Single `todos` array under one key | Trivial schema | Whole-list rewrite on every change, hard to migrate, full re-parse to find one day | Acceptable for v1 (<1000 todos); revisit if perf shows up |
| Re-render entire calendar on any change | Simple state model | Flicker, lost focus on edit input, scroll jump | Acceptable if focus is preserved; see Pitfall focus regression |
| No schema version field | Less ceremony | Next change breaks all existing user data | Never — add `schemaVersion: 1` from day one |
| Skip `noopener` on any future external links | One attribute | Tabnabbing | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `localStorage` | Treating it as JSON store | It's string-only — always `JSON.stringify`/`parse` with try/catch |
| `localStorage` cross-tab | Two open tabs overwrite each other | Listen to `window.addEventListener('storage', ...)` and reload state, or accept "last-write-wins" and document it |
| `Date` parsing | `new Date('2026-05-03')` | Use `new Date(y, m-1, d)` for local; reserve ISO parsing for timestamps with explicit time+offset |
| `Temporal` API | Using `Temporal.PlainDate` because it's "the modern way" | As of 2026, `Temporal` is **not yet broadly shipped** in stable browsers (only behind flags / Firefox Nightly). Do not depend on it for a no-build static app. Stick to `Date` + the helper from Pitfall 1. |
| GitHub Pages hosting | Assuming relative paths from `file://` work the same | They do, but service worker / module / fetch behavior differs — test on Pages before declaring "ships" |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading entire todos blob to render one cell's count | Sluggish month navigation | Maintain a `Map<dateKey, count>` derived once per render; or index todos by dateKey at load time | Noticeable around 500+ todos |
| Re-serializing all todos on every keystroke (live edit) | Typing lag, storage thrash | Debounce `save()` ~150ms during edit, flush on blur | 100+ todos on a low-end device |
| Full DOM rebuild of todo list on toggle | Lost focus, scroll jump | Patch the single `<li>` in place; use stable `id` per todo | Any size, immediately user-visible |
| Storing `Date` objects in JSON | They become strings on reload, type-confusion bugs | Store `createdAt` as ISO string or epoch ms; never as `Date` | First reload |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `innerHTML` of user text | Stored XSS → script runs with full localStorage access | `textContent` only for user data (Pitfall 2) |
| Trusting parsed JSON shape | Manipulated storage → undefined access crashes app, or worse, prototype pollution if merged into objects | Validate shape on load; never `Object.assign({}, parsed)` without a schema check; never use `__proto__` keys |
| Pasting HTML into contenteditable edit field | Same XSS class as innerHTML | Use `<input type="text">` not `contenteditable`; if contenteditable is required, listen to `paste` and force `event.clipboardData.getData('text/plain')` |
| Exposing future "import JSON" without validation | Malicious file dropped → data loss or XSS | Validate every field before merging; enforce schema version match |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Click-to-edit todo loses input focus on every keystroke (full re-render) | Cannot type | In-place patch; or open a dedicated edit input and re-render only on commit |
| No empty state for "no todos on this day" | Looks broken | Show "이 날짜에 할 일이 없습니다" placeholder |
| Today's cell not visually distinct | User can't orient | Highlight today + selected day with distinct styles (today = ring, selected = filled) |
| No keyboard support (only mouse on calendar cells) | Accessibility regression, fails screen-reader users | Cells are `<button>` elements; arrow keys navigate days; Enter selects |
| `delete` button with no confirmation, no undo | Accidental data loss is permanent | Either confirm destructive actions or offer 5-second undo toast |
| Checkbox state visually toggles but persistence fails silently (quota) | User thinks it saved | Surface `save()` failure (Pitfall 3) |
| Calendar count badge counts completed + open identically | Can't see at-a-glance progress | Show `done/total` or only count open todos — pick and document |
| Month label in English on Korean UI | Inconsistent | Use `toLocaleString('ko-KR', { month: 'long' })` or hard-code Korean month names |
| Focus moves to top of page after re-render | Keyboard users lose place | After re-render, restore focus to the element that triggered the change (track via `data-id`) |

## "Looks Done But Isn't" Checklist

- [ ] **Date keys:** Verify a todo created at 23:55 local time appears on today's cell (not tomorrow's) — proves no UTC drift.
- [ ] **First run:** Clear all storage, hard reload — app renders empty calendar, doesn't throw.
- [ ] **Corrupted storage:** In DevTools set `localStorage.todos = "{not json"` — app recovers to empty state, doesn't crash.
- [ ] **Double-click delivery:** Literally double-click `index.html` in the OS file manager — fully works (or README explicitly says "serve via http").
- [ ] **XSS:** Add a todo with text `<img src=x onerror=alert(1)>` — renders as literal text, no alert.
- [ ] **Leap year:** Navigate to Feb 2028 — shows 29 cells.
- [ ] **Month boundary:** From Jan 31, click "next month" — lands on Feb 1 (not Mar 3).
- [ ] **Schema version:** `localStorage` payload includes `schemaVersion: 1` — future migrations are possible.
- [ ] **Quota:** Mock `setItem` to throw — UI surfaces an error toast, doesn't pretend it saved.
- [ ] **Focus preservation:** Toggle a checkbox via keyboard — focus stays on that checkbox after re-render.
- [ ] **Cross-tab:** Open two tabs, add a todo in one — either it appears in the other on focus, or behavior is documented.
- [ ] **Cell click on filler day:** Click a greyed-out prev-month day — defined behavior (navigate or disabled), not silent wrong-month write.
- [ ] **Edit cancel:** Start editing a todo, press Escape — original text restored, no save.
- [ ] **GitHub Pages:** Deploy and load over HTTPS — no console errors, paths resolve.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| UTC date-key drift shipped | HIGH | Write one-shot migration: re-key affected entries by reconstructing local date from `createdAt` if available; bump `schemaVersion`. User-visible warning. |
| XSS via `innerHTML` shipped | MEDIUM | Replace with `textContent`; sanitize existing stored todos on next load by re-rendering through the safe path (no payload stripping needed since rendering is the unsafe step). |
| `localStorage` corruption with no try/catch | LOW | Add wrapped `load()`; corrupted users see empty state instead of broken app. Lossy but unblocks. |
| File:// modules broke double-click | LOW | Convert `import`s to global script tags; or update README to require local server. |
| Schema change with no version field | HIGH | Best-effort heuristic detection (check for new field presence); preserve unknown fields; ship migration with backup-to-`__backup__` key first. |
| Calendar off-by-one (leap/month nav) | LOW | Replace nav code with `new Date(y, m+delta, 1)`; add the four boundary tests. |
| Quota exceeded with no UI | MEDIUM | Add error toast; offer "export JSON" button so users can clear without data loss. |

## Pitfall-to-Phase Mapping

Suggested phase ordering (date model first, persistence second, render third, calendar grid fourth, polish last):

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| UTC date-key drift | Phase 1 — Data model & date helpers | Unit test `dateKey()` with mocked TZ; manual late-night smoke test |
| ES modules over file:// | Phase 1 — Project bootstrap | Double-click `index.html` in OS file manager; expect working app |
| localStorage failure modes | Phase 2 — Persistence layer | Tests for null/corrupt/quota; DevTools manual corruption test |
| Schema versioning absent | Phase 2 — Persistence layer | Inspect stored payload includes `schemaVersion` |
| `innerHTML` XSS | Phase 3 — Todo list render | XSS payload as todo text renders literally; CI grep for `innerHTML\s*=` |
| Focus / keyboard regressions | Phase 3 — Todo list render & Phase 5 — A11y polish | Keyboard-only edit flow; focus restored after re-render |
| Calendar grid edge cases (leap, month nav, fillers) | Phase 4 — Calendar grid | Boundary tests: Feb 2024/2028, Jan→Feb from day 31, year-end nav |
| State-render desync (count badges, selected day) | Phase 4 — Calendar grid + Phase 3 integration | After every CRUD op, badge count matches `todos.filter(t => t.dateKey === k).length` |
| UX pitfalls (empty state, today/selected highlight, confirm delete) | Phase 5 — Polish | Manual UX checklist walkthrough |
| Cross-tab `storage` event (optional) | Phase 5 — Polish or deferred | Two-tab manual test; or document "single-tab only" |
| `Temporal` API misuse | Avoided in Phase 1 by decision | Code review: no `Temporal.*` references |

## Sources

- MDN: `Date.prototype.toISOString`, `Date` constructor parsing rules, `localStorage` quota and `QuotaExceededError`, `Element.innerHTML` security note, ES modules and the `file://` scheme — all consistent and well-documented (HIGH).
- TC39 Temporal proposal status: as of early 2026, Stage 3, shipped behind flag in Firefox Nightly; not in stable Chrome/Safari. Verify before relying. (MEDIUM — recheck at implementation time.)
- Common community knowledge / known issues: Safari Private Browsing localStorage `setItem` throw (historically true; modern Safari grants ~7MB even in private but still has edge cases) — treat defensively (MEDIUM).
- PROJECT.md constraints: vanilla HTML/CSS/JS, no build, localStorage, "double-click or GitHub Pages" delivery (HIGH — primary source).

---
*Pitfalls research for: no-build vanilla JS date-based todo app with localStorage*
*Researched: 2026-05-03*
