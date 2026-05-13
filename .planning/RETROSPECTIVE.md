# Retrospective: Hansung Todo (GSD Demo)

## Milestone: v1.0 — MVP

**Shipped:** 2026-05-13
**Phases:** 4 | **Plans:** 11

### What Was Built

날짜별 todo 관리 정적 웹앱. 월 그리드 캘린더에서 임의 날짜를 골라 CRUD하고, localStorage로 영속하며, 저장 실패 시 가시 배너로 우아하게 알리는 v1.0 — 빌드 도구·프레임워크 없이 바닐라 HTML/CSS/JS만으로 완성.

### What Worked

- **Safety invariants 조기 lock** — Phase 1에서 `dateKey()` 로컬 시간 + `toISOString` 금지 + 단일 storage 어댑터 + `textContent`-only을 동시에 못박은 결과, Phase 2/3/4 어디에서도 UTC 드리프트·XSS·raw localStorage 누수가 0건이었다.
- **Coarse 4-phase roadmap** — research가 제안한 5단계 중 P1+P2를 Foundation으로 병합. 의존 사슬이 단순해져 각 phase에서 다음 phase가 "재렌더 1줄 + 위임 listener 1개 추가"로 끝나는 구조가 됐다.
- **Date overflow normalization (`monthGrid`)** — 조건부 leap-year 분기를 제거하고 42셀 고정. 분기 0개 = 버그 표면 0개 + 레이아웃 점프 0.
- **`commit()` always-apply-to-memory** — save() throw 전환 후에도 메모리 상태는 항상 갱신하고 throw만 따로 capture. UI 일관성과 실패 알림을 동시에 만족.
- **위임 이벤트 + module-let 상태** — DOM 재렌더 시 listener 보존, mount는 1회. Phase 2의 listener 4개 + Phase 3의 calendar listener 1개 + Phase 4의 banner listener 1개 모두 stable container에 위임.

### What Was Inefficient

- **VERIFICATION.md 2건 누락 (Phase 1, 2)** — Phase 2/3/4 의존으로 implicit 검증되었지만 형식적 산출물이 없어 audit이 `passed`가 아니라 `tech_debt`로 떨어졌다. 작성 비용은 phase당 ~15분 규모로 추정되며, 다음 milestone 첫 작업으로 retroactive 가능.
- **편집 중 캘린더 셀 클릭 race** — `editingId` flush가 캘린더 위임 핸들러에 없어 편집 텍스트 유실 가능. 데이터 안전성은 보장되나 UX 흠. 발견 시점이 Phase 4 audit 이후로 늦었다.
- **dev 전용 `window.*` 글로벌** — Phase 1에서 콘솔 검증용으로 노출한 globals가 Phase 4까지 잔존. "Phase 2 도입 시 재검토" 메모는 있었으나 정리 작업이 우선순위에서 밀렸다.

### Patterns Established

- **단일 mount, 부분 재렌더 (`replaceChildren`)** — listener 보존 + listContainer만 갱신. Phase 2 ~ 4 전체에서 일관.
- **위임 이벤트 + dataset contract** (`data-action`, `data-key`) — Phase 3 calendar, Phase 4 banner 모두 동일 패턴.
- **Append-only Phase block** — CSS와 JS 모두 phase별 블록을 byte-equal 보존하면서 아래에 누적. Diff가 좁아 코드 리뷰가 쉬웠다.
- **Pure helpers + view-renderer** — `todos.js`, `calendar.js` 둘 다 동일 구조(순수 함수 + 단일 render).
- **이중 신호 강조 (border-weight + color)** — 색맹 안전 + 두 강조 상태(today / selected)가 신호 종류 자체로 구분.

### Key Lessons

- "informational tech debt"는 audit이 잡아주지 않으면 잊힌다 — VERIFICATION.md 산출물은 phase 마무리 체크리스트에 못박는 게 낫다.
- Safety invariants는 코드 시작 전(Phase 1)에 한 번 lock하면 비용이 0에 가깝지만, 뒤늦게 retrofit하면 비싸다. 다음 milestone에도 첫 phase에서 invariants 재확인.
- 인라인 편집의 lifecycle은 다른 selection 상태(selectedKey 등)와 명시적으로 동기화해야 한다 — race 자동 발견은 어렵다.

### Cost Observations

- 작업 집중도: 단일 일자(2026-05-03) 내 80 commits — 마일스톤 호흡이 짧고 빠른 데모 프로젝트
- audit 분리: 코드 완료(2026-05-03) ↔ audit·archive(2026-05-13) 10일 간격 — code freeze 이후 검증/문서 단계가 별도로 진행됨

## Cross-Milestone Trends

(첫 마일스톤 — 트렌드는 v1.1 이후 비교 가능)

---
*Retrospective started: 2026-05-13 (v1.0)*
