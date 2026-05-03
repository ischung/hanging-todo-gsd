# Phase 2: Todo CRUD — Discussion Log

**Date:** 2026-05-03
**Mode:** discuss (default), no advisor profile
**Phase:** 02 — Todo CRUD (against today)

> 사람이 보기 위한 감사 로그입니다. 다운스트림 에이전트(researcher / planner / executor)는 `02-CONTEXT.md`를 읽습니다.

## 사전 분석 (질문 전)

### 잠긴 결정 (재논의하지 않음)
- 스토리지 키 `hansung-todo:v1`, 스키마 `{ schemaVersion: 1, todosByDate: {...} }` (Phase 1 / PERS-01·02)
- todo shape `{ id, text, done, createdAt }` (TODO-02 / Phase 1 CONTEXT)
- `id = crypto.randomUUID()`, `createdAt = Date.now()` (Phase 1 CONTEXT)
- 정렬: `createdAt` 오름차순 안정 정렬 (TODO-06)
- `textContent`-only 렌더 / `innerHTML` 금지 (STYL-02)
- 로컬 시간 `dateKey()` 사용, `toISOString` 금지 (PERS-05)
- selectedDate는 `dateKey()` 호출 결과로 하드코딩 (ROADMAP — "no calendar UI yet")
- `js/storage.js`가 유일한 localStorage I/O 경계 (Phase 1 PATTERNS)

### 사전 결정 (질문 안 함, Claude 재량)
- 입력 검증: `text.trim()`이 빈 문자열이면 추가/저장 거부, 추가 후 input clear + focus 유지
- 빈 상태(TODO-07) 한국어 카피: "아직 할 일이 없습니다."
- `app.js`의 `window.*` dev 노출은 Phase 2에서도 유지 (Phase 3에서 재검토)
- save 실패 시: in-memory state는 갱신, console.warn만 (PERS-04 노출은 Phase 4)
- `<main id="app">`에 정적 마크업 박지 않고 `app.js`가 동적 마운트 (Phase 3 마이그레이션 비용 회피)

## 토의된 Gray Areas

### Q1. Edit UX — TODO-04 텍스트 수정 인터랙션
- **제시 옵션:**
  1. 인라인 편집 (Recommended) — 텍스트 → input 치환, Enter 저장 / Esc 취소 / blur 저장
  2. `<dialog>` 모달 편집
  3. 행 단위 edit-mode 토글
- **사용자 선택:** 1. 인라인 편집
- **근거:** 마크업/모듈 최소화. 모달은 Phase 4 폴리시에서 필요 시 도입.

### Q2. Delete UX — 삭제 확인
- **제시 옵션:**
  1. 즉시 삭제, 확인 없음 (Recommended)
  2. `window.confirm()` 1회 확인
  3. 인라인 undo 토스트
- **사용자 선택:** 1. 즉시 삭제
- **근거:** 데이터 가벼움 + 재추가 비용 낮음. Undo 토스트는 v2(POL).

### Q3. Render — 모듈 분할 + 렌더 전략
- **제시 옵션:**
  1. `js/todos.js` 단일 + 전체 리스트 재렌더 (Recommended)
  2. `js/todos.js` + 타겟 노드 갱신 (DOM 디핑)
  3. `js/todos.js` + `render.js` 분리 + 전체 재렌더
- **사용자 선택:** 1. 단일 파일 + 전체 재렌더
- **근거:** v1 todo 수 규모에서 충분히 빠름. 버그 표면/강의 가독성 우선. Phase 3에서 calendar 추가 시 분리 재평가.

### Q4. Done style — 완료 시각 표시 범위
- **제시 옵션:**
  1. 최소 strikethrough + 회색 (Recommended)
  2. 체크박스 native 표시만, CSS 0줄
  3. Phase 4 토큰 미리 도입
- **사용자 선택:** 1. 최소 strikethrough + 회색
- **근거:** TODO-03 "시각적 구분" 요구를 분명히 충족하면서 STYL-01 폴리시 책임은 Phase 4에 남김.

## Deferred Ideas
- Undo 토스트 → v2 (POL)
- Storage 실패 토스트 → Phase 4 (PERS-04)
- `<dialog>` 모달 패턴 → Phase 4 필요 시
- 본격 done 스타일/애니메이션 → Phase 4 (STYL-01)
- 키보드 네비게이션 / ARIA → v2 (POL-03/04)
- Todo 텍스트 max length → v2
- 자정 넘김 TODAY 갱신 → Phase 3에서 selectedDate 도입으로 자연 해소

## Scope Creep — 발생 없음
사용자가 본 페이즈 도메인 밖 기능을 제안한 사례 없음.

---
*Phase 2 discussion: 2026-05-03*
