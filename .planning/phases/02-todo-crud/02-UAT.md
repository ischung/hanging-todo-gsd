---
status: complete
phase: 02-todo-crud
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-05-03T00:00:00Z
updated: 2026-05-03T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: |
  실행 중인 dev 서버 종료 → `python3 -m http.server`로 새로 시작 → http://localhost:8000 접속 → 콘솔 에러 0건, "오늘 할 일" 입력 폼이 보이고, todo가 0건이면 "아직 할 일이 없습니다." 메시지가 노출된다.
result: pass

### 2. 추가 (Enter)
expected: 입력창에 "공부하기" 입력 후 Enter → 즉시 리스트 상단/하단에 노출, 입력창 clear, focus 유지.
result: pass

### 3. 추가 (버튼 클릭)
expected: "운동하기" 입력 후 [추가] 버튼 클릭 → 동일하게 즉시 반영, 입력창 clear.
result: pass

### 4. 빈 입력 거부
expected: 입력창 비운 채 Enter / 공백만 입력 후 Enter → 아무 todo도 추가되지 않음, 에러 표시 없음.
result: pass

### 5. 토글 완료
expected: 체크박스 클릭 → 텍스트가 strikethrough + 회색으로 변함. 다시 클릭 → 원래대로 복원.
result: pass

### 6. 인라인 편집 — Enter 저장
expected: ✎ 클릭 → 텍스트 자리에 input 등장 (현재 값 prefill, 커서 끝). 텍스트 수정 후 Enter → 저장되고 input → 텍스트로 복귀.
result: pass

### 7. 인라인 편집 — blur 저장
expected: ✎ 클릭 → 다른 곳 클릭 (focus 이동) → 변경 내용 자동 저장.
result: pass

### 8. 인라인 편집 — Esc 취소
expected: ✎ 클릭 → 텍스트 변경 → Esc → 원래 텍스트로 복원, 변경 내용 버려짐.
result: pass

### 9. 인라인 편집 — 빈/공백 거부
expected: ✎ 클릭 → 입력 비우거나 공백만 → Enter → 거부되고 원래 텍스트 유지.
result: pass

### 10. 즉시 삭제
expected: × 버튼 클릭 → 확인 다이얼로그 없이 즉시 리스트에서 사라짐. 마지막 항목이면 empty 메시지 노출.
result: pass

### 11. Reload 영속성
expected: 여러 todo 추가/토글/편집 후 페이지 새로고침 → 모든 상태가 createdAt 오름차순으로 동일하게 복원됨.
result: pass

### 12. XSS literal 표시
expected: 입력창에 `<img src=x onerror=alert(1)>` 입력 → alert 발생 없음, 리스트에 정확히 그 문자열이 literal text로 표시됨.
result: pass

### 13. 한국어 IME
expected: 한글 IME로 "공부하기" 입력 → 잘린 자모 없이 그대로 저장됨. 편집도 동일.
result: pass

### 14. 편집 전환 race (WR-01 fix verify)
expected: |
  Todo A를 ✎로 편집 중("foo" → "FOO" 수정, 아직 저장 X) 상태에서, Todo B의 ✎/텍스트를 클릭한다.
  → A는 "FOO"로 저장됨 (옛 입력이 유실되거나 B에 잘못 commit되지 않음).
  → B가 새 편집 모드로 진입.
result: pass

## Summary

total: 14
passed: 14
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
