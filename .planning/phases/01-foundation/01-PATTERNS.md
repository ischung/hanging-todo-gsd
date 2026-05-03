# Phase 1: Foundation — Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 6 (모두 신규 생성)
**Analogs found:** 0 / 6 — 그린필드 페이즈 (코드 0줄). 모든 패턴은 `.planning/research/*.md`, `CLAUDE.md`, `01-CONTEXT.md`의 reference 코드/규약을 따른다.

## File Classification

| 신규 파일 | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `index.html` | entry / shell | request-response (정적 로드) | (없음) — `STACK.md` lines 55–70 reference HTML | doc-only |
| `css/styles.css` | config / token skeleton | n/a | (없음) — `01-CONTEXT.md` "CSS는 Phase 1 범위?" | doc-only |
| `js/dateKey.js` | utility | transform (Date → string) | (없음) — `PITFALLS.md` lines 20–28 reference 구현 | doc-only |
| `js/storage.js` | persistence adapter | CRUD (load/save) | (없음) — `PITFALLS.md` lines 80–99 + `ARCHITECTURE.md` lines 316–321 contract | doc-only |
| `js/app.js` | bootstrap / controller | event-driven (DOMContentLoaded) | (없음) — `ARCHITECTURE.md` lines 92–99, `01-CONTEXT.md` decisions | doc-only |
| `README.md` | docs | n/a | (없음, 기존 19B stub은 무시) — `01-CONTEXT.md` "README 범위" | doc-only |

## Pattern Assignments

### `index.html` (entry, request-response)

**Analog:** 없음 — `.planning/research/STACK.md` lines 55–70의 reference HTML 그대로 차용.

**Shell pattern** (STACK.md:56–70):
```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hansung Todo</title>
    <link rel="stylesheet" href="./css/styles.css" />
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="./js/app.js"></script>
  </body>
</html>
```

**적용 규칙:**
- `lang="ko"` — 프로젝트는 ko-KR UI (CLAUDE.md "Korean weekday").
- `<script type="module">` — `01-CONTEXT.md` decisions "모듈 로딩 전략" 잠금. plain `<script>`로 바꾸지 말 것.
- `<link rel="stylesheet" href="./css/styles.css">` — DEL-02 정적 자산 구조. 경로는 `./css/`이지 `./styles.css` 아님 (ARCHITECTURE.md:50 구조와 일치).
- `<main id="app">` — Phase 2 이후 view들이 mount할 노드. Phase 1에선 비어 있음.

---

### `css/styles.css` (config skeleton)

**Analog:** 없음 — `01-CONTEXT.md` "CSS는 Phase 1 범위?" 결정에 따른 골격만.

**Skeleton pattern** (CONTEXT lines 82–83):
```css
/* Phase 1: 정적 자산 구조 충족용 골격. 본격 스타일은 Phase 4 (STYL-01). */
:root {
  /* design tokens placeholder — Phase 4에서 채움 */
}
```

**적용 규칙:**
- 파일이 존재해야 `index.html`의 `<link>`가 404를 내지 않는다 (검증 1: 콘솔 에러 0건).
- 토큰을 미리 추가하지 말 것 — Phase 4 STYL-01 범위 (CLAUDE.md "Surgical Changes").

---

### `js/dateKey.js` (utility, transform)

**Analog:** 없음 — `.planning/research/PITFALLS.md` lines 20–28 reference 구현을 그대로 사용.

**Core transform pattern** (PITFALLS.md:21–28):
```js
// dateKey.js — single source of truth
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

**금지 패턴** (PITFALLS.md:29, 33–35; CONTEXT spec_lock PERS-05):
- `d.toISOString().slice(0,10)` — UTC 드리프트.
- `d.toJSON()`, `Date.UTC(...)` — UTC 기반.
- `new Date('2026-05-03')` — 엔진별 UTC/local 모호. 테스트 시엔 `new Date(y, m-1, d)` 사용.

**Module export 규칙:**
- 단 하나의 named export `dateKey`. default export 금지 (CONTEXT decisions "dateKey.js 책임").

---

### `js/storage.js` (persistence adapter, CRUD)

**Analog:** 없음 — `PITFALLS.md` lines 80–99 wrapped helpers + `ARCHITECTURE.md` lines 316–321 contract를 결합.

**Constants** (CONTEXT spec_lock PERS-01/02):
```js
export const KEY = 'hansung-todo:v1';

export function defaultState() {
  return { schemaVersion: 1, todosByDate: {} };
}
```

**Load pattern** (PITFALLS.md:81–89, CONTEXT decisions "storage.js 책임"):
```js
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw == null) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== 1) return defaultState();
    return parsed;
  } catch {
    return defaultState(); // 손상 / SecurityError 흡수
  }
}
```

**Save pattern** (PITFALLS.md:90–98):
```js
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false; // QuotaExceededError / SecurityError. UX 노출은 Phase 4(PERS-04).
  }
}
```

**금지 패턴** (PITFALLS.md Pitfall 3, ARCHITECTURE.md Anti-Pattern 1):
- `localStorage.getItem`/`setItem`을 `storage.js` 밖에서 직접 호출 금지.
- `JSON.parse(localStorage.getItem(...))` 비-wrapped 호출 금지.
- 키 문자열 하드코딩 금지 — 항상 `KEY` 상수 import.

**스키마 잠금** (CONTEXT spec_lock):
- `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": Todo[] } }`. Phase 1엔 `todosByDate`가 비어 있어도 OK.

---

### `js/app.js` (bootstrap, event-driven)

**Analog:** 없음 — `ARCHITECTURE.md` lines 92–99 import shape + `01-CONTEXT.md` decisions "js/ 파일 분할" 결합.

**Boot pattern** (CONTEXT decisions "js/ 파일 분할" + 검증 항목 2/3):
```js
import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';

// Phase 1: UI 없음. 모듈 로딩 검증 + 콘솔 라운드트립을 위한 dev 노출.
// Phase 2 이후 view를 wire-up하면서 window 노출은 제거 가능.
window.dateKey = dateKey;
window.defaultState = defaultState;
window.load = load;
window.save = save;
window.STORAGE_KEY = KEY;

console.info('[hansung-todo] foundation loaded', { today: dateKey() });
```

**적용 규칙:**
- `app.js`는 Phase 1 한정 thin bootstrap — 검증 체크리스트 2·3번(콘솔에서 `window.dateKey(...)`, `window.save(...)`)을 가능하게 만드는 것이 유일 목적.
- `window.*` 노출은 dev 편의용. Phase 2에서 store/view를 도입할 때 제거 또는 축소.
- `import` 경로는 상대경로 + `.js` 확장자 명시 (브라우저 ESM 요구사항, ARCHITECTURE.md Pattern 1).

---

### `README.md` (docs)

**Analog:** 없음 (기존 19B stub은 placeholder, 무시). `01-CONTEXT.md` "README 범위" 결정 따름.

**Required sections** (CONTEXT decisions "README 범위"):
1. 프로젝트 한 줄 소개 (`PROJECT.md` "What This Is" 인용/요약).
2. 실행 방법: `python3 -m http.server` + `http://localhost:8000` 접속 안내.
3. GitHub Pages 배포 한 줄.
4. 파일 구조 트리 (Phase 1 시점: `index.html`, `css/styles.css`, `js/{dateKey,storage,app}.js`, `README.md`).
5. **"`file://` 더블클릭은 지원하지 않음"** 한 줄 경고 (PITFALLS.md Pitfall 4, CONTEXT decisions "모듈 로딩 전략").

**금지 사항:**
- 빌드/npm 명령 안내 금지 (PROJECT.md DEL-01 위반).
- Phase 2+ 기능 설명 금지 (CLAUDE.md "Simplicity First", surgical scope).

---

## Shared Patterns

### 모듈 시스템
**Source:** `ARCHITECTURE.md` Pattern 1 (lines 78–101), `01-CONTEXT.md` decisions "모듈 로딩 전략"
**Apply to:** `index.html`, `js/*.js` 전부
- Native ESM. `<script type="module">` 단 1개. `import`/`export`만 사용. globals(`window.*`)는 Phase 1 dev 노출 한정.
- 파일 import 경로는 항상 상대경로 + `.js` 확장자 (e.g. `./dateKey.js`).

### 날짜 키 표현
**Source:** `PITFALLS.md` Pitfall 1, `CONTEXT.md` spec_lock PERS-05
**Apply to:** `dateKey.js`, `storage.js` (`todosByDate` 키), 향후 모든 view
- 항상 `dateKey()` 함수 통과. 직접 문자열 조립 금지.
- `Date` 생성은 `new Date(y, m-1, d)` 또는 `new Date()`만. 문자열 파싱 금지.

### localStorage 접근
**Source:** `PITFALLS.md` Pitfall 3, `ARCHITECTURE.md` Anti-Pattern 1
**Apply to:** `storage.js` (유일 호출처), 그 외 파일은 import만
- `localStorage.*` 직접 호출은 `storage.js` 안에서만. 모든 read/write는 try/catch로 감싸 폴백/`false` 반환.
- 키 문자열은 `KEY` 상수 단일 정의.

### 정적 자산 구조 (DEL-02)
**Source:** `ARCHITECTURE.md` lines 50–67, `CONTEXT.md` spec_lock
**Apply to:** 파일 배치 전체
- 루트에 `index.html`, `README.md`. CSS는 `css/`, JS는 `js/`. 빌드 산출물 디렉터리(`dist/`, `build/`) 생성 금지.

### XSS 사전 방어 (Phase 1엔 DOM 코드 거의 없지만 규약 정착)
**Source:** `PITFALLS.md` Pitfall 2, `ARCHITECTURE.md` Anti-Pattern 2
**Apply to:** 향후 모든 view; Phase 1 검증 6번 grep 통과
- `el.innerHTML = ...` 금지 (정적 마크업 외). 사용자 텍스트는 `textContent`만.

---

## No Analog Found

**모든 6개 파일이 이 카테고리에 해당.** 코드베이스에 기존 파일이 0개이므로, 플래너는 위에 명시된 `.planning/research/*.md` 및 `01-CONTEXT.md` 코드 발췌를 직접 인용해 plan action을 작성해야 한다.

| 파일 | 대체 참조 |
|------|-----------|
| `index.html` | `STACK.md` lines 55–70 |
| `css/styles.css` | `01-CONTEXT.md` decisions "CSS는 Phase 1 범위?" |
| `js/dateKey.js` | `PITFALLS.md` lines 20–28 |
| `js/storage.js` | `PITFALLS.md` lines 80–99, `ARCHITECTURE.md` lines 316–321 |
| `js/app.js` | `ARCHITECTURE.md` lines 92–99, `CONTEXT.md` decisions + 검증 체크리스트 |
| `README.md` | `01-CONTEXT.md` decisions "README 범위" |

## Metadata

**Analog search scope:** 리포 루트 (`/Users/insang/Documents/.../hansung-todo-gsd/`) 전체. `src/`, `js/`, `css/`, `index.html` 모두 부재 확인. 기존 파일은 `CLAUDE.md`(가이드), `README.md`(19B stub), `.planning/`, `.claude/`, `.git/` 뿐.
**Files scanned:** 6 reference docs (CLAUDE.md, PROJECT.md, STACK.md, ARCHITECTURE.md, PITFALLS.md, 01-CONTEXT.md).
**Pattern extraction date:** 2026-05-03

## PATTERNS COMPLETE
