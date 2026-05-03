# Phase 1 — Discussion Log

**Date:** 2026-05-03
**Mode:** discuss (default)

## Areas selected by user
모듈 로딩 전략, todo id 생성 방식, createdAt 저장 포맷, js/ 파일 분할 경계 (4/4)

## Q1: 모듈 로딩 전략
**Options presented:**
1. ESM + http.server 안내 (Recommended)
2. 평범 `<script>` + window 네임스페이스
3. ESM + double-click도 보장 (사실상 1과 동일)

**Selected:** ESM + http.server 안내
**Note:** DEL-03의 "double-click 또는 http.server" 계약은 http.server 단독 안내로도 만족. README에 명시.

## Q2: todo id 생성
**Options:** crypto.randomUUID() (Recommended) / Date.now()+random / 단조 카운터
**Selected:** crypto.randomUUID()
**Note:** 2026 baseline 지원, 충돌 무시 가능. Phase 2에서 사용 시작.

## Q3: createdAt 저장 포맷
**Options:** epoch ms (Recommended) / ISO 8601 문자열
**Selected:** epoch ms (Number)
**Note:** Number 정렬로 TODO-06 안정 정렬, JSON 라운드트립에서 타입 안 변함.

## Q4: js/ 파일 분할 경계
**Options:** 최소 3개 (Recommended) / 빈 파일 미리 / model.js 분리
**Selected:** 최소 — dateKey.js, storage.js, app.js
**Note:** YAGNI. 후속 페이즈가 필요할 때 추가.

## Deferred ideas
- Storage 실패 토스트 → Phase 4 (PERS-04)
- newTodo() 헬퍼 → Phase 2
- schemaVersion 마이그레이션 로직 → 실제 변경 시
- ARIA / 키보드 → v2 (POL-03/04)

## Claude's discretion
- README 구조 (한 줄 소개 + 실행 + 배포 + 트리 + 더블클릭 미지원 경고).
- `css/styles.css`를 빈 골격으로 생성해 DEL-02 정적 구조 계약 만족.
- `app.js`에서 헬퍼를 `window`에 노출해 Phase 1 검증(DevTools 콘솔 라운드트립) 가능하게 함.
- Phase 1 검증용 grep 체크리스트 (`toISOString`, `innerHTML\\s*=`).
