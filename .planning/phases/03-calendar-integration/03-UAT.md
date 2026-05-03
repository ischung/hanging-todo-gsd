---
status: complete
phase: 03-calendar-integration
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-05-03T00:00:00Z
updated: 2026-05-03T00:00:00Z
completed: 2026-05-03T00:00:00Z
---

## Current Test

(all tests complete)

## Tests

### 1. 진입 시 캘린더와 오늘 날짜 강조
expected: index.html 진입 시 7×6 캘린더, "YYYY년 M월" 타이틀 + [이전][오늘][다음] 버튼, 오늘 셀이 굵은 테두리(2px) + 파란 글자 + 파란 배경(흰 글자)로 today/selected 동시 강조, 아래 "YYYY년 M월 D일 요일" 한국어 헤더 표시
result: pass

### 2. 임의 날짜 클릭 → 선택 이동 + 헤더/리스트 갱신
expected: 캘린더에서 오늘이 아닌 다른 in-month 날짜(예: 다음 주 어느 날)를 클릭하면 그 셀이 파란 배경(selected)으로 바뀌고 오늘 셀의 selected는 해제(테두리만 남음). 아래 한국어 헤더 텍스트가 클릭한 날짜로 즉시 갱신되고, todo 리스트는 그 날짜의 todo로 (없으면 비어있는 상태로) 재렌더링된다.
result: pass

### 3. 다른 날짜에 todo 추가 → 그 날짜에만 저장 + 셀 배지
expected: 임의 날짜를 선택한 상태에서 폼에 텍스트를 입력해 추가하면 todo 리스트에 그 항목이 나타나고, 캘린더의 그 날짜 셀 우상단에 카운트 배지(예: "1")가 표시된다. 같은 날짜에 2개 더 추가하면 배지가 "3"으로 바뀌고, 모두 삭제하면 배지가 사라진다. 다른 날짜로 이동하면 그 todo는 보이지 않다가 원래 날짜로 돌아오면 다시 나타난다.
result: pass

### 4. 이전/다음 달 네비게이션 + selected 보존
expected: [다음] 버튼을 누르면 캘린더가 다음 달로 바뀌고 타이틀이 갱신된다. 이때 현재 selected 날짜가 새 달 범위 밖이면 선택 표시는 안 보이지만, [이전]을 다시 눌러 원래 달로 돌아오면 동일한 셀에 selected 강조가 그대로 복원되어 있다. 1월에서 [이전] → 작년 12월, 12월에서 [다음] → 다음 해 1월로 wrap된다.
result: pass

### 5. "오늘" 버튼
expected: 다른 달/다른 날짜를 보고 있을 때 [오늘] 버튼을 누르면 캘린더가 오늘이 속한 달로 점프하고, 오늘 셀이 today + selected로 강조되며 아래 헤더와 todo 리스트도 오늘 기준으로 갱신된다.
result: pass

### 6. 인접 달(회색) 셀 클릭 → 무동작
expected: 캘린더 6×7 그리드에서 옅은 회색으로 표시된 인접 달 날짜 셀(예: 5월 view의 4월 마지막 며칠 / 6월 첫 며칠)을 클릭해도 아무 변화가 없다(선택 이동 없음, 헤더/리스트 변화 없음, 콘솔 에러 없음).
result: pass

### 7. F5 새로고침 후 데이터 잔존 + selected 리셋
expected: 비-오늘 날짜에 todo를 추가한 뒤 F5로 새로고침하면, 캘린더는 오늘이 속한 달로 돌아오고 selected는 오늘로 리셋되지만, 아까 추가한 todo가 들어있던 날짜 셀에는 카운트 배지가 그대로 남아있다. 그 날짜를 다시 클릭하면 추가했던 todo들이 그대로 리스트에 보인다.
result: pass

### 8. XSS 회귀 — 스크립트 텍스트 입력
expected: 폼에 `<img src=x onerror=alert(1)>` 같은 HTML/스크립트 문자열을 입력해 추가하면, 알림창이 뜨지 않고 todo 리스트에 입력 문자열이 그대로 텍스트로만 표시된다(태그가 렌더되지 않음).
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
