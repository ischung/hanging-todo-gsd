---
status: testing
phase: 01-foundation
source: [01-01-SUMMARY.md]
started: 2026-05-03T00:00:00Z
updated: 2026-05-03T00:00:00Z
---

## Current Test

number: 1
name: Cold Start Smoke Test
expected: |
  `python3 -m http.server 8000` 실행 → http://localhost:8000 접속 → 페이지가 200으로 로드되고 콘솔에 ESM 임포트 에러 0건.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  `python3 -m http.server 8000` 실행 → http://localhost:8000 접속 → 페이지 200 OK, 콘솔에 ESM 임포트 에러 0건, `js/dateKey.js` / `js/storage.js` / `js/app.js` 모두 200으로 로드됨.
result: [pending]

### 2. dateKey — 자정 근처 UTC 드리프트 없음
expected: |
  DevTools Console에서 `dateKey(new Date(2026,4,3,23,55))` 실행 → 결과가 정확히 `'2026-05-03'`. (한국시간 자정 직전이지만 UTC로 변환되지 않음.)
result: [pending]

### 3. localStorage 키 + 스키마
expected: |
  DevTools Application → Local Storage → http://localhost:8000 →
  키 `hansung-todo:v1`이 존재하며 값은 JSON 형태 `{ "schemaVersion": 1, "todosByDate": { ... } }`.
result: [pending]

### 4. 손상 JSON 폴백
expected: |
  Console에서 `localStorage.setItem('hansung-todo:v1', '{not valid json')` → 페이지 새로고침 → 콘솔 에러 없이 앱이 정상 부팅하고, 키 값이 다시 `{ "schemaVersion": 1, "todosByDate": {} }` 또는 기존 정상 todos로 복원됨 (defaultState 폴백).
result: [pending]

### 5. README 안내 동작
expected: |
  README.md의 실행 안내(`python3 -m http.server 8000`) 그대로 따라했을 때 위 1번이 그대로 동작. file:// 경고도 README에 명시되어 있음.
result: [pending]

### 6. storage 경계 (코드 진실문)
expected: |
  터미널에서 `grep -rn "localStorage\." js/ | grep -v "/storage.js"` → 0건. (단일 어댑터 경계 유지.)
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

[none yet]
