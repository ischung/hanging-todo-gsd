---
phase: 02-todo-crud
plan: 01
subsystem: ui
tags: [vanilla-js, esm, immutable-state, dom-render, xss-defense]

requires:
  - phase: 01-foundation
    provides: defaultState shape, load/save signature, dateKey() — todos.js consumes none directly; honors boundary by NOT importing KEY/dateKey
provides:
  - 5 pure immutable helpers (getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo)
  - renderTodoList(container, todos, editingId) view function with empty-state fallback
  - XSS-safe DOM rendering via textContent + input.value (zero innerHTML)
affects: [02-02, 02-03, 03-calendar]

tech-stack:
  added: []
  patterns:
    - "Immutable state transform: helper(state, key, ...) → new state (호출처가 save 책임)"
    - "Single-container replaceChildren render (event-listener 보존)"
    - "Input.value property assignment for edit mode (HTML 파싱 우회)"

key-files:
  created:
    - js/todos.js
  modified: []

key-decisions:
  - "todos.js does not import KEY nor dateKey — Phase 1 storage/date 경계를 호출처(app.js)에 위임"
  - "renderTodoItem은 파일-스코프 내부 함수, export 안 함 — 외부 인터페이스 표면 최소화"
  - "Empty state copy '아직 할 일이 없습니다.' 단일 <p class='empty'> — 날짜 비종속 카피로 Phase 3에서 재사용"

patterns-established:
  - "Pattern 1: Immutable transform — `{...state, todosByDate: {...state.todosByDate, [key]: new}}` 3중 spread"
  - "Pattern 2: Stable sort `[...list].sort((a,b) => a.createdAt - b.createdAt)`"
  - "Pattern 3: container.replaceChildren(node) 단일 호출로 empty↔list 전환 (innerHTML 금지)"
  - "Pattern 4: 사용자 텍스트는 항상 el.textContent / input.value (property 할당)"

requirements-completed: [TODO-02, TODO-06, STYL-02, PERS-03]

duration: ~10min
completed: 2026-05-03
---

# Phase 02 Plan 01: js/todos.js — todos 도메인 모듈 Summary

**5개 immutable state helpers + XSS-safe renderTodoList in a single 112-line vanilla ESM module, honoring Phase 1 storage/date boundaries (no localStorage, no dateKey imports)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-03T09:30Z
- **Completed:** 2026-05-03T09:40Z
- **Tasks:** 1
- **Files modified:** 1 (created)

## Accomplishments

- `js/todos.js` 신규 작성 (112 lines): 6 named exports + 1 internal helper.
- 모든 plan grep gate 통과 (innerHTML 0건, localStorage 0건, dateKey import 0건, UTC 토큰 0건, default export 0건, 6개 export 확인).
- Phase 1 진실문 유지 확인 (`grep -rE` 전체 `js/`에서 innerHTML / UTC / raw localStorage 모두 0건).

## Task Commits

1. **Task 1: js/todos.js — 헬퍼 5종 + renderTodoList/renderTodoItem 단일 파일 작성** — `f6763b8` (feat)

## Files Created/Modified

- `js/todos.js` (NEW, 112 lines)
  - **Exports (6):** `getTodosForDate`, `addTodo`, `toggleTodo`, `editTodo`, `removeTodo`, `renderTodoList`.
  - **Internal:** `renderTodoItem(t, isEditing)` (파일 스코프).
  - **No imports** (storage/dateKey 경계 honor).

## Decisions Made

None beyond plan-fixed decisions. Plan은 RESEARCH §Pattern 1 + §Pattern 3을 그대로 차용하라고 명시했고 그렇게 했다. RESEARCH §Pattern 1 코드의 `import { dateKey } from './dateKey.js'` 1줄은 plan의 명시적 금지 사항이라 제거(이는 plan 의도이지 deviation 아님).

## Console Round-trip Verification (Node-simulated, 6 asserts passed)

`http.server` 띄우고 브라우저 콘솔에서 import할 필요 없이, 헬퍼 5종은 순수 함수라 Node로 직접 검증함 (DOM API에 의존하지 않음). renderTodoList는 다음 plan(02-02 app.js 와이어링) 통합 시점에 브라우저에서 자연 검증됨.

```
ALL ASSERTS PASSED
```

검증 항목:
1. `add+sort`: A → B 추가 후 createdAt 오름차순 유지.
2. `toggle`: 첫 항목 done=true.
3. `addTodo rejects empty trim`: 공백만 입력 시 `s4 === s3` (Object.is 동일성).
4. `editTodo rejects empty trim`: 공백만 입력 시 `s5 === s3`.
5. `remove`: 1개 제거 후 length=1.
6. `input state not mutated`: 원본 `s0.todosByDate['2026-05-03']`이 여전히 undefined.

## Grep Gates (all pass)

| Gate | Result |
|------|--------|
| `grep -E "^export function …" js/todos.js \| sort -u \| wc -l` | 6 ✓ |
| `grep -E "innerHTML\\s*=\|outerHTML\\s*=\|insertAdjacentHTML" js/todos.js` | 0건 ✓ |
| `grep -E "localStorage\\." js/todos.js` | 0건 ✓ |
| `grep -E "from ['\\\"]\\./dateKey\\.js['\\\"]" js/todos.js` | 0건 ✓ |
| `grep -E "toISOString\|toJSON\|Date\\.UTC" js/todos.js` | 0건 ✓ |
| `grep -E "^export default" js/todos.js` | 0건 ✓ |
| `grep -q "crypto.randomUUID"` | ✓ |
| `grep -q "Date.now"` | ✓ |
| `grep -q "replaceChildren"` | ✓ |
| `grep -q "a\\.createdAt - b\\.createdAt"` | ✓ |
| `grep -q "아직 할 일이 없습니다"` | ✓ |

Phase 1 진실문 (`js/` 전체):

| Gate | Result |
|------|--------|
| `grep -rE "innerHTML\\s*=" js/` | 0건 ✓ |
| `grep -rE "toISOString\|toJSON\|Date\\.UTC" js/` | 0건 ✓ |
| `grep -r "localStorage\\." js/ \| grep -v js/storage.js` | 0건 ✓ |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **초기 작업 디렉터리 혼선:** `cd` 명령으로 main repo 경로(`/Users/.../hansung-todo-gsd`)로 이동해 `js/todos.js`를 잘못된 위치에 생성. 즉시 worktree 안(`/.../.claude/worktrees/agent-.../js/todos.js`)으로 `mv`해 옮기고 main repo는 untracked 상태 그대로 둠 (변경 사항 0). 이후 모든 git 명령은 `git -C "$WORKTREE"`로 worktree 절대 경로 명시. 영향 없음.

## User Setup Required

None — 외부 서비스 설정 불필요.

## Next Plan Readiness

- `js/todos.js`의 6개 export 인터페이스 잠금. 다음 plan(`02-02-PLAN.md`)에서 `app.js`가 `import { getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo, renderTodoList } from './todos.js'`로 직접 사용 가능.
- `renderTodoList`는 단일 컨테이너 + listener 위임 패턴(02-PATTERNS §`js/app.js`)과 결합 시 즉시 동작.
- Open questions: 없음 (인터페이스 고정).

## Self-Check

- [x] FOUND: `js/todos.js`
- [x] FOUND commit: `f6763b8` (feat(02-01): add todos.js with 5 immutable helpers + renderTodoList)

## Self-Check: PASSED

---
*Phase: 02-todo-crud*
*Completed: 2026-05-03*
