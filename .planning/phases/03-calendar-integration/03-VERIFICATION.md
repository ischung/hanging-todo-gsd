---
phase: 03-calendar-integration
verified: 2026-05-03T00:00:00Z
status: human_needed
score: 5/5 must-haves verified (static); 5 success criteria require browser UAT sign-off
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "월 그리드 + 경계 이동 (SC1 / CAL-01·02·03)"
    expected: "브라우저에서 7×N(=6×7=42) 셀 그리드 + 일~토 헤더가 보이고, '< 이전'을 1월에서 누르면 작년 12월로, '다음 >'을 12월에서 누르면 다음 해 1월로 넘어가며, '오늘' 버튼이 viewYM과 selectedKey를 오늘로 즉시 복귀시킨다. 1월 31일에서 다음 → 2월(평년/윤년 모두 정상), 윤년 2024-02-29 셀 존재."
    why_human: "그리드 시각 렌더링/버튼 클릭 흐름은 코드/노드 스모크로 정확성은 입증되나(42 cells, 경계 wrap, 윤년 처리 통과), '실제 화면에 의도대로 보이는지'는 자동화 도구 없이 사람 눈으로 확인해야 함."
  - test: "오늘/선택 셀 시각 구분 (SC2 / CAL-04·05)"
    expected: "오늘 셀은 두꺼운 파란 테두리(2px solid #2563eb), 선택 셀은 파란 배경(#2563eb) + 흰 글자. 두 상태가 한 셀에 겹치면 둘 다 보인다(채워진 배경 + 더 진한 테두리 #1e40af)."
    why_human: "색·두께 차이로 사람이 즉시 식별 가능한지는 시각 판단. CSS 규칙은 정의되어 있음(.cal-cell.is-today / .is-selected / 둘 합성)."
  - test: "셀 todo 카운트 배지 즉시 갱신 (SC3 / CAL-06)"
    expected: "0개 날짜는 배지 없음, 1개 이상이면 .cal-badge에 숫자 표시. 어떤 날짜를 선택해 todo를 추가/삭제하면 해당 셀의 배지가 다음 렌더에서 즉시 반영된다."
    why_human: "배지 노드 생성 분기는 코드로 검증됨(count>0 일 때만 append). '입력 → 즉시 갱신' 인지는 실제 클릭 흐름에서만 확인 가능."
  - test: "셀 클릭 → 헤더/리스트 재렌더 (SC4 / CAL-07 / TODO-08)"
    expected: "임의 셀을 클릭하면 #date-header 텍스트가 'YYYY년 M월 D일 요일'(ko-KR full)로 갱신되고, #todo-list 가 그 날짜의 todo로 다시 렌더된다(빈 날짜는 '아직 할 일이 없습니다.')."
    why_human: "delegated click → selectedKey 갱신 → render() 팬아웃이 코드로 보장됨. 다만 'CAL-07 Pending' 상태가 REQUIREMENTS.md에 명시되어 있어 사람이 클릭 동선으로 한 번 확인 후 체크해야 함."
  - test: "선택 날짜 CRUD 영속/UTC 드리프트 부재 (SC5)"
    expected: "임의 날짜(예: 2026-05-31, 23:55 로컬에 추가)에 todo를 추가/토글/수정/삭제 → 새로고침 후 같은 날짜 셀 배지·리스트에 그대로 복원. localStorage(hansung-todo:v1)의 키와 셀 data-key가 일치하고, UTC로 +1/-1 일 드리프트가 발생하지 않음."
    why_human: "코드상 모든 날짜 변환이 dateKey()(local-time)만 사용하고 toISOString/getUTC* 가 코드베이스에 0회 등장하나, 실제 영속·복원 사이클은 브라우저 새로고침으로만 검증됨."
---

# Phase 3: Calendar Integration 검증 리포트

**Phase Goal:** A user can navigate a month-grid calendar and pick any date to view and manage that date's todos.
**Verified:** 2026-05-03
**Status:** human_needed (정적 코드 검증 전부 통과 — 5개 SC는 브라우저 UAT 사인오프 필요)
**Re-verification:** No — 최초 검증

## Goal Achievement

### Observable Truths (ROADMAP 5 SC)

| #   | Truth (Success Criterion)                                                                 | Status                  | Evidence                                                                                                                                                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 7×N 월 그리드 + prev/next/today가 월·연 경계 이동 (윤년 포함)                               | ✓ STATIC PASS / UAT 요  | `js/calendar.js:16-32` `monthGrid`이 `firstWeekday + i` 루프로 정확히 42셀을 생성. node 스모크: Jan 2026(첫 셀 2025-12-28), Feb 2024-02-29 inMonth=true, `prevMonth({2026,0})={2025,11}`, `nextMonth({2026,11})={2027,0}` 모두 통과. `app.js:91-100` 가 `prev`/`next`/`today` 액션 분기 보유.                  |
| 2   | 오늘/선택 셀이 서로/일반 셀과 시각 구분                                                     | ✓ STATIC PASS / UAT 요  | `calendar.js:115-116` 가 `is-today`/`is-selected` 클래스 분기. `styles.css:55-68` 에 단독 today(border 2px), 단독 selected(파란 배경), 합성(배경+짙은 테두리) 3 규칙 존재 — 색맹 안전(테두리 vs 채움 구분).                                                                                                  |
| 3   | 셀당 todo 개수 배지(0개면 미표시) + 추가/삭제 즉시 반영                                     | ✓ STATIC PASS / UAT 요  | `calendar.js:123-129` `count = todosByDate[key]?.length ?? 0; if (count > 0)` 일 때만 `.cal-badge` append. `renderCalendar`가 캐시 없이 매 호출마다 `todosByDate`를 직접 읽음 → `commit()` 후 `render()` 팬아웃이 배지 즉시 갱신 보장.                                                                          |
| 4   | 셀 클릭 → 선택 + 헤더 갱신 + todo 리스트 재렌더                                              | ✓ STATIC PASS / UAT 요  | `app.js:103-108` delegated `closest('[data-key]')` 가 `selectedKey = cell.dataset.key; render()`. `app.js:77-82` `render()` 가 `renderCalendar` → `dateHeader.textContent = formatHeader(selectedKey)` → `renderTodoList` 순서로 팬아웃. `formatHeader` 는 ko-KR full 포맷.                                  |
| 5   | 선택 날짜 CRUD 영속 + UTC 드리프트 부재                                                     | ✓ STATIC PASS / UAT 요  | 코드베이스 전체에 `toISOString`/`getUTCDate`/`getUTCMonth`/`getUTCFullYear` 0회(grep 빈 결과). `dateKey.js` 가 `getFullYear/Month/Date` 만 사용. `monthGrid` 의 `Date` 생성도 `new Date(y, m0, 1 - firstWeekday + i)` (로컬). `addTodo/toggleTodo/editTodo/removeTodo` 가 `selectedKey` 만 키로 사용 → 드리프트 불가. |

**Score (정적):** 5/5 통과. UAT 사인오프 후 5/5 종합 PASS 가능.

### Required Artifacts (Plan 01·02·03 must_haves)

| Artifact          | Expected                                                            | Status       | Details                                                                                                          |
| ----------------- | ------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `js/calendar.js`  | monthGrid/prevMonth/nextMonth/todayYM/renderCalendar/formatHeader   | ✓ VERIFIED   | 6개 named export 모두 존재(라인 16/34/38/42/58/142). 146 라인, ≥80 만족. `import { dateKey } from './dateKey.js'` 존재. |
| `js/app.js`       | selectedKey + viewYM 모듈 상태 + calendar import + render 팬아웃        | ✓ VERIFIED   | `let viewYM = todayYM()` (24), `let selectedKey = dateKey()` (25), `from './calendar.js'` import (20-22), render 팬아웃(77-82). TODAY 상수 흔적 없음. |
| `index.html`      | 단일 `<main id="app">` 마운트, defer/모듈 스크립트                     | ✓ VERIFIED   | `<main id="app">` + `<script type="module" src="./js/app.js">` (10-11). Phase 3 코멘트 갱신됨.                   |
| `css/styles.css`  | Phase 3 블록(.cal-* + state classes) + 기존 Phase 1/2 규칙 보존       | ✓ VERIFIED   | `.cal-nav/.cal-title/.cal-weekdays/.cal-grid/.cal-cell/.cal-cell-adjacent/.cal-cell.is-today/.cal-cell.is-selected/.cal-cell.is-today.is-selected/.cal-badge/#date-header` 11 셀렉터 존재(19-80). `.todo-list .done`, `.empty`, `.editing` Phase 1/2 규칙 그대로(7-16). gradient/box-shadow/transition 0회. |

### Key Link Verification

| From                                  | To                       | Via                              | Status   | Details                                                                              |
| ------------------------------------- | ------------------------ | -------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `js/calendar.js`                      | `js/dateKey.js`          | `import { dateKey }`             | ✓ WIRED  | line 4. `monthGrid` 내부 셀 키 생성에 사용(25, 28).                                  |
| `js/app.js`                           | `js/calendar.js`         | ESM import                       | ✓ WIRED  | line 19-21: `todayYM, prevMonth, nextMonth, renderCalendar, formatHeader` 모두 호출. |
| `app.js calendarSection` click handler | `viewYM`/`selectedKey` 상태 | `closest('[data-action]')`/`closest('[data-key]')` | ✓ WIRED  | line 90, 103. nav 분기 `prev`/`next`/`today` 모두 처리, 셀 클릭 → `selectedKey` 갱신.    |
| `render()`                            | 3 서브뷰                  | renderCalendar → dateHeader → renderTodoList | ✓ WIRED  | line 78-81. 매 commit/select/nav마다 호출.                                          |
| `commit()`                            | `save()` 영속             | `storage.js`                     | ✓ WIRED  | line 71-73. 실패 시 console.warn (Phase 4가 가시화 담당).                            |
| `css/styles.css .cal-grid`            | `renderCalendar` 의 `.cal-grid` 컨테이너 | class selector            | ✓ WIRED  | `calendar.js:83` `grid.className = 'cal-grid'` ↔ `styles.css:30` 규칙 매칭.         |

### Data-Flow Trace (Level 4)

| Artifact                | Data Variable        | Source                                              | Produces Real Data | Status      |
| ----------------------- | -------------------- | --------------------------------------------------- | ------------------ | ----------- |
| `renderCalendar` 셀 배지 | `todosByDate[key]`   | `state = load()` ← `localStorage[hansung-todo:v1]` (storage.js) | ✓ Yes              | ✓ FLOWING  |
| `#date-header` 텍스트     | `selectedKey`        | `app.js` 모듈 변수 ← `dateKey()` 또는 셀 클릭 dataset | ✓ Yes              | ✓ FLOWING  |
| `#todo-list`             | `getTodosForDate(state, selectedKey)` | 동일 store, 동일 key                | ✓ Yes              | ✓ FLOWING  |
| `.cal-cell.is-today`     | `cell.isToday`       | `dateKey(d) === todayKey` 매 렌더 평가              | ✓ Yes              | ✓ FLOWING  |

데이터는 단일 `state` 객체에서 출발해 calendar/header/list 3 서브뷰로 분기되고, 모든 키가 같은 `selectedKey` 또는 `cell.key` (dateKey 산출물)를 공유 → SC5의 "no UTC drift" 구조적으로 보장.

### Behavioral Spot-Checks

| Behavior                            | Command                                                | Result                                                              | Status   |
| ----------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | -------- |
| `monthGrid` 42 cells / Sunday-start | `node ... monthGrid(2026,0,...)` 첫 셀 검사             | `2025-12-28` (Sun) 첫 셀, day 31 → `2026-01-31`                       | ✓ PASS   |
| 윤년 2024-02-29 inMonth             | `node ... monthGrid(2024,1,...)` 에서 day=29 inMonth   | `key=2024-02-29 inMonth=true`                                       | ✓ PASS   |
| 연 경계 wrap                         | `prevMonth({2026,0})`, `nextMonth({2026,11})`          | `{2025,11}`, `{2027,0}`                                             | ✓ PASS   |
| today flag                          | `monthGrid(2026,4, new Date(2026,4,3))` isToday 셀 키   | `2026-05-03`                                                        | ✓ PASS   |
| 금지 API 부재(UTC, innerHTML)        | `grep -nE 'toISOString\|getUTC\w+\|innerHTML' js/ index.html` | 빈 결과                                                       | ✓ PASS   |

### Requirements Coverage

| Req     | Source Plan        | Description                                                | Status                     | Evidence                                                                                                      |
| ------- | ------------------ | ---------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| CAL-01  | 03-01, 03-03       | 월 그리드 + 요일 헤더 + 7×N                                  | ✓ SATISFIED (UAT 요)        | `monthGrid` 42 셀 + `.cal-weekdays` (일~토) + `.cal-grid` 7 cols.                                              |
| CAL-02  | 03-01, 03-02       | 이전/다음 달 이동                                            | ✓ SATISFIED (UAT 요)        | `prevMonth/nextMonth` 헬퍼 + `app.js:93-94` 액션 핸들러 + `data-action="prev|next"` 버튼.                       |
| CAL-03  | 03-01, 03-02       | "오늘" 버튼으로 이번 달·오늘 즉시 이동                       | ✓ SATISFIED (UAT 요)        | `app.js:95-98` `viewYM = todayYM(); selectedKey = dateKey()`.                                                 |
| CAL-04  | 03-01, 03-03       | 오늘 날짜 시각 강조                                          | ✓ SATISFIED (UAT 요)        | `cell.isToday` 플래그 + `is-today` 클래스 + `styles.css:55-58` 규칙.                                            |
| CAL-05  | 03-02, 03-03       | 선택 날짜 강조(오늘과 구분)                                  | ✓ SATISFIED (UAT 요)        | `is-selected` 클래스 + `styles.css:60-68` 단독·합성 규칙. 색맹 안전(채움 vs 테두리).                            |
| CAL-06  | 03-01, 03-03       | 셀당 todo 개수 (0개 미표시)                                  | ✓ SATISFIED (UAT 요)        | `calendar.js:123-129` count>0 분기. `.cal-badge` 스타일.                                                       |
| CAL-07  | 03-02              | 셀 클릭 → 선택 + 해당 날짜 todo 노출                        | ✓ SATISFIED (UAT 요 — REQUIREMENTS.md 에 'Pending'으로 표기) | `app.js:103-108` delegated handler + `render()` 팬아웃. 정적 와이어 완전 — UAT 시 체크.                            |
| TODO-08 | 03-01, 03-02       | 사람 친화적 헤더("YYYY년 M월 D일 요일")                      | ✓ SATISFIED (UAT 요)        | `formatHeader` ko-KR `dateStyle:'full'` + `app.js:79` `dateHeader.textContent = formatHeader(selectedKey)`. |

**Orphans:** 없음. ROADMAP/REQUIREMENTS.md의 Phase 3 요구(CAL-01~07, TODO-08) 8개 모두 03-01/02/03 plans의 `requirements:` 헤더에 등장.

### Anti-Patterns Found

| File             | Line | Pattern                                                       | Severity | Impact                                                                                          |
| ---------------- | ---- | ------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| `js/app.js`      | 6-10 | `window.dateKey/load/save/STORAGE_KEY/defaultState` dev 노출 | ℹ️ Info  | Phase 1 의도된 콘솔 검증 훅. ROADMAP에서 Phase 2 도입 시 재검토 메모됨. Phase 3 와는 무관.                   |
| `js/app.js`      | 73   | `console.warn('[hansung-todo] save failed; mutation kept in memory')` | ℹ️ Info  | Phase 4 (PERS-04) 에서 가시 UX로 대체될 자리. 현 단계에선 silent crash 없음을 보장하므로 OK.                |

차단/경고급 안티패턴 없음. TODO/FIXME/Placeholder/빈 핸들러/하드코딩 빈 prop/`return null` 스텁 모두 0회.

### Human Verification Required

ROADMAP의 5 Success Criteria가 본질적으로 시각·상호작용 검증을 요구하므로 위 frontmatter `human_verification:` 5건이 모두 사람 사인오프 대상입니다. 사용자(또는 강의 시연자)가 브라우저에서 다음을 확인:

1. **그리드/내비게이션** — 월 표시, 7×N 배치, 이전/다음/오늘 버튼이 1월·12월·윤년에서 정확히 동작.
2. **오늘/선택 시각 구분** — 두 상태가 서로 다른 신호(테두리 vs 채움)로 즉시 식별, 합성 시 둘 다 표시.
3. **배지 즉시 갱신** — todo 추가/삭제 후 셀 카운트가 다음 인터랙션 없이 갱신.
4. **셀 클릭 흐름** — 임의 셀 클릭 시 헤더(ko-KR full) + todo 리스트가 그 날짜로 갱신.
5. **영속 + UTC 드리프트 부재** — 23:55 로컬에 다른 날짜에 todo 추가 → 새로고침 → 같은 날짜에 그대로.

REQUIREMENTS.md 의 CAL-07 'Pending' 표시도 UAT 통과 후 체크로 갱신해야 합니다.

### Gaps Summary

코드 차원의 갭 **없음**. 정적 검증(파일 존재·실체·와이어·데이터 흐름·금지 API 부재·플랜별 must_haves) 모두 통과. 5개 ROADMAP Success Criteria 의 최종 PASS 는 브라우저 UAT 1회로 확정 가능. 따라서 상태는 `human_needed` (gaps_found 아님).

---

_Verified: 2026-05-03_
_Verifier: Claude (gsd-verifier)_
