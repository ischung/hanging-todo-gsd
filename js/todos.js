// Phase 2: todos 도메인 모듈 — 순수 immutable state 헬퍼 5종 + DOM 렌더 (renderTodoList/renderTodoItem).
// localStorage I/O와 dateKey 변환은 하지 않는다 (storage.js 경계 + 호출처가 key 전달 패턴 유지).

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
