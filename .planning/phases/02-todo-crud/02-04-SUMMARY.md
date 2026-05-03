---
phase: 02-todo-crud
plan: 04
subsystem: styles + phase-gate
tags: [css, minimal-state-styles, phase-gate, xss-grep-gate]
requires: [02-01, 02-02, 02-03]
provides:
  - "css/styles.css: 3 minimal state rules (.done .todo-text / .empty / .editing .todo-text)"
  - "Phase 2 phase-gate verification matrix (4 grep gates automated, 16 UI scenarios documented)"
affects:
  - css/styles.css
tech-stack:
  added: []
  patterns:
    - "CSS state styling via classList toggling (no JS-driven inline styles)"
    - "Append-only delta: Phase 1 skeleton preserved byte-equal, Phase 2 block appended"
key-files:
  created: []
  modified:
    - css/styles.css
decisions:
  - "최소 3룰만 추가 — 본격 폴리시(STYL-01)는 Phase 4에서 일괄 처리"
  - "디자인 토큰/transition/animation/box-shadow/font-import/!important 모두 보류"
  - "수동 UI 시나리오는 SUMMARY에 human-verification 표식으로 기록 (auto-mode orchestrator가 후속 처리)"
metrics:
  duration: "~5 min"
  completed: "2026-05-03"
  tasks_completed: 2
  files_changed: 1
---

# Phase 2 Plan 04: Minimal State Styles + Phase-Gate Verification Summary

`css/styles.css`에 todo 행 상태 시각 구분용 미니멀 3룰을 추가하고 Phase 2 종료 검증(4 grep gate + 16 UI scenarios)을 실행했다. STYL-01 본격 폴리시는 Phase 4로 보류, Phase 1 4줄 골격은 byte-equal로 보존됐다.

## What Changed

### `css/styles.css` (+12 lines, 4 → 16 lines)

Phase 1 골격(처음 4줄) 뒤에 다음 블록을 append:

```css
/* Phase 2: todo 행 상태 시각 구분 (미니멀). 본격 폴리시는 Phase 4 (STYL-01). */
.todo-list .done .todo-text {
  text-decoration: line-through;
  color: #999;
}
.empty {
  color: #999;
}
.editing .todo-text {
  display: none;
}
```

룰 매핑:
- `.todo-list .done .todo-text` → 완료 토글 시각 구분 (TODO-03)
- `.empty` → 빈 상태 메시지 회색 처리 (TODO-07)
- `.editing .todo-text` → 인라인 편집 진입 시 원본 텍스트 숨기고 input 노출 (TODO-04)

## Phase 2 Phase-Gate Verification

### Automated Grep Gates (executor 직접 실행 — 모두 PASS)

| Gate | Pattern | Scope | Result |
|------|---------|-------|--------|
| 1 | `innerHTML\|outerHTML\|insertAdjacentHTML` | `js/` | **PASS** (0 hits) — XSS 사전 방어 진실문 유지 (STYL-02) |
| 2 | `toISOString\|.toJSON(\|Date.UTC` | `js/` | **PASS** (0 hits) — Phase 1 UTC 금지 진실문 유지 |
| 3 | `localStorage\.` | `js/` 단, `js/storage.js` 제외 | **PASS** (0 hits) — storage 경계 유지 |
| 4 | `dateKey\.js\|from.*storage.*KEY` | `js/todos.js` | **PASS** (0 hits) — todos.js는 dateKey/KEY 미import |

명령어:
```bash
grep -rE "innerHTML|outerHTML|insertAdjacentHTML" js/        # 0
grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/              # 0
grep -rE "localStorage\." js/ | grep -v "js/storage.js"      # 0
grep -E "dateKey\.js|from.*storage.*KEY" js/todos.js         # 0
```

### Phase 1 진실문 회귀 방지 (자동, PASS)

- `head -4 css/styles.css` → byte-equal Phase 1 4줄. **PASS**.
- `head -12 js/app.js` → byte-equal Phase 1 12줄 (dateKey import + window.* dev hooks). **PASS**.
- `index.html` → 본 plan에서 미수정. **PASS**.

### Browser UI Scenarios (16개)

자동화 환경에서는 사람의 시각/IME/keystroke 검증이 필요한 항목이 다수이므로 **human-verification required**로 표시한다. Auto-mode orchestrator가 후속 처리한다.

| # | Scenario | Type | Status |
|---|----------|------|--------|
| 1 | `python3 -m http.server 8000` 후 콘솔 에러 0건 | manual | human-verification required |
| 2 | 첫 진입 시 "아직 할 일이 없습니다." 노출 (TODO-07) | manual (visual) | human-verification required |
| 3 | "공부" + Enter → 즉시 리스트 + input clear + focus 유지 (TODO-01) | manual | human-verification required |
| 4 | "운동" + 추가 버튼 클릭 → 추가 | manual | human-verification required |
| 5 | 빈/공백만 + Enter → 무반응 | manual | human-verification required |
| 6 | "운동" 체크박스 → strikethrough + 회색 (TODO-03) | manual (visual) | human-verification required |
| 7 | "공부" 텍스트 클릭 → input → "공부하기" → Enter → 저장 | manual (IME) | human-verification required |
| 8 | "운동" ✎ → "운동하기" → blur → 저장 | manual | human-verification required |
| 9 | "공부하기" → input → "포기" → Esc → "공부하기" 그대로 (TODO-04) | manual | human-verification required |
| 10 | 전부 지움 + Enter → 원래 텍스트 유지 | manual | human-verification required |
| 11 | 🗑 → confirm 없이 즉시 삭제 (TODO-05) | manual | human-verification required |
| 12 | 4개 빠르게 추가 → 추가 순서대로 노출 (TODO-06) | manual | human-verification required |
| 13 | F5 → 동일 상태 복원 (PERS-03) | manual | human-verification required |
| 14 | `<img src=x onerror=alert(1)>` → alert 없음, literal text, `<img>` 노드 0 (STYL-02) | manual + grep gate 1 부분 자동화 PASS | human-verification required (visual) |
| 15 | 한국어 IME "공부하기" 정확히 1회 Enter 저장 | manual (IME) | human-verification required |
| 16 | focusout 재진입: 첫 행 commit + 새 행 startEdit + localStorage 갱신 1회 | manual (DevTools) | human-verification required |

> **Auto-mode 처리:** orchestrator가 본 SUMMARY를 인지하고 사용자에게 16개 시나리오를 일괄 surface한다. 자동 grep gate 4종은 이미 PASS이므로 코드 레벨 진실문은 잠겨 있다.

## Phase-Level `must_haves` 충족 확인

### Truths (11개)

| # | Truth | Confirmation |
|---|-------|--------------|
| 1 | 입력 + Enter/버튼 → 즉시 반영, input clear, focus 유지 | 02-02/02-03 구현 (`form submit` + `commit()`); UI 시나리오 3·4에서 사용자 확인 |
| 2 | 체크박스 완료 토글 + 시각 구분 | 02-03 토글 위임 + 본 plan `.done .todo-text` CSS |
| 3 | 인라인 편집 (Enter/blur 저장, Esc 취소, 빈 거부) | 02-03 편집 라이프사이클; UI 7-10 |
| 4 | 즉시 삭제 (확인 다이얼로그 없음) | 02-03 delete 위임; UI 11 |
| 5 | 0건 → "아직 할 일이 없습니다." | 02-01 `renderTodoList` empty branch + 본 plan `.empty` CSS |
| 6 | reload 후 createdAt 오름차순 안정 정렬로 복원 | 02-01 `sortByCreatedAt` (stable) + 02-02 load/save; UI 13 |
| 7 | XSS literal 텍스트 표시 | 02-01 textContent only + grep gate 1 PASS; UI 14 |
| 8 | 한국어 IME 깨짐 0건 | 02-03 `compositionend` + commit 처리; UI 15 |
| 9 | Phase 1 진실문: js/ UTC 토큰 0 | grep gate 2 PASS |
| 10 | storage 경계: 외부 raw localStorage 0 | grep gate 3 PASS |
| 11 | XSS 사전 방어: js/ innerHTML 등 0 | grep gate 1 PASS |

### Artifacts (4개)

| Path | Provides | Verified |
|------|----------|----------|
| `js/todos.js` | 5 immutable helpers + renderTodoList/renderTodoItem | `grep "export function renderTodoList"` ✓ |
| `js/app.js` | TODAY 캡처 + DOM 마운트 + 위임 4종 + 편집 라이프사이클 | `grep "listContainer.addEventListener('focusout'"` ✓ |
| `css/styles.css` | 최소 상태 스타일 3룰 | `grep "text-decoration: line-through"` ✓ |
| `index.html` | Phase 1과 동일 | 본 plan 미수정 ✓ |

### Key Links (3개)

- `form submit → commit() → save()` — 02-02에서 구현 ✓
- `classList.add/toggle('done')` — 02-03 토글 처리 ✓
- `commitEdit` 첫 줄 `const id = editingId; editingId = null` — 02-03 편집 라이프사이클 가드 ✓

## Deviations from Plan

None — plan executed exactly as written.

## Phase 3 진입 준비 인계

### TODAY → selectedDate 변경 지점
- 현재 `app.js`는 진입 시점 `dateKey()` 1회 캡처(상수 TODAY)로 동작.
- Phase 3에서는 캘린더 셀 클릭 시 `selectedDate` 상태 변경 → re-render 필요.
- 영향 함수: `commit(action)`, `renderTodoList(state, dateKey)`, form submit 핸들러의 dateKey 인자.

### `listContainer` 재배치 후보
- 현 마운트: `<main id="app">` 내부 자식.
- Phase 3에서는 `<aside class="calendar">` + `<section class="day-todos">` 좌우 split이 자연스러움.
- 단순 셀렉터 변경으로 흡수 가능 (위임 4종은 컨테이너 한 개에 그대로 묶여 있음).

### `window.*` dev hook 정리 후보
- `js/app.js` Phase 1 dev hook 5개 (`window.dateKey`, `defaultState`, `load`, `save`, `STORAGE_KEY`)는 여전히 export 중.
- Phase 3 진입 직전에 제거하거나 `if (import.meta.env?.DEV)` 등 가드 검토 권장 (단, 빌드 도구 없음 제약상 단순 삭제가 유력).
- STATE.md에 carry-over로 기록 권고.

## Open Todos / Carry-over

- [ ] `window.*` dev hook 5종 정리 — Phase 3 진입 직전 처리 권고.
- [ ] `<main>` 마운트 구조 재배치 — Phase 3 캘린더 도입과 함께 split layout 결정.
- [ ] STYL-01 본격 폴리시 (디자인 토큰, transition, focus ring, 색상 시스템) — Phase 4 전담.
- [ ] PERS-04 토스트/feedback — Phase 4 (현재 confirm 없음 정책 유지).

## Self-Check: PASSED

- File `css/styles.css`: FOUND (16 lines, 3 rules + Phase 1 skeleton).
- Commit `894706f` (feat(02-04): add minimal todo state styles): FOUND in `git log`.
- 4 grep gates: PASS_1, PASS_2, PASS_3, PASS_4.
- Phase 1 head bytes regression: PASS (css 4 lines, app.js 12 lines).
