# Hansung Todo (GSD Demo)

## What This Is

날짜별 todo를 관리하는 정적 웹앱. 캘린더에서 날짜를 클릭하면 그 날짜의 todo 목록을 확인하고, 추가/완료 토글/수정/삭제할 수 있다. 빌드 도구 없이 `index.html` + 바닐라 JS 파일들로 동작하며, 데이터는 브라우저 `localStorage`에 영구 저장된다.

## Core Value

사용자가 캘린더에서 날짜를 골라 그 날의 todo를 손쉽게 관리할 수 있고, 새로고침 후에도 데이터가 유지된다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 월(月) 그리드 캘린더에서 날짜를 클릭해 선택할 수 있다
- [ ] 선택된 날짜의 todo 목록이 표시된다
- [ ] 선택된 날짜에 새 todo를 추가할 수 있다 (텍스트)
- [ ] todo의 완료 여부를 체크박스로 토글할 수 있다
- [ ] todo 텍스트를 수정할 수 있다
- [ ] todo를 삭제할 수 있다
- [ ] 각 todo는 텍스트, 완료 여부, 생성 시각(createdAt)을 보유한다
- [ ] 새로고침 후에도 모든 todo 데이터가 유지된다 (localStorage)
- [ ] 빌드 도구 없이 `index.html`을 브라우저로 열어 동작한다
- [ ] Modern/Polished 비주얼 스타일 (다듬어진 컴포넌트, 부드러운 그림자/전환)
- [ ] 캘린더 셀에 해당 날짜의 todo 개수/표시가 노출된다

### Out of Scope

- 서버/계정/동기화 — 정적 웹앱 범위 밖, localStorage로 충분
- 빌드 도구(Vite/Webpack 등) — "빌드 없이 동작" 제약
- 프레임워크(React/Vue 등) — 바닐라 JS로 충분, 빌드 없는 정적 자산 원칙
- 알림/리마인더 — v1 범위 밖
- 주(週)/일(日) 뷰 — 월 그리드 단일 뷰로 시작
- 반복 일정, 라벨/카테고리, 첨부파일 — v1 범위 밖

## Context

- 한성대 소프트웨어공학 수업의 GSD(Get-Shit-Done) 워크플로우 데모/실습용 프로젝트
- 정적 호스팅(파일 더블클릭 또는 GitHub Pages 수준)에서 즉시 동작해야 함
- 학생/교수 모두 이해할 수 있도록 단순한 구조 유지 (HTML/CSS/JS 파일 분리)

## Constraints

- **Tech stack**: 바닐라 HTML/CSS/JS only — 빌드 도구·프레임워크 금지
- **Persistence**: 브라우저 localStorage — 외부 DB/서버 없음
- **Distribution**: `index.html` 단일 진입점, 정적 파일로 동작

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 빌드 없는 바닐라 JS | 강의 데모 단순성 + 정적 호스팅 즉시 실행 | — Pending |
| localStorage 영속화 | 서버 없이 새로고침 데이터 유지 요구 충족 | — Pending |
| 월 그리드 캘린더 단일 뷰 | v1 범위 최소화, 가장 익숙한 UI | — Pending |
| Modern/Polished 스타일 | 데모 가시성 향상 | — Pending |

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
*Last updated: 2026-05-03 after initialization*
