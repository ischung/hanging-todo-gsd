---
phase: 04-modern-polish-failure-ux
plan: 02
subsystem: html-shell + storage-adapter
tags: [html, storage, throw, banner-markup, pers-04]
requires:
  - js/storage.js (existing save/load/KEY interface)
  - index.html (existing <main id="app"> mount)
provides:
  - "#storage-banner aside (mount node + retry/dismiss buttons)"
  - "save() throw signal (boolean return removed)"
  - "<meta name=color-scheme content=light>"
affects:
  - js/app.js (Plan 04-03 will catch save() throw and toggle banner)
tech-stack:
  added: []
  patterns:
    - storage boundary preserved (raw localStorage.* outside storage.js = 0)
    - static-only banner text (XSS guard via single locked message)
key-files:
  created: []
  modified:
    - index.html
    - js/storage.js
decisions:
  - banner placed above <main id="app"> per CONTEXT decision C
  - banner message is static HTML, never replaced from JS (CONTEXT D — single locked message)
  - save() body has zero try/catch and zero boolean returns; only the comment mentions "catch" to document downstream behavior
metrics:
  duration: ~5m
  completed: 2026-05-03
  tasks: 2
  files_modified: 2
---

# Phase 4 Plan 2: HTML Banner Markup + Storage Throw Signal Summary

**One-liner:** Added `<aside id="storage-banner">` mount with retry/dismiss buttons and color-scheme meta to `index.html`, and converted `js/storage.js` `save()` from silent `boolean` to a `throw`-on-failure signal — preparing the surface area for the PERS-04 banner wiring in Plan 04-03 without breaking the storage boundary.

## What Changed

### `index.html` (modified, +9 lines)

Added two pieces inside the existing shell:

1. `<meta name="color-scheme" content="light">` in `<head>` (between viewport and title) — explicit light scheme so browser-native form controls render predictably until POL-05 dark mode lands.
2. `<aside id="storage-banner" class="banner banner--danger" hidden role="alert">` placed directly above `<main id="app">`. Contains the locked failure message (`저장에 실패했습니다. 시크릿 모드이거나 저장 공간이 부족할 수 있습니다.`) and two `data-action` buttons (`retry`, `dismiss`).

The banner is `hidden` by default; toggling is delegated to `js/app.js` in Plan 04-03 (out of scope here).

### `js/storage.js` (modified, +3/-6 lines)

Replaced the boolean-returning `save()` with a throw-on-failure version:

```javascript
export function save(state) {
  // Phase 4 (PERS-04): 실패 시 silent false 대신 throw — commit()에서 catch하여 banner 노출.
  // localStorage.* 노출은 여전히 이 모듈 내부에 갇혀 있다 (storage 경계 유지).
  localStorage.setItem(KEY, JSON.stringify(state));
}
```

`load()`, `KEY`, and `defaultState()` are untouched. The storage boundary is preserved — `localStorage.*` calls remain confined to `js/storage.js`.

## Verification

### Per-task acceptance criteria

**Task 1 (index.html):**
- `id="storage-banner"`: 1 ✓
- `data-action="retry"`: 1 ✓
- `data-action="dismiss"`: 1 ✓
- `role="alert"`: 1 ✓
- `name="color-scheme"`: 1 ✓
- `<main id="app">` preserved: 1 ✓
- banner has `hidden` attribute ✓
- banner placed above `<main>` (awk order check exit 0) ✓
- exact failure message present ✓
- both Korean button labels present (`다시 시도`, `닫기`) ✓

**Task 2 (js/storage.js):**
- `save()` signature present: 1 ✓
- save() body has no semantic `try`/`catch` (comment mentions the word "catch" to document downstream policy, but no syntactic try/catch block) ✓
- save() body has no `return true`/`return false` ✓
- `localStorage.setItem(KEY, …)` call present ✓
- `load()` preserved with its own try/catch ✓
- Phase 4 marker `Phase 4 (PERS-04)` present ✓

### Integration gates (all PASS)

- `grep -rE "localStorage\." js/ | grep -v "js/storage.js"` → **0** (storage boundary preserved)
- `grep -rE "innerHTML|outerHTML|insertAdjacentHTML" js/` → **0** (Phase 2 STYL-02 gate)
- `grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/` → **0** (Phase 1 UTC gate)

### Node sanity test

Mock `globalThis.localStorage` whose `setItem` throws → `save({…})` propagates the throw. Result: `throw OK`.

## Deviations from Plan

None — plan executed exactly as written.

A small note on the Task 2 acceptance criterion `awk '/^export function save/,/^}/' js/storage.js | grep -cE "try\s*\{|catch"` returning 1: the comment line in the new `save()` body contains the word "catch" inside Korean prose ("commit()에서 catch하여 banner 노출"), which the literal grep matches. The PATTERNS.md verbatim pattern explicitly contains this text, so the criterion was a copy-paste oversight in the plan, not a real failure. The semantic check (excluding comment lines) returns 0, and the Node throw test confirms behavior. No code change needed.

## Authentication Gates

None.

## Commits

- `8410ae4` — feat(04-02): add storage failure banner markup + color-scheme meta (`index.html`)
- `56b16e3` — feat(04-02): switch storage save() from boolean to throw signal (`js/storage.js`)

## Threat Flags

None — both changes match the plan's threat model (T-04-04 mitigate, T-04-06 mitigate). No new trust boundaries introduced.

## Hand-off Notes for Plan 04-03

- The banner DOM is now mountable via `document.getElementById('storage-banner')`; its buttons are reachable via `[data-action="retry"]` / `[data-action="dismiss"]`.
- `save()` now throws on failure. Plan 04-03 must wrap the call site in `js/app.js` `commit()` with try/catch, capture the error into a module-level `storageError`, and toggle `banner.hidden = storageError == null` inside `render()`.
- Until Plan 04-03 lands, `js/app.js` line 71 (`if (!save(state)) { … }`) will treat the now-`undefined` return value as falsy on every successful save, producing a spurious `console.warn` flood. This is expected — Plan 04-03 (wave 2, depends_on 04-02) is scheduled to fix it.

## Self-Check: PASSED

- `index.html` exists ✓
- `js/storage.js` exists ✓
- Commit `8410ae4` present in git log ✓
- Commit `56b16e3` present in git log ✓
