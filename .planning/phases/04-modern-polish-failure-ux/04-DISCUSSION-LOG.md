# Discussion Log: Phase 04 — Modern Polish & Failure UX

**Date:** 2026-05-03
**Mode:** discuss (default)

## Areas Selected by User

User multi-selected all 4 presented gray areas:
1. 시각 방향성 (visual direction)
2. 한국어 타이포그래피
3. 저장 실패 알림 형식
4. 실패 시 데이터·재시도 정책

## Q1 — 시각 방향성

**Options presented:**
- 현재 톤 + 마이크로 디테일 (Recommended) — 기존 #2563eb accent / 흰·회색 베이스 유지, spacing scale + 1단계 그림자 + transition + type scale만 추가
- Apple-like 주제
- Notion/Linear-like 주제
- Material-ish (elevation 강조)

**User selected:** 현재 톤 + 마이크로 디테일

**Captured as:** Decision A in CONTEXT.md (4가지 토큰 추가 — spacing/shadow/transition/type)

## Q2 — 한국어 타이포그래피

**Options presented:**
- 시스템 폰트 스택만 (Recommended) — 의존성 0, file:// 동작
- Pretendard CDN
- Inter + 시스템 한글

**User selected:** 시스템 폰트 스택만

**Captured as:** Decision B (system-font 스택; CDN 폰트 금지 — "no CDN runtime dep" 잠금 재확인)

## Q3 — 저장 실패 알림 형식

**Options presented:**
- Persistent banner (Recommended) — 사용자가 닫기 전까지 유지
- Top toast (자동 숨김)
- Inline error (폼 아래)
- Modal dialog

**User selected:** Persistent banner

**Captured as:** Decision C (`<aside id="storage-banner" role="alert" hidden>`, [재시도][닫기], color + 좌측 막대 + 텍스트로 의미 전달)

## Q4 — 실패 시 데이터·재시도 정책

**Options presented:**
- 메모리 보관 + Retry 버튼 (Recommended) — UI 즉시 반영, 명시적 재시도
- UI 롤백 (입력 자체 취소)
- 메모리 보관 + auto-retry

**User selected:** 메모리 보관 + Retry 버튼

**Captured as:** Decision D (commit() try/catch로 storageError set/clear, render()에서 banner 토글, auto-retry 없음)

## Deferred (capture for v2)

- 다크 모드 (POL-05)
- prefers-reduced-motion 가드
- selectedDate 영속화 (Phase 3 이월)
- POL-01 ~ POL-06 일괄 v2
- 실패 원인 자세히 분기 (Quota / Private / Disabled)

## Claude's discretion (not asked)

- CSS 토큰 명명/값 — 본 phase에서 결정해도 무방한 구현 디테일.
- save() 내부 try/catch 위치 — storage 모듈 캡슐화로 자명.
- banner 등장 애니메이션 디테일 (slide-down 150ms) — Decision A의 transition 토큰을 따름.
- color 토큰 매핑값 (#2563eb 등) — 기존 하드코딩과 동일하게 유지하여 시각 회귀 0.
