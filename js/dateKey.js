// 로컬 시간 기준 YYYY-MM-DD 키 (UTC 드리프트 차단).
// toISOString / toJSON / Date.UTC 사용 금지.
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
