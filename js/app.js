import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';

// Phase 1: UI 없음. 콘솔에서 검증 체크리스트 2/3번 실행을 가능하게 만드는 dev 노출.
// Phase 2 도입 시 재검토 (제거 또는 축소).
window.dateKey = dateKey;
window.defaultState = defaultState;
window.load = load;
window.save = save;
window.STORAGE_KEY = KEY;

console.info('[hansung-todo] foundation loaded', { today: dateKey() });

// Phase 2 (02-02): 부트스트랩 — TODAY 캡처 → DOM 마운트(폼 + 리스트 컨테이너) → 최초 렌더 → 추가 폼 submit 와이어링.
// toggle/edit/remove 위임 listener는 02-03에서 추가.
import {
  getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo, renderTodoList,
} from './todos.js';

const TODAY = dateKey();
let state = load();
let editingId = null; // transient UI state — store 외부 (02-03에서 사용)

function buildForm() {
  const f = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'todo-input';
  input.placeholder = '할 일을 입력하세요';
  input.autocomplete = 'off';
  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.id = 'todo-add';
  addBtn.textContent = '추가';
  f.append(input, addBtn);
  return f;
}

function buildListContainer() {
  const div = document.createElement('div');
  div.id = 'todo-list';
  return div;
}

const form = buildForm();
const listContainer = buildListContainer();
const root = document.getElementById('app');
if (!root) throw new Error('[hansung-todo] #app 마운트 노드가 없습니다. index.html에 <main id="app">가 있고, app.js가 defer 또는 <body> 끝에서 로드되는지 확인하세요.');
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim()) return;
  commit(addTodo(state, TODAY, input.value));
  input.value = '';
  input.focus();
});

// 위임: 체크박스 토글 (change 이벤트 — Pitfall 3)
listContainer.addEventListener('change', (e) => {
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;
  const id = cb.closest('li')?.dataset.id;
  if (!id) return;
  commit(toggleTodo(state, TODAY, id));
});

// 위임: 클릭 — 삭제 / 편집 시작
listContainer.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.closest('li')?.dataset.id;
  if (!id) return;
  if (t.matches('.todo-remove')) commit(removeTodo(state, TODAY, id));
  else if (t.matches('.todo-edit') || t.matches('.todo-text')) {
    // 동일 id에 대한 startEdit 재진입은 무시 (입력 중 ✎ 재클릭 시 cursor/selection/입력 텍스트 유실 방지)
    if (editingId !== id) startEdit(id);
  }
});

// 위임: 편집 input keydown — 한국어 IME 가드 (Pitfall 1)
listContainer.addEventListener('keydown', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key === 'Enter') { e.preventDefault(); commitEdit(input); }
  else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
});

// 위임: 편집 input focusout — 재진입 가드 (Pitfall 2)
listContainer.addEventListener('focusout', (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement) || !input.matches('.todo-edit-input')) return;
  if (editingId == null) return;
  commitEdit(input);
});

function startEdit(id) {
  editingId = id;
  render();
  const input = listContainer.querySelector('.todo-edit-input');
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function commitEdit(input) {
  const id = editingId; editingId = null;   // ← 가드 먼저 풀기 (Pitfall 2)
  if (id == null) return;
  commit(editTodo(state, TODAY, id, input.value));
}

function cancelEdit() {
  editingId = null;
  render();
}

render();
