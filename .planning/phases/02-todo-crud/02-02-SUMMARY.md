---
phase: 02-todo-crud
plan: 02
subsystem: ui
tags: [vanilla-js, esm, bootstrap, dom-mount, form-submit, ime-guard]

requires:
  - plan: 02-01
    provides: getTodosForDate, addTodo, renderTodoList (todos.js named exports)
  - phase: 01-foundation
    provides: dateKey(), load(), save() — consumed unchanged via existing imports
provides:
  - Phase 2 부트스트랩 (TODAY 캡처 + DOM 마운트 + 최초 렌더)
  - 추가 폼 submit 핸들러 (IME-safe, <form>+submit only)
  - commit() / render() 헬퍼 — 02-03 위임 listener의 호출 진입점
affects: [02-03]

tech-stack:
  added: []
  patterns:
    - "Append-only bootstrap: Phase 1 13줄 byte-equal 보존, 그 아래에 Phase 2 코드 누적"
    - "<form>+submit (별도 keydown 0건) → 한국어 IME Enter 자동 우회"
    - "commit(nextState) 단일 진입점 → save 실패 시 console.warn + in-memory 낙관적 갱신"
    - "DOM 마운트 1회 (root.replaceChildren), listContainer만 재렌더 → listener 보존"

key-files:
  created: []
  modified:
    - js/app.js  # 13 → 72 lines (+60, append-only)

key-decisions:
  - "todos.js import 라인은 이번 plan에서 사용하는 3종(getTodosForDate, addTodo, renderTodoList)만 — toggle/edit/remove는 02-03에서 추가 (scope creep 회피)"
  - "buildForm/buildListContainer 작은 헬퍼 2개로 분리 — 부트스트랩 흐름이 선형으로 읽힘"
  - "render() 호출은 파일 마지막 줄 1회만 — 부트스트랩 순서 (마운트 → 핸들러 → 최초 렌더) 명시적으로 보존"

patterns-established:
  - "Pattern: append-only bootstrap 확장 — 기존 console.info 부트 로그 직후에 신규 import + 모듈 변수 + DOM 마운트 + 핸들러 + render() 누적"
  - "Pattern: form submit 핸들러 내부 input clear + focus → 연속 입력 UX"

requirements-completed: [TODO-01, TODO-07, PERS-03]

duration: ~6min
completed: 2026-05-03
---

# Phase 02 Plan 02: js/app.js — 부트스트랩 + 추가 폼 와이어링 Summary

**Phase 1의 13줄 부트스트랩을 byte-equal 보존한 채 60줄을 append-only로 추가하여 폼 마운트, 최초 empty-state 렌더, 추가 폼 submit 핸들러를 와이어링**

## Performance

- **Duration:** ~6 min
- **Tasks:** 1 / 1
- **Files modified:** 1 (js/app.js)
- **Lines:** 13 → 72 (+60 추가, -0 삭제)

## Accomplishments

- `js/app.js` Phase 2 부트스트랩 layer 추가 — Phase 1 라인 1-12 byte-for-byte 보존 (diff exit code 0).
- 모든 plan grep gate 통과 (PASS):
  - Phase 1 12줄 byte-equal.
  - todos.js import / TODAY 캡처 / state·editingId 변수 / replaceChildren 마운트 / commit save 가드 / form submit 핸들러 / input.focus / 최초 render() 1회 호출 — 모두 확인.
  - 금지 패턴 0건: `innerHTML=`, `outerHTML=`, raw `localStorage.`, `toISOString|toJSON|Date.UTC`, `addEventListener('keydown'`.

## Task Commits

1. **Task 1: js/app.js append — TODAY/state/editingId + DOM 마운트 + commit/render + form submit** — `94a1d75` (feat)

## Files Modified

- `js/app.js` (13 → 72 lines, +60 append-only)
  - **유지 (lines 1-12):** Phase 1 import 2종 + window.* 노출 5건 + console.info 부트 로그.
  - **추가 (lines 13-72):**
    - 신규 import: `getTodosForDate, addTodo, renderTodoList from './todos.js'`.
    - 모듈 스코프: `const TODAY`, `let state`, `let editingId = null`.
    - 헬퍼: `buildForm()`, `buildListContainer()` — innerHTML 0건, createElement + append만.
    - 마운트: `root.replaceChildren(form, listContainer)` 1회.
    - `commit(nextState)`, `render()` 헬퍼.
    - `form.addEventListener('submit', ...)` — preventDefault → trim 가드 → addTodo → input.value='' → input.focus().
    - 마지막 줄: `render();` (최초 empty-state 1회).

## Decisions Made

None beyond plan-fixed decisions. Plan은 todos.js import에서 toggle/edit/remove를 명시적으로 제외했고(scope creep 금지) 그렇게 따랐다.

## Diff Summary

```
js/app.js
   13 lines (Phase 1, untouched)
+ 60 lines (Phase 2 bootstrap)
─────────
   72 lines total
```

## Grep Gate Transcript

```
$ head -12 js/app.js | diff - <(printf "...Phase 1 13줄...")
(no output — byte-equal)

$ grep -q "from './todos.js'"             ✓
$ grep -q "const TODAY = dateKey()"       ✓
$ grep -q "let state = load()"            ✓
$ grep -q "let editingId = null"          ✓
$ grep -q "root.replaceChildren(form, listContainer)" ✓
$ grep -q "if (!save(state))"             ✓
$ grep -q "save failed; mutation kept in memory" ✓
$ grep -q "form.addEventListener('submit'" ✓
$ grep -q "input.focus()"                 ✓
$ grep -E "innerHTML=|outerHTML="         (no match — 0건)
$ grep -E "localStorage\."                (no match — 0건)
$ grep -E "toISOString|toJSON|Date\.UTC"  (no match — 0건)
$ grep -E "addEventListener\(['\"]keydown['\"]" (no match — 0건)
$ grep -cE "^render\(\);"                 1 ✓

PASS
```

## Browser Verification (수동 — 사용자 책임)

본 worktree 실행 환경에는 그래픽 브라우저가 없어 수동 8단계 검증은 사용자가 메인 리포에서 다음 절차로 직접 수행해야 한다:

1. `python3 -m http.server 8000` → `http://localhost:8000` 접속.
2. 콘솔 에러 0건. `[hansung-todo] foundation loaded` 부트 로그 1회.
3. 페이지에 input + 추가 버튼 + "아직 할 일이 없습니다." 메시지 노출 (TODO-07).
4. "공부하기" 입력 → Enter → 리스트에 1개 노출, input clear, focus 유지.
5. "운동하기" 입력 → 추가 버튼 클릭 → 리스트에 2개 노출.
6. 빈 문자열/공백만 입력 → 추가 시도 → 변화 없음 (form submit 가드).
7. **한국어 IME 검증:** 자모 조합 도중 Enter는 add 미실행, 조합 확정 후 Enter만 add 트리거. "공부하긱" 같은 깨진 텍스트 없음.
8. F5 reload → 추가된 2개가 동일 순서로 노출 (PERS-03).

코드상의 보장 — IME 가드는 별도 keydown listener 0건 + `<form submit>` 단일 진입점이라는 패턴 자체로 자동 충족되며, 별도 런타임 분기가 없다 (Pitfall 1 회피).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Open Questions for 02-03

- **editingId guard 위치:** `commitEdit` 진입 첫 줄에서 `editingId = null` 선처리 (Pitfall 2 — focusout 재진입 차단). PATTERNS lines 198-208에 코드 발췌 잠금됨.
- **위임 listener 4종 등록 순서:** change → click → keydown → focusout 순으로 listContainer 단일 노드에 등록 (RESEARCH §Pattern 2). `replaceChildren`이 자식만 교체하므로 listener는 최초 마운트 후 보존됨.
- **import 라인 확장:** 02-03에서 `toggleTodo, editTodo, removeTodo`를 기존 multi-line import에 추가 (한 줄에 6종 모두 노출).

## User Setup Required

None — 외부 서비스/시크릿 설정 불필요. 수동 브라우저 검증만 사용자 영역.

## Next Plan Readiness

- `commit(nextState)` 진입점이 잠겼으므로 02-03의 4종 핸들러는 모두 `commit(toggleTodo(...))` / `commit(editTodo(...))` / `commit(removeTodo(...))` 형태로 호출 가능.
- `render()`가 `editingId`를 인자로 넘기므로 02-03의 inline edit 라이프사이클은 `editingId` 변수만 갱신 후 `render()` 호출하면 됨.
- listContainer 단일 노드는 마운트되어 있으며, `replaceChildren`로 자식만 갱신되므로 위임 listener는 한 번 등록 후 모든 재렌더에서 보존됨.

## Self-Check

- [x] FOUND: `js/app.js` (modified, 72 lines)
- [x] FOUND commit: `94a1d75` (feat(02-02): wire app.js bootstrap with form submit + initial render)

## Self-Check: PASSED

---
*Phase: 02-todo-crud*
*Completed: 2026-05-03*
