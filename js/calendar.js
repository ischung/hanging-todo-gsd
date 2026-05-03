// Phase 3: calendar 도메인 모듈 — 순수 헬퍼(monthGrid/prevMonth/nextMonth/todayYM) + DOM 렌더(renderCalendar) + 헤더 포맷터(formatHeader).
// 영속 저장 I/O 금지 (storage.js 경계), dateKey()만 import. 호출처(app.js)가 viewYM/selectedKey/todosByDate를 주입.

import { dateKey } from './dateKey.js';

/**
 * 6 weeks × 7 days = 42 cells, Sunday-start. Adjacent-month cells included
 * so the grid height never jumps. All Date construction uses local-time
 * new Date(y, m, d) — UTC-based Date APIs are forbidden (Phase 1 lock; see dateKey.js).
 *
 * @param {number} year   e.g. 2026
 * @param {number} m0     month index 0-11 (0 = January)
 * @param {Date}   today  defaults to new Date(); used only for isToday flag
 * @returns {Array<{date: Date, key: string, day: number, inMonth: boolean, isToday: boolean}>}
 */
export function monthGrid(year, m0, today = new Date()) {
  const first = new Date(year, m0, 1);
  const firstWeekday = first.getDay(); // 0=Sun .. 6=Sat
  const todayKey = dateKey(today);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(year, m0, 1 - firstWeekday + i);
    cells.push({
      date: d,
      key: dateKey(d),
      day: d.getDate(),
      inMonth: d.getMonth() === m0,
      isToday: dateKey(d) === todayKey,
    });
  }
  return cells;
}

export function prevMonth({ y, m }) {
  return m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 };
}

export function nextMonth({ y, m }) {
  return m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 };
}

export function todayYM(d = new Date()) {
  return { y: d.getFullYear(), m: d.getMonth() };
}

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Full subtree replace — mirrors renderTodoList in js/todos.js.
 * Reads counts at render time from todosByDate (no caching).
 *
 * @param {HTMLElement} container         stable mount node (owned by app.js)
 * @param {{y:number, m:number}} viewYM
 * @param {string} selectedKey            "YYYY-MM-DD"
 * @param {Record<string, unknown[]>} todosByDate
 * @param {Date} [today=new Date()]
 */
export function renderCalendar(container, viewYM, selectedKey, todosByDate, today = new Date()) {
  const cells = monthGrid(viewYM.y, viewYM.m, today);

  const nav = document.createElement('div');
  nav.className = 'cal-nav';
  nav.append(
    navBtn('prev', '< 이전'),
    navBtn('today', '오늘'),
    navBtn('next', '다음 >'),
  );
  const title = document.createElement('span');
  title.className = 'cal-title';
  title.textContent = `${viewYM.y}년 ${viewYM.m + 1}월`;
  nav.append(title);

  const head = document.createElement('div');
  head.className = 'cal-weekdays';
  for (const w of WEEKDAYS_KO) {
    const c = document.createElement('div');
    c.className = 'cal-weekday';
    c.textContent = w;
    head.append(c);
  }

  const grid = document.createElement('div');
  grid.className = 'cal-grid';
  for (const cell of cells) {
    grid.append(buildCell(cell, selectedKey, todosByDate));
  }

  container.replaceChildren(nav, head, grid);
}

function navBtn(action, label) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cal-nav-btn';
  b.dataset.action = action; // 'prev' | 'today' | 'next'
  b.textContent = label;
  return b;
}

function buildCell(cell, selectedKey, todosByDate) {
  if (!cell.inMonth) {
    const div = document.createElement('div');
    div.className = 'cal-cell cal-cell-adjacent';
    const num = document.createElement('span');
    num.className = 'cal-day';
    num.textContent = String(cell.day);
    div.append(num);
    return div;
  }

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'cal-cell';
  btn.dataset.key = cell.key;
  if (cell.isToday) btn.classList.add('is-today');
  if (cell.key === selectedKey) btn.classList.add('is-selected');

  const num = document.createElement('span');
  num.className = 'cal-day';
  num.textContent = String(cell.day);
  btn.append(num);

  const count = todosByDate[cell.key]?.length ?? 0;
  if (count > 0) {
    const badge = document.createElement('span');
    badge.className = 'cal-badge';
    badge.textContent = String(count);
    btn.append(badge);
  }
  return btn;
}

const HEADER_FMT = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'full' });

/**
 * "YYYY-MM-DD" → "YYYY년 M월 D일 요일" (ko-KR full).
 * Reconstructs Date from parts (NOT new Date(key)) to keep local-time discipline.
 *
 * @param {string} key  "YYYY-MM-DD"
 * @returns {string}
 */
export function formatHeader(key) {
  const [y, m, d] = key.split('-').map(Number);
  return HEADER_FMT.format(new Date(y, m - 1, d));
}
