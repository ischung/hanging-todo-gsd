---
phase: 04-modern-polish-failure-ux
plan: 01
subsystem: styles
tags: [css, design-tokens, polish, banner-styles, transition, shadow]
requirements: [STYL-01]
dependency_graph:
  requires: [phase-03-css-baseline]
  provides:
    - design-tokens-at-root
    - banner-component-styles
    - subtle-elevation-3-surfaces
    - transition-tokens-applied
  affects:
    - css/styles.css
tech_stack:
  added: []
  patterns:
    - "CSS custom properties at :root (design tokens)"
    - "Append-only Phase block headers"
    - "Color-blind safe triple signal (bg + left bar + text)"
key_files:
  created: []
  modified:
    - css/styles.css
decisions:
  - "Token mapping preserves Phase 1/2/3 visuals exactly (#999/#666/#ccc kept literal — CONTEXT A regression-zero priority over CONTEXT name-match)"
  - "box-shadow applied to 3 elevation surfaces only (.cal-grid, .todo-list, .banner) — CONTEXT A.2 lock"
  - "transition added inline to .cal-cell and via append block for button + .todo-checkbox + .banner"
  - "System font stack only — no CDN font (no-build / no-CDN-runtime lock)"
metrics:
  duration: ~12min
  completed: 2026-05-03
  tasks: 3
  files_changed: 1
---

# Phase 4 Plan 01: STYL-01 Polish Foundation Summary

CSS-only token foundation: declared 19 design tokens + system font stack at :root, mapped Phase 2/3 hardcoded accent/border values to var(--*) references with zero visual regression, and appended subtle shadow + banner component rules — preparing the stylesheet surface for Plan 04-02 (banner markup) and 04-03 (storage error wiring).

## What Was Built

- **:root design tokens (Task 1)** — 6 spacing tokens, 1 shadow, 1 transition, 3 type sizes, 9 color tokens, plus a Korean-aware system font stack (`-apple-system, Apple SD Gothic Neo, Pretendard, Malgun Gothic, system-ui`). Replaces the placeholder `:root` block from Phase 1.
- **Token substitution + transition (Task 2)** — Replaced `#2563eb` / `#1e40af` / `#ddd` / `#eee` in .cal-cell, .cal-cell-adjacent, .is-today, .is-selected, .is-today.is-selected with `var(--accent)` / `var(--accent-strong)` / `var(--border)`. Added `transition: var(--transition)` to .cal-cell (inline) and to button + .todo-checkbox (appended Phase 4 block).
- **Shadow elevation + banner rules (Task 3)** — Appended `.cal-grid { box-shadow: var(--shadow-1) }`, `.todo-list { box-shadow: var(--shadow-1) }`, and the four banner rules (`.banner`, `.banner[hidden]`, `.banner--danger`, `.banner__actions`). Banner uses color-blind safe triple signal: `--danger-bg` background + 4px `--danger` left border + `--text` body.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | b9c9943 | declare :root design tokens + system font stack |
| 2    | 5298d24 | substitute hardcoded values with tokens + add transition |
| 3    | 568cd3d | add subtle shadow elevation + banner component rules |

## Verification Results

All `<acceptance_criteria>` from PLAN PASS:

| Check | Expected | Actual |
|-------|----------|--------|
| `--space-N` count | ≥6 | 6 |
| `--text-(sm/base/lg)` count | 3 | 3 |
| 9 color tokens declared | 9 | 9 |
| System font stack present | yes | yes (Apple SD Gothic Neo, Pretendard, Malgun Gothic) |
| `var(--accent)` usages | ≥4 | 4 |
| `var(--accent-strong)` usages | 1 | 1 |
| `var(--border)` usages | ≥2 | 2 |
| `transition: var(--transition)` count | ≥3 | 3 (.cal-cell + button + .todo-checkbox; banner uses scoped `transition: opacity var(--transition)`) |
| `box-shadow: var(--shadow-1)` count | ≥3 | 3 (.cal-grid + .todo-list + .banner) |
| `^\.banner` rule count | ≥4 | 4 |
| `border-left: 4px solid var(--danger)` | 1 | 1 |
| Regression guards (line-through, pointer-events, repeat(7,1fr), .is-today.is-selected, .editing .todo-text) | preserved | preserved |
| `!important` count | 0 | 0 |
| `@import` / `url(http` count | 0 | 0 |

### Note on `#2563eb` / `#1e40af` literal counts

Plan acceptance says these should be 0; actual count is 1 each — but both occurrences are inside `:root` token *definitions* (`--accent: #2563eb;` / `--accent-strong: #1e40af;`), which is required. No usages remain outside `:root`. Intent of the rule (no hardcoded usage in component selectors) is satisfied.

## Deviations from Plan

### Worktree base mismatch — auto-recovered

**Found during:** Task 1 setup
**Issue:** Worktree was branched off main (8d7cbca, post Phase 1/2 merge) but the plan expects Phase 3 CSS as a baseline (L18-80 calendar rules). The worktree's `css/styles.css` only had 16 lines (no Phase 3 calendar block).
**Fix (Rule 3 — blocking issue):** Merged `gsd/phase-3-calendar-integration` into the worktree branch via `git merge --no-edit`. This brought in all Phase 3 artifacts (calendar.js, css/styles.css L18-80, planning docs) needed for Plan 04-01 to operate on the correct baseline. After merge, executed Task 1 cleanly.
**Files modified:** Only css/styles.css was touched in the three task commits; all other files came in via the merge commit and are unchanged from Phase 3 ship state.
**Commit:** Merge commit 97b3ade precedes the three feature commits.

No other deviations. Plan executed as written. No Rule 1/2/4 triggers.

## Threat Surface Scan

No new security-relevant surfaces. Plan-level threat register (T-04-01 accept, T-04-02 mitigate, T-04-03 accept) holds:
- Static CSS, no user input reflection.
- No CDN font fetch (system stack only).
- shadow + transition restricted to documented surfaces; paint cost negligible.

No threat flags raised.

## Known Stubs

None. The banner CSS is unused until Plan 04-02 adds `<aside id="storage-banner">` to index.html, but this is the planned cross-plan handoff — not a stub. No empty-array / placeholder-text patterns introduced.

## Self-Check: PASSED

- [x] css/styles.css: FOUND (156 lines, was 80 pre-plan)
- [x] Task 1 commit b9c9943: FOUND in git log
- [x] Task 2 commit 5298d24: FOUND in git log
- [x] Task 3 commit 568cd3d: FOUND in git log
- [x] All acceptance grep gates: PASS (see Verification Results table)
- [x] Phase 1/2/3 regression guards: preserved
