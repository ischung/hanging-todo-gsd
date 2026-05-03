---
phase: 04-modern-polish-failure-ux
plan: 03
subsystem: app-controller
tags: [app, integration, error-surface, delegated-events, pers-04]
requirements: [PERS-04]
dependency_graph:
  requires:
    - phase-04-02-banner-markup
    - phase-04-02-storage-throw
    - phase-04-01-banner-css
  provides:
    - storage-error-module-variable
    - commit-try-catch-flow
    - render-banner-toggle
    - banner-retry-dismiss-delegation
  affects:
    - js/app.js
tech_stack:
  added: []
  patterns:
    - "Module-let UI state (storageError) — same shape as state/viewYM/selectedKey/editingId"
    - "commit() try/catch with always-apply-to-memory + capture-error-on-throw"
    - "render() fan-out extended with banner.hidden toggle from storageError"
    - "Single delegated click listener for banner data-action (retry/dismiss) — Phase 2/3 pattern"
key_files:
  created: []
  modified:
    - js/app.js
decisions:
  - "Worktree base mismatch — auto-merged gsd/phase-3-calendar-integration (Rule 3 blocking) to bring in Phase 3 wiring + 04-01 + 04-02"
  - "storageError lives next to existing module-let state (no separate store)"
  - "retry handler reuses commit(state) — no special path; success auto-clears banner"
  - "dismiss is pure UI: storageError=null + render() (no save attempt)"
metrics:
  duration: ~10m
  completed: 2026-05-03
  tasks: 2
  files_modified: 1
---

# Phase 4 Plan 3: Storage Failure Banner Integration Summary

**One-liner:** Wired the storage-failure banner end-to-end inside `js/app.js` — added `storageError` module-let, replaced the boolean `save()` branch with a `try`/`catch` that always keeps the mutation in memory, toggled `banner.hidden` from `render()`, and registered a single delegated click listener that maps `data-action="retry"` to `commit(state)` and `data-action="dismiss"` to `storageError = null` + `render()`.

## What Changed

### `js/app.js` (modified, +27/-4)

Five surgical insertions inside the existing Phase 2/3 controller (no other lines touched):

1. **Module variable** — `let storageError = null;` declared next to `state`/`viewYM`/`selectedKey`/`editingId` (line 27). Holds the captured `Error` after `save()` throws; cleared on success or dismiss.
2. **Banner mount capture** — `const banner = document.getElementById('storage-banner');` plus a guard that throws with a precise diagnostic if the node is missing (right after the `#app` mount guard).
3. **`commit()` body replacement** — boolean `if (!save(state)) console.warn(...)` is gone; the new body is the verbatim CONTEXT decision D pseudocode:
   ```js
   state = nextState;
   try { save(state); storageError = null; }
   catch (err) { storageError = err; console.warn('[hansung-todo] save failed; kept in memory', err); }
   render();
   ```
   Memory is always updated; persist failure becomes a captured error (no rollback).
4. **`render()` extension** — appended `banner.hidden = storageError == null;` as the last line of the existing fan-out. Banner toggles purely as a derived property of `storageError`.
5. **Banner click delegation** — single `addEventListener('click', ...)` on the banner node, between the calendar listener and the form `submit` handler. Resolves `data-action` via `closest('[data-action]')` and routes:
   - `retry` → `commit(state)` (re-runs the same try/catch; banner hides automatically on success).
   - `dismiss` → `storageError = null; render();` (no save attempt).
   - other / null → no-op.

## Verification

### Per-task acceptance criteria (Task 1 — all PASS)

| Check                                                     | Expected | Actual |
| --------------------------------------------------------- | -------- | ------ |
| `let storageError` declarations                           | 1        | 1      |
| `document.getElementById('storage-banner')` calls         | 1        | 1      |
| `if (!banner) throw` mount guard                          | 1        | 1      |
| `commit` body has `try {` + `catch (`                     | ≥2       | 2      |
| `commit` body retains boolean `if (!save(...))` branch    | 0        | 0      |
| `render` body has `banner.hidden = storageError == null`  | 1        | 1      |
| `banner.addEventListener('click'` delegation listeners    | 1        | 1      |
| `action === 'retry'` branches                             | 1        | 1      |
| `action === 'dismiss'` branches                           | 1        | 1      |

### Integration / regression gates (all PASS)

- `grep -rE "localStorage\." js/ | grep -v "js/storage.js"` → **0** (storage boundary preserved — Phase 1 lock)
- `grep -rE "innerHTML|outerHTML|insertAdjacentHTML" js/` → **0** (Phase 2 STYL-02 gate)
- `grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/` → **0** (Phase 1 UTC gate)
- `node --input-type=module --check < js/app.js` → **syntax OK**

### Phase 4 phase-gate matrix

| Axis             | Truth                                                                                                                    | Source                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| CSS tokens       | `:root` declares 19 design tokens + system font stack; `var(--*)` referenced across calendar/list/banner                 | Plan 04-01 (`5298d24`)       |
| Banner styles    | `.banner` / `.banner--danger` / `.banner__actions` rules with subtle shadow + 150ms opacity transition                   | Plan 04-01 (`568cd3d`)       |
| Banner markup    | `<aside id="storage-banner" hidden role="alert">` above `<main id="app">`, with `data-action="retry"` / `="dismiss"`     | Plan 04-02 (`8410ae4`)       |
| Storage signal   | `save()` throws on `setItem` failure (boundary preserved — only `js/storage.js` touches `localStorage.*`)                | Plan 04-02 (`56b16e3`)       |
| App wiring       | `commit()` try/catch + `storageError` module-let + `render()` toggle + delegated retry/dismiss                           | Plan 04-03 (`73e5973`)       |
| UAT readiness    | All four axes integrate; banner hidden on cold load, visible only after a `save()` throw                                 | Task 2 (human-verify gate)   |

## Deviations from Plan

### Worktree base mismatch — auto-recovered (Rule 3 — blocking issue)

**Found during:** start-up worktree branch check.
**Issue:** The agent worktree branched off `main` (pre-Phase 3) and was missing every commit from `gsd/phase-3-calendar-integration` (Phase 3 wiring + 04-01 CSS tokens + 04-02 banner markup + storage throw). Without those, `document.getElementById('storage-banner')` and `var(--accent)` would have nothing to bind to.
**Fix:** `git merge gsd/phase-3-calendar-integration --no-edit` brought the worktree branch up to the `f3c74fa` (04-02) baseline before any task work. The merge commit precedes the feature commit. Task 1 then executed cleanly against the correct baseline.
**Files affected by merge:** Phase 3 calendar (js/calendar.js, css/styles.css L18+), Phase 4 CSS tokens, banner markup, storage throw — none of which Plan 04-03 modifies. Plan 04-03's only feature commit (`73e5973`) touches `js/app.js` exclusively.

No other deviations. No Rule 1/2/4 triggers. The PATTERNS verbatim block was applied as written.

## Authentication Gates

None.

## Commits

| Task | Commit  | Description                                                  |
| ---- | ------- | ------------------------------------------------------------ |
| 1    | 73e5973 | wire storage failure banner into commit/render flow          |
| 2    | —       | human-verify checkpoint (no commit)                          |

## Threat Surface Scan

No new security-relevant surfaces introduced. The plan's `<threat_model>` (T-04-07 mitigate, T-04-08 accept, T-04-09 mitigate, T-04-10 accept, T-04-11 accept) holds:

- **T-04-07 (data-action spoofing):** banner listener handles only `retry` / `dismiss` literally; any other value falls through as no-op.
- **T-04-08 (info disclosure via console):** `console.warn(err)` only; banner body is static `textContent` — `err` is never injected into the DOM.
- **T-04-09 (DoS via auto-retry):** retry is user-action triggered. No timer, no recursion. One `setItem` per click.
- **T-04-10 (storageError tamper):** module-let, no exported handle. ES module encapsulation enforced.
- **T-04-11 (dismiss data loss):** intentional UX (CONTEXT decision D). `console.warn` leaves a dev trace.

No threat flags raised.

## Known Stubs

None. The full PERS-04 chain (markup + CSS + throw + wiring) is now closed. Banner is hidden by default, only shown after a real `save()` throw.

## CHECKPOINT REACHED

**Type:** human-verify
**Plan:** 04-03
**Progress:** 1 / 2 tasks complete (Task 2 is the checkpoint itself)

### What was built (Phase 4 cumulative — three plans)

- **Visual polish (STYL-01)** — design tokens at `:root`, system font stack (Apple SD Gothic Neo / Pretendard / Malgun Gothic / system-ui), 150 ms transitions on hover/selection, subtle one-step shadow on calendar grid + todo list + banner, 8-px spacing scale.
- **Storage failure banner (PERS-04)** — top-of-page red banner with [다시 시도] / [닫기] buttons. Shown only when `localStorage.setItem` throws; auto-hidden on successful retry.
- **No regressions** — Phase 2/3 add/toggle/edit/delete/calendar-nav/date-select unchanged.

### How to verify (run on the merged worktree branch — or merge to phase branch first)

1. `python3 -m http.server 8000` and open `http://localhost:8000`.
2. **STYL-01 visual sanity:**
   - Korean text renders crisply via the system stack (macOS: Apple SD Gothic Neo, Windows: Malgun Gothic).
   - Calendar cell hover transitions smoothly (~150 ms).
   - "Today" border + "selected" filled background still distinct (color-blind safe dual signal preserved).
   - Done-todo line-through, empty-list muted text — all preserved.
3. **PERS-04 failure banner — simulate setItem throw via DevTools Console:**
   ```js
   const orig = Storage.prototype.setItem;
   Storage.prototype.setItem = function () {
     throw new DOMException('QuotaExceededError', 'QuotaExceededError');
   };
   ```
   Then type "테스트" into the input and press Enter. Expected:
   - The todo appears in the list immediately (memory mutation).
   - Red banner slides into view above the calendar with the locked message
     "저장에 실패했습니다. 시크릿 모드이거나 저장 공간이 부족할 수 있습니다."
   - `[다시 시도]` and `[닫기]` buttons visible.
   - No app crash; console shows one `[hansung-todo] save failed; kept in memory` warning.
4. **Retry flow:**
   - Click `[다시 시도]` → still failing, banner stays.
   - Console: `Storage.prototype.setItem = orig;`
   - Click `[다시 시도]` again → banner disappears. Refresh the page → "테스트" todo persists.
5. **Dismiss flow:**
   - Re-arm the throw (paste the override again), trigger banner via add.
   - Click `[닫기]` → banner hides. Data is unsaved (acknowledged by user).
6. **Regression sweep:** add / toggle / inline-edit (Enter, Esc, blur) / delete / calendar prev-next-today / date-cell select — all behave as in Phase 3.

### Awaiting

User verification on the live page. Reply `approved` if all six steps pass, or report any deviation (visual, functional, console error) so we can issue a corrective plan against 04-01 / 04-02 / 04-03.

## Self-Check: PASSED

- [x] `js/app.js` exists and contains the five Plan 04-03 insertions
- [x] Commit `73e5973` present in `git log`
- [x] All Task 1 acceptance grep gates PASS
- [x] All Phase 1–3 regression gates PASS (`localStorage` boundary, `innerHTML`, UTC drift)
- [x] `node --input-type=module --check` reports syntax OK
- [x] Task 2 checkpoint surfaced above (no commit expected)
