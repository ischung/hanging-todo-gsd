# Hansung Todo (GSD Demo)

## What This Is

날짜별 todo를 관리하는 정적 웹앱. 캘린더 월 그리드에서 날짜를 클릭하면 그 날의 todo 목록을 확인하고, 추가/완료 토글/인라인 편집/삭제할 수 있다. 빌드 도구·프레임워크 없이 `index.html` + 바닐라 JS 모듈로 동작하며, 데이터는 브라우저 `localStorage` 단일 키(`hansung-todo:v1`)에 영구 저장된다. 저장 실패(quota / Private Mode)는 가시 배너로 우아하게 노출된다.

## Core Value

사용자가 캘린더에서 날짜를 골라 그 날의 todo를 손쉽게 관리할 수 있고, 새로고침 후에도 데이터가 유지된다.

→ v1.0 출시 후에도 검증된 핵심 가치. 저장 실패 시 silent fake-save가 아니라 가시 배너로 알린다는 신뢰성 보강이 추가되었다.

## Requirements

### Validated (v1.0 — 2026-05-13)

- ✓ 월 그리드 캘린더에서 날짜를 클릭해 선택 (CAL-01..07) — v1.0
- ✓ 선택된 날짜의 todo 목록 표시 + 사람 친화적 헤더 (TODO-08, CAL-07) — v1.0
- ✓ todo 추가 (Enter / 추가 버튼, IME-safe) (TODO-01) — v1.0
- ✓ 완료 토글, 인라인 텍스트 편집, 삭제 (TODO-03..05) — v1.0
- ✓ `{ id, text, done, createdAt }` 구조 + `createdAt` 오름차순 안정 정렬 (TODO-02, TODO-06) — v1.0
- ✓ empty-state 메시지 (TODO-07) — v1.0
- ✓ localStorage 영속 (PERS-01..03, PERS-05) — v1.0
- ✓ 저장 실패 시 가시 배너(retry/dismiss), 크래시 없음 (PERS-04) — v1.0
- ✓ 빌드 없이 `index.html` 동작 + GitHub Pages 호환 (DEL-01..03) — v1.0
- ✓ Modern/Polished 비주얼(디자인 토큰 + transition + subtle elevation) (STYL-01) — v1.0
- ✓ `textContent`-only 렌더링 XSS 방어 (STYL-02) — v1.0
- ✓ 셀당 todo 개수 배지, 즉시 갱신 (CAL-06) — v1.0

### Active (next milestone candidates)

- [ ] JSON 내보내기/가져오기 (수동 백업) — POL-01
- [ ] 완료 항목 숨기기 토글 — POL-02
- [ ] 캘린더 키보드 네비게이션 (방향키 + Enter, roving tabindex) — POL-03
- [ ] ARIA grid 역할 + 라벨 — POL-04
- [ ] `prefers-color-scheme` 다크 모드, `prefers-reduced-motion` 존중 — POL-05
- [ ] "저장됨 ✓" 인디케이터 — POL-06
- [ ] (tech debt) Phase 1·2 VERIFICATION.md retroactive 작성
- [ ] (tech debt) 편집 중 다른 날짜 선택 시 `editingId` flush — 편집 텍스트 유실 race 해소
- [ ] (tech debt) dev 전용 `window.*` 글로벌 정리

### Out of Scope

- 서버/계정/동기화 — 정적 웹앱 범위 밖, localStorage로 충분
- 빌드 도구(Vite/Webpack 등) — "빌드 없이 동작" 하드 제약 (재확인)
- 프레임워크(React/Vue 등) — 바닐라 JS로 충분, 강의 가독성 우선 (재확인)
- 알림/리마인더 — v1 범위 밖
- 주(週)/일(日) 뷰 — 월 그리드 단일 뷰
- 반복 일정, 라벨/카테고리, 첨부파일 — v1 범위 밖
- 드래그-드롭 일정 이동 — 복잡도 vs 가치 비대칭
- 실시간 멀티탭 동기화 — single-tab 가정

## Context

**Shipped v1.0 (2026-05-13):** 4 phases · 11 plans · 674 LOC (js+css) · 80 commits · 25/25 requirements WIRED · audit `tech_debt` (0 blockers).

- 한성대 소프트웨어공학 수업의 GSD(Get-Shit-Done) 워크플로우 데모/실습용 프로젝트
- 정적 호스팅(`python3 -m http.server` 또는 GitHub Pages)에서 즉시 동작
- 학생/교수 모두 이해할 수 있도록 단순한 구조(HTML/CSS/JS 파일 분리) 유지
- **Tech stack:** Vanilla HTML/CSS/JS (ES2023+ 네이티브 모듈), `localStorage`, 빌드 0
- **모듈 구조:** `js/{app, storage, calendar, todos, dateKey}.js` + `css/styles.css` + `index.html`
- **Known issues:** VERIFICATION.md 2건 누락 (Phase 1, 2), 편집 중 캘린더 클릭 시 editingId race, dev 전용 `window.*` 잔존 — 모두 정보성 tech debt, v1.1에서 우선순위 결정

## Constraints

- **Tech stack**: 바닐라 HTML/CSS/JS only — 빌드 도구·프레임워크 금지
- **Persistence**: 브라우저 localStorage — 외부 DB/서버 없음
- **Distribution**: `index.html` 단일 진입점, 정적 파일로 동작 (`python3 -m http.server` 또는 GitHub Pages)
- **Safety invariants (v1.0 확립):**
  - 로컬 시간 `dateKey()` 사용 — `toISOString` 전체 금지 (UTC 드리프트 방지)
  - 단일 storage 어댑터 — `js/storage.js` 외 raw `localStorage.*` 호출 금지
  - `textContent`-only 렌더링 — `innerHTML` 금지 (XSS 방어)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 빌드 없는 바닐라 JS | 강의 데모 단순성 + 정적 호스팅 즉시 실행 | ✓ Good — 11 plans, 674 LOC, 빌드 0건 유지 |
| localStorage 영속화 (단일 키, JSON blob) | 서버 없이 새로고침 데이터 유지 + 원자 쓰기 | ✓ Good — PERS-01..03 충족, save() throw로 PERS-04 완성 |
| 월 그리드 캘린더 단일 뷰 | v1 범위 최소화, 가장 익숙한 UI | ✓ Good — 42셀 고정 그리드로 분기 0 달성 |
| Modern/Polished 스타일 | 데모 가시성 향상 | ✓ Good — `:root` 디자인 토큰 + transition, Phase 4 VERIFICATION 14/14 |
| 4-phase coarse roadmap (research 5 → 4) | P1+P2 → Foundation 병합으로 coarse granularity | ✓ Good — 의존 사슬 명확, 각 phase 검증 가능 |
| 로컬 시간 `dateKey()`, `toISOString` 금지 | UTC 드리프트 방지 (Pitfall 1) | ✓ Good — milestone 내 `toISOString` 0회, 임의 날짜 CRUD UTC 드리프트 0 |
| `textContent`-only 렌더링 | XSS 방어 (Pitfall 2) | ✓ Good — `innerHTML` 0회, Phase 2 UAT 14/14 |
| 단일 storage 어댑터 boundary | raw localStorage 호출 추적 단순화 | ✓ Good — `js/storage.js` 외 raw 호출 0건 유지 |
| 인라인 편집 (Enter/Esc/blur), 모달 없음 | 마크업 최소화 | ✓ Good — IME-safe, focusout re-entry guard 작동 |
| 즉시 삭제 (확인·undo 없음) | 재추가 비용 낮음 | ⚠ Revisit — v1.1에서 undo / 완료 숨기기로 보강 가능 (POL-02) |
| `save()` boolean → throw 전환 | 실패 신호 단일화 (PERS-04) | ✓ Good — `commit()` try/catch always-apply-to-memory로 UI 일관성 유지 |
| 이중 신호 (border-weight + color) 강조 | 색맹 안전 (color-only 회피) | ✓ Good — Phase 3 UAT 통과 |
| 인접달 셀 `<div>` (data-key 부재) | `closest('[data-key]')` 가드만으로 비활성, 브라우저별 disabled focus 차이 회피 | ✓ Good |
| selectedKey/viewYM은 module-let, reload 시 today reset | schema 확장 회피, v1 단순화 | ✓ Good — 사용자 혼란 없음 (UAT) |
| Phase 1·2 VERIFICATION.md 미작성 | implicit 검증(Phase 2/3/4 의존) + UAT 사인오프로 충분 판단 | ⚠ Revisit — retroactive 작성 v1.1 첫 작업 후보 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-13 after v1.0 milestone*
