---
phase: 03-calendar-integration
date: 2026-05-03
mode: discuss (single-pass batched)
---

# Phase 3 Discussion Log

## Gray Areas Presented

| # | Area | Options | User selection |
|---|------|---------|----------------|
| A | 레이아웃 배치 | A1 stacked / A2 split | **A1 stacked** |
| B | 모듈 구조 | B1 신규 `js/calendar.js` / B2 app.js 통합 | **B1 신규 파일** |
| C | today vs selected 시각 구분 | C1 테두리+filled / C2 색만 | **C1 테두리+filled** |
| D | selectedDate reload | D1 메모리 only / D2 localStorage 영속 | **D1 메모리 only** |
| E | 주 시작일 + 인접 셀 | E1 일요일+회색 인접 / E2 월요일 / E3 비표시 | **E1 일요일+회색 인접** |

**User response:** `all recommended` — 모든 권장안 채택.

## Carried Forward (Re-asked? → No)

- 로컬 시간 dateKey, storage 경계, textContent-only, 단일 파일+전체 재렌더, 위임 이벤트, 미니멀 시각 — Phase 1/2에서 잠금.

## Deferred Ideas

- selectedDate localStorage 영속 (D2 옵션) — Phase 4 폴리시 또는 v2.
- 드래그 to reschedule, week/agenda view, i18n, 키보드 nav — v2.

## Notes

- 6주 고정 그리드(42셀)로 결정 — 월별 레이아웃 점프 방지 + CSS Grid 단순.
- count badge는 "0개일 땐 노드 자체 미생성" — `:empty` 의존 회피.
- `js/todos.js`의 `getTodosForDate(state, dateKey)` 시그니처가 이미 임의 날짜를 지원 → Phase 3에서 호출 시 `selectedKey`만 변경하면 끝.
