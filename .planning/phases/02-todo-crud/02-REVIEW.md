---
phase: 02-todo-crud
reviewed: 2026-05-03T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - js/todos.js
  - js/app.js
  - css/styles.css
findings:
  critical: 0
  warning: 5
  info: 4
  total: 9
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-03
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Phase 2의 순수 헬퍼(`todos.js`)와 위임 리스너 와이어링(`app.js`), CSS 상태 규칙(`styles.css`)을 검토했다. `todos.js`의 immutable 헬퍼는 깨끗하고 XSS 안전 처리(`textContent` / `value` property)가 일관된다. 다만 `app.js`의 편집 lifecycle은 여러 listener(focusout / click / keydown)가 동일 transient state(`editingId`)를 공유하면서 race-condition성 결함이 발견된다. 가장 중요한 문제는 **편집 중인 상태에서 다른 todo의 편집 버튼이나 텍스트를 클릭할 때 이전 input의 텍스트가 새 todo에 잘못 commit될 수 있는** 핸들러 순서 문제다. 또한 `localStorage` 변조에 대한 방어가 storage 경계에서 충분치 않아 `todos.js`가 throw할 수 있다. 그 외에는 dev 글로벌 노출과 죽은 CSS 규칙 등 정리할 잔여물이 있다.

## Warnings

### WR-01: 편집 전환 시 focusout이 새 editingId를 덮어쓴다 (잘못된 todo에 텍스트 commit)

**File:** `js/app.js:108-116, 101-106, 118-122`
**Issue:** 사용자가 todo A를 편집 중인 상태에서 todo B의 `.todo-edit` 또는 `.todo-text`를 클릭하면 다음 순서가 발생한다.

1. `click` 핸들러가 `startEdit(B.id)`를 호출 → `editingId = B.id` 설정 → `render()` 실행 → `replaceChildren()`이 A의 input을 DOM에서 제거.
2. A의 input이 제거되며 `focusout` 이벤트가 발화 → `focusout` 핸들러가 `commitEdit(A_input)` 호출.
3. `commitEdit` 내부에서 `const id = editingId`로 id를 캡처하는데, 이 시점 `editingId`는 이미 `B.id`이므로 **A input의 텍스트가 B todo에 덮어씌워진다.**
4. 이후 `startEdit` 내부의 `listContainer.querySelector('.todo-edit-input').focus()`도 B의 새 input이 아닌, render에 의해 사라진 input을 참조해 실패하거나, 또는 commitEdit가 또 다른 render를 호출해 B input도 잃는다.

**Fix:** `startEdit` 진입 시 진행 중인 편집을 명시적으로 정리한 후에만 새 편집을 시작하도록 분리한다. 예:

```js
function startEdit(id) {
  // 진행 중 편집이 있으면 먼저 commit (다른 todo여도 안전하게 캡처된 id로)
  if (editingId != null && editingId !== id) {
    const prev = listContainer.querySelector('.todo-edit-input');
    const prevId = editingId;
    editingId = null;
    if (prev) {
      // editingId를 풀고 직접 도메인 헬퍼로 적용 (focusout 핸들러가 새 id로 commit하지 않도록)
      commit(editTodo(state, TODAY, prevId, prev.value));
    }
  }
  editingId = id;
  render();
  const input = listContainer.querySelector('.todo-edit-input');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}
```

또는 `commitEdit`가 input의 `dataset.id`(편집 시작 시점에 li로부터 복사)를 사용해 commit하도록 바꿔 "현재 editingId" 의존성을 제거한다.

### WR-02: localStorage 데이터가 변조된 경우 todos.js가 throw

**File:** `js/storage.js:14-17` (boundary), `js/todos.js:5,7,27,40,51`
**Issue:** `storage.load()`는 `parsed.todosByDate`가 object인지만 검사하고 각 value가 배열인지는 검증하지 않는다. 누가 DevTools에서 `localStorage`를 `{"schemaVersion":1,"todosByDate":{"2026-05-03":"oops"}}`처럼 변조하면 `getTodosForDate` → `[...list].sort(...)` 또는 `addTodo` → `[...prev, todo]`에서 TypeError가 발생해 앱 전체가 죽는다. Phase 1 boundary 계약은 "이 모듈만 raw localStorage 호출"이지만 실제 invariant(`value === Array`)를 강제하지 않는다.
**Fix:** `storage.js`의 `load()`에서 각 value를 배열로만 좁히거나, `todos.js`의 `state.todosByDate[key] ?? []`를 `Array.isArray(state.todosByDate[key]) ? state.todosByDate[key] : []`로 방어한다.

```js
// storage.js load() 내부
for (const k of Object.keys(parsed.todosByDate)) {
  if (!Array.isArray(parsed.todosByDate[k])) return defaultState();
}
```

### WR-03: `crypto.randomUUID()`가 secure context 외에서 throw

**File:** `js/todos.js:14`
**Issue:** `crypto.randomUUID()`는 secure context (HTTPS, localhost, 일부 브라우저의 `file://`)에서만 정의된다. 프로젝트 STACK 문서는 `file://` 더블클릭 데모를 명시 권장 시나리오로 둔다. Chrome은 `file://`을 secure context로 취급하지만 Safari는 그렇지 않으며, 이 경우 `crypto.randomUUID is not a function`이 발생하며 `addTodo`가 죽고 form submit이 실패한다.
**Fix:** 폴백을 추가하거나, `Date.now() + Math.random()` 기반의 단순 id 생성기를 둔다.

```js
function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

### WR-04: `#app` 누락 시 부트스트랩이 즉시 throw

**File:** `js/app.js:47-48`
**Issue:** `document.getElementById('app')`가 null일 때 곧바로 `root.replaceChildren(...)`을 호출 → `TypeError`. `index.html` 계약이 어디에서도 명시되지 않아 누군가 마크업 구조를 바꾸면 디버깅이 어렵다. 또한 `app.js`가 `<head>` 또는 `defer` 없이 로드되면 DOM이 아직 없을 때도 같은 오류.
**Fix:** 명시적 가드 + 메시지로 실패 원인을 노출한다.

```js
const root = document.getElementById('app');
if (!root) throw new Error('[hansung-todo] #app 마운트 노드가 없습니다.');
```

또한 `index.html`의 `<script type="module" src="./js/app.js">`가 `<body>` 끝 또는 `defer`로 로드되도록 보장한다(이미 그렇다면 OK).

### WR-05: 편집 중에 같은 todo의 편집 버튼/텍스트를 다시 클릭하면 입력 손실

**File:** `js/app.js:88, 108-116`
**Issue:** 편집 중 `.todo-text`는 input으로 교체되어 매치하지 않지만 `.todo-edit` 버튼은 그대로 남아있다. 사용자가 편집 중 실수로 ✎ 버튼을 다시 누르면 `startEdit(sameId)`가 호출되어 `render()`가 실행되며 input이 재생성된다. 이 과정에서 (a) 사용자가 입력 중이던 텍스트가 사라지거나, (b) WR-01 시나리오와 동일하게 focusout이 발화되어 입력 텍스트가 commit된다(이 경우는 같은 id이므로 데이터가 잘못 가지는 않지만 selection/cursor 상태는 모두 잃는다).
**Fix:** 클릭 핸들러에서 동일 id에 대한 startEdit 재진입을 가드한다.

```js
else if (t.matches('.todo-edit') || t.matches('.todo-text')) {
  if (editingId !== id) startEdit(id);
}
```

## Info

### IN-01: `.editing .todo-text { display: none }`는 죽은 CSS 규칙

**File:** `css/styles.css:14-16`
**Issue:** 편집 모드에서 `renderTodoItem`은 `<span class="todo-text">`를 만들지 않고 `<input class="todo-edit-input">`로 교체한다. 따라서 `.editing .todo-text` selector는 매치할 DOM이 없다. 의도한 효과(편집 중 텍스트 숨김)는 이미 JS의 분기로 달성되어 있어 규칙 자체가 불필요하다.
**Fix:** 규칙을 제거하거나, 향후 "텍스트도 같이 보여주는 편집 UX"로 바꿀 계획이라면 주석으로 의도를 남긴다.

### IN-02: Phase 1 dev 글로벌 노출이 정리되지 않았다

**File:** `js/app.js:6-12`
**Issue:** 코멘트에 "Phase 2 도입 시 재검토 (제거 또는 축소)"라고 적혀 있는데, Phase 2 작업 후에도 `window.dateKey/defaultState/load/save/STORAGE_KEY`가 그대로 노출되어 있다. 의사결정 흔적이 없다(제거 결정도, 유지 결정도 코드/문서에 기록되지 않음).
**Fix:** Phase 2 검증 체크리스트가 더 이상 이 글로벌을 요구하지 않는다면 삭제한다. 유지하기로 했다면 코멘트를 "Phase 2 검증에서도 사용하므로 유지"로 갱신한다.

### IN-03: form 내부 input 참조에 ID/명시 핸들 미사용

**File:** `js/app.js:65`
**Issue:** `buildForm`이 `input.id = 'todo-input'`을 설정하지만 submit 핸들러는 `form.querySelector('input')`로 다시 조회한다. 빌드 시 직접 참조를 넘기면 selector 오타/구조 변경에 더 강해진다.
**Fix:** `buildForm`이 `{ form, input, addBtn }`을 반환하거나 클로저에 캡처한다.

### IN-04: `keyCode === 229` 가드는 `isComposing`과 중복

**File:** `js/app.js:95`
**Issue:** 모던 브라우저(Chrome/Edge/Firefox/Safari 현행)는 모두 `KeyboardEvent.isComposing`을 지원하므로 `keyCode === 229`는 사실상 dead branch다. STACK 문서가 모던 브라우저 전제이므로 제거해도 무방하다.
**Fix:** `if (e.isComposing) return;`만 남긴다. (Pitfall 문서 링크 주석은 남겨도 된다.)

---

_Reviewed: 2026-05-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
