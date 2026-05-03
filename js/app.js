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
