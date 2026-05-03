# Feature Research

**Domain:** Date-based todo app with month-grid calendar (single-user, single-device, localStorage-backed, no-build static web app)
**Researched:** 2026-05-03
**Confidence:** HIGH (mature domain; conventions well-established across Apple Calendar, Google Calendar, TeuxDeux, Todoist, TickTick, Things, and countless localStorage demo apps)

## Feature Landscape

### Table Stakes (Users Expect These)

A calendar-todo app missing any of these feels broken. These are the non-negotiable UX baseline.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Month-grid calendar (7 cols × 5–6 rows) | Universally familiar layout (Apple/Google Calendar) | LOW | Render 35–42 cells; include leading/trailing days from prev/next month, visually de-emphasized |
| "Today" highlight | Anchors user in time; first thing eyes look for | LOW | Distinct background/ring on today's cell; computed from `new Date()` at render |
| Selected-day highlight | User must see which day's list they're viewing | LOW | Different from "today" style so both can coexist when selected ≠ today |
| Day cell shows todo presence | Whole point of "calendar view" — see at-a-glance which days have work | LOW | Count badge ("3") or dot indicator. Counts must be live (update on add/delete) |
| Click day → reveals that day's todo list | Core interaction loop | LOW | Side panel or below-calendar list; selection state in memory |
| Add todo via text input + Enter | "Enter to add" is universal; mouse-only feels archaic | LOW | Input focused on day-select; Enter submits, clears input, keeps focus |
| Toggle complete via checkbox | Defining gesture of a todo app | LOW | Click checkbox flips `completed` boolean; persist immediately |
| Visual completed state (strikethrough + dim) | Without this, completed/active are indistinguishable | LOW | CSS `text-decoration: line-through` + reduced opacity |
| Edit todo text inline | Typos happen; modal-to-edit feels heavy for a one-line task | LOW | Double-click or pencil icon → text becomes input; Enter saves, Esc cancels |
| Delete todo | Obvious necessity | LOW | Trash icon per row; confirm only if destructive at scale (single delete = no confirm) |
| Month navigation (prev/next + "Today") | Can't be stuck on current month | LOW | `<` `>` buttons in header; "Today" button jumps back to current month and selects today |
| Persistence across reload | Explicit requirement; users assume it for any "saved" UI | LOW | localStorage write on every mutation; read on init |
| Empty state for day with no todos | A blank panel looks broken/loading | LOW | "No todos for [date]. Add one above." Friendly, not preachy |
| Stable ordering of todos within a day | Random reorder on render is disorienting | LOW | Sort by `createdAt` ascending (oldest first) is the convention; document it |
| Date displayed in human-readable form | "2026-05-03" alone feels raw | LOW | Show "May 3, 2026" or locale equivalent in the day-detail header |
| Responsive enough to not break on laptop screens | Demo will be shown on a projector | LOW | Min 1024px works; mobile is a stretch goal, not table stakes here |

### Differentiators (Competitive Advantage)

Nice-to-have polish that elevates the demo without expanding scope dangerously. Pick selectively.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Keyboard navigation on calendar (arrows + Enter) | Power-user feel; accessibility win | MEDIUM | Arrow keys move focus between day cells; Enter selects; requires roving tabindex |
| Today button always visible | Fast return after browsing months | LOW | Already listed in table stakes' nav; can be styled prominently |
| Completed-count vs total ("2/5") on day cell | Richer at-a-glance than raw count | LOW | Format "completed/total" or progress dot; small but expressive |
| Hide-completed toggle in day list | Reduces visual noise once tasks pile up | LOW | Single checkbox/toggle "Hide completed"; UI-only state (not persisted, or persisted as preference) |
| Smooth transitions (cell hover, panel slide-in) | Matches "Modern/Polished" requirement | LOW | CSS transitions on transform/opacity; avoid layout-thrashing properties |
| Focus management after add | Input keeps focus → rapid entry of multiple todos | LOW | After Enter: clear input, refocus same input; do not steal focus on render |
| JSON export (download `.json`) | Trust + portability; user owns their data | LOW | Serialize localStorage → Blob → `<a download>`; one button |
| JSON import (upload `.json`) | Restore/migrate; pairs with export | MEDIUM | File input → parse → validate shape → confirm overwrite → write to localStorage; merge vs replace decision needed |
| Auto-focus add input on day select | Removes one click from the loop | LOW | Set focus when selected day changes |
| Esc to deselect / cancel edit | Standard modal-ish dismissal | LOW | Esc on edit input cancels; Esc on calendar clears selection (optional) |
| Visible day-of-week headers | Sun/Mon/.../Sat row above grid | LOW | Trivial but expected; consider locale-aware first day of week |
| Distinct weekend column tint | Subtle visual rhythm | LOW | Sat/Sun cells slightly different background |
| ARIA roles for grid + buttons | Accessibility table stakes for serious apps; differentiator at demo level | MEDIUM | `role="grid"`, `aria-selected`, `aria-label="May 3, 2026, 3 todos"`; non-trivial to do correctly |
| `prefers-color-scheme` dark mode | Polish; near-free with CSS vars | LOW | Define color tokens; media query swap |
| Visible storage usage / "All saved" indicator | Builds trust that localStorage is working | LOW | Tiny "Saved ✓" toast or footer text after writes |

### Anti-Features (Commonly Requested, Often Problematic)

Features that sound great but blow up scope, complexity, or the no-build/single-user constraint. Explicitly NOT building.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Recurring tasks ("every Monday") | Real life has recurrence | Requires a rule engine (RRULE/iCal) and materialization strategy; balloons data model and UI; out of v1 scope per PROJECT.md | Add tasks manually for now; defer to v2 |
| Cross-device sync / accounts | "I want it on my phone too" | Requires server, auth, conflict resolution — violates static/no-build/no-server constraint | Ship JSON export/import as the manual sync path |
| Reminders / push notifications | "Don't let me forget" | Requires Notification API + Service Worker + permission UX; out of v1 scope | Defer; user keeps the tab/app open while planning |
| Drag-and-drop tasks between days | Feels delightful in demos | HTML5 DnD is finicky; touch support is separate; mutation logic + visual feedback is non-trivial; high effort vs low value at demo scale | Edit task to change date — or defer entirely (v1 has no date-change UI; tasks live on the day they were added) |
| Multiple lists / projects / labels | Real productivity apps have them | Adds a whole taxonomy layer (CRUD for lists, filtering UI, color picker) | Single flat list per day is sufficient for the demo's "Core Value" |
| Priorities / due times / time-of-day | "When today?" | Adds time pickers, sorting rules, overdue logic; date-only is the chosen abstraction | Users can prefix text ("9am: …") if they want |
| Subtasks / nested todos | Tasks have sub-steps | Tree data model + indent UI + completion-rollup logic; massive scope | Flat list; users write multiple sibling tasks |
| Search across all dates | "Where did I write that?" | Requires global index UI + result navigation; small payoff at single-user scale | Browser Ctrl+F if rendered, or defer |
| Week / day view toggle | Matches Google Calendar | Three render modes triple the UI work and the keyboard model | Month grid only per PROJECT.md scope |
| Markdown / rich text in todo body | "I want links and bold" | XSS surface on a localStorage-only app is real (export-then-import attacks); rendering complexity | Plain text only; line-break the description if needed |
| Real-time collaboration | Modern apps do it | Requires a backend, presence, CRDTs — directly violates "single-user, no-server" | Out of scope; not a sync app |
| Cloud backup ("login with Google") | "Don't lose my data" | Auth + storage backend; out of scope | JSON export covers the backup use case manually |
| Undo / redo stack | Power-user nicety | Requires command pattern + history buffer + keyboard bindings + UI affordance; medium-large effort | Confirmation on destructive actions only if the project later asks for it; otherwise skip |
| Confirm dialog on every delete | "Don't let me misclick" | Modal interruptions slow down the core loop; one-row delete is low-stakes | Skip confirm for single-todo delete; consider it only for "delete all on day" if that ever exists |
| Animations on every state change | "Polish" | Over-animation hurts perceived performance and a11y (`prefers-reduced-motion`) | Subtle transitions on hover/select only; respect `prefers-reduced-motion` |
| LocalStorage encryption | "Privacy" | False sense of security — key must live in JS; trivially reversible | Don't encrypt; document that localStorage is plain-text and per-browser |

## Feature Dependencies

```
Month-grid calendar render
    └──requires──> Date utilities (start-of-month, days-in-month, day-of-week)

Day cell todo count badge
    └──requires──> Todos grouped by date key (YYYY-MM-DD)
                       └──requires──> localStorage read on init

Click day → show day's list
    └──requires──> Selected-date state in memory

Add todo (Enter to add)
    └──requires──> Selected-date state
    └──requires──> localStorage write

Toggle complete / Edit / Delete
    └──requires──> Stable todo IDs (createdAt or uuid)
    └──requires──> localStorage write

Stable ordering within a day
    └──requires──> createdAt timestamp on every todo

JSON export
    └──requires──> Stable serialization shape (versioned)

JSON import
    └──requires──> JSON export (same shape)
    └──requires──> Schema validation + confirm-overwrite UX

Keyboard nav on calendar
    └──requires──> Roving tabindex + focus management
    └──enhances──> Click day → show day's list

ARIA grid roles
    └──enhances──> Keyboard nav (announces selection state)

Hide-completed toggle
    └──requires──> Visible completed state (strikethrough)

Auto-focus add input
    └──enhances──> Add todo flow (rapid entry)

Recurring tasks ──conflicts──> "Each todo lives on one date" data model
Drag-and-drop reschedule ──conflicts──> Date-immutable todo (would need date-edit UI anyway)
Subtasks ──conflicts──> Flat per-day list rendering
```

### Dependency Notes

- **Day count badge requires todos-by-date grouping:** The render path needs `todosByDate[YYYY-MM-DD].length` cheaply. Suggests storing as a map keyed by date string, or computing the index once per render.
- **Edit/Delete/Toggle require stable IDs:** `createdAt` (ms timestamp) is sufficient as an ID for single-user; collisions are practically impossible. `crypto.randomUUID()` is also free and clearer.
- **JSON import requires export first:** Same schema; bumping schema version later requires a migration step.
- **Keyboard nav enhances click-to-select:** Both paths converge on the same "set selected date" handler — implement the handler once.
- **Hide-completed requires visible completed state:** The hide toggle only makes sense if completed items are otherwise visible by default.
- **Recurring conflicts with the date-bound model:** A todo "belongs to" exactly one date in v1. Recurrence implies either materialized copies (data bloat) or virtual instances (rendering complexity). Defer.

## MVP Definition

### Launch With (v1)

These map directly to PROJECT.md's Active requirements. Anything beyond is scope creep.

- [ ] Month-grid calendar with prev/next/today navigation — core navigation surface
- [ ] Today highlight + selected-day highlight — orientation
- [ ] Day cell shows todo count (badge or dot) — the "calendar view" payoff
- [ ] Click day → shows that day's todo list — core loop
- [ ] Add todo (text input + Enter) on selected day — core loop
- [ ] Toggle complete via checkbox with strikethrough state — core loop
- [ ] Inline edit todo text — required by PROJECT.md
- [ ] Delete todo — required by PROJECT.md
- [ ] Todo shape: `{ id, text, completed, createdAt }` — required by PROJECT.md
- [ ] localStorage persistence on every mutation — required by PROJECT.md
- [ ] Empty state for day with no todos — prevents "is it broken?" moments
- [ ] Stable ordering by `createdAt` ascending — predictability
- [ ] Modern/polished styling: subtle shadows, smooth hover/selection transitions, weekday headers — required by PROJECT.md
- [ ] Auto-focus add input on day select — small UX win, near-free
- [ ] Human-readable date header in day panel ("May 3, 2026") — readability

### Add After Validation (v1.x)

Add once the core loop is shipped and a real user has poked at it.

- [ ] JSON export — trigger: user asks "how do I back this up?"
- [ ] JSON import — trigger: ships with export as a pair
- [ ] Hide-completed toggle — trigger: a day accumulates >10 completed items in testing
- [ ] Keyboard navigation on calendar (arrows + Enter) — trigger: accessibility review or power-user feedback
- [ ] ARIA grid roles + labels — trigger: a11y pass
- [ ] `prefers-color-scheme` dark mode — trigger: low-effort polish window
- [ ] `prefers-reduced-motion` respect — trigger: a11y pass
- [ ] Completed/total ratio on day cells ("2/5") — trigger: count badge feels too flat

### Future Consideration (v2+)

Defer indefinitely. Several of these are explicitly Out of Scope in PROJECT.md.

- [ ] Recurring tasks — out of scope per PROJECT.md
- [ ] Reminders/notifications — out of scope per PROJECT.md
- [ ] Week / day views — out of scope per PROJECT.md
- [ ] Labels / categories / multiple lists — out of scope per PROJECT.md
- [ ] Subtasks — adds tree model
- [ ] Search across dates — small payoff at single-user scale
- [ ] Drag-and-drop reschedule — high effort, marginal value
- [ ] Cross-device sync / accounts — violates static/no-server constraint
- [ ] Undo/redo — defer until destructive actions become more frequent

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Month grid + today/selected highlight | HIGH | LOW | P1 |
| Day count badge | HIGH | LOW | P1 |
| Click day → list | HIGH | LOW | P1 |
| Add (Enter) / Toggle / Edit / Delete | HIGH | LOW | P1 |
| localStorage persistence | HIGH | LOW | P1 |
| Empty state | MEDIUM | LOW | P1 |
| Stable createdAt ordering | MEDIUM | LOW | P1 |
| Modern/polished styling | HIGH | LOW | P1 |
| Auto-focus add input | MEDIUM | LOW | P1 |
| Human-readable date header | MEDIUM | LOW | P1 |
| Month nav (prev/next/today buttons) | HIGH | LOW | P1 |
| JSON export | MEDIUM | LOW | P2 |
| JSON import | MEDIUM | MEDIUM | P2 |
| Hide-completed toggle | MEDIUM | LOW | P2 |
| Keyboard nav on calendar | MEDIUM | MEDIUM | P2 |
| ARIA grid + labels | MEDIUM | MEDIUM | P2 |
| Dark mode (`prefers-color-scheme`) | LOW | LOW | P2 |
| `prefers-reduced-motion` | MEDIUM | LOW | P2 |
| Completed/total ratio badge | LOW | LOW | P3 |
| Esc to cancel edit | MEDIUM | LOW | P2 |
| Recurring tasks | HIGH | HIGH | P3 (out of scope) |
| Sync / accounts | HIGH | HIGH | P3 (out of scope) |
| Drag-and-drop reschedule | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (maps to PROJECT.md Active requirements)
- P2: Should have, add post-launch as polish
- P3: Nice to have / out of scope

## Competitor Feature Analysis

| Feature | Apple Calendar | Google Calendar | TeuxDeux | Todoist | Our Approach |
|---------|----------------|-----------------|----------|---------|--------------|
| Month grid as primary view | Yes (toggleable) | Yes (toggleable) | Week-based, not month | No (list-first) | Month-only, no toggle |
| Day cell event/todo indicator | Colored dots/bars | Colored bars | N/A | N/A | Numeric count badge (clearer for todos than events) |
| Today highlight | Filled circle on date | Blue circle on date | Underlined column | "Today" section | Filled background on cell |
| Click day → quick add | Popover form | Popover form | Inline on column | N/A | Side/below panel + text input + Enter |
| Inline edit | Modal | Modal | Inline | Inline | Inline (lighter feel) |
| Persistence | iCloud | Google account | Account | Account | localStorage (no account) |
| Recurring tasks | Yes | Yes | Limited | Yes (rich) | None (deferred) |
| Keyboard navigation | Yes | Yes | Limited | Yes | Stretch goal (P2) |
| Export | .ics | .ics | None | JSON/CSV (paid) | JSON (P2) |
| Sync | iCloud | Google | Account | Account | None — JSON export instead |

**Takeaway:** Big-name calendar apps are event-centric (with start/end times, locations, attendees) and account-bound. Todo-centric apps (Todoist/TickTick) are list-centric and downplay the calendar. Our niche — a *date-bound, account-less, localStorage* todo list with a *month grid as the primary surface* — is closest to TeuxDeux in spirit but with month-grid instead of week-strip. Differentiate on simplicity and zero-setup (open the HTML, start typing), not on features.

## Sources

- Apple Calendar (macOS Sonoma) — month view conventions, today/selected highlight patterns
- Google Calendar web — month-grid event indicators, prev/next/Today header pattern
- TeuxDeux (teuxdeux.com) — minimalist date-bound todo UX, inline edit feel
- Todoist / TickTick — list-centric todo conventions, completed-state styling, hide-completed toggle
- Things 3 (Cultured Code) — empty-state copy tone, polish baseline
- W3C ARIA Authoring Practices — Grid pattern (roving tabindex, `aria-selected`) for keyboard-nav reference
- MDN — `localStorage`, Notification API (referenced for anti-feature rationale), `prefers-reduced-motion`
- PROJECT.md (this repo) — authoritative scope/constraints

---
*Feature research for: date-based todo app with month-grid calendar, single-user localStorage*
*Researched: 2026-05-03*
