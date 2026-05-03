# Requirements: Hansung Todo (GSD Demo)

**Defined:** 2026-05-03
**Core Value:** 사용자가 캘린더에서 날짜를 골라 그 날의 todo를 손쉽게 관리할 수 있고, 새로고침 후에도 데이터가 유지된다.

## v1 Requirements

### Calendar

- [ ] **CAL-01**: 사용자는 월(月) 그리드 형태의 캘린더를 볼 수 있다 (요일 헤더 + 7×N 날짜 셀)
- [ ] **CAL-02**: 사용자는 이전/다음 달로 이동할 수 있다
- [ ] **CAL-03**: 사용자는 "오늘" 버튼으로 이번 달·오늘 날짜로 즉시 이동할 수 있다
- [ ] **CAL-04**: 오늘 날짜는 시각적으로 강조된다
- [ ] **CAL-05**: 선택된 날짜는 시각적으로 강조된다 (오늘 강조와 구분)
- [ ] **CAL-06**: 각 날짜 셀은 해당 날짜의 todo 개수를 표시한다 (0개면 미표시)
- [ ] **CAL-07**: 사용자가 날짜 셀을 클릭하면 그 날짜가 선택되고 해당 날짜의 todo 목록이 노출된다

### Todo

- [ ] **TODO-01**: 사용자는 선택된 날짜에 새 todo를 텍스트로 추가할 수 있다 (Enter 또는 추가 버튼)
- [ ] **TODO-02**: 각 todo는 `{ id, text, done, createdAt }` 구조를 보유한다 (`id`는 고유, `createdAt`은 타임스탬프)
- [ ] **TODO-03**: 사용자는 체크박스로 todo의 완료 여부를 토글할 수 있다 (완료 시 시각적 구분)
- [ ] **TODO-04**: 사용자는 기존 todo의 텍스트를 수정할 수 있다
- [ ] **TODO-05**: 사용자는 todo를 삭제할 수 있다
- [ ] **TODO-06**: todo 목록은 `createdAt` 오름차순으로 안정적으로 정렬된다
- [ ] **TODO-07**: todo가 없는 날짜는 빈 상태(empty state) 메시지를 표시한다
- [ ] **TODO-08**: 선택된 날짜의 사람 친화적 헤더가 표시된다 (예: "2026년 5월 3일 일요일")

### Persistence

- [ ] **PERS-01**: 모든 todo 데이터는 `localStorage` 단일 키(`hansung-todo:v1`)에 JSON으로 저장된다
- [ ] **PERS-02**: 저장 스키마는 `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": Todo[] } }` 형태다
- [ ] **PERS-03**: 페이지 새로고침 후에도 모든 todo 데이터가 유지된다
- [ ] **PERS-04**: 저장 실패(quota, Private Mode 등) 시 앱이 크래시하지 않고 사용자에게 실패를 알린다
- [ ] **PERS-05**: 날짜 키는 항상 로컬 시간 기준 `YYYY-MM-DD` 포맷으로 생성된다 (`toISOString` 금지 — UTC 드리프트 방지)

### Delivery

- [ ] **DEL-01**: 빌드 도구·번들러·프레임워크 없이 `index.html`을 통해 동작한다
- [ ] **DEL-02**: 정적 자산 `index.html` + `css/` + `js/` 구조로 배포 가능하다 (GitHub Pages 호환)
- [ ] **DEL-03**: 실행 방법(double-click 또는 `python3 -m http.server`)이 README에 문서화된다

### Style

- [ ] **STYL-01**: Modern/Polished 비주얼 스타일을 적용한다 (다듬어진 컴포넌트, 부드러운 그림자/전환)
- [ ] **STYL-02**: 모든 사용자 입력 텍스트는 `textContent`로 렌더링된다 (`innerHTML` 금지 — XSS 방지)

## v2 Requirements

### Polish

- **POL-01**: JSON 내보내기/가져오기 (수동 백업)
- **POL-02**: "완료 항목 숨기기" 토글
- **POL-03**: 캘린더 키보드 네비게이션 (방향키 + Enter, roving tabindex)
- **POL-04**: ARIA grid 역할 + 라벨
- **POL-05**: `prefers-color-scheme` 다크 모드, `prefers-reduced-motion` 존중
- **POL-06**: "저장됨 ✓" 인디케이터

## Out of Scope

| Feature | Reason |
|---------|--------|
| 서버/계정/동기화 | 정적 웹앱 범위 밖, localStorage로 충분 |
| 빌드 도구 (Vite/Webpack 등) | "빌드 없이 동작" 하드 제약 |
| 프레임워크 (React/Vue 등) | 바닐라 JS로 충분, 강의 가독성 우선 |
| 알림/리마인더 | v1 범위 밖 |
| 주(週)/일(日) 뷰 | 월 그리드 단일 뷰로 시작 |
| 반복 일정, 라벨/카테고리, 첨부파일 | v1 범위 밖 |
| 드래그-드롭 일정 이동 | 복잡도 vs 가치 비대칭 |
| 실시간 멀티탭 동기화 | v1은 single-tab 가정 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAL-01 | TBD | Pending |
| CAL-02 | TBD | Pending |
| CAL-03 | TBD | Pending |
| CAL-04 | TBD | Pending |
| CAL-05 | TBD | Pending |
| CAL-06 | TBD | Pending |
| CAL-07 | TBD | Pending |
| TODO-01 | TBD | Pending |
| TODO-02 | TBD | Pending |
| TODO-03 | TBD | Pending |
| TODO-04 | TBD | Pending |
| TODO-05 | TBD | Pending |
| TODO-06 | TBD | Pending |
| TODO-07 | TBD | Pending |
| TODO-08 | TBD | Pending |
| PERS-01 | TBD | Pending |
| PERS-02 | TBD | Pending |
| PERS-03 | TBD | Pending |
| PERS-04 | TBD | Pending |
| PERS-05 | TBD | Pending |
| DEL-01 | TBD | Pending |
| DEL-02 | TBD | Pending |
| DEL-03 | TBD | Pending |
| STYL-01 | TBD | Pending |
| STYL-02 | TBD | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0 (filled by roadmap)
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-05-03*
*Last updated: 2026-05-03 after initial definition*
