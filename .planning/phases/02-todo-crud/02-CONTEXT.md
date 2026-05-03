# Phase 2: Todo CRUD (against today) — CONTEXT

**Created:** 2026-05-03
**Phase goal:** 사용자가 오늘 날짜의 todo를 추가/완료 토글/수정/삭제할 수 있고, 새로고침 후에도 모두 유지된다. **캘린더 UI는 Phase 3 — 이 페이즈는 `selectedDate = dateKey()` 하드코딩.**
**Requirements covered:** TODO-01, TODO-02, TODO-03, TODO-04, TODO-05, TODO-06, TODO-07, PERS-03, STYL-02

<domain>
Phase 1이 만든 storage/dateKey 위에 첫 사용자 인터랙션 레이어를 올린다. UI는 단순한 입력 박스 + 단일 todo 리스트. 캘린더 그리드/날짜 선택/카운트 배지/사람 친화 헤더는 모두 Phase 3 영역이며 이 페이즈에서는 만들지 않는다. 디자인 토큰/애니메이션/그림자 등 본격 폴리시는 Phase 4(STYL-01) 영역. 본 페이즈의 종착점: "오늘 todo 4개 추가 → 1개 토글 → 1개 텍스트 수정 → 1개 삭제 → reload → 모두 동일 상태로 복원"이 사용자 입장에서 매끄럽게 동작.
</domain>

<canonical_refs>
다운스트림(researcher / planner / executor)이 반드시 읽어야 할 문서:

- `.planning/PROJECT.md` — 하드 제약(무빌드/무프레임워크/단일 진입점/localStorage)
- `.planning/REQUIREMENTS.md` — TODO-01~07, PERS-03, STYL-02 잠금 사양
- `.planning/ROADMAP.md` — Phase 2 Success Criteria 5개 + ordering rationale ("Calendar after CRUD")
- `.planning/research/PITFALLS.md` — Pitfall 2 (textContent-only/XSS), Pitfall 3 (storage 실패는 Phase 4지만 save() boolean 시그니처 인지 필요)
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1에서 잠긴 결정(스키마, id 생성, createdAt 포맷, 모듈 경계)
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — Phase 1 산출물 인터페이스 (`KEY/defaultState/load/save`, `dateKey()`)
- `.planning/phases/01-foundation/01-PATTERNS.md` — 확립된 storage 경계 패턴, ESM 임포트 규칙
- `js/storage.js` — `KEY/defaultState/load/save` 시그니처
- `js/dateKey.js` — `dateKey(d?)` 시그니처
- `js/app.js` — 현재 부트스트랩 상태 (window 노출은 Phase 2에서도 잠정 유지)
- `index.html` — `<main id="app">`이 렌더 타겟
- `CLAUDE.md` (project) — `<dialog>`/`Intl.DateTimeFormat('ko-KR')` 등 권장 native API 표
</canonical_refs>

<decisions>

### 수정(Edit) 인터랙션 — **인라인 편집**
- 텍스트 영역 클릭 또는 ✎ 버튼 → 같은 자리에서 `<span>`이 `<input type="text">`로 치환.
- **Enter 또는 blur → 저장**, **Esc → 취소** (편집 전 텍스트로 복원).
- 빈 문자열/공백만 trim 결과 → **저장 거부**(원래 텍스트 유지). 삭제로 간주하지 않는다.
- `<dialog>` 모달은 도입하지 않는다 — Phase 2 마크업/모듈 수를 최소화. 모달 패턴은 Phase 4 폴리시에서 필요 시 도입.
- 한 번에 한 todo만 편집 모드 — 다른 행을 편집 시작하면 진행 중이던 편집은 (현재 input 값 기준) 자동 저장.

### 삭제 인터랙션 — **즉시 삭제, 확인 없음**
- 🗑 버튼 클릭 = 즉시 store mutation + 재렌더.
- `window.confirm()` 사용 안 함 — 데이터가 가볍고 todo는 다시 추가 1초.
- Undo 토스트는 v2(POL) 영역. Phase 4 폴리시에서도 도입하지 않는다 (출시 범위 외).

### 모듈 분할 + 렌더 전략 — **`js/todos.js` + 전체 리스트 재렌더**
- 새 파일 1개만 추가: `js/todos.js`.
  - 순수 state 헬퍼: `getTodosForDate(state, key)`, `addTodo(state, key, text)`, `toggleTodo(state, key, id)`, `editTodo(state, key, id, text)`, `removeTodo(state, key, id)`.
    - 모두 새 state 객체 반환(immutable update). 호출처가 `save(newState)`를 직접 부른다.
    - `addTodo`는 내부에서 `crypto.randomUUID()` + `Date.now()`로 `{id, text, done:false, createdAt}` 생성.
  - DOM 렌더: `renderTodoList(container, todos, handlers)` — `container.replaceChildren(...)` 또는 `textContent = ''` 후 append. **`innerHTML` 절대 금지.**
- `render.js`/`dom.js` 분리는 Phase 2에서 하지 않는다 — 코드량 임계점에 못 미침. Phase 3에서 calendar 추가 시 재평가.
- **재렌더 전략:** 어떤 변경(add/toggle/edit/remove)이든 `todos = getTodosForDate(state, today)` → `renderTodoList(container, todos, handlers)` 전체 호출. v1 todo 수 규모(많아야 수십 개/날짜)에서 충분히 빠르고 버그 표면이 가장 작다.
- **정렬:** `getTodosForDate`가 항상 `createdAt` 오름차순 안정 정렬을 보장(TODO-06). 비교는 `a.createdAt - b.createdAt` (Number).

### 추가(Add) UX
- 마크업: `<input id="todo-input">` + `<button id="todo-add">추가</button>` — 단순 폼.
- Enter 또는 추가 버튼 클릭 모두 동일 핸들러 (TODO-01).
- 검증: `text.trim()`이 빈 문자열이면 무시(추가 거부, 알림 없음). 한국어 공백·탭만 입력된 경우도 동일.
- 길이 제한 없음 — localStorage 5MB 한도가 사실상 상한. 명시적 max length는 v2.
- 추가 후: input 값 비우기 + focus 유지(연속 입력 자연스럽게).
- 추가된 항목이 즉시 리스트 하단(또는 정렬상 마지막, 보통 동일)에 나타나야 함 (Success Criteria #1).

### 토글(Toggle) UX
- 행마다 `<input type="checkbox">` (native). `change` 이벤트로 `toggleTodo` 호출 → save → 재렌더.
- 완료 시각 구분 (TODO-03): `li.done` 클래스 + CSS `text-decoration: line-through` + 흐린 색상. 본격 폴리시는 Phase 4.

### 빈 상태 (TODO-07)
- 해당 날짜 todo 0개 → 리스트 컨테이너에 단일 `<p class="empty">` 노출.
- 카피(한국어): **"아직 할 일이 없습니다."** (오늘만 보여주는 페이즈이지만 Phase 3에서도 재사용할 수 있도록 날짜 비종속 문구).
- todo가 1개 이상이면 empty 노드 제거 → todo `<ul>` 노출.

### XSS 방지 (STYL-02 잠금 재확인)
- 모든 todo 텍스트 표시는 `el.textContent = todo.text` 또는 `document.createTextNode(todo.text)`.
- `innerHTML` 사용 0건. `outerHTML`도 금지. 셋업/정리 시 `replaceChildren()` 우선, 정 안 되면 `textContent = ''` 후 append.
- Success Criteria #5의 검증 입력(`<img src=x onerror=alert(1)>`)은 executor가 수동으로 한 번 넣어보는 시나리오로 verify에 포함.

### `js/app.js` 변경 범위
- Phase 2에서 다음 추가:
  - `const TODAY = dateKey();` — 모듈 로드 시점에 한 번 캡처(Phase 2는 자정 넘김 케이스를 다루지 않음 — Phase 3에서 selectedDate 도입 시 재평가).
  - DOM ready 후: 입력 폼 + 리스트 컨테이너 마크업을 `<main id="app">` 안에 생성하거나 `index.html`에 정적으로 추가.
  - 최초 진입 시 `state = load(); render(state, TODAY);`.
  - 핸들러 4개(add/toggle/edit/remove)에서: state mutation → `save(state)` → 전체 재렌더.
- `window.dateKey/load/save/...` 노출은 **Phase 2에서도 유지** (검증 콘솔 셸로 유용). Phase 3에서 캘린더 도입 시 압축/제거 재검토.

### `save()` 실패 처리 (PERS-04 경계)
- `save(state)`는 `boolean` 반환(Phase 1 시그니처). Phase 2에서는 **반환값을 무시하지 않고 변수로 받되, 실패 시 UX 노출은 하지 않는다**.
  - 이유: PERS-04는 Phase 4 잠금이라 토스트/알림 컴포넌트가 아직 없다. 그러나 "save 실패 시 in-memory state는 어떻게?"라는 결정은 미루지 않는다.
- **결정:** 실패해도 in-memory state는 갱신(낙관적), 콘솔에 `console.warn('[hansung-todo] save failed; mutation kept in memory')`만 남긴다. Phase 4가 이 지점에 토스트를 끼워 넣을 hook이 됨.

### 마크업 추가 위치
- `index.html`의 `<main id="app">`은 비워두고, `app.js`가 한 번에 폼 + 리스트 컨테이너를 동적으로 생성한다 (호출 1회, 이후 리스트 컨테이너만 재렌더).
- 정적 마크업으로 두지 않는 이유: Phase 3에서 캘린더가 들어올 때 `<main>` 내부 구조가 다시 바뀐다 — Phase 2에서 정적 마크업으로 박아두면 Phase 3 마이그레이션 비용 발생.

### 파일 구조 (Phase 2 종료 시점)
```
js/
  dateKey.js     (Phase 1, 변경 없음)
  storage.js     (Phase 1, 변경 없음)
  todos.js       (NEW — state 헬퍼 + renderTodoList)
  app.js         (수정 — 부트스트랩에서 폼/리스트 마운트 + 핸들러 와이어링)
css/
  styles.css     (수정 — done strikethrough/회색, empty 메시지 미니멀 톤만. STYL-01 본격 폴리시는 Phase 4)
index.html       (변경 없음 또는 최소)
```

### Phase 2 검증 방법 (executor가 따를 체크리스트)
1. 추가: 입력 → Enter → 리스트에 즉시 추가, input clear (TODO-01).
2. 추가: 빈 문자열/공백만 입력 시 무시 (검증 정책).
3. 토글: 체크박스 클릭 시 `done` 토글 + 시각 구분 적용 (TODO-03).
4. 수정: 텍스트 클릭 → input → Enter 저장 / Esc 취소 / blur 저장 / 빈 값 거부 (TODO-04).
5. 삭제: 🗑 클릭 시 즉시 사라짐, 확인 없음 (TODO-05).
6. 정렬: 추가 시간 순서대로 안정 표시 (TODO-06).
7. 빈 상태: 모두 삭제 시 "아직 할 일이 없습니다." 노출 (TODO-07).
8. 영속화: 4개 추가/1개 토글/1개 수정/1개 삭제 → reload → 동일 상태 (PERS-03).
9. XSS: `<img src=x onerror=alert(1)>` 입력 → 텍스트로만 표시, alert 미발생 (STYL-02).
10. `grep -rE "innerHTML\s*=" js/` → 0건.
11. `grep -r "toISOString\|Date\.UTC" js/` → 여전히 0건 (Phase 1 진실문 유지).
12. `js/storage.js` 외에서 raw `localStorage.` 호출 0건 (Phase 1 경계 패턴 유지).

</decisions>

<deferred_ideas>
다음 페이즈/마일스톤으로 미룸:

- **Undo 토스트 / "삭제됨" 스낵바** → v2 (POL).
- **Storage 실패 사용자 알림 (토스트)** → Phase 4 (PERS-04). Phase 2는 console.warn만.
- **본격 done 스타일(애니메이션·취소선 두께·아이콘 모핑)** → Phase 4 (STYL-01).
- **캘린더/날짜 선택/카운트 배지/사람 친화 헤더** → Phase 3.
- **`<dialog>` 모달 패턴** → Phase 4 폴리시에서 필요 시(현재 시점에선 not needed).
- **키보드 네비게이션·ARIA 라벨** → v2 (POL-03/04).
- **Todo 텍스트 max length 제한** → v2.
- **자정 넘김 시 TODAY 자동 갱신** → Phase 3에서 selectedDate 도입과 함께 자연스럽게 해소.
- **JSON export/import 백업** → v2 (POL-01).
</deferred_ideas>

<code_context>
**기존 파일에서 변경 없음:**
- `js/dateKey.js` — `dateKey(d?)` 그대로 사용.
- `js/storage.js` — `KEY/defaultState/load/save` 그대로 사용. 새 모듈 어댑터 추가 금지(경계 패턴 유지).
- `index.html` — 가능하면 그대로. `<main id="app">`을 동적 마운트 타겟으로.

**수정 대상:**
- `js/app.js` — 부트스트랩에서 마크업 마운트 + 핸들러 와이어링. `window.*` 노출은 잠정 유지.
- `css/styles.css` — `.done` strikethrough/회색 + `.empty` 미니멀 톤만 추가. 토큰/애니메이션은 Phase 4.

**신규:**
- `js/todos.js` — state 헬퍼 + `renderTodoList`. 단일 파일에 묶어 모듈 수 최소화.

**확립된 패턴 (Phase 1 PATTERNS):**
- Storage 경계: 모든 localStorage I/O는 `js/storage.js`만 — `js/todos.js`는 `KEY` 직접 참조 금지, `load`/`save`만 import.
- ESM 임포트: 상대경로 + `.js` 확장자 명시.
- 로컬 시간 dateKey: `toISOString`/`toJSON`/`Date.UTC` 사용 0건 유지.
- textContent-only: `innerHTML` 사용 0건 유지.
</code_context>

---
*Phase 2 context captured: 2026-05-03*
