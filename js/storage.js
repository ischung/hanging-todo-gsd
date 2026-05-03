// Phase 1: localStorage 단일 어댑터.
// 다른 모든 모듈은 raw localStorage.* 호출 금지 — 반드시 이 모듈의 KEY/defaultState/load/save를 import.

export const KEY = 'hansung-todo:v1';

export function defaultState() {
  return { schemaVersion: 1, todosByDate: {} };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1) return defaultState();
    if (!parsed.todosByDate || typeof parsed.todosByDate !== 'object') return defaultState();
    // 각 날짜 key의 value가 배열이어야 한다 (todos.js 헬퍼들의 invariant).
    // DevTools 등으로 변조된 경우 전체를 기본 상태로 폴백하여 todos.js가 throw하지 않도록 보장.
    for (const k of Object.keys(parsed.todosByDate)) {
      if (!Array.isArray(parsed.todosByDate[k])) return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
