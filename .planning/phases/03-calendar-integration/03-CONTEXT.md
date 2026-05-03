---
phase: 03-calendar-integration
created: 2026-05-03
status: locked
mode: discuss
requirements: [CAL-01, CAL-02, CAL-03, CAL-04, CAL-05, CAL-06, CAL-07, TODO-08]
---

<domain>
월(月) 그리드 캘린더 + 날짜 선택 + 셀별 todo count badge + 선택된 날짜의 todo 목록 연동.

Phase 2까지 "오늘"에만 묶여 있던 todo CRUD를 임의의 날짜로 확장한다. 데이터 스키마(`todosByDate[dateKey]`)는 Phase 1에서 이미 미래의 날짜 다중성을 가정해 잠겨 있으므로 storage 변경 없음. 이 phase는 **뷰/네비게이션 + 선택 상태**가 책임이다.
</domain>

<canonical_refs>
- `.planning/PROJECT.md` — 프로젝트 핵심 가치 + 제약 (no build, vanilla, localStorage)
- `.planning/REQUIREMENTS.md` — CAL-01..07, TODO-08 명세
- `.planning/ROADMAP.md` — Phase 3 success criteria 5종 (월 boundary 포함)
- `.planning/phases/01-foundation/01-CONTEXT.md` — dateKey 로컬 시간 / storage 경계 lock
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — `js/dateKey.js`, `js/storage.js` 인터페이스
- `.planning/phases/02-todo-crud/02-CONTEXT.md` — 위임 이벤트 / 단일 파일 + 전체 재렌더 / 미니멀 done 스타일
- `.planning/phases/02-todo-crud/02-02-SUMMARY.md` — `js/app.js` 부트 인터페이스 (`commit/render/editingId` 잠금)
- `.planning/phases/02-todo-crud/02-03-SUMMARY.md` — 위임 이벤트 4종 + 인라인 편집 라이프사이클
</canonical_refs>

<carried_forward>
이전 phase에서 잠긴 결정 — Phase 3에서 그대로 적용:

| 결정 | Locked in | 적용 방식 (Phase 3) |
|---|---|---|
| 로컬 시간 `dateKey()` 만 사용, `toISOString`/`Date.UTC` 금지 | Phase 1 | 캘린더 셀 ↔ key ↔ 저장된 date 모두 dateKey로 일치 (UTC drift 0) |
| Storage 경계: `js/storage.js` 외부에서 raw `localStorage.*` 금지 | Phase 1 | 셀 badge count도 `load().todosByDate[key]?.length` 경유 |
| `textContent`-only 렌더 (XSS) | Phase 2 | 날짜 셀 라벨, 헤더 텍스트, badge 숫자 모두 textContent |
| 단일 파일 모듈 + 전체 재렌더 | Phase 2 | `js/calendar.js`도 `renderCalendar()` 1회로 6×7 셀 전체 재렌더 |
| 위임 이벤트 1회 등록 | Phase 2 | 캘린더 컨테이너에 click 위임 1개 (셀 선택 + nav 버튼) |
| 미니멀 시각 — 본격 폴리시는 Phase 4 | Phase 2 | 강조/배지 모두 굵기·색만; 그라디언트/그림자 금지 |
</carried_forward>

<decisions>

### A. 레이아웃 배치 — 세로 stacked
- 캘린더 위, 헤더(`YYYY년 M월 D일 요일`) 아래, todo list 가장 아래.
- 모바일/데스크톱 모두 동일 마크업, 미디어쿼리 분기 0건.
- 마운트 노드: `<main id="app">` 내부에 `<section id="calendar">` + 기존 헤더 자리 + `<section id="todos">` 순서.

### B. 모듈 구조 — `js/calendar.js` 신규
- 순수 헬퍼: `monthGrid(year, monthIndex0)` → 6주 × 7일 = 42 셀 배열 (각 셀: `{ date: Date, key: string, inMonth: boolean, isToday: boolean }`).
- nav 헬퍼: `prevMonth(viewYM)`, `nextMonth(viewYM)`, `todayYM()` — 모두 순수 함수, year/month wrap 처리.
- view 진입: `renderCalendar(container, viewYM, selectedKey, todosByDate)` — 컨테이너 내부 전체 재렌더.
- `js/app.js`는 캘린더와 todo list를 모두 마운트/와이어링; `js/todos.js` 그대로 재사용 (오늘이 아닌 임의 날짜 keyed CRUD가 이미 가능).

### C. today vs selected 시각 구분
- **Today**: 굵은 테두리 (e.g., `border: 2px solid currentColor` 또는 accent) + accent 색 텍스트.
- **Selected**: 채워진 배경 (filled, dark text on accent bg).
- **둘 다인 날**: filled 배경 + 굵은 테두리 동시 적용 (CSS class 2개 조합 — 충돌 없음).
- 색만으로 구분하지 않음 (색맹 접근성).

### D. selectedDate reload 동작 — 메모리 only, 새로고침 시 오늘로 reset
- `selectedKey` 모듈 변수로만 보유; localStorage 저장 안 함.
- reload 시 `selectedKey = dateKey(new Date())`로 초기화 → "오늘" 자동 선택.
- 이유: schema 확장 회피, v1 단순화. 마지막 선택 복원이 필요해지면 Phase 4 이후로 deferred.

### E. 주 시작일 + 인접 요일 셀
- **주 시작일**: 일요일 (한국 일반 캘린더 관습).
- **요일 헤더**: 일/월/화/수/목/금/토 (한국어 단문). `Intl.DateTimeFormat('ko-KR', { weekday: 'short' })` 사용 가능하나 단순 배열 리터럴이 더 짧고 명확.
- **인접 셀**: 이전/다음 달 날짜 회색으로 표시(클릭 비활성, badge 미표시) — 6주 고정 그리드로 월별 레이아웃 점프 방지.
- 6주 고정: 모든 달이 6×7 = 42 셀 → CSS Grid `grid-template-rows: repeat(6, 1fr)` 안정.

### F. 월 nav UI (보조 결정)
- 한국어 텍스트 + 화살표: `< 이전`, `오늘`, `다음 >` 3버튼 한 줄.
- "오늘" 버튼은 `viewYM = todayYM()` + `selectedKey = today`로 한 번에 점프.

### G. count badge 스타일
- 셀 우상단 작은 원 또는 숫자만 (회색 또는 accent text).
- 0개일 땐 노드 자체 미생성 (CSS `:empty` 의존 금지).
- todo가 추가/삭제될 때마다 캘린더 전체 재렌더로 자동 갱신 (`render()` 단일 진입점에서 캘린더 + todo list 둘 다 재렌더).

### H. 데이터 흐름 (와이어링 잠금)
- 단일 `render()`가 (1) 캘린더 + (2) 헤더 + (3) todo list 모두 다시 그림.
- `commit(nextState)` (Phase 2 잠금) 흐름은 그대로 유지: 모든 mutation → save → render.
- 셀 클릭 → `selectedKey = key` → `render()` (storage write 없음, 메모리만).
- nav 버튼 클릭 → `viewYM = ...` → `render()` (selectedKey 유지; 보이는 달이 바뀔 뿐).

</decisions>

<deferred>
- **selectedDate 영속성** — reload 후 마지막 선택 날짜 복원. Phase 4 폴리시 또는 v2 후보.
- **드래그 to reschedule** (날짜 간 todo 이동) — v2.
- **week/agenda view** — v2 (현재 month view만).
- **i18n 다국어** — 한국어 하드코딩만; 영어 등은 v2.
- **키보드 nav** (←→↑↓ 캘린더 이동) — Phase 4 또는 v2.
- **Phase 3에서 `app.js`의 `window.*` dev 노출 정리** (STATE.md open todo) — Phase 3 wiring 정리 시 같이 검토.
- **`<main>` 마운트 구조 재배치** (캘린더 도입) — 본 phase에서 처리됨 (decision A).
</deferred>

<code_context>
- `js/dateKey.js` — 로컬 시간 YYYY-MM-DD 변환 (그대로 재사용)
- `js/storage.js` — `KEY`, `defaultState`, `load`, `save` (그대로 재사용; schema 변경 없음)
- `js/todos.js` — 5 헬퍼 (`getTodosForDate(state, dateKey)` 시그니처가 이미 임의 날짜 지원 — Phase 3에서 selectedKey만 갈아끼우면 됨)
- `js/app.js` — Phase 2 wiring (commit/render/editingId 모듈 변수). Phase 3에서 calendar 마운트 + nav 와이어링 추가, render()는 캘린더+todo list 둘 다 재렌더하도록 확장.
- `index.html` — `<main id="app">` 마운트 노드 존재. Phase 3에서 내부 구조만 재배치 (calendar/header/todos 3 섹션).
- `css/styles.css` — Phase 1 골격 + Phase 2 미니멀 3룰. Phase 3에서 calendar grid + 셀 상태 룰 추가, 본격 폴리시는 Phase 4.
</code_context>

<scope_guardrail>
**이 phase는 다음을 하지 않는다:**
- 본격 시각 폴리시 (그림자, 그라디언트, 트랜지션) — Phase 4 STYL-01.
- 저장 실패 UX (toast 등) — Phase 4 PERS-04.
- 데이터 schema 변경 — Phase 1에서 잠김.
- selectedDate 영속화 — deferred.
- 키보드 navigation, drag, week view — deferred.
</scope_guardrail>
