# Phase 2: Todo CRUD (against today) — Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 4 (1 NEW, 3 MODIFY)
**Analogs found:** 4 / 4 — Phase 1 산출물이 모든 신규 파일에 대해 1차 analog로 작동.

## File Classification

| 파일 | New/Modified | Role | Data Flow | Closest Analog | Match Quality |
|------|-------------|------|-----------|----------------|---------------|
| `js/todos.js` | NEW | state helpers + view module | transform (immutable state) + render (DOM) | `js/storage.js` (named export 모듈 형태) + `js/dateKey.js` (순수 함수 시그니처) | role-match (헬퍼) / doc-only (DOM 렌더는 RESEARCH §Pattern 3) |
| `js/app.js` | MODIFY | bootstrap / controller | event-driven (DOMContentLoaded → 위임 listener) | `js/app.js` (Phase 1 thin bootstrap) | exact (자기 자신을 점진 확장) |
| `css/styles.css` | MODIFY | view tokens / state classes | n/a | `css/styles.css` (Phase 1 골격, `:root` placeholder) | exact (자기 자신에 추가) |
| `index.html` | (likely no change) | entry shell | request-response | `index.html` (Phase 1 셸) | exact — `<main id="app">` 빈 mount 타겟 그대로 사용 |

## Pattern Assignments

### `js/todos.js` (NEW — state helpers + view, transform/render)

**Analog #1 (모듈 형태):** `js/storage.js`
- 같은 패턴 차용 항목: 파일 상단 한 줄 주석으로 모듈 책임 선언, named exports만 사용 (default export 금지), 순수 함수 + try/catch 없음(헬퍼는 throw 안 하는 함수만 — storage가 try/catch를 책임지듯 todos는 immutable transform만 책임).

**Imports/Header pattern** (`js/storage.js` lines 1-2 미러):
```js
// Phase 2: todos 도메인 모듈 — 순수 immutable state 헬퍼 + DOM 렌더.
// localStorage I/O는 하지 않는다 (storage.js 경계 유지). dateKey 변환도 하지 않는다 (호출처가 key를 인자로 전달).
```

**Named export 시그니처 패턴** (`js/storage.js` lines 4-30 — 모두 `export function NAME(...)` 단일 줄 시그니처):
```js
export function getTodosForDate(state, key) { ... }
export function addTodo(state, key, text) { ... }
export function toggleTodo(state, key, id) { ... }
export function editTodo(state, key, id, text) { ... }
export function removeTodo(state, key, id) { ... }
export function renderTodoList(container, todos, editingId) { ... }
```
- `KEY/defaultState/load/save` 4종이 한 파일에 평면 export된 storage.js와 동일한 모듈 형태.
- default export 0건, 클래스 0건. (Phase 1 PATTERNS "Module export 규칙" 일관 유지.)

**Immutable transform pattern** (RESEARCH §Pattern 1 — `02-RESEARCH.md` lines 215-273):
```js
export function addTodo(state, key, text) {
  const trimmed = text.trim();
  if (!trimmed) return state; // no-op idempotent
  const todo = {
    id: crypto.randomUUID(),
    text: trimmed,
    done: false,
    createdAt: Date.now(),
  };
  const prev = state.todosByDate[key] ?? [];
  return {
    ...state,
    todosByDate: { ...state.todosByDate, [key]: [...prev, todo] },
  };
}
```
- 모든 헬퍼는 새 state 반환 (호출처가 `save(newState)` 책임).
- `state.todosByDate[key]`가 비어있으면 `?? []` — Phase 1 `defaultState()`가 빈 객체를 보장하므로 안전.
- `addTodo`만 부수 입력(`crypto.randomUUID`, `Date.now`) — 나머지 헬퍼는 결정적.

**정렬 패턴** (RESEARCH Pitfall 5 — line 528):
```js
return [...list].sort((a, b) => a.createdAt - b.createdAt);
```
- 비교 함수 필수. ES2019+ stable sort 활용. `.sort()` 단독 호출 금지.

**DOM 렌더 패턴** (RESEARCH §Pattern 3 — lines 397-451):
- `replaceChildren(...)` 단일 호출로 컨테이너 통째 교체. `innerHTML` / `outerHTML` 0건.
- 빈 상태 분기: `replaceChildren(p)` (단일 `<p class="empty">`).
- 리스트 분기: `replaceChildren(ul)` (단일 `<ul>` 안에 `<li>×N`).
- 모든 사용자 텍스트는 `el.textContent = t.text` 또는 `input.value = t.text` (property 할당은 HTML 파싱 우회).
- `<li>`에 `dataset.id = t.id` — 위임 핸들러가 `closest('li').dataset.id`로 추출.
- `<li>`에 `t.done && classList.add('done')`, `isEditing && classList.add('editing')`.

**금지 패턴 (Phase 1 진실문 + Phase 2 신규):**
- `localStorage.*` 직접 호출 — Phase 1 경계 (PATTERNS "localStorage 접근"). `js/storage.js` 외부 0건 유지.
- `innerHTML` / `outerHTML` 좌변 — RESEARCH Anti-Patterns 1줄.
- `toISOString` / `Date.UTC` / `toJSON` — Phase 1 진실문. todos.js는 createdAt 비교만 (Number).
- `dateKey` import — 호출처(`app.js`)가 `TODAY`를 인자로 전달, `getTodosForDate(state, key)` 시그니처가 Phase 3에서 그대로 재사용 (RESEARCH lines 277-278).
- `.sort()` 비교 함수 누락 — Pitfall 5.

---

### `js/app.js` (MODIFY — bootstrap, event-driven)

**Analog:** 자기 자신 (`js/app.js` Phase 1 상태 — 13줄). Phase 2 변경은 **append-only + window 노출 유지**.

**기존 상태 보존** (`js/app.js` lines 1-12):
```js
import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';

window.dateKey = dateKey;
window.defaultState = defaultState;
window.load = load;
window.save = save;
window.STORAGE_KEY = KEY;

console.info('[hansung-todo] foundation loaded', { today: dateKey() });
```
- **유지:** `window.*` 노출 (CONTEXT "잠정 유지"). `console.info` 부트 로그.
- **추가:** `import { ... } from './todos.js';` 1줄. `TODAY` 캡처. DOM 마운트. 위임 listener.
- **금지:** `dateKey`/`storage` import 라인 수정. 기존 window 노출 제거.

**Imports 추가 패턴** (Phase 1 PATTERNS "ESM 임포트 규칙" + RESEARCH lines 290-292):
```js
import {
  getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo, renderTodoList,
} from './todos.js';
```
- 상대경로 + `.js` 확장자 (Phase 1 진실문).
- multi-line named import — storage.js에서 4종 import한 기존 형태와 동일 스타일.

**TODAY 캡처 + 모듈 변수 패턴** (CONTEXT "app.js 변경 범위" + RESEARCH lines 294-296):
```js
const TODAY = dateKey();
let state = load();
let editingId = null;  // transient UI state — store 외부 (RESEARCH Anti-Pattern 5)
```
- `TODAY`는 `const` (Phase 2는 자정 넘김 미처리 — Phase 3 selectedDate 도입 시 재평가).
- `state`는 `let` — `commit()`이 재할당.
- `editingId`는 `let` — `state.todosByDate`에 절대 저장하지 않음 (RESEARCH Anti-Pattern: "save 페이로드에 transient UI 상태 새어나감").

**DOM 마운트 패턴 (`<main id="app">` 동적 빌드, 1회만)** (CONTEXT "마크업 추가 위치"):
```js
const root = document.getElementById('app');
const form = buildForm();              // <form><input id="todo-input"><button>추가</button></form>
const listContainer = buildListContainer();  // <div id="todo-list"></div>
root.replaceChildren(form, listContainer);
```
- 정적 마크업 변경 0 — `index.html`은 그대로 (Phase 3 마이그레이션 비용 회피).
- `replaceChildren(form, listContainer)`로 한 번에 마운트 — `innerHTML` 금지 일관 유지.
- 폼 컨테이너는 한 번 만들고 절대 재렌더하지 않음. listContainer만 `renderTodoList`가 교체.

**commit / render 헬퍼 패턴** (CONTEXT "save() 실패 처리" + RESEARCH lines 304-315):
```js
function commit(nextState) {
  state = nextState;
  if (!save(state)) {
    console.warn('[hansung-todo] save failed; mutation kept in memory');
  }
  render();
}

function render() {
  const todos = getTodosForDate(state, TODAY);
  renderTodoList(listContainer, todos, editingId);
}
```
- `save()` boolean 반환을 변수로 받지 않고 `if (!save(state))`로 직접 분기 — 실패해도 in-memory 갱신은 유지(낙관적).
- 메시지 prefix `[hansung-todo]` — `app.js` line 12 `console.info` prefix 동일.

**위임 이벤트 패턴** (RESEARCH §Pattern 2 — lines 318-353; Pitfall 1, 2, 3 통합):
```js
// 체크박스: change 이벤트 (click 아님 — Pitfall 3)
listContainer.addEventListener('change', (e) => {
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;
  const id = cb.closest('li')?.dataset.id;
  if (!id) return;
  commit(toggleTodo(state, TODAY, id));
});

// 클릭: 삭제 / 편집 시작
listContainer.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.closest('li')?.dataset.id;
  if (!id) return;
  if (t.matches('.todo-remove')) commit(removeTodo(state, TODAY, id));
  else if (t.matches('.todo-edit') || t.matches('.todo-text')) startEdit(id);
});

// 편집 input keydown — 한국어 IME 가드 (Pitfall 1)
listContainer.addEventListener('keydown', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') { e.preventDefault(); commitEdit(input); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
});

// 편집 input focusout — 재진입 가드 (Pitfall 2)
listContainer.addEventListener('focusout', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (editingId == null) return;
  commitEdit(input);
});
```
- 4개 listener 모두 `listContainer` 단일 노드에 1회 등록 — `replaceChildren()`가 자식만 교체하므로 listener 보존 (RESEARCH Pattern 2 핵심).
- `instanceof HTMLInputElement` + `matches('.class')` 이중 가드 — non-input 타깃에 대한 안전 fallthrough.

**편집 라이프사이클 패턴** (RESEARCH lines 355-370 + Pitfall 2):
```js
function startEdit(id) {
  editingId = id;
  render();
  const input = listContainer.querySelector('.todo-edit-input');
  if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}
function commitEdit(input) {
  const id = editingId; editingId = null;       // ← 가드 먼저 풀어 focusout 재진입 차단
  if (id == null) return;
  commit(editTodo(state, TODAY, id, input.value));
}
function cancelEdit() {
  editingId = null;
  render();
}
```
- **`editingId = null`을 commit 진입 첫 줄에 둔다** — Pitfall 2 (focusout 재진입 무한 루프).
- `editTodo` 헬퍼가 빈/공백을 거부하면 state 그대로 반환 → render는 원래 텍스트 복원 (CONTEXT "빈 문자열/공백만 → 저장 거부").

**추가 폼 패턴** (RESEARCH §"<form> 기반" — lines 373-381; Pitfall 1):
```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim()) return;
  commit(addTodo(state, TODAY, input.value));
  input.value = '';
  input.focus();
});
```
- `<form>` + `submit` — 브라우저가 IME 도중 Enter는 submit으로 변환하지 않음 (한국어 IME 가드 자동).
- 별도 `keydown Enter` 리스너 금지 — Pitfall 1 회피.
- 마지막 `input.focus()` — CONTEXT "추가 후: input 값 비우기 + focus 유지".

**최초 렌더 호출:**
```js
render(); // 페이지 로드 시 1회
```

---

### `css/styles.css` (MODIFY — view tokens / state classes)

**Analog:** 자기 자신 (`css/styles.css` Phase 1 상태 — 4줄, `:root` placeholder만).

**기존 상태 보존** (`css/styles.css` lines 1-4):
```css
/* Phase 1: 정적 자산 구조(DEL-02) 충족용 골격. 본격 스타일은 Phase 4 (STYL-01). */
:root {
  /* design tokens placeholder — Phase 4에서 채움 */
}
```
- **유지:** Phase 1 주석과 `:root` 블록. 토큰을 추가하지 말 것 (Phase 4 STYL-01 범위).
- **추가:** `.done`, `.empty`, `.editing` 3종 미니멀 룰만.

**미니멀 state 룰 패턴** (CONTEXT "수정 대상" + STYL-02 lock):
```css
/* Phase 2: todo 행 상태 시각 구분(미니멀). 본격 폴리시는 Phase 4 (STYL-01). */
.todo-list .done .todo-text {
  text-decoration: line-through;
  color: #999;
}
.empty {
  color: #999;
}
.editing .todo-text {
  display: none;  /* 편집 모드에서 span 숨김 — input이 같은 자리에 노출됨 */
}
```
- 디자인 토큰 / 애니메이션 / 그림자 / spacing scale **금지** — Phase 4 영역.
- 컬러 hex 직접 사용 OK (Phase 4가 토큰화 책임). 인라인 색상 2-3개 한정.
- `.done`은 `<li>`에, `.todo-text`는 `<span>`에 — `js/todos.js`의 마크업 합의와 일치 (RESEARCH §Pattern 3).

---

### `index.html` (likely no change)

**Analog:** 자기 자신 (Phase 1 13줄 그대로).

**유지 사유** (CONTEXT "마크업 추가 위치"):
- `<main id="app"><!-- ... --></main>` 빈 mount 타겟 그대로.
- `app.js`가 동적으로 폼 + 리스트 컨테이너를 마운트 — 정적 마크업 추가 시 Phase 3 캘린더 도입 시 마이그레이션 비용 발생.
- **변경 가능 시나리오:** `<title>`을 "Hansung Todo — 오늘 할 일"로 살짝 수정 정도 (선택). 그 외 구조 변경 0.

---

## Shared Patterns

### Storage 경계 유지
**Source:** Phase 1 PATTERNS "localStorage 접근" + `js/storage.js`
**Apply to:** `js/todos.js`, `js/app.js`
- `localStorage.*` 직접 호출은 `js/storage.js` 안에서만. todos.js는 `KEY` 상수도 import 안 함 — `load`/`save`만 import.
- app.js는 `save(state)` 호출만, raw `localStorage` 0건.
- **검증:** `grep -r "localStorage\." js/ | grep -v js/storage.js` → 0건.

### ESM 임포트 규칙
**Source:** Phase 1 PATTERNS "모듈 시스템" + `js/app.js` lines 1-2
**Apply to:** `js/todos.js`, `js/app.js`
- 상대경로 + `.js` 확장자 (`./todos.js`, `./storage.js`, `./dateKey.js`).
- bare specifier 금지 (`import 'todos'` ✗).
- default export 금지 — named exports만.

### dateKey 단일 진입점
**Source:** Phase 1 PATTERNS "날짜 키 표현" + `js/dateKey.js`
**Apply to:** `js/app.js` (`TODAY` 캡처 1회)
- `dateKey()` 함수 통과만 — 직접 문자열 조립 금지.
- todos.js는 `dateKey` import 안 함 (호출처가 key를 인자로).
- `toISOString` / `toJSON` / `Date.UTC` 0건 유지 (Phase 1 진실문).

### XSS 방어 (textContent-only)
**Source:** Phase 1 PATTERNS "XSS 사전 방어" + RESEARCH §Pattern 3
**Apply to:** `js/todos.js` (모든 사용자 텍스트 표시)
- `el.textContent = t.text` 또는 `input.value = t.text` (property).
- `el.innerHTML = ...` / `el.outerHTML = ...` 좌변 0건.
- 컨테이너 청소는 항상 `replaceChildren(...)` — 수동 firstChild 루프 / `innerHTML = ''` 둘 다 금지.
- **검증:** `grep -rE "innerHTML\s*=" js/` → 0건. (Phase 1 진실문 유지 + Phase 2 verify #10).

### 위임 이벤트 + 단일 컨테이너
**Source:** RESEARCH §Pattern 2
**Apply to:** `js/app.js`
- 리스트 컨테이너 1개에 listener 4종(change/click/keydown/focusout) 등록.
- `replaceChildren()` 후에도 컨테이너 자체는 살아있어 listener 보존.
- per-`<li>` listener 추가 금지 (Anti-Pattern).

### `console.warn` prefix
**Source:** `js/app.js` line 12 (`console.info('[hansung-todo] foundation loaded', ...)`)
**Apply to:** `js/app.js` `commit()` 실패 분기
- 모든 콘솔 메시지는 `[hansung-todo]` prefix — Phase 1 부트 로그와 일관.
- `commit()` 내 `console.warn('[hansung-todo] save failed; mutation kept in memory')` (CONTEXT 잠금 메시지).

### Phase 4 폴리시 범위 보존
**Source:** CONTEXT "deferred_ideas" + Phase 1 STYL-01 transfer
**Apply to:** `css/styles.css`
- 디자인 토큰(`--color-*`, `--space-*`) 추가 금지.
- 애니메이션 / transition / shadow / 폰트 임포트 금지.
- 미니멀 3-룰(`.done`, `.empty`, `.editing`)만.

---

## No Analog Found

| 파일 / 기능 | 대체 참조 |
|------------|-----------|
| `renderTodoList` / `renderTodoItem` DOM 빌드 | RESEARCH §Pattern 3 (lines 397-451) — 첫 DOM-heavy 렌더 함수, 코드베이스에 선행 analog 없음 |
| 위임 이벤트 4종(change/click/keydown/focusout) | RESEARCH §Pattern 2 (lines 318-353) — Phase 1엔 이벤트 0건 |
| 인라인 편집 라이프사이클 | RESEARCH lines 355-370 + Pitfall 2 — 신규 도입 |
| 한국어 IME 가드 | RESEARCH Pitfall 1 (lines 482-493) + `<form submit>` 패턴 — 신규 도입 |

위 4개 모두 **Phase 2가 첫 도입**이라 코드베이스 analog 없음. 플래너는 RESEARCH의 코드 발췌를 직접 인용해 plan action을 작성하고, Phase 3 이후에는 todos.js / app.js가 새로운 analog가 된다.

---

## Metadata

**Analog search scope:** 리포 전체 (`js/`, `css/`, `index.html`, `.planning/phases/01-foundation/`).
**Files scanned:** 7 (Phase 1 산출물 5종 + 02-CONTEXT.md + 02-RESEARCH.md + 01-PATTERNS.md + 01-01-SUMMARY.md).
**Pattern extraction date:** 2026-05-03

## PATTERN MAPPING COMPLETE
