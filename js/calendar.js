// Phase 3: calendar 도메인 모듈 — 순수 헬퍼(monthGrid/prevMonth/nextMonth/todayYM) + DOM 렌더(renderCalendar) + 헤더 포맷터(formatHeader).
// localStorage I/O 금지, dateKey()만 import. 호출처(app.js)가 viewYM/selectedKey/todosByDate를 주입.

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
