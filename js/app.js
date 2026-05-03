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

// Phase 2 (02-02): 부트스트랩 — DOM 마운트(폼 + 리스트 컨테이너) → 최초 렌더 → 추가 폼 submit 와이어링.
// Phase 3 (03-02): selectedKey/viewYM 모듈 상태 도입, 캘린더 + 헤더 마운트 추가, render 팬아웃.
import {
  getTodosForDate, addTodo, toggleTodo, editTodo, removeTodo, renderTodoList,
} from './todos.js';
import {
  todayYM, prevMonth, nextMonth, renderCalendar, formatHeader,
} from './calendar.js';

let state = load();
let viewYM = todayYM();              // {y, m} — transient UI state, never persisted (decision D)
let selectedKey = dateKey();         // "YYYY-MM-DD" — resets to today on reload (decision D)
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

function buildCalendarSection() {
  const s = document.createElement('section');
  s.id = 'calendar';
  return s;
}

function buildDateHeader() {
  const h = document.createElement('header');
  h.id = 'date-header';
  return h;
}

const form = buildForm();
const listContainer = buildListContainer();
const calendarSection = buildCalendarSection();
const dateHeader = buildDateHeader();
const root = document.getElementById('app');
if (!root) throw new Error('[hansung-todo] #app 마운트 노드가 없습니다. index.html에 <main id="app">가 있고, app.js가 defer 또는 <body> 끝에서 로드되는지 확인하세요.');
root.replaceChildren(calendarSection, dateHeader, form, listContainer);

function commit(nextState) {
  state = nextState;
  if (!save(state)) {
    console.warn('[hansung-todo] save failed; mutation kept in memory');
  }
  render();
}

function render() {
  renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate);
  dateHeader.textContent = formatHeader(selectedKey);
  const todos = getTodosForDate(state, selectedKey);
  renderTodoList(listContainer, todos, editingId);
}

// 위임: 캘린더 nav 버튼 + 셀 선택 (단일 listener — Phase 2 패턴 동일).
// 인접달 셀(<div>)은 data-key/data-action 둘 다 없어 자연스럽게 no-op.
calendarSection.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  const navBtn = t.closest('[data-action]');
  if (navBtn) {
    const a = navBtn.dataset.action;
    if (a === 'prev') viewYM = prevMonth(viewYM);
    else if (a === 'next') viewYM = nextMonth(viewYM);
    else if (a === 'today') {
      viewYM = todayYM();
      selectedKey = dateKey();
    }
    render();
    return;
  }

  const cell = t.closest('[data-key]');
  if (cell) {
    selectedKey = cell.dataset.key;
    render();
    return;
  }
  // else: adjacent-month div or whitespace — no-op (decision E lock).
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = form.querySelector('input');
  if (!input.value.trim()) return;
  commit(addTodo(state, selectedKey, input.value));
  input.value = '';
  input.focus();
});

// 위임: 체크박스 토글 (change 이벤트 — Pitfall 3)
listContainer.addEventListener('change', (e) => {
  const cb = e.target;
  if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox') return;
  const id = cb.closest('li')?.dataset.id;
  if (!id) return;
  commit(toggleTodo(state, selectedKey, id));
});

// 위임: 클릭 — 삭제 / 편집 시작
listContainer.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.closest('li')?.dataset.id;
  if (!id) return;
  if (t.matches('.todo-remove')) commit(removeTodo(state, selectedKey, id));
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
  // 진행 중인 편집이 다른 todo에 있으면 먼저 OLD id 기준으로 commit한다.
  // editingId를 먼저 null로 풀어 두지 않으면, 이어지는 render()가 OLD input을
  // DOM에서 제거하며 발화하는 focusout이 NEW id를 캡처해 OLD 텍스트를 잘못된
  // todo에 commit한다 (WR-01 race). commit 자체가 render도 호출하므로 별도 호출 불요.
  if (editingId != null && editingId !== id) {
    const prevInput = listContainer.querySelector('.todo-edit-input');
    const prevId = editingId;
    editingId = null; // focusout 핸들러 재진입 차단 (Pitfall 2 + WR-01)
    if (prevInput) commit(editTodo(state, selectedKey, prevId, prevInput.value));
  }
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
  commit(editTodo(state, selectedKey, id, input.value));
}

function cancelEdit() {
  editingId = null;
  render();
}

render();
