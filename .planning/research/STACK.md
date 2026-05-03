# Stack Research

**Domain:** No-build static web app — date-based todo with month-grid calendar + localStorage
**Researched:** 2026-05-03
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| HTML5 | Living standard | Single `index.html` entry point, semantic markup (`<dialog>`, `<button>`, `<input type="checkbox">`) | Zero tooling required; native `<dialog>` + form validation eliminate need for UI libs. |
| CSS3 (vanilla, single stylesheet) | Living standard | Layout (CSS Grid for the 7×N month grid), theming via CSS Custom Properties (design tokens), transitions for "polished" feel | CSS Grid is the canonical primitive for calendar layouts in 2026 — no framework needed. Custom properties give one-line theme/token changes that students can read. |
| Vanilla JavaScript (ES2023+, native ES Modules) | ES2023 baseline | App logic, DOM rendering, localStorage I/O | Modern browsers (Chrome/Edge/Firefox/Safari current) all support `<script type="module">` directly from `file://` and HTTP. No build, no transpile. Matches the "바닐라 JS only" hard constraint. |
| `localStorage` (Web Storage API) | Living standard | Persist todos across reloads | Synchronous, key/value, ~5MB quota — more than sufficient for a personal todo list. Universally supported, zero setup. |
| Native `Date` | ES baseline | Month grid math (first-of-month weekday, days-in-month, "today" highlight), `createdAt` timestamps | Sufficient for a single-timezone, local-only month view. Avoids adding a CDN dependency for trivial date math. (See "Alternatives" for Temporal/day.js rationale.) |

### Supporting Libraries

**None required.** This is a deliberate recommendation — every requirement in `PROJECT.md` is achievable with the platform alone, and the demo's pedagogical value is highest when students can read every line.

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | — |

If a future milestone adds week/day views, recurring events, or timezone handling, revisit this table — see "Stack Patterns by Variant" below.

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Any modern browser (Chrome/Firefox/Edge/Safari, current) | Runtime + DevTools (Application tab to inspect localStorage, Sources for debugging) | No install. Open `index.html` directly or serve via `python3 -m http.server` if `file://` blocks ES module imports (it does not in Chrome/Firefox 2026 baseline, but a static server is one command if needed). |
| VS Code + "Live Server" extension *(optional)* | Auto-reload while editing | Optional convenience for the lecture demo. Not required to ship. |
| GitHub Pages | Hosting | Drop the repo, enable Pages — done. Confirms the static-files contract. |

**Testing (no-build):** Author tests as a separate `tests.html` that imports the same ES modules and asserts via plain `console.assert` (or a ~30-line in-file assertion harness). Run by opening `tests.html` in the browser. This keeps the "no build, no npm" rule intact while still teaching test-first habits. See "What NOT to Use" for why we avoid Vitest/Jest here.

## Installation

```bash
# No package install. The entire stack is the browser.
# Project layout:
#   index.html          ← entry point
#   styles.css          ← single stylesheet with design tokens at :root
#   js/
#     app.js            ← bootstrap (imported as <script type="module">)
#     storage.js        ← localStorage read/write + JSON schema
#     calendar.js       ← month-grid render, navigation, date-cell badges
#     todos.js          ← CRUD + per-date list render
#     dom.js            ← tiny DOM helpers (createEl, on, qs)
#   tests.html          ← optional: imports ./js/*.js and runs assertions
```

```html
<!-- index.html — the only "install" needed -->
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hansung Todo</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="./js/app.js"></script>
  </body>
</html>
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Native `Date` for month math | **Temporal API** (TC39 Stage 4, March 2026; Baseline Newly Available expected late 2026) | Use Temporal once Safari ships full support and Baseline goes "Widely Available" (~2027–2028). For this demo *today*, Temporal is partially shipped (Firefox 139+, Chrome 144+) but not yet in shipping Safari — adding it now means a polyfill, which violates "no build, no deps." |
| Native `Date` | **day.js v1.11.20 via CDN** (`<script type="module">` from jsDelivr/unpkg) | Use day.js if formatting/localization (e.g., Korean weekday names beyond what `Intl.DateTimeFormat` provides) becomes painful, or if the project grows beyond month-grid math. For v1's scope (first-of-month weekday, days-in-month, today comparison), `Date` + `Intl.DateTimeFormat` is enough and avoids a network dependency that breaks offline `file://` use. |
| Build calendar from scratch (~80–120 LOC) | **vanilla-calendar-pro** (CDN-friendly, zero deps, TS-typed, actively maintained) | Use if the requirements expand to date-range pickers, multiple views, or i18n out of the box. For a *single* month grid that only needs "click a day → show its todos" + a count badge per cell, hand-rolled CSS Grid is shorter than the library's config and is more pedagogically valuable for a software-engineering course. |
| Build calendar from scratch | **FullCalendar Standard** (CDN distribution available) | Use only if you need event-on-grid rendering, drag-to-reschedule, week/day/agenda views. Overkill for v1 and adds ~100KB+ runtime weight. |
| Single vanilla CSS file with custom-property tokens | **Tailwind via Play CDN** | Tailwind Play CDN works without a build but adds a runtime JIT (~300KB) and a class-soup HTML that hurts the "students can read every line" goal. Skip. |
| Plain `console.assert` test harness in `tests.html` | **Vitest 4 / Jest 30** | Use only if the project later adopts npm + a build step. Both require Node + a runner, violating the no-build rule. |
| Plain `console.assert` test harness | **Web Test Runner** (`@web/test-runner`) | Genuine no-bundler browser test runner, but still requires `npm install` and Node to launch — violates "정적 파일로 동작." Reasonable upgrade path if the course later teaches CI. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| React / Vue / Svelte / Solid (any framework) | Explicit project constraint. Also requires a build step (JSX/SFC compilation) or a CDN runtime that adds 40–150KB and an unfamiliar mental model for a 1-page todo. | Vanilla JS modules + a tiny `render()` function that re-renders the affected subtree. |
| Vite / Webpack / esbuild / Parcel / any bundler | Explicit project constraint ("빌드 도구 없이"). Breaks the "open `index.html` and it works" demo. | Native `<script type="module">` — browsers resolve relative imports themselves. |
| TypeScript | Requires `tsc` or a bundler to strip types. Violates no-build. | Vanilla JS + JSDoc comments (`@typedef`, `@param`) for type hints that VS Code understands without compilation. |
| Tailwind (PostCSS pipeline) | Requires `npx tailwindcss build`. | Vanilla CSS with CSS Custom Properties at `:root` for design tokens. |
| Sass/Less | Requires a build step. | CSS nesting (Baseline Widely Available 2025) + custom properties cover almost all Sass use cases natively. |
| jQuery | Adds 30KB to do what `document.querySelector` and `addEventListener` already do natively in 2026. Sends the wrong signal in a software-engineering course. | Native DOM APIs. |
| Moment.js | Officially in maintenance mode since 2020; not tree-shakeable; ~70KB. | Native `Date` + `Intl.DateTimeFormat`; if more needed, day.js. |
| `IndexedDB` for v1 | Async, verbose API for what is fundamentally a small key/value store. Quota and complexity unjustified. | `localStorage` with a single JSON-serialized object keyed by date string. |
| Service Worker / PWA shell for v1 | Out of scope; adds debugging surface (cache invalidation) that distracts from the GSD lesson. | Plain page load. Add later if "offline-first" becomes a requirement. |
| `cdnjs` / `unpkg` *runtime* deps for required functionality | Breaks `file://` double-click demo when offline; introduces a third-party availability dependency for a course demo. | Zero runtime deps. (CDN imports are fine for *optional* enhancements.) |

## Stack Patterns by Variant

**If the project stays within v1 scope (month grid + per-date todos + localStorage):**
- Use the recommended zero-dependency stack exactly as above.
- Hand-roll the calendar (~80 LOC of CSS Grid + a `for` loop over `daysInMonth`).
- Use `Intl.DateTimeFormat('ko-KR', { weekday: 'short' })` for Korean weekday headers — no library needed.

**If a later milestone adds week/day views or drag-to-reschedule:**
- Adopt **vanilla-calendar-pro** via jsDelivr CDN (still no build).
- Or, if event-rendering on the grid is needed, **FullCalendar Standard** via CDN.

**If a later milestone adds timezone handling, recurrence, or date-range math:**
- Re-evaluate **Temporal** (likely Baseline Widely Available by 2027).
- Until then, **day.js** v1.11.20 via `<script type="module" src="https://cdn.jsdelivr.net/npm/dayjs@1/+esm">` with the `duration` and `relativeTime` plugins.

**If the course later introduces a build step:**
- Migrate to **Vite** + **Vitest 4** + **TypeScript**. The module boundaries chosen here (`storage.js`, `calendar.js`, `todos.js`) port cleanly.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Native ES Modules (`<script type="module">`) | Chrome ≥ 89, Firefox ≥ 108, Safari ≥ 15, Edge ≥ 89 | All current browsers in 2026 ship this. `file://` imports work in Chrome and Firefox; if a student hits a CORS error opening directly, recommend `python3 -m http.server`. |
| CSS Nesting | Chrome ≥ 120, Firefox ≥ 117, Safari ≥ 17.2 | Baseline Widely Available since 2025. Safe to use unprefixed. |
| `<dialog>` element + `showModal()` | All current browsers | Use for the "edit todo" modal — replaces a custom modal component. |
| `Intl.DateTimeFormat` with `ko-KR` | Universal | Use for Korean month / weekday rendering. |
| `localStorage` | Universal | ~5MB quota per origin. Wrap reads/writes in `try/catch` because Safari Private Mode can throw `QuotaExceededError`. |
| Temporal | Firefox 139+ (May 2025), Chrome 144+ (Jan 2026), Safari (preview only) | **Do not use yet** for cross-browser demo. Revisit when Baseline goes "Widely Available." |

## Sources

- [Vanilla Calendar Pro — Installation and Usage](https://vanilla-calendar.pro/docs/learn/installation-and-usage) — confirmed CDN distribution, zero dependencies. HIGH confidence.
- [vanilla-calendar-pro on jsDelivr](https://www.jsdelivr.com/package/npm/vanilla-calendar-pro) — verified CDN URL pattern. HIGH.
- [FullCalendar GitHub / docs](https://bryntum.com/blog/the-best-javascript-calendar-components/) — confirmed CDN script-tag install path. MEDIUM (third-party summary).
- [TC39 Advances Temporal to Stage 4 — Socket](https://socket.dev/blog/tc39-advances-temporal-to-stage-4) — Stage 4 in March 2026, Baseline Newly Available expected late 2026. HIGH.
- [JavaScript Temporal in 2026 — Bryntum](https://bryntum.com/blog/javascript-temporal-is-it-finally-here/) — Firefox 139 (May 2025), Chrome 144 (Jan 2026), Safari preview only. HIGH.
- [Temporal in ECMA262 — Chrome Status](https://chromestatus.com/feature/5668291307634688) — shipping status. HIGH.
- [day.js on npm](https://www.npmjs.com/package/dayjs) and [day.js Browser install](https://day.js.org/docs/en/installation/browser) — v1.11.20 latest, official CDN guidance. HIGH.
- [Vitest vs Jest 30: 2026 Year of Browser-Native Testing — DEV](https://dev.to/dataformathub/vitest-vs-jest-30-why-2026-is-the-year-of-browser-native-testing-2fgb) — confirms Vitest 4 / Jest 30 still require Node + npm; not a no-build option. MEDIUM.
- [How to Unit Test HTML and Vanilla JavaScript Without a UI Framework — DEV](https://dev.to/thawkin3/how-to-unit-test-html-and-vanilla-javascript-without-a-ui-framework-4io) — pattern for in-browser `console.assert` test harness. MEDIUM.
- [Testing JavaScript without a (third-party) framework — alexwlchan](https://alexwlchan.net/2023/testing-javascript-without-a-framework/) — corroborates the no-deps test approach. MEDIUM.
- `PROJECT.md` (this repo) — constraint authority for "no build / no framework / localStorage / single `index.html`." HIGH.

---
*Stack research for: no-build static date-based todo web app*
*Researched: 2026-05-03*

## RESEARCH COMPLETE — Stack dimension

**Confidence:** HIGH

### Key Findings

- The project's hard constraints (no build, no framework, single `index.html`, localStorage) make **zero runtime dependencies** the correct stack — every requirement in `PROJECT.md` is achievable with the platform alone.
- **Native `Date` + `Intl.DateTimeFormat`** is sufficient for month-grid math and Korean localization. Adding day.js or Temporal would buy nothing for v1's scope and would introduce CDN/offline fragility.
- **Temporal** reached TC39 Stage 4 in March 2026 but Safari hasn't shipped it yet — defer to a future milestone (~2027 Baseline Widely Available).
- **Build the calendar from scratch** (~80 LOC of CSS Grid). vanilla-calendar-pro and FullCalendar are good escape hatches if scope grows, but for v1 they are heavier than the code they replace and worse for the pedagogical demo.
- **Testing without a build:** a `tests.html` page that imports the same ES modules and uses `console.assert` keeps the no-build contract intact. Vitest/Jest/Web Test Runner all require npm and are explicitly out.
- Module structure recommendation: `js/{app,storage,calendar,todos,dom}.js` — gives clear seams for the GSD phase plan without abstraction overhead.

### Roadmap Implications

- Phase ordering can safely place **storage layer first** (pure functions over `localStorage`, easiest to test in `tests.html`), then **calendar render**, then **todo CRUD wiring**, then **polish/styling**.
- No phase requires a "set up build tooling" step — the entire toolchain is "open the file in a browser."
- Flag for a later phase: if "Modern/Polished" styling expands into a design system, revisit whether design tokens stay inline or move into a separate `tokens.css`.

