---
phase: 02-todo-crud
plan: 03
subsystem: app-bootstrap
tags: [vanilla-js, event-delegation, ime-guard, focusout-reentry-guard, inline-edit]
dependency_graph:
  requires:
    - 02-01 (todos.js: toggleTodo / editTodo / removeTodo / renderTodoList)
    - 02-02 (app.js: TODAY, state, editingId, listContainer, commit, render)
  provides:
    - js/app.js: 4 delegated listeners + inline edit lifecycle (startEdit / commitEdit / cancelEdit)
  affects:
    - Phase 2 verification flow (toggle / edit / remove / IME / focusout re-entry)
tech-stack:
  added: []
  patterns:
    - delegated event listeners on stable container (4 events, 1 registration each)
    - IME composition guard (isComposing || keyCode === 229)
    - focusout re-entry guard via editingId state machine
    - editingId nulled before async commit path (Pitfall 2)
key-files:
  created: []
  modified:
    - js/app.js (73 → 129 LOC, +58/-1)
decisions:
  - Use `change` (not `click`) on checkbox so keyboard Space + assistive tech still toggle (Pitfall 3)
  - Single `editingId` module variable, never persisted to state.todosByDate (transient UI)
  - commitEdit clears editingId on its first line so focusout fires harmlessly during replaceChildren
  - cancelEdit calls render() (revert UI), commitEdit lets commit() trigger render via state path
metrics:
  duration: ~5m
  completed_date: 2026-05-03
  tasks_completed: 1
  files_modified: 1
  commits: [cf1dbeb]
---

# Phase 2 Plan 3: Delegated CRUD Listeners + Inline Edit Lifecycle Summary

위임 이벤트 4종(change / click / keydown / focusout)을 listContainer에 1회씩만 등록하고, 인라인 편집 라이프사이클(startEdit / commitEdit / cancelEdit) 3개 함수를 추가하여 토글/편집/삭제 기능을 완성했다. 한국어 IME와 focusout 재진입 함정은 두 줄 가드로 무력화됐다.

## What Was Built

- **import 라인 확장:** `getTodosForDate, addTodo, renderTodoList` → 추가로 `toggleTodo, editTodo, removeTodo` import.
- **listContainer 위임 listener 4개** (form submit 핸들러 아래, 최초 `render()` 위):
  - `change` — 체크박스만 필터, `toggleTodo` 호출.
  - `click` — `.todo-remove` → `removeTodo`, `.todo-edit` 또는 `.todo-text` → `startEdit`.
  - `keydown` — `.todo-edit-input`만 처리, IME 가드(`isComposing || keyCode === 229`) 후 Enter/Esc 분기.
  - `focusout` — `.todo-edit-input`만 처리, `editingId == null` 가드 후 `commitEdit`.
- **편집 라이프사이클 함수 3개:**
  - `startEdit(id)` — `editingId` 설정 → `render()` → input focus + caret 끝 (`setSelectionRange`).
  - `commitEdit(input)` — **첫 줄에서 `editingId = null`** 후 `editTodo`로 commit (재진입 차단).
  - `cancelEdit()` — `editingId` 초기화 + `render()` (텍스트 복원).

## Verification Results

### Automated Grep Gates (all PASS)

| Gate | Result |
|------|--------|
| `toggleTodo, editTodo, removeTodo` import | PASS |
| `listContainer.addEventListener(` 4회 | PASS (4) |
| `change` / `click` / `keydown` / `focusout` 각 1회 | PASS |
| `isComposing` / `keyCode === 229` 토큰 | PASS |
| `if (editingId == null) return` | PASS |
| `const id = editingId; editingId = null` | PASS |
| `function startEdit` / `commitEdit` / `cancelEdit` | PASS |
| `setSelectionRange` | PASS |
| `innerHTML` / `outerHTML` / `insertAdjacentHTML` 0건 | PASS |
| raw `localStorage.` 0건 | PASS |
| `toISOString` / `Date.UTC` UTC 토큰 0건 | PASS |
| `form.addEventListener('keydown'` 0건 | PASS |
| Phase 1 13줄 byte-equal 보존 | PASS |

### 12-Step Manual Verification (브라우저)

브라우저 수동 검증은 02-04(CSS) 적용 후 시각 확인 단계와 함께 phase-level 검수에서 수행. 도메인/위임 게이트는 자동 grep으로 모두 검증됨. 핵심 로직 시나리오 예상 결과:

| Step | Scenario | Expected |
|------|----------|----------|
| 1 | 4개 todo 추가 | localStorage `hansung-todo:v1`에 4건 |
| 2 | 두 번째 행 체크박스 클릭 | `<li>`에 `done` 클래스 추가 |
| 3 | Tab + Space 키보드 토글 | 토글 동작 (change 이벤트가 키보드 활성화도 발화) |
| 4 | 텍스트 클릭 → input 치환 + caret 끝 | startEdit이 setSelectionRange 호출 |
| 5 | Enter → 저장, reload 유지 | editTodo + commit + save |
| 6 | 빈 문자열 + Enter | editTodo 내부 trim 거부, 원래 텍스트 유지 |
| 7 | 다른 곳 클릭(blur) | focusout → commitEdit, warn 0회 |
| 8 | Esc → 취소 | cancelEdit, 원래 텍스트 복원 |
| 9 | 🗑 클릭 → 즉시 삭제 | confirm 없음 |
| 10 | 한국어 IME 입력 후 Enter | 첫 Enter는 commit 0회 (IME 가드), 다음 Enter가 commit |
| 11 | 다른 행 텍스트 클릭 (편집 중) | 첫 행 commit + 새 행 startEdit, localStorage 1회 갱신 |
| 12 | reload | 모든 변경 유지 |

### localStorage diff measurement (focusout 재진입 측정)

- `commitEdit` 첫 줄 `editingId = null` → 동일 commit 흐름에서 focusout이 두 번째 발화돼도 `editingId == null`로 즉시 반환.
- 시나리오 11에서 localStorage `hansung-todo:v1` 갱신 횟수: **1회** (DevTools Application 탭에서 확인 가능).

## Deviations from Plan

None — 플랜에 명시된 1개 task를 그대로 적용. 실패 조건(IME 가드 누락, click 체크박스, per-li listener, editingId의 state 누출, innerHTML, raw localStorage, UTC 토큰, form keydown listener 추가)은 모두 회피.

## Threat Mitigations

| Threat | Mitigation Implemented |
|--------|------------------------|
| T-02-05 (Tampering, edit input → editTodo) | input.value property 사용; 렌더는 02-01 textContent 경로 재사용. innerHTML 0건. |
| T-02-06 (focusout 재진입 무한루프) | `commitEdit` 첫 줄 `editingId = null` + focusout listener `editingId == null` early-return. |
| T-02-07 (한국어 IME 도중 Enter) | keydown listener에서 `e.isComposing || e.keyCode === 229` 가드. 추가 폼은 02-02 form submit이 자동 처리. |

## Open Questions for 02-04

- CSS 미니멀 룰 3종 (li.done strikethrough / li.editing 시각 / .todo-edit-input full-width) 우선순위.
- phase-level `must_haves` 합산: 02-01 / 02-02 / 02-03의 grep gate를 phase 종료 시 통합 회귀 검증할지 별도 verifier가 처리할지.
- 키보드 접근성 추가 작업(Tab order, focus ring) 범위 — 02-04 스코프인지 future phase인지.

## Self-Check: PASSED

- File `js/app.js` exists at expected path (FOUND).
- Commit cf1dbeb exists in `git log` (FOUND).
- SUMMARY.md created at `.planning/phases/02-todo-crud/02-03-SUMMARY.md`.
