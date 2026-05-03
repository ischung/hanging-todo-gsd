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
  // Phase 4 (PERS-04): 실패 시 silent false 대신 throw — commit()에서 catch하여 banner 노출.
  // localStorage.* 노출은 여전히 이 모듈 내부에 갇혀 있다 (storage 경계 유지).
  localStorage.setItem(KEY, JSON.stringify(state));
}
