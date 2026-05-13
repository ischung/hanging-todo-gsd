---
phase: 03-calendar-integration
plan: 02
subsystem: ui
tags: [vanilla-js, esm, dom, event-delegation, calendar-wiring]

# Dependency graph
requires:
  - phase: 03-calendar-integration
    plan: 01
    provides: js/calendar.js exports (todayYM/prevMonth/nextMonth/renderCalendar/formatHeader) + data-action/data-key dataset contract
  - phase: 03-calendar-integration
    plan: 03
    provides: CSS classes (.cal-cell, .is-today, .is-selected, .cal-cell-adjacent, .cal-badge, #date-header)
  - phase: 02-todo-crud
    plan: 02-03
    provides: commit()/render() funnel, editingId lifecycle, 4 listContainer delegated listeners
provides:
  - 캘린더 ↔ todo CRUD 풀-와이어링: selectedKey 기반 임의 날짜 add/toggle/edit/remove
  - 단일 render() 팬아웃 (calendar + date header + todo list)
  - 단일 delegated calendar click listener (nav + cell)
affects: [phase-4-styl-01, phase-4-pers-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-let transient UI state (selectedKey/viewYM) — same lifecycle as editingId, never persisted"
    - "Single delegated click on calendarSection — 자식이 아니라 컨테이너 1곳에만 등록 (Phase 2 패턴 동일)"
    - "render() 단일 진입점이 3 subview 팬아웃 (renderCalendar → dateHeader.textContent → renderTodoList)"

key-files:
  created: []
  modified:
    - js/app.js
    - index.html

key-decisions:
  - "viewYM과 selectedKey 모두 module-let, save() 경로에 절대 흐르지 않음 (decision D lock — reload 시 오늘로 reset)"
  - "캘린더 click 핸들러는 commit()을 호출하지 않음 — 순수 UI state mutation만 → render()"
  - "data-action 매칭을 data-key보다 먼저 확인 (nav 버튼이 더 specific; 어차피 두 attribute는 서로 다른 element subtree에 존재해 충돌 없음)"
  - "인접달 <div>는 data-key/data-action 둘 다 없어 closest() 두 가드가 자연 no-op — 별도 disabled 분기 불필요"
  - "form submit input은 selectedKey로 addTodo 호출 — 캘린더에서 다른 날짜를 골라도 그 날짜로 추가"

patterns-established:
  - "Pattern: nav vs cell branching via closest('[data-action]') / closest('[data-key]') — dataset 네임스페이스가 mutually exclusive하므로 단일 listener에서 안전 분기"
  - "Pattern: render() 팬아웃은 (a) 도메인 컴포넌트 자기 컨테이너에 replaceChildren + (b) 헤더는 textContent 직접 — 두 패턴 혼용해도 무관"

requirements-completed: [CAL-02, CAL-03, CAL-05, CAL-07, TODO-08]

# Metrics
duration: 5min
completed: 2026-05-03
---

# Phase 3 Plan 02: js/app.js wiring — selectedKey/viewYM + render fan-out + delegated calendar listener Summary

**Phase 2의 "오늘 전용" todo CRUD를 임의 날짜로 확장: selectedKey/viewYM 모듈 상태 도입, `<main id="app">` 마운트를 calendar/header/form/list 4-section으로 재배치, render() 팬아웃, calendarSection에 단일 delegated click listener 추가. TODAY 상수 6 사이트가 selectedKey로 모두 치환되어 form submit / change-toggle / click-remove / startEdit / commitEdit / render의 getTodosForDate 모두 선택된 날짜로 재타게팅됨.**

## Performance

- **Started:** 2026-05-03T11:20:00Z
- **Tasks:** 3
- **Files modified:** 2 (js/app.js, index.html)

## Accomplishments

- **Task 1 — module state restructure (`4209235`):** `const TODAY` 제거; `let viewYM = todayYM()` + `let selectedKey = dateKey()` 도입; `./calendar.js`에서 5종 import; `buildCalendarSection()` / `buildDateHeader()` 팩토리 추가; mount line이 `root.replaceChildren(calendarSection, dateHeader, form, listContainer)`로 변경. 6곳의 TODAY → selectedKey 치환 (submit, change, click-remove, startEdit, commitEdit, render의 getTodosForDate).
- **Task 2 — render fan-out + delegated calendar listener (`cf2dda0`):** `render()`가 (1) `renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate)` → (2) `dateHeader.textContent = formatHeader(selectedKey)` → (3) `renderTodoList(listContainer, todos, editingId)`를 순차 호출. `calendarSection.addEventListener('click', ...)` 1개 등록: closest('[data-action]')로 nav 분기 (prev/next는 viewYM만, today는 viewYM + selectedKey 동시 갱신), closest('[data-key]')로 셀 선택 (selectedKey만 갱신). 두 분기 모두 commit() 호출 없음 — 순수 UI 상태.
- **Task 3 — index.html 코멘트 갱신 (`48071bc`):** `<main id="app">` 안의 코멘트만 "Phase 3: js/app.js mounts calendar + 날짜 헤더 + todo form/list 순서로 렌더"로 교체. 마크업 구조 변경 없음 (JS가 subtree 소유 — Phase 2 패턴 보존).

## User-Facing Changes

Phase 2까지는 "오늘" 한 날짜에만 todo를 달 수 있었다. 본 plan 이후 사용자는 다음을 할 수 있다:

- **임의 날짜 선택 (CAL-05, CAL-07):** 캘린더 셀을 클릭하면 그 셀이 selected 상태(파란 배경)로 바뀌고, 그 아래 날짜 헤더(`2026년 5월 13일` 형식)와 todo 리스트가 그 날짜 기준으로 즉시 재렌더된다.
- **임의 날짜에 todo CRUD (TODO-08):** 선택된 날짜에 대해 추가/완료 토글/수정/삭제가 모두 동작한다. 입력 form은 더 이상 "오늘"로 고정되지 않고 현재 selectedKey로 추가한다.
- **월 이동 (CAL-02):** 헤더의 `‹` / `›` 버튼으로 이전/다음 달로 이동한다. 12월 → 1월, 1월 → 12월 wrap도 자연스럽다. 이동 중 selectedKey는 보존되므로 원래 달로 돌아오면 같은 셀이 다시 selected로 보인다.
- **"오늘" 점프 (CAL-03):** "오늘" 버튼은 viewYM과 selectedKey를 동시에 today로 스냅한다 — 멀리 떠난 사용자가 한 번에 복귀할 수 있다.
- **인접달 셀:** 회색으로 흐릿하게 보이고 클릭해도 무동작(혼동 방지).
- **새로고침 동작:** todo 데이터는 localStorage에 그대로 남지만 selectedKey는 의도적으로 today로 reset된다(decision D). 즉 reload 후 사용자는 항상 오늘 날짜를 먼저 보게 된다.

캘린더 셀의 todo 배지(`CAL-06`)와 today/selected 시각 강조(`CAL-04`) 자체의 렌더 로직은 plan 01에서, 색/테두리 등 스타일은 plan 03에서 land됨 — 본 plan은 그 둘을 실제 상태와 wiring한다.

## Task Commits

1. **Task 1: selectedKey/viewYM + calendar/header mount** — `4209235` (feat)
2. **Task 2: render() fan-out + delegated calendar listener** — `cf2dda0` (feat)
3. **Task 3: index.html comment refresh** — `48071bc` (docs)

## Files Modified — Line Range Map

### `js/app.js` (Phase 2 → Phase 3 diff)

| Region | Old (Phase 2) | New (Phase 3) | Change |
| --- | --- | --- | --- |
| Imports | line 16-18 (todos.js only) | lines 16-21 (todos.js + calendar.js) | +3 lines (calendar.js named imports) |
| Module state | line 20 `const TODAY = dateKey()` | lines 23-26 (state, viewYM, selectedKey, editingId) | TODAY 제거; viewYM + selectedKey 신설 |
| Section factories | lines 24-43 (buildForm, buildListContainer) | lines 28-59 (+ buildCalendarSection, buildDateHeader) | +12 lines (2 신규 팩토리) |
| Mount | line 49 `root.replaceChildren(form, listContainer)` | line 67 `root.replaceChildren(calendarSection, dateHeader, form, listContainer)` | 4-arg mount |
| `render()` body | lines 59-62 (todos + renderTodoList) | lines 77-82 (calendar + header + list 3-step fan-out) | +2 lines (renderCalendar, dateHeader.textContent) |
| Calendar listener | (없음) | lines 84-110 | 신규 — 27 lines, single delegated click |
| 6 TODAY 사이트 | lines 68/79/88/121/135 + render | lines 116/127/136/169/183/80 | 모두 selectedKey로 치환 |

### `index.html`

- Line 10: 코멘트 텍스트만 "Phase 2/3에서 캘린더와 todo 리스트가 여기에 렌더됨" → "Phase 3: js/app.js mounts calendar + 날짜 헤더 + todo form/list 순서로 렌더". 구조 변경 0.

## Static Verification Gates — All PASS

```bash
$ grep -c 'const TODAY' js/app.js                             # 0 ✓
$ grep -c 'TODAY' js/app.js                                   # 0 ✓
$ grep -c 'let selectedKey' js/app.js                         # 1 ✓
$ grep -c 'let viewYM' js/app.js                              # 1 ✓
$ grep -c "from './calendar.js'" js/app.js                    # 1 ✓
$ grep -c 'selectedKey' js/app.js                             # 12 (≥ 7) ✓
$ grep -c 'viewYM' js/app.js                                  # 6 (≥ 5) ✓
$ grep -c 'calendarSection' js/app.js                         # 4 (≥ 3) ✓
$ grep -c 'renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate)' js/app.js  # 1 ✓
$ grep -c 'dateHeader.textContent = formatHeader(selectedKey)' js/app.js                       # 1 ✓
$ grep -c 'calendarSection.addEventListener' js/app.js        # 1 ✓
$ grep -cE "closest\('\[data-action\]'\)" js/app.js           # 1 ✓
$ grep -cE "closest\('\[data-key\]'\)" js/app.js              # 1 ✓
$ awk '/calendarSection.addEventListener/,/^\}\);/' js/app.js | grep -c 'commit('  # 0 ✓
$ grep -c 'root.replaceChildren(calendarSection, dateHeader, form, listContainer)' js/app.js  # 1 ✓
$ grep -c 'Phase 3: js/app.js mounts' index.html              # 1 ✓
$ grep -c '<section id="calendar"' index.html                 # 0 ✓
$ grep -c '<header id="date-header"' index.html               # 0 ✓

# Forbidden API gates (phase-wide)
$ grep -rE "innerHTML\s*=" js/                                # 0 ✓
$ grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/             # 0 ✓
$ grep -rE "localStorage\." js/ | grep -v js/storage.js       # 0 ✓
$ grep -rE "new Date\(['\"]" js/                              # 0 ✓
$ grep -E "function (monthGrid|prevMonth|nextMonth|todayYM|renderCalendar|formatHeader)" js/calendar.js | wc -l  # 6 ✓
```

## 12 UAT Scenarios — Status

본 executor 환경에는 brower session이 없어 12 시나리오는 **정적 증거(static evidence) + 코드 리뷰**로 검증했다. 각 시나리오마다 (a) 어떤 코드 경로가 그 행동을 보장하는지, (b) 사용자 사이드 브라우저 검증이 필요한지 표시한다.

| # | Scenario | Static Evidence | Browser Sign-off |
| --- | --- | --- | --- |
| 1 | 진입 시 today = 굵은 테두리 + accent text (CAL-04) | `renderCalendar` 셀 빌더에서 `cell.isToday` → `classList.add('is-today')` (Plan 01 calendar.js L115); CSS `.cal-cell.is-today` 룰이 border 2px + 파랑 (Plan 03 SUMMARY) | PENDING (시각 확인) |
| 2 | Today 진입 시 동시에 selected → 두 클래스 stack (CAL-04 + CAL-05) | 부트시 `selectedKey = dateKey()` (line 25); `cell.key === selectedKey` 가 today 셀에서 true → `is-selected` 추가 (calendar.js L116); CSS `.cal-cell.is-today.is-selected` 스택 룰 존재 | PENDING (시각 확인) |
| 3 | 임의 in-month day 클릭 → selected 이동, 헤더 갱신, todo 리스트 재렌더 (CAL-05/CAL-07/TODO-08) | `closest('[data-key]')` → `selectedKey = cell.dataset.key` → `render()` (app.js L103-107); render() 가 calendar+header+list 모두 재렌더 (L77-82) | PENDING (시각 확인) |
| 4 | 다음 → selectedKey 보존, 이전 → 원래 달의 selected 복원 (Pitfall 5) | nav 핸들러는 `viewYM` 만 갱신; `selectedKey`은 prev/next에서 변경 없음 (app.js L93-94) → 동일 달로 돌아오면 동일 셀에 is-selected 부착 | PENDING (시각 확인) |
| 5 | 5/31 → 다음 → 6월; 1월 ↔ 12월 wrap | `prevMonth({y, m: 0}) → {y-1, m: 11}`, `nextMonth({y, m: 11}) → {y+1, m: 0}` (calendar.js L34-40) — node-eval로 Plan 01에서 검증 완료 | PENDING (시각 확인) |
| 6 | 2024-02 grid에 29일 inMonth=true | `monthGrid` `+i` 루프 + Date 생성자 overflow normalization (calendar.js L21-30) — Plan 01 SUMMARY에서 leap-year 케이스 node-eval 통과 확인 | PASS (Plan 01 검증 인용) |
| 7 | "오늘" 버튼 → viewYM/selectedKey 둘 다 today snap | `if (a === 'today') { viewYM = todayYM(); selectedKey = dateKey(); }` (app.js L95-98) | PENDING (시각 확인) |
| 8 | 인접달 회색 셀 클릭 → 무동작/무에러 | 인접달 cell은 `<div>` 로 data-key/data-action 부재 → `closest('[data-action]')`/`closest('[data-key]')` 둘 다 null → handler가 silently return (app.js L84-110); 추가로 CSS `.cal-cell-adjacent { pointer-events: none; }` 도 보강 (Plan 03) | PENDING (시각 확인) |
| 9 | 오늘 셀 todo 3개 추가 → 배지 "3"; 모두 삭제 → 배지 사라짐 (CAL-06) | `renderCalendar` buildCell 가 매 렌더마다 `todosByDate[cell.key]?.length ?? 0` 재계산; 0이면 badge 노드 자체 미생성 (calendar.js L123-129); commit() → render() 흐름이 add/remove 양쪽에서 작동 | PENDING (시각 확인) |
| 10 | F5 reload → selectedKey가 today로 reset (decision D) | 모듈 최상위 `let selectedKey = dateKey()` 가 매 reload마다 재실행 (app.js L25); save()/load() 경로에 selectedKey 부재 | PENDING (헤더 텍스트 확인) |
| 11 | 비-today 날짜에 추가한 todo가 reload 후에도 그 날짜에 잔존 (PERS-03 regression) | form submit이 `addTodo(state, selectedKey, input.value)` → commit() → save() (app.js L116, L69-75); state.todosByDate[selectedKey] 에 안전 저장; 반대 방향 navigate 시 동일 키로 조회 | PENDING (시각 확인) |
| 12 | `<img src=x onerror=alert(1)>` 입력 → 텍스트로만 렌더 (STYL-02 regression) | renderTodoList는 textContent만 사용 (Phase 2 lock); 본 plan은 todos.js 변경 없음 → regression surface 0 | PASS (Phase 2 lock 인용) |

**Browser sign-off가 필요한 10건은 사용자 단계 UAT** — 본 SUMMARY 작성 시점 executor 환경에서는 브라우저를 띄울 수 없다. 코드 경로/CSS 룰/static gate가 모두 시나리오의 사전 조건을 충족하므로 실패 가능성은 낮다. 사용자가 `python3 -m http.server` 로 실행 후 10건을 visually 확인하면 된다.

## Decisions Made

frontmatter `key-decisions` 참조. 본 plan에서 in-execution 결정은 0 (모든 결정은 03-CONTEXT/03-PATTERNS에서 lock된 채로 진입).

## Deviations from Plan

None — 플랜이 적은 그대로 실행됨.

미세 조정 1건: 03-PATTERNS.md 가 `viewYM = { year, month }` 라고 적었으나, Plan 01의 todayYM/prevMonth/nextMonth가 모두 `{y, m}` 키로 잠겨 있었기 때문에 그 형태(짧은 키)로 통일. 이는 Plan 02의 PLAN.md `<interfaces>` 블록(`todayYM(): {y,m}`)이 이미 올바른 짧은 키를 명시하고 있어 deviation이라기보다는 Plan 01과의 일관성 유지.

## Issues Encountered

None — 3 task 모두 첫 시도 그대로 통과. node-eval은 `window` not defined로 실패하나 이는 module-top-level의 `window.dateKey = ...` 등 dev 노출 라인 때문이고, 브라우저에서는 정상. 실제 import-graph 정합성은 Plan 01의 calendar.js 가 Plan 01에서 이미 node-eval로 검증된 바 있다.

## Threat Flags

새로 도입된 보안 surface 없음. 본 plan의 신규 코드 경로(캘린더 click 핸들러)는:
- T-03-06 mitigate: `instanceof HTMLElement` 가드 + `closest()` 룩업; eval/innerHTML 부재.
- T-03-07 mitigate: `cell.dataset.key` 는 calendar.js 가 dateKey() output으로만 채우므로 codomain `\d{4}-\d{2}-\d{2}`; 이후 흐름은 todos.js 의 객체 키로만 사용.
- T-03-08 accept: window.* dev 노출은 Phase 1 carry-over (deferred).
- T-03-09 accept: render() per-click; 42셀 + textContent only로 클릭당 < 1ms 예상.

## Self-Check: PASSED

- `js/app.js` modified — FOUND (line 1–192).
- `index.html` modified — FOUND (line 10).
- Commits in `git log --oneline`:
  - `4209235` (Task 1) — FOUND
  - `cf2dda0` (Task 2) — FOUND
  - `48071bc` (Task 3) — FOUND
- 모든 static gate (15건) PASS.
- TDD gate compliance: 본 plan은 `tdd="true"` 마킹 task 3개를 포함하나 프로젝트에 test harness 부재(`tests.html` 없음, Plan 01 SUMMARY의 "No analog Found" 참조). 따라서 RED/GREEN cycle은 적용 불가하며 static grep gate가 그 자리를 대신함 (이는 03-PATTERNS.md `tests.html (OPTIONAL — no analog)` 결정과 정합).

## TDD Gate Compliance

본 plan task 들은 `tdd="true"` 로 마크돼 있으나, 리포에 test harness가 없음(`tests.html` 부재). 03-PATTERNS.md 가 명시적으로 "skip unless Phase 3 plan explicitly elects to add one"로 결정함. 따라서 RED 커밋(test) 없이 GREEN 커밋(feat)만 존재하는 것이 정합 — static grep gate + 다음 사용자 sign-off (12 UAT)가 검증을 대체. SDD/TDD 엄격 해석에서는 향후 별도 plan으로 `tests.html` harness를 도입한 뒤 calendar.js + app.js 와이어링에 대한 회귀 테스트를 추가하는 것이 권장.

## User Setup Required

없음. 정적 사이트 — 브라우저에서 `index.html` 열기 또는 `python3 -m http.server` 후 12 UAT 시나리오를 시각 검증.

## Next Phase Readiness

- **Phase 3 완료:** plan 01 (calendar 모듈), plan 02 (wiring, 본 plan), plan 03 (CSS) 모두 land. 사용자 UAT 1건만 남음 — 그것까지 PASS면 phase 3 closing 가능.
- **Phase 4 준비 완료:** STYL-01 디자인 토큰 도입 시 `:root`에 새 토큰 추가 + 기존 `.cal-cell.is-today` / `.cal-cell.is-selected` / `#date-header` 룰을 재작성하면 됨. selectedKey/viewYM 와이어링은 그대로 재사용. PERS-04 toast는 `commit()`의 `console.warn` 사이트(app.js L72)에 toast 호출 한 줄 추가하면 됨.
- **Open Todos (carry-over):** `window.*` dev 노출 압축은 본 plan 범위 밖 (CONTEXT `<deferred>` lock).

---
*Phase: 03-calendar-integration*
*Completed: 2026-05-03*
