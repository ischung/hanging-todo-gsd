# Phase 2: Todo CRUD (against today) — Research

**Researched:** 2026-05-03
**Domain:** 바닐라 JS 단일 파일 todo 모듈 (state 헬퍼 + 전체 리스트 재렌더 + 인라인 편집) on top of Phase 1 storage/dateKey
**Confidence:** HIGH

## Summary

Phase 2는 코드 구현 난이도가 매우 낮은 페이즈다. CONTEXT.md가 모든 핵심 결정을 잠갔기 때문에(인라인 편집, 즉시 삭제, `js/todos.js` 단일 파일, 전체 리스트 재렌더, `<main id="app">` 동적 마운트), 본 연구의 가치는 **"실수하기 쉬운 기술적 함정"** 다섯 곳을 미리 식별해 plan task의 verify 단계에 박아 넣는 데 있다:

1. **한국어 IME composition** — `keydown` Enter 핸들러가 한글 조합 도중에 실수로 발화한다. `isComposing` / `keyCode === 229` 체크 필수.
2. **focus 손실로 인한 자동 저장 무한 루프** — 인라인 편집 input의 `blur → save → 전체 재렌더` 흐름이 `replaceChildren()`으로 input 자신을 제거하면서 또 한 번 blur를 발화시킬 수 있음. "한 번에 한 행만 편집" 결정과 결합해 **state 측 `editingId` 플래그 또는 핸들러 idempotent 가드** 필요.
3. **`<input type=checkbox>` 토글 신뢰성** — `click` 이벤트와 `change` 이벤트는 다르며, `change`만 사용해야 키보드(Space)에서도 동작하고 `event.preventDefault()` 사이드이펙트가 없다.
4. **`crypto.randomUUID()` secure-context 함정** — HTTP origin에서는 `undefined`. Phase 1이 `localhost`로 잠겼으므로 OK이지만 검증에서 명시적으로 확인 필요.
5. **innerHTML grep gate** — `replaceChildren()` + `createElement` + `textContent`만으로 list/empty-state 전환을 모두 처리할 수 있어 **innerHTML 0건이 검증 가능한 진실문**으로 성립.

**Primary recommendation:** `js/todos.js` 안에서 (a) 순수 immutable state 헬퍼 5종, (b) 단일 `renderTodoList(container, todos, handlers, editingId)` 함수, (c) `app.js`에서 한 번 등록되는 위임 이벤트 리스너(`change` / `click` / `dblclick`)를 명확히 분리한다. 이벤트 위임은 컨테이너 1개에 거는 것을 권장(`replaceChildren` 후에도 동일 컨테이너 유지).

## User Constraints (from CONTEXT.md)

### Locked Decisions

**수정 인터랙션 — 인라인 편집:**
- 텍스트 영역 클릭 또는 ✎ 버튼 → 같은 자리에서 `<span>`이 `<input type="text">`로 치환.
- Enter 또는 blur → 저장 / Esc → 취소 (편집 전 텍스트로 복원).
- 빈/공백만 입력 → 저장 거부, 원래 텍스트 유지 (삭제로 간주하지 않음).
- `<dialog>` 모달 도입 안 함.
- 한 번에 한 todo만 편집 — 다른 행 편집 시작하면 진행 중 편집 자동 저장.

**삭제 인터랙션 — 즉시 삭제:**
- 🗑 클릭 = 즉시 mutation + 재렌더. `confirm()` 안 씀, undo 토스트 없음(v2).

**모듈 + 렌더 전략 — `js/todos.js` 단일 파일 + 전체 리스트 재렌더:**
- 순수 헬퍼: `getTodosForDate / addTodo / toggleTodo / editTodo / removeTodo` (모두 새 state 반환).
- `addTodo` 내부에서 `crypto.randomUUID()` + `Date.now()`로 `{id, text, done:false, createdAt}` 생성.
- 어떤 변경이든 `getTodosForDate(state, today)` → `renderTodoList(container, todos, handlers)` 전체 재호출.
- 정렬: `getTodosForDate`가 항상 `createdAt` 오름차순 안정 정렬 보장.
- DOM 빌드는 `replaceChildren()` 또는 `textContent = ''` + append. **`innerHTML` 절대 금지.**
- `render.js` / `dom.js` 분리는 Phase 2에서 하지 않음.

**추가 UX:** `<input id="todo-input">` + `<button id="todo-add">추가</button>`. Enter 또는 버튼 동일 핸들러. `text.trim() === ''` → 무시(알림 없음). 추가 후 input clear + focus 유지. 길이 제한 없음.

**토글 UX:** `<input type="checkbox">` + `change` 이벤트. 시각 구분은 `li.done` 클래스 + CSS `text-decoration: line-through` + 흐린 색상.

**빈 상태:** `<p class="empty">아직 할 일이 없습니다.</p>` (날짜 비종속 문구).

**XSS:** todo 텍스트는 항상 `textContent` / `createTextNode`. `innerHTML` / `outerHTML` 사용 0건.

**`app.js` 변경 범위:**
- `const TODAY = dateKey();` — 모듈 로드 시점 1회 캡처.
- DOM ready 후 `<main id="app">` 안에 폼 + 리스트 컨테이너 동적 생성(정적 마크업 추가 최소).
- 핸들러 4개에서: state mutation → `save(state)` → 전체 재렌더.
- `window.dateKey/load/save/...` 노출 **Phase 2에서도 잠정 유지** (Phase 3에서 재검토).

**`save()` 실패 처리:** boolean 반환값을 변수로 받되 UX 노출 없음. 실패해도 in-memory state는 갱신(낙관적), `console.warn('[hansung-todo] save failed; mutation kept in memory')`만. Phase 4 토스트의 hook이 됨.

**파일 구조 (Phase 2 종료 시점):**
```
js/
  dateKey.js     (변경 없음)
  storage.js     (변경 없음)
  todos.js       (NEW)
  app.js         (수정 — 부트스트랩 확장)
css/
  styles.css     (수정 — .done strikethrough/회색, .empty 미니멀 톤만)
index.html       (변경 없음 또는 최소)
```

### Claude's Discretion

CONTEXT.md에서 명시적으로 잠그지 않은 영역(planner/executor가 본 연구의 권고를 적용해 결정):

- 이벤트 위임 vs per-row listener — 본 연구는 **컨테이너 위임 권고**.
- `editingId`를 state에 두느냐 / `app.js` 모듈 변수로 두느냐 — 본 연구는 **모듈 변수 권고** (저장하지 않는 transient UI state이므로 store 오염 회피).
- 한국어 IME 가드 구현 방식(`isComposing` 우선, `keyCode 229` 폴백).
- `<button class="todo-edit">✎</button>` / `<button class="todo-remove">🗑</button>` — 마크업 디테일.
- `tests.html` 자동화 추가 여부 — 본 연구는 **순수 헬퍼만 자동, DOM/IME/XSS는 수동 verify 권고**.

### Deferred Ideas (OUT OF SCOPE)

- Undo 토스트 / 삭제됨 스낵바 → v2 (POL).
- Storage 실패 토스트 → Phase 4 (PERS-04).
- 본격 done 스타일(애니메이션, 취소선 두께, 아이콘 모핑) → Phase 4 (STYL-01).
- 캘린더 그리드 / 날짜 선택 / 카운트 배지 / 사람 친화 헤더 → Phase 3.
- `<dialog>` 모달 패턴 → Phase 4 폴리시(필요 시).
- 키보드 네비게이션 / ARIA 라벨 → v2 (POL-03/04).
- Todo 텍스트 max length → v2.
- 자정 넘김 시 TODAY 자동 갱신 → Phase 3.
- JSON export/import → v2 (POL-01).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TODO-01 | 새 todo 텍스트 추가 (Enter 또는 추가 버튼) | "Add UX 패턴" + "한국어 IME 가드" 섹션 |
| TODO-02 | `{id, text, done, createdAt}` 구조 | "Todo 생성 패턴" — `crypto.randomUUID()` + `Date.now()` |
| TODO-03 | 체크박스 토글 + 시각 구분 | "체크박스 토글 신뢰성" 섹션 (`change` 이벤트 사용) |
| TODO-04 | 텍스트 수정 (인라인) | "인라인 편집 라이프사이클" 섹션 + blur/Enter/Esc 핸들링 |
| TODO-05 | 즉시 삭제 | 위임 이벤트 + immutable filter 헬퍼 |
| TODO-06 | createdAt 오름차순 안정 정렬 | "안정 정렬 보장" 섹션 — `Array.prototype.sort` 안정성 + tie-breaker |
| TODO-07 | 빈 상태 메시지 | "Empty-state ↔ List 전환" 섹션 |
| PERS-03 | 새로고침 후 데이터 유지 | Phase 1 `save()/load()` 재사용 + 모든 mutation 직후 `save()` |
| STYL-02 | textContent-only 렌더 | "XSS 방지 + grep gate" 섹션 |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Todo 입력/검증 (trim, 빈 거부) | Browser (DOM) | — | 클라이언트 전용 정적 앱, 서버 없음 |
| Immutable state 변환 | Browser (Module: `js/todos.js`) | — | 순수 함수 — DOM과 storage 사이의 logic seam |
| DOM 렌더 (list, empty, 편집 input) | Browser (Module: `js/todos.js` `renderTodoList`) | — | View tier |
| 이벤트 와이어링 (change/click/keydown) | Browser (Module: `js/app.js`) | — | Controller seam — 핸들러는 헬퍼 호출 후 `save()` + 재렌더 |
| 영속화 | Browser (Module: `js/storage.js`) | — | Phase 1에서 잠긴 단일 어댑터 — Phase 2는 import만 |
| 날짜 키 캡처 | Browser (Module: `js/dateKey.js`) | — | Phase 1에서 잠긴 헬퍼 |

**왜 이 분할이 옳은가:** 정적 앱이므로 모든 tier가 Browser다. 진짜 분할은 `js/` 안의 **모듈 책임 경계**다. CONTEXT가 잠근 "`js/todos.js` 단일 파일 + 헬퍼/렌더 함께"는 v1 규모(수십 todos/날짜)에서 합리적이며, Phase 3 calendar 도입 시 `dom.js` 분리를 재평가하는 것이 surgical하다.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native DOM (HTMLElement, document) | Living standard | 마크업 빌드, 이벤트 리스너 | Vanilla 제약 [CITED: CLAUDE.md project] |
| `crypto.randomUUID()` | Web Crypto API, Baseline Widely Available | todo `id` 생성 | secure context(HTTPS / localhost)에서 동작 [VERIFIED: MDN] |
| `Date.now()` | ES baseline | `createdAt` 타임스탬프 (epoch ms) | `Date` 객체 JSON 저장 회피 [CITED: PITFALLS.md Performance Traps] |
| `Element.replaceChildren()` | Baseline Widely Available since 2022 | DOM 컨테이너 청소 + 재구성 | `innerHTML = ''` 회피, 단일 호출 atomic [VERIFIED: MDN] |
| `Element.textContent` | Universal | 사용자 입력 안전 표시 | XSS 방지 [CITED: PITFALLS.md Pitfall 2] |
| `InputEvent.isComposing` | Baseline Widely Available | 한국어 IME 조합 중 Enter 가드 | composition 이벤트 표준 속성 [VERIFIED: MDN] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (없음) | — | — | Phase 2는 추가 의존성 0건 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `replaceChildren()` | `while (c.firstChild) c.removeChild(c.firstChild)` | 더 verbose, 동일 결과. `replaceChildren()`이 더 명료 + atomic. |
| `crypto.randomUUID()` | `Date.now() + Math.random().toString(36)` | secure-context 의존 없음. 그러나 충돌 가능성 0이 아니고, Phase 1 컨텍스트(`localhost`)에서 `randomUUID`이 동작하므로 불필요. |
| 컨테이너 이벤트 위임 | `<li>`마다 listener 추가 | 전체 재렌더 전략에서 매 렌더마다 listener 재부착이 낭비. **위임 권고**. |
| `addEventListener('change', ...)` 위임 | per-checkbox listener | 전체 재렌더 후에도 컨테이너만 살아있으면 위임이 자동 작동. |

**Installation:**
```bash
# 추가 패키지 0건 — Phase 2도 빌드/번들/네트워크 의존 없음.
```

**Version verification:** N/A — 외부 패키지 추가 0건.

## Architecture Patterns

### System Architecture Diagram

```
[User Input]
    │
    ├─[Enter / Add 버튼 클릭]─► app.js: addHandler(text)
    │                              │ trim → 빈이면 return
    │                              │ todos.addTodo(state, TODAY, text) ──► 새 state
    │                              │ save(state) ──► (boolean, warn on false)
    │                              │ render() ───────────────────────────┐
    │                              ▼                                      │
    │                          [in-memory state]                          │
    │                                                                     │
    ├─[checkbox change]─────► app.js: 위임 listener (event.target.matches('.todo-checkbox'))
    │                              │ id = li.dataset.id
    │                              │ todos.toggleTodo(state, TODAY, id) ─► 새 state ──┤
    │                              │ save + render                                     │
    │                                                                                  │
    ├─[✎ click / ✏ dblclick]──► app.js: editingId = id; render()                       │
    │                              ▼                                                   │
    │                          [편집 모드 input 노출]                                  │
    │                              │                                                   │
    │                              ├─[Enter / blur]─► commit (todos.editTodo) + render │
    │                              ├─[Esc]──────────► cancel: editingId=null + render  │
    │                              │                                                   │
    └─[🗑 click]──────────► app.js: 위임 listener                                       │
                                   │ todos.removeTodo(state, TODAY, id) ──► 새 state ──┤
                                   │ save + render                                     │
                                                                                       ▼
                                                            renderTodoList(container, todos, editingId)
                                                                   │
                                                                   ├─ todos.length === 0 → <p class=empty>
                                                                   └─ else → <ul>{<li>×N}</ul>
```

데이터 흐름 핵심:
1. **단방향:** Event → handler → 헬퍼(immutable) → save → render. 양방향 바인딩 없음.
2. **재렌더 단위:** 폼 컨테이너는 한 번 만들고 절대 재렌더하지 않음. 리스트 컨테이너만 `replaceChildren()`으로 통째 교체.
3. **`editingId`는 state 외부:** `app.js` 모듈 스코프 변수. `state.todosByDate` 직렬화에는 들어가지 않음.

### Recommended Project Structure

```
js/
  dateKey.js        # Phase 1 — 변경 없음
  storage.js        # Phase 1 — 변경 없음
  todos.js          # NEW — 헬퍼 5종 + renderTodoList
  app.js            # 수정 — TODAY 캡처 + DOM 마운트 + 위임 핸들러 와이어링
css/
  styles.css        # 수정 — .done + .empty + .editing 미니멀
index.html          # 변경 없음 (`<main id="app">` 빈 상태 유지)
```

### Pattern 1: Immutable State 헬퍼 (todos.js)

**What:** 모든 mutation은 새 state 객체를 반환. 호출처가 `save(newState)` + 재할당.
**When to use:** Phase 2의 5개 헬퍼 전부.
**Example:**

```js
// js/todos.js
import { dateKey } from './dateKey.js';

export function getTodosForDate(state, key) {
  const list = state.todosByDate[key] ?? [];
  // 안정 정렬: 동일 createdAt 시 원래 순서 유지 (Array.sort는 ES2019+ stable).
  return [...list].sort((a, b) => a.createdAt - b.createdAt);
}

export function addTodo(state, key, text) {
  const trimmed = text.trim();
  if (!trimmed) return state; // no-op (호출처가 이미 가드해도 idempotent)
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

export function toggleTodo(state, key, id) {
  const prev = state.todosByDate[key] ?? [];
  return {
    ...state,
    todosByDate: {
      ...state.todosByDate,
      [key]: prev.map(t => t.id === id ? { ...t, done: !t.done } : t),
    },
  };
}

export function editTodo(state, key, id, text) {
  const trimmed = text.trim();
  if (!trimmed) return state; // 빈 문자열 거부
  const prev = state.todosByDate[key] ?? [];
  return {
    ...state,
    todosByDate: {
      ...state.todosByDate,
      [key]: prev.map(t => t.id === id ? { ...t, text: trimmed } : t),
    },
  };
}

export function removeTodo(state, key, id) {
  const prev = state.todosByDate[key] ?? [];
  return {
    ...state,
    todosByDate: {
      ...state.todosByDate,
      [key]: prev.filter(t => t.id !== id),
    },
  };
}
```

**핵심 규칙:**
- `dateKey` import는 `todos.js`에서 직접 사용하지 않음 — `app.js`가 `TODAY`를 인자로 전달. `getTodosForDate(state, key)` 시그니처가 Phase 3에서 그대로 재사용된다.
- `state.todosByDate[key]`가 빈 배열이 됐을 때 키를 prune할지(ARCHITECTURE.md 권고) 여부는 v1 데이터 크기에서 무의미 → **prune 안 함**으로 결정 (단순성 우선).

### Pattern 2: 단일 컨테이너 위임 이벤트 (app.js)

**What:** 리스트 컨테이너 1개에 `change` / `click` / `keydown` / `focusout` 리스너 한 번만 등록. `replaceChildren()` 후에도 컨테이너 자체는 살아있으므로 listener 보존.
**When to use:** 전체 재렌더 + per-row 액션 조합 시 표준.
**Example:**

```js
// js/app.js (Phase 2 추가분 골격)
import { dateKey } from './dateKey.js';
import { load, save } from './storage.js';
import {
  getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo,
} from './todos.js';

const TODAY = dateKey();
let state = load();
let editingId = null;  // transient UI state — store 외부

const root = document.getElementById('app');
// 1회만: 폼 + 리스트 컨테이너 빌드
const form = buildForm();
const listContainer = buildListContainer();
root.replaceChildren(form, listContainer);

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

// === 위임 ===
listContainer.addEventListener('change', (e) => {
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;
  const id = cb.closest('li')?.dataset.id;
  if (!id) return;
  commit(toggleTodo(state, TODAY, id));
});

listContainer.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const li = t.closest('li');
  const id = li?.dataset.id;
  if (!id) return;
  if (t.matches('.todo-remove')) {
    commit(removeTodo(state, TODAY, id));
  } else if (t.matches('.todo-edit') || t.matches('.todo-text')) {
    startEdit(id);
  }
});

// 인라인 편집 입력 — 위임으로 keydown / focusout 모두 처리
listContainer.addEventListener('keydown', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (e.isComposing || e.keyCode === 229) return;  // 한국어 IME 가드
  if (e.key === 'Enter') { e.preventDefault(); commitEdit(input); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
});
listContainer.addEventListener('focusout', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  // 편집 모드를 우리가 막 종료한 직후의 focusout(=재렌더로 input 사라짐)을 무시하기 위해 editingId 가드
  if (editingId == null) return;
  commitEdit(input);
});

function startEdit(id) {
  editingId = id;
  render();
  // 편집 input에 focus + caret end
  const input = listContainer.querySelector('.todo-edit-input');
  if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
}
function commitEdit(input) {
  const id = editingId; editingId = null;       // 가드 먼저 풀어 focusout 재진입 차단
  if (id == null) return;
  commit(editTodo(state, TODAY, id, input.value));  // 빈/공백은 헬퍼가 거부 (state 그대로)
}
function cancelEdit() {
  editingId = null;
  render();
}

// === 추가 폼 ===
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  const text = input.value;
  if (!text.trim()) return;     // 빈/공백만 → 무시 (UI 변화 없음)
  commit(addTodo(state, TODAY, text));
  input.value = '';
  input.focus();                 // 연속 입력 자연스럽게
});

render();
```

**핵심 규칙:**
- 폼은 `<form>`으로 감싸고 `submit` 이벤트로 처리 — Enter/버튼 클릭이 자동으로 동일 경로 통합 (별도 keydown 핸들러 불필요).
- `commit()`이 `save()` 실패 시 `console.warn`만 — CONTEXT.md 결정.
- `editingId`를 `commitEdit` 진입 시점에 즉시 `null`로 비워 focusout 재진입을 방지 (재렌더 도중 input이 DOM에서 제거되며 focusout 한 번 더 발화 가능).

### Pattern 3: `renderTodoList` — empty ↔ list 전환 안전한 단일 진입

**What:** 컨테이너를 `replaceChildren(...nodes)`로 통째 교체. 분기 1: 0개 → `<p class="empty">`. 분기 2: 1+ → `<ul>{<li>×N}</ul>`. 텍스트는 항상 `textContent`.
**When to use:** Phase 2에서 단 한 번 호출되는 view 함수.
**Example:**

```js
// js/todos.js (이어서)
export function renderTodoList(container, todos, editingId) {
  if (todos.length === 0) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '아직 할 일이 없습니다.';
    container.replaceChildren(p);
    return;
  }
  const ul = document.createElement('ul');
  ul.className = 'todo-list';
  for (const t of todos) {
    ul.append(renderTodoItem(t, t.id === editingId));
  }
  container.replaceChildren(ul);
}

function renderTodoItem(t, isEditing) {
  const li = document.createElement('li');
  li.dataset.id = t.id;
  if (t.done) li.classList.add('done');
  if (isEditing) li.classList.add('editing');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'todo-checkbox';
  cb.checked = t.done;

  let body;
  if (isEditing) {
    body = document.createElement('input');
    body.type = 'text';
    body.className = 'todo-edit-input';
    body.value = t.text;        // value는 attribute가 아니라 property — XSS 안전
  } else {
    body = document.createElement('span');
    body.className = 'todo-text';
    body.textContent = t.text;  // XSS 안전
  }

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'todo-edit';
  editBtn.textContent = '✎';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'todo-remove';
  removeBtn.textContent = '🗑';

  li.append(cb, body, editBtn, removeBtn);
  return li;
}
```

**핵심 규칙:**
- `input.value` 할당은 DOM property이고 HTML 파싱을 거치지 않으므로 `<img src=x onerror=...>` 같은 문자열도 literal text로 안전.
- `replaceChildren(...args)`는 컨테이너의 기존 children을 한 번에 교체 — 두 분기 사이의 깜박임을 최소화하고 listener는 컨테이너 자체에 붙어있으므로 보존.

### Anti-Patterns to Avoid

- **`innerHTML += '<li>...</li>'`:** XSS 진입로. CONTEXT.md가 명시적으로 금지. grep gate 0건이 verify 항목.
- **per-`<li>` listener 추가:** 전체 재렌더와 결합 시 메모리/시간 낭비 + GC 압력. 위임으로 대체.
- **`click` 이벤트로 체크박스 토글 처리:** 키보드 Space로는 발화하지 않으므로 접근성 회귀. 항상 `change` 사용.
- **`keydown` Enter 핸들러 단독 사용 (`isComposing` 가드 없이):** 한국어 입력 도중 자모 결합 확정 Enter가 add 트리거를 발화시킨다. `<form submit>` + IME-가드가 정답.
- **`editingId`를 `state.todosByDate`에 저장:** save 페이로드에 transient UI 상태가 새어나감. `app.js` 모듈 변수가 옳은 위치.
- **편집 commit 후 `editingId`를 비우지 않은 채 재렌더:** focusout 재진입으로 두 번 commit. `editingId = null`을 commit 진입 첫 줄에 둔다.
- **`new Date().toISOString().slice(0,10)` 또는 `Date.UTC`:** Phase 1 진실문(`js/`에서 0건) 위반. `dateKey()`만 사용.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID 생성 | `Date.now() + Math.random().toString(36)` | `crypto.randomUUID()` | secure-context (localhost/HTTPS)에서 동작, 충돌 없음. CONTEXT.md 결정. |
| 컨테이너 청소 | 수동 `firstChild` 루프 | `replaceChildren()` | 단일 atomic call. Baseline Widely Available. |
| HTML 안전 escape | 수제 `&<>"'` 치환 함수 | `textContent` / `createTextNode` | escape 누락 위험 0. CONTEXT.md 잠금. |
| 이벤트 dispatch / 발행-구독 | EventTarget 서브클래싱 / EventEmitter | 직접 `commit()` 함수 호출 | Phase 2 규모에선 함수 호출이 가장 단순. ARCHITECTURE.md 패턴은 Phase 3+에서 재평가. |
| 한국어 IME 가드 | 수제 timer / setTimeout debounce | `event.isComposing` + `keyCode === 229` 폴백 | 표준 브라우저 API. 모든 evergreen에서 동작. |
| `<form>` Enter→submit | 별도 keydown 리스너 | `<form>` element + `submit` 이벤트 | 브라우저가 Enter→submit 변환 자동 처리, IME 가드와 자연스럽게 통합. |

**Key insight:** Phase 2는 새로 끌어들일 라이브러리/추상화가 없다. 모든 함정은 **표준 DOM API의 미묘한 분기(`change` vs `click`, `isComposing`, `replaceChildren`, `<form>`)** 안에 있다. 이걸 plan task의 verify 단계에 박아 넣는 것이 본 연구의 최대 가치.

## Common Pitfalls

### Pitfall 1: 한국어 IME 조합 도중 Enter가 add를 발화

**What goes wrong:** "공부하기"를 입력하던 중 마지막 글자 자모를 조합 확정하기 위해 누른 Enter가 todo add 핸들러까지 트리거되어 미완성 텍스트("공부하긱")가 추가된다.
**Why it happens:** 한국어 IME는 자모 조합 확정 시 `keydown { key: 'Enter' }` 이벤트를 발화하지만, 동시에 `event.isComposing === true`이거나 (구형 브라우저는) `event.keyCode === 229`로 신호한다. 이 신호를 체크하지 않은 핸들러는 입력 의도와 todo 추가 의도를 구분 못함.
**How to avoid:**
1. 추가 폼은 `<form>` + `submit` 이벤트로 처리 (브라우저가 IME 도중 Enter는 submit으로 변환하지 않음 — Chrome/Firefox/Safari 표준 동작).
2. 인라인 편집 input의 `keydown Enter`는 `if (e.isComposing || e.keyCode === 229) return;` 가드 필수.
3. 검증: 입력란에 한글 "공부하기" 직접 타이핑 → 마지막 Enter가 commit으로 한 번만 발화.

**Warning signs:**
- 한국어 텍스트 입력 시 마지막 자모가 한 글자 누락된 todo가 추가됨.
- IME 조합 중 Enter로 편집 input이 닫히지만 텍스트가 이전 상태로 보임.

### Pitfall 2: Blur → save → re-render → 재진입 focusout

**What goes wrong:** 편집 input에서 blur 발생 → commitEdit 호출 → 헬퍼로 state 갱신 → render() → `replaceChildren()`이 input을 DOM에서 제거 → input의 focus가 풀리면서 또 한 번 focusout 발화 → commitEdit 두 번째 호출. `editingId`가 살아있으면 두 번째 commit이 무한 루프 또는 어색한 state 전이를 만든다.
**Why it happens:** `replaceChildren()`은 기존 노드를 detach한다. focused 노드가 detach되면 브라우저가 focusout/blur를 추가 발화한다.
**How to avoid:**
1. `commitEdit(input)` 함수의 첫 줄에서 `const id = editingId; editingId = null;`로 가드 먼저 풀기.
2. focusout 위임 핸들러는 `if (editingId == null) return;`으로 재진입 방지.
3. 검증: 편집 input에 텍스트 입력 후 다른 곳 클릭 → state는 한 번만 갱신됐는지 (DevTools에서 `localStorage.getItem('hansung-todo:v1')`을 두 번 비교).

**Warning signs:**
- 편집 commit 후 콘솔 warn이 두 번 찍힘.
- 빈 텍스트로 편집 commit 시 "원래 텍스트 유지" 동작이 두 번 일어나며 잠깐 깜빡임.

### Pitfall 3: `change` vs `click` 이벤트 혼동 (체크박스)

**What goes wrong:** 체크박스에 `click` 리스너를 달면 키보드 Space에서 동작하지 않거나, `event.preventDefault()`가 있으면 시각 토글 자체가 막힌다.
**Why it happens:** `<input type="checkbox">`의 표준 사용자 인터랙션 이벤트는 `change`다. `click`은 마우스 클릭 한정.
**How to avoid:** 위임 시 `addEventListener('change', ...)`로 등록하고 `e.target.type === 'checkbox'`만 분기. preventDefault 호출 금지.
**Warning signs:** 키보드 사용자가 Space로 토글 시 시각만 변하고 state는 갱신 안 됨.

### Pitfall 4: `crypto.randomUUID()` undefined on HTTP origin

**What goes wrong:** Phase 1이 `python3 -m http.server`로 잠겼지만 누군가 `0.0.0.0`이나 LAN IP로 접속하면 secure context가 아니어서 `crypto.randomUUID is not a function` 발화.
**Why it happens:** `randomUUID()`는 secure context 한정 API. `localhost` / `127.0.0.1` / `https:`만 secure context. [VERIFIED: MDN — "available only in secure contexts (HTTPS), in some or all supporting browsers"; localhost는 secure context]
**How to avoid:**
1. README에 `http://localhost:8000`만 언급(`http://0.0.0.0`이나 LAN IP 안내 금지).
2. 검증 체크리스트에 `typeof crypto.randomUUID === 'function'` 콘솔 확인 한 줄 추가.
3. GitHub Pages는 HTTPS이므로 자동 OK.
**Warning signs:** 팀원이 `--bind 0.0.0.0` 옵션을 README에 추가하면 LAN 접속 환경에서 add가 묵묵히 실패.

### Pitfall 5: `Array.prototype.sort` 비교 함수 누락

**What goes wrong:** `[...list].sort()` (비교 함수 없이) 호출 시 모든 요소가 string으로 변환되어 정렬됨 → `{createdAt: 1746230400000}` 객체는 `[object Object]`로 비교되어 무의미한 순서.
**Why it happens:** ES 명세상 비교 함수 생략 시 toString 변환 후 사전식 정렬. 객체 배열에 그냥 `.sort()` 호출하면 안 된다.
**How to avoid:** 항상 `(a, b) => a.createdAt - b.createdAt` (Number 비교) 명시. ES2019부터 stable하므로 동률은 입력 순서 보존.
**Warning signs:** 같은 시각에 두 todo 추가 후 reload 시 순서가 뒤집힘 (실제로는 재현 어려움 — `Date.now()`가 ms이므로 동률은 매우 드물지만 검증 의식은 필수).

### Pitfall 6: Empty-state 노드와 list 노드의 컨테이너 혼동

**What goes wrong:** `<p class="empty">`를 추가했다가 첫 todo 추가 시 `<p>` 옆에 `<ul>`을 append하는 구현으로 가면, "0개" 메시지와 리스트가 동시에 보임.
**Why it happens:** 컨테이너 청소 잊음.
**How to avoid:** **항상 `replaceChildren()`로 단일 자식 교체**. `renderTodoList`는 분기마다 `replaceChildren(p)` 또는 `replaceChildren(ul)`을 호출 — append 금지.
**Warning signs:** 모든 todo 삭제 후 빈 리스트와 empty 메시지가 동시에 보이거나 그 반대.

## Code Examples

### 한국어 IME 가드된 편집 commit

```js
// Source: MDN InputEvent.isComposing + 표준 폴백 패턴
listContainer.addEventListener('keydown', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') { e.preventDefault(); commitEdit(input); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
});
```

### `<form>` 기반 추가 (Enter+버튼 통합)

```js
// Source: HTML Living Standard — implicit form submission
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim()) return;
  commit(addTodo(state, TODAY, input.value));
  input.value = '';
  input.focus();
});
```

### XSS 검증용 입력 (수동 verify)

```
입력값: <img src=x onerror=alert(1)>
기대 결과:
  - alert 미발생
  - <li> 안에 <span>이 그 문자열을 literal text로 표시
  - DevTools Elements 탭에서 <img> 노드 0개
  - grep -rE "innerHTML\s*=" js/  → 0건
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `el.innerHTML = '<li>...</li>'` | `createElement` + `textContent` + `replaceChildren()` | `replaceChildren` Baseline 2022 | XSS-by-construction; verify가 grep gate 1줄로 끝남 |
| `<li>`마다 listener | 컨테이너 위임 (`addEventListener` on root) | Standard since IE9, 그러나 전체 재렌더 패턴이 일반화되며 더 중요해짐 | listener 등록 1회로 끝, GC 압력 0 |
| 수동 GUID 생성 (`Math.random` 조합) | `crypto.randomUUID()` | Baseline 2023 | 충돌 없음, 읽기 쉬움. localhost/HTTPS 한정. |
| `keypress` Enter 검출 | `<form>` + `submit` 이벤트 | `keypress`는 deprecated since 2019 | IME 처리 자동 통합 |

**Deprecated/outdated:**
- `keypress` 이벤트 — `keydown` 또는 `<form submit>`로 대체.
- `Element.outerHTML =` 사용자 텍스트 — `innerHTML`과 동일한 XSS 위험. 본 phase에서 0건.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| (없음) | — | — | — |

**모든 핵심 claim이 [VERIFIED] 또는 [CITED]:**
- `crypto.randomUUID()` localhost OK → [VERIFIED: MDN web search 2026-05-03]
- `Element.replaceChildren()` baseline → [VERIFIED: MDN]
- `event.isComposing` 한국어 IME 가드 → [VERIFIED: MDN InputEvent]
- `Array.prototype.sort` ES2019+ stable → [CITED: TC39 / ECMA-262]
- CONTEXT.md 결정 인용 → [CITED: 02-CONTEXT.md]
- Phase 1 인터페이스 (`KEY/defaultState/load/save`, `dateKey()`) → [VERIFIED: js/storage.js, js/dateKey.js 직접 검사]

## Open Questions

1. **`window.*` dev hook 정리 시점**
   - What we know: CONTEXT.md "Phase 2에서도 잠정 유지", STATE.md Open Todos에 "Phase 3에서 재검토" 기록됨.
   - What's unclear: Phase 2 추가로 노출할 항목(예: `window.todos`, `window.state`)이 있는가?
   - Recommendation: **추가 노출 금지.** Phase 1 노출만 유지. `state`는 모듈 내부 `let`이고 `app.js`가 mutate하므로 `window.getState = () => state` 정도가 검증 콘솔에 유용하지만 deferred.

2. **편집 input 시작 트리거: `click` vs `dblclick`**
   - What we know: CONTEXT.md "텍스트 영역 클릭 또는 ✎ 버튼". 단일 클릭 명시.
   - What's unclear: 텍스트 클릭 시 즉시 편집 시작 vs ✎ 버튼만 편집 시작.
   - Recommendation: CONTEXT.md 그대로 — 텍스트 영역 단일 클릭 = 편집 시작. plan task에서 명시.

3. **`tests.html` 추가 여부**
   - What we know: STACK.md가 `console.assert` 기반 무빌드 테스트 패턴 권고했으나 Phase 1에서 만들지 않음.
   - What's unclear: Phase 2의 5개 헬퍼는 순수 함수라 테스트 가치가 명확. 그러나 CONTEXT.md가 명시 안 함.
   - Recommendation: Phase 2에서 **추가하지 않음.** 단순성 우선. Phase 4 폴리시에서 검토.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Chrome/Firefox/Safari/Edge (current) | 모든 ES2023+ DOM API | ✓ | 2026 baseline | — |
| `python3 -m http.server` | localhost secure context (Phase 1 결정) | ✓ | 시스템 표준 | GitHub Pages (HTTPS) |
| `crypto.randomUUID()` | todo id 생성 | ✓ | secure-context 한정 — localhost OK | `Date.now() + Math.random()` (사용 안 함) |
| Web Storage API (`localStorage`) | Phase 1 storage 어댑터 | ✓ | universal | — |

**Missing dependencies with no fallback:** 없음.

**Missing dependencies with fallback:** 없음.

## Validation Architecture

> `.planning/config.json`에서 `workflow.nyquist_validation`이 명시적으로 설정되지 않았다고 가정 — 절대 경로로 확인하지 않았음. 만약 false면 이 섹션 무시.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual (브라우저 DevTools) + grep CI gate |
| Config file | 없음 — Phase 2도 무빌드 유지 |
| Quick run command | `python3 -m http.server 8000` 후 브라우저 수동 |
| Full suite command | 동일 + 검증 체크리스트 12항목 (CONTEXT.md "Phase 2 검증 방법") |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TODO-01 | 입력 + Enter / 추가 버튼 → 즉시 추가 | manual (browser) | — (DevTools) | ❌ N/A — 수동 검증 |
| TODO-02 | `{id, text, done, createdAt}` 구조 | grep + manual | `grep -E "crypto\.randomUUID\|Date\.now" js/todos.js` → 1+건 | ✅ 검증 가능 |
| TODO-03 | 체크박스 토글 + 시각 구분 | manual | — | ❌ |
| TODO-04 | 인라인 편집 (Enter/Esc/blur, 빈 거부) | manual | — | ❌ |
| TODO-05 | 즉시 삭제 | manual | — | ❌ |
| TODO-06 | createdAt 안정 정렬 | manual + 콘솔 | `getTodosForDate(load(), '2026-05-03')` 콘솔 호출 | ✅ |
| TODO-07 | 빈 상태 메시지 | manual | — | ❌ |
| PERS-03 | 새로고침 후 데이터 유지 | manual (reload) | — | ❌ |
| STYL-02 | textContent-only | grep gate | `grep -rE "innerHTML\\s*=" js/` → 0건 | ✅ |
| (Phase 1 진실문 유지) | UTC 토큰 0건 | grep gate | `grep -rE "toISOString\|\\.toJSON\\(\|Date\\.UTC" js/` → 0건 | ✅ |
| (Phase 1 경계 유지) | storage 외부 raw localStorage 0건 | grep gate | `grep -r "localStorage\\." js/ \| grep -v js/storage.js` → 0건 | ✅ |

### Sampling Rate

- **Per task commit:** 해당 task가 손댄 모듈에 grep gate 적용 (innerHTML / UTC 토큰 / raw localStorage).
- **Per wave merge:** 검증 체크리스트 12항목 중 자동화 가능한 grep 4종 + 콘솔 라운드트립.
- **Phase gate:** 사용자 손으로 12항목 전부 + XSS payload 입력 + reload 검증.

### Wave 0 Gaps

- 없음 — `tests.html` 도입은 deferred. 기존 grep gate + 수동 DevTools 검증으로 충분 (CONTEXT.md 결정).

*(Phase 2 verify는 본질적으로 사용자 인터랙션 검증이라 자동화 비용 > 가치. plan task에서 verify 단계마다 명시적 수동 시나리오 1줄씩.)*

## Security Domain

> `security_enforcement` 명시적 false 아니므로 포함.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 인증 없음 (단일 사용자, 로컬) |
| V3 Session Management | no | 세션 없음 |
| V4 Access Control | no | 권한 모델 없음 |
| V5 Input Validation | yes | `text.trim()` + length unconstrained (CONTEXT 결정), `textContent` 렌더 |
| V6 Cryptography | partial | `crypto.randomUUID()` 사용 — 직접 암호화 안 함, ID 생성에만 |
| V7 Errors & Logging | partial | `save()` 실패 시 `console.warn` (CONTEXT 결정) |
| V11 Business Logic | yes | 빈 todo 추가 거부, 빈 편집 거부 |

### Known Threat Patterns for vanilla DOM + localStorage

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stored XSS via todo text | Tampering / Elevation | `textContent` only, `innerHTML` 0건 (CONTEXT lock + grep gate) |
| HTML attribute injection (예: `value="..."`) | Tampering | `input.value = t.text` 사용 — property 할당이라 HTML 파싱 우회. attribute 문자열 보간 금지 |
| Prototype pollution via `JSON.parse(localStorage)` | Tampering | Phase 1 `load()`이 schema 검증 후 폴백 — Phase 2가 추가로 위반하지 않으면 OK |
| LocalStorage quota DoS | DoS | 길이 제한 없음(CONTEXT 결정) — `save()`가 false 반환 시 console.warn (Phase 4에서 토스트로 강화) |
| Clickjacking | — | 정적 단일 페이지, 외부 frame 노출 안 함. v2 검토 가치 낮음 |

**Phase 2 보안 결론:** STYL-02(textContent-only)가 잠겨 있어 본 페이즈가 도입 가능한 신규 보안 위험은 없음. grep gate 1줄(`innerHTML\s*=` 0건)로 검증 종료.

## Sources

### Primary (HIGH confidence)
- [MDN — Crypto: randomUUID() method](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID) — secure context 요구사항 + localhost 허용
- [MDN — Element.replaceChildren()](https://developer.mozilla.org/en-US/docs/Web/API/Element/replaceChildren) — baseline + atomic semantics
- [MDN — InputEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/isComposing) — 한국어 IME 가드
- `.planning/research/PITFALLS.md` — Pitfalls 1–4, Anti-Patterns
- `.planning/research/ARCHITECTURE.md` — 단일 store + 렌더 패턴, view contract
- `.planning/phases/02-todo-crud/02-CONTEXT.md` — 모든 잠긴 결정의 진실 원천
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — Phase 1 인터페이스 검증
- `.planning/phases/01-foundation/01-PATTERNS.md` — 확립된 storage/모듈 경계 패턴
- `js/storage.js`, `js/dateKey.js`, `js/app.js`, `index.html` — 직접 검사
- `CLAUDE.md` (project) — 무빌드/무프레임워크/단일 진입점/localStorage 제약

### Secondary (MEDIUM confidence)
- WebSearch (2026-05-03) — `crypto.randomUUID secure context localhost HTTP availability` 결과 다수 일치

### Tertiary (LOW confidence)
- 없음 — 모든 claim이 1차/2차 source로 cross-verified.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Phase 1 인터페이스 직접 검사 + MDN cross-verified
- Architecture: HIGH — CONTEXT.md가 핵심 결정 잠금, 패턴은 ARCHITECTURE.md/PATTERNS.md 인용
- Pitfalls: HIGH — IME/focus/event-type 함정은 표준 브라우저 동작이라 deterministic

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (안정 도메인, 30일)
