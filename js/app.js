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
  getTodosForDate, addTodo, renderTodoList,
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

render();
