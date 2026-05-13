---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - js/dateKey.js
  - js/storage.js
  - js/app.js
  - index.html
  - css/styles.css
  - README.md
autonomous: true
requirements: [DEL-01, DEL-02, DEL-03, PERS-01, PERS-02, PERS-05]

must_haves:
  truths:
    - "사용자가 README의 명령(`python3 -m http.server`)으로 페이지를 열면 콘솔 에러 0건으로 로드된다"
    - "리포지터리는 `index.html` + `css/` + `js/` 정적 자산만으로 구성되며 빌드 산출물이 없다"
    - "DevTools 콘솔에서 `window.save(window.defaultState()); window.load()`가 `{ schemaVersion: 1, todosByDate: {} }`로 라운드트립된다"
    - "`window.dateKey(new Date(2026,4,3,23,55))`는 로컬 시간 기준 `'2026-05-03'`을 반환한다 (UTC 드리프트 없음)"
    - "`js/` 트리에서 `toISOString` / `toJSON` / `Date.UTC` / `innerHTML =` 가 발견되지 않는다"
    - "README가 로컬 실행 명령과 GitHub Pages 배포 방법을 모두 문서화한다"
  artifacts:
    - path: "index.html"
      provides: "단일 진입점, 모듈 부트스트랩, 스타일시트 링크"
      contains: "<script type=\"module\" src=\"./js/app.js\">"
    - path: "css/styles.css"
      provides: "DEL-02 디렉터리 계약 충족용 스타일 골격"
      min_lines: 1
    - path: "js/dateKey.js"
      provides: "로컬 시간 YYYY-MM-DD 변환 헬퍼"
      exports: ["dateKey"]
    - path: "js/storage.js"
      provides: "localStorage 단일 어댑터 (KEY, defaultState, load, save)"
      exports: ["KEY", "defaultState", "load", "save"]
    - path: "js/app.js"
      provides: "Phase 1 thin bootstrap + 콘솔 검증용 window 노출"
    - path: "README.md"
      provides: "실행 안내 (http.server / GitHub Pages / 파일 트리 / file:// 경고)"
  key_links:
    - from: "index.html"
      to: "js/app.js"
      via: "<script type=\"module\" src=\"./js/app.js\">"
      pattern: "type=\"module\".*js/app\\.js"
    - from: "js/app.js"
      to: "js/dateKey.js, js/storage.js"
      via: "ESM import (상대경로 + .js 확장자)"
      pattern: "import .* from '\\./(dateKey|storage)\\.js'"
    - from: "js/storage.js"
      to: "window.localStorage"
      via: "KEY = 'hansung-todo:v1'로 getItem/setItem (try/catch 래핑)"
      pattern: "localStorage\\.(getItem|setItem)"
    - from: "index.html"
      to: "css/styles.css"
      via: "<link rel=\"stylesheet\" href=\"./css/styles.css\">"
      pattern: "rel=\"stylesheet\".*css/styles\\.css"
---

<objective>
Phase 1 Foundation: 빌드 도구 없이 동작하는 정적 셸과 안전한 날짜·저장 원시 함수, 그리고 실행 안내 README를 만든다. UI는 그리지 않는다 — DevTools 콘솔에서 헬퍼 라운드트립이 검증되는 지점까지가 종착점.

Purpose: 이후 모든 페이즈가 의존하는 두 계약(로컬 시간 `YYYY-MM-DD` 키, `hansung-todo:v1` 단일 키 + `schemaVersion: 1` 스키마)을 가장 싸게 잠근다. Pitfalls 1·3·4를 구조적으로 차단한다.
Output: 6개 파일 (`index.html`, `css/styles.css`, `js/dateKey.js`, `js/storage.js`, `js/app.js`, `README.md`).
</objective>

<execution_context>
@/Users/insang/Documents/강의/소프트웨어공학/2026/대면수업용/sdd/gsd/hansung-todo-gsd/.claude/get-shit-done/workflows/execute-plan.md
@/Users/insang/Documents/강의/소프트웨어공학/2026/대면수업용/sdd/gsd/hansung-todo-gsd/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/research/STACK.md
@.planning/research/ARCHITECTURE.md
@.planning/research/PITFALLS.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-PATTERNS.md
@CLAUDE.md

<interfaces>
<!-- Phase 1이 만들 계약. 모든 코드는 이 시그니처를 정확히 따른다 (CONTEXT.md spec_lock + PATTERNS.md 참조 코드). -->

js/dateKey.js (named export 1개):
```js
export function dateKey(d = new Date()): string  // 'YYYY-MM-DD' (로컬 시간)
```

js/storage.js (named exports 4개):
```js
export const KEY = 'hansung-todo:v1';
export function defaultState(): { schemaVersion: 1, todosByDate: {} };
export function load(): { schemaVersion: 1, todosByDate: Record<string, Todo[]> };  // try/catch + 스키마 검증; 실패 시 defaultState()
export function save(state): boolean;  // try/catch; 성공 true / 실패 false
```

js/app.js (Phase 1 thin bootstrap):
```js
import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';
// 콘솔 검증용 window 노출 (Phase 2에서 재검토)
window.dateKey = dateKey;
window.defaultState = defaultState;
window.load = load;
window.save = save;
window.STORAGE_KEY = KEY;
```

Todo 모델 (Phase 2에서 구현; Phase 1은 스키마만 잠금):
```
{ id: string (crypto.randomUUID), text: string, done: boolean, createdAt: number (Date.now()) }
```
</interfaces>
</context>

<tasks>

<!--
  순서 근거:
   1. 가장 작고 순수한 모듈(dateKey)부터 → 다른 어떤 코드도 의존하지 않음.
   2. storage 어댑터 → dateKey와 독립이지만 schema 잠금이 무거우므로 두 번째.
   3. app.js bootstrap → 위 두 모듈을 import하므로 그 다음.
   4. index.html → app.js를 로드하는 진입점.
   5. css/styles.css → index.html의 <link>가 404를 내지 않게 함 (마지막에 추가해도 무방하지만 4번과 같은 commit으로 묶어 셸을 한 번에 셋업).
   6. README → 코드가 다 있는 상태에서 실행 안내를 작성.
  각 task는 독립 commit으로 의미를 가진다.
-->

<task type="auto">
  <name>Task 1: dateKey 헬퍼 작성 (PERS-05)</name>
  <files>js/dateKey.js</files>
  <action>
    `js/dateKey.js`를 새로 만들고 PITFALLS.md Pitfall 1의 reference 구현을 그대로 옮긴다 (per D-PERS-05 lock):

    ```js
    // 로컬 시간 기준 YYYY-MM-DD 키 (UTC 드리프트 차단).
    // toISOString / toJSON / Date.UTC 사용 금지.
    export function dateKey(d = new Date()) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    ```

    규칙:
    - 단일 named export (`dateKey`). default export 금지.
    - 다른 함수/유틸 추가 금지 — Phase 1 범위는 이 한 함수.
    - 주석은 위 두 줄(목적 + 금지)만. 과잉 설명 금지 (CLAUDE.md "Simplicity First").
  </action>
  <verify>
    <automated>node -e "import('./js/dateKey.js').then(m => { const r = m.dateKey(new Date(2026,4,3,23,55)); if (r !== '2026-05-03') { console.error('FAIL:', r); process.exit(1); } console.log('OK:', r); })"</automated>
    추가 grep: `grep -nE "toISOString|\.toJSON\(|Date\.UTC|new Date\('" js/dateKey.js` → 0건.
  </verify>
  <acceptance_criteria>
    - `test -f js/dateKey.js` → 파일 존재 (exit 0)
    - `grep -cE "^export function dateKey\b" js/dateKey.js` → `1` (named export 정확히 1개)
    - `grep -cE "^export default" js/dateKey.js` → `0` (default export 금지)
    - `grep -cE "export (function|const|let|var) " js/dateKey.js` → `1` (다른 export 추가 금지)
    - `grep -qE "getFullYear\(\)" js/dateKey.js && grep -qE "getMonth\(\)" js/dateKey.js && grep -qE "getDate\(\)" js/dateKey.js && grep -qE "padStart\(2, *'0'\)" js/dateKey.js` → 모두 매칭
    - `grep -cE "toISOString|\.toJSON\(|Date\.UTC" js/dateKey.js` → `0`
    - `node --input-type=module -e "import('./js/dateKey.js').then(m=>{if(m.dateKey(new Date(2026,4,3,23,55))!=='2026-05-03')process.exit(1)})"` → exit 0
  </acceptance_criteria>
  <done>
    `js/dateKey.js` 파일 존재, `dateKey` named export 1개, `new Date(2026,4,3,23,55)` 입력에 `'2026-05-03'` 반환, 금지 API 미사용.
    Commit: `feat(phase-01): add local-time dateKey helper (PERS-05)`
  </done>
</task>

<task type="auto">
  <name>Task 2: storage 어댑터 작성 (PERS-01, PERS-02)</name>
  <files>js/storage.js</files>
  <action>
    `js/storage.js`를 새로 만들고 PITFALLS.md Pitfall 3 + CONTEXT.md spec_lock에 정확히 일치하는 4개 export를 작성한다:

    ```js
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
        return parsed;
      } catch {
        return defaultState(); // 손상 JSON / SecurityError 흡수
      }
    }

    export function save(state) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
        return true;
      } catch {
        return false; // QuotaExceededError / SecurityError. UX는 Phase 4 (PERS-04).
      }
    }
    ```

    규칙 (per D-PERS-01/02 lock):
    - `KEY` 문자열은 정확히 `'hansung-todo:v1'`. 변경 금지.
    - `defaultState()`는 항상 `{ schemaVersion: 1, todosByDate: {} }` (객체 동일성을 위해 매 호출 새 객체 반환).
    - `load()`는 `null`/손상 JSON/`SecurityError`/`schemaVersion !== 1`/`todosByDate` 누락 모두 `defaultState()`로 폴백.
    - `save()`는 boolean 반환. 실패 시 throw 금지. 실패 UX 노출은 Phase 4 (deferred — 여기서 토스트/UI 추가 금지).
    - 마이그레이션 로직 추가 금지 (deferred to v2).
  </action>
  <verify>
    <automated>node --input-type=module -e "import('./js/storage.js').then(m => { if (m.KEY !== 'hansung-todo:v1') throw new Error('KEY'); const d = m.defaultState(); if (d.schemaVersion !== 1 || typeof d.todosByDate !== 'object') throw new Error('defaultState shape'); console.log('OK', d); })"</automated>
    추가: `grep -nE "toISOString|\.toJSON\(|Date\.UTC" js/storage.js` → 0건.
  </verify>
  <acceptance_criteria>
    - `test -f js/storage.js` → 파일 존재
    - `grep -cE "^export const KEY = 'hansung-todo:v1';" js/storage.js` → `1` (KEY 문자열 정확)
    - `grep -cE "^export function defaultState\b" js/storage.js` → `1`
    - `grep -cE "^export function load\b" js/storage.js` → `1`
    - `grep -cE "^export function save\b" js/storage.js` → `1`
    - `grep -cE "schemaVersion: *1" js/storage.js` → `>= 1` (defaultState 내부)
    - `grep -cE "try *\{" js/storage.js` → `>= 2` (load, save 모두 래핑)
    - `grep -cE "JSON\.parse" js/storage.js` → `>= 1`; `grep -cE "JSON\.stringify" js/storage.js` → `>= 1`
    - `grep -cE "toISOString|\.toJSON\(|Date\.UTC" js/storage.js` → `0`
    - `grep -cE "migrat" js/storage.js` → `0` (마이그레이션 로직 금지)
    - `node --input-type=module -e "import('./js/storage.js').then(m=>{if(m.KEY!=='hansung-todo:v1')process.exit(1);const d=m.defaultState();if(d.schemaVersion!==1||typeof d.todosByDate!=='object')process.exit(1);if(m.save({schemaVersion:1,todosByDate:{}})!==true)process.exit(1)}).catch(()=>process.exit(1))"` → exit 0 (Node 환경에 localStorage가 없으므로 실패하면 jsdom 또는 브라우저 검증으로 대체; 최소 import 무에러는 통과해야 함)
  </acceptance_criteria>
  <done>
    `js/storage.js` 파일 존재; `KEY === 'hansung-todo:v1'`; `defaultState()` 형태 일치; `load`/`save` 모두 try/catch로 감싸짐.
    Commit: `feat(phase-01): add localStorage adapter with schema fallback (PERS-01, PERS-02)`
  </done>
</task>

<task type="auto">
  <name>Task 3: app.js thin bootstrap 작성</name>
  <files>js/app.js</files>
  <action>
    `js/app.js`를 새로 만든다. Phase 1 한정 thin bootstrap — 모듈 그래프 무결성 + 콘솔 검증용 window 노출만:

    ```js
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
    ```

    규칙:
    - import 경로는 상대경로 + `.js` 확장자 명시 (`./dateKey.js`, `./storage.js`). bare specifier 금지.
    - DOM 조작 금지 — Phase 2/3 범위.
    - `localStorage.*` 직접 호출 금지 — `storage.js`만 통과.
    - `window.*` 노출은 위 5개만. 그 외 추가 금지.
  </action>
  <verify>
    <automated>grep -nE "import .* from '\\./(dateKey|storage)\\.js'" js/app.js | wc -l | tr -d ' '</automated>
    기댓값: `2`. 추가 검증: `grep -cE "localStorage\\." js/app.js` → `0` (storage 경계 유지).
  </verify>
  <acceptance_criteria>
    - `test -f js/app.js` → 파일 존재
    - `grep -cE "^import \{ dateKey \} from '\./dateKey\.js';" js/app.js` → `1`
    - `grep -cE "^import \{ KEY, defaultState, load, save \} from '\./storage\.js';" js/app.js` → `1`
    - `grep -cE "^window\.dateKey *=" js/app.js` → `1`
    - `grep -cE "^window\.defaultState *=" js/app.js` → `1`
    - `grep -cE "^window\.load *=" js/app.js` → `1`
    - `grep -cE "^window\.save *=" js/app.js` → `1`
    - `grep -cE "^window\.STORAGE_KEY *=" js/app.js` → `1`
    - `grep -cE "^window\." js/app.js` → `5` (정확히 5개만 노출)
    - `grep -cE "localStorage\." js/app.js` → `0` (storage 경계 유지)
    - `grep -cE "document\.|querySelector|getElementById|addEventListener" js/app.js` → `0` (Phase 1은 DOM 조작 금지)
  </acceptance_criteria>
  <done>
    `js/app.js` 존재; `dateKey`/`storage` ESM import 둘 다 상대경로+`.js`; `window.dateKey/defaultState/load/save/STORAGE_KEY` 5개 노출; raw `localStorage.` 호출 0건.
    Commit: `feat(phase-01): bootstrap modules and expose helpers for console verification`
  </done>
</task>

<task type="auto">
  <name>Task 4: index.html 단일 진입점 + css/styles.css 골격 작성 (DEL-01, DEL-02)</name>
  <files>index.html, css/styles.css</files>
  <action>
    두 파일을 함께 생성한다 (이 두 파일이 함께 있어야 페이지 로드가 콘솔 에러 0건이 된다).

    `index.html` (PATTERNS.md / RESEARCH.md 참조 마크업):
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
        <main id="app"><!-- Phase 2/3에서 캘린더와 todo 리스트가 여기에 렌더됨 --></main>
        <script type="module" src="./js/app.js"></script>
      </body>
    </html>
    ```

    `css/styles.css` (Phase 4 STYL-01까지는 골격만 — CONTEXT "CSS는 Phase 1 범위?" 결정):
    ```css
    /* Phase 1: 정적 자산 구조(DEL-02) 충족용 골격. 본격 스타일은 Phase 4 (STYL-01). */
    :root {
      /* design tokens placeholder — Phase 4에서 채움 */
    }
    ```

    규칙 (per D-DEL-01/02 lock):
    - `<script type="module">` 단 1개, `src="./js/app.js"`만. 다른 `<script>` 태그 금지.
    - `<link rel="stylesheet" href="./css/styles.css">` (경로의 `./` 명시).
    - `<main id="app">` 노드는 비어 있거나 주석만 (Phase 2 mount 자리).
    - CSS에 토큰/스타일 추가 금지 — Phase 4 책임.
    - `index.html` 안에 inline `<script>` / inline `<style>` 금지.
    - 외부 CDN 링크 금지 (zero runtime dependency, STACK.md "What NOT to Use").
  </action>
  <verify>
    <automated>test -f index.html && test -f css/styles.css && grep -q 'type="module".*js/app\.js' index.html && grep -q 'css/styles\.css' index.html && echo OK</automated>
    수동 검증 (실행 시): 다음 step을 실행해 콘솔 에러 0건 확인:
    `python3 -m http.server 8765 >/dev/null 2>&1 &` → `curl -sf http://localhost:8765/ -o /dev/null && curl -sf http://localhost:8765/js/app.js -o /dev/null && curl -sf http://localhost:8765/js/dateKey.js -o /dev/null && curl -sf http://localhost:8765/js/storage.js -o /dev/null && curl -sf http://localhost:8765/css/styles.css -o /dev/null && echo "all 200"` → `kill %1`.
  </verify>
  <acceptance_criteria>
    - `test -f index.html && test -f css/styles.css` → 둘 다 존재
    - `grep -cE '<html lang="ko">' index.html` → `1`
    - `grep -cE '<script type="module" src="\./js/app\.js"></script>' index.html` → `1`
    - `grep -cE '<script' index.html` → `1` (다른 `<script>` 태그 금지, inline 포함)
    - `grep -cE '<link rel="stylesheet" href="\./css/styles\.css"' index.html` → `1`
    - `grep -cE '<main id="app"' index.html` → `1`
    - `grep -cE '<style' index.html` → `0` (inline `<style>` 금지)
    - `grep -cE 'https?://[^"]*\.(js|css)' index.html` → `0` (외부 CDN 링크 금지)
    - `grep -cE ':root *\{' css/styles.css` → `>= 1`
    - `wc -l < css/styles.css` → `>= 1` (min_lines: 1)
  </acceptance_criteria>
  <done>
    `index.html`은 한국어 lang, 모듈 스크립트 1개, 스타일시트 링크 1개를 가진 정적 셸. `css/styles.css`는 Phase 4 책임 명시 주석을 포함한 골격. http.server로 서빙 시 모든 자산 200 응답, 콘솔 에러 0건.
    Commit: `feat(phase-01): static shell with module bootstrap and css skeleton (DEL-01, DEL-02)`
  </done>
</task>

<task type="auto">
  <name>Task 5: README.md 실행 안내 작성 (DEL-03)</name>
  <files>README.md</files>
  <action>
    기존 `README.md` stub을 덮어쓴다. CONTEXT "README 범위" 결정의 5개 항목을 정확히 충족:

    ```markdown
    # Hansung Todo (GSD Demo)

    날짜별 todo를 관리하는 정적 웹앱. 캘린더에서 날짜를 클릭해 그 날의 todo를 추가/완료/수정/삭제하며, 데이터는 브라우저 `localStorage`에 영구 저장된다.

    ## 실행 방법

    저장소를 받은 뒤 프로젝트 루트에서:

    ```bash
    python3 -m http.server 8000
    ```

    브라우저로 `http://localhost:8000` 접속.

    > ⚠️ `index.html`을 더블클릭(`file://`)하면 ES 모듈이 CORS로 차단되어 동작하지 않습니다. 반드시 위 명령으로 로컬 서버를 띄우세요.

    ## GitHub Pages 배포

    저장소 Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정하면 별도 빌드 없이 배포됩니다.

    ## 파일 구조

    ```
    .
    ├── index.html         # 단일 진입점 (<script type="module">)
    ├── css/
    │   └── styles.css     # 스타일 (Phase 1은 골격만, 본격 스타일은 Phase 4)
    ├── js/
    │   ├── dateKey.js     # 로컬 시간 YYYY-MM-DD 헬퍼
    │   ├── storage.js     # localStorage 입출력 (KEY / defaultState / load / save)
    │   └── app.js         # 부트스트랩 (콘솔 검증용 window 노출)
    └── README.md
    ```
    ```

    규칙 (per D-DEL-03 lock):
    - 위 5개 섹션(소개 / 실행 방법 / file:// 경고 / GitHub Pages / 파일 구조)을 모두 포함.
    - npm/build/install 명령 안내 금지 (DEL-01 위반).
    - Phase 2+ 기능 설명 금지 (CLAUDE.md "Surgical Changes").
    - Phase 1 시점의 파일 트리만 보여줌 (`calendar.js`, `todos.js`, `dom.js` 미언급).
  </action>
  <verify>
    <automated>grep -q "python3 -m http.server" README.md && grep -q "GitHub Pages" README.md && grep -qE "file://|더블클릭" README.md && grep -q "dateKey.js" README.md && grep -q "storage.js" README.md && echo OK</automated>
  </verify>
  <acceptance_criteria>
    - `test -f README.md` → 파일 존재
    - `grep -cE "python3 -m http\.server" README.md` → `>= 1`
    - `grep -cE "GitHub Pages" README.md` → `>= 1`
    - `grep -cE "file://|더블클릭" README.md` → `>= 1` (file:// 미지원 경고)
    - `grep -cE "dateKey\.js" README.md` → `>= 1`
    - `grep -cE "storage\.js" README.md` → `>= 1`
    - `grep -cE "app\.js" README.md` → `>= 1`
    - `grep -ciE "\bnpm\b|\bnpx\b|\byarn\b|\bpnpm\b|\bvite\b|\bwebpack\b|\bbundler\b|\bbuild step\b" README.md` → `0` (빌드/패키지 매니저 언급 금지)
    - `grep -cE "calendar\.js|todos\.js|dom\.js" README.md` → `0` (Phase 2+ 파일 미언급)
  </acceptance_criteria>
  <done>
    `README.md`가 실행 명령, file:// 미지원 경고, GitHub Pages 안내, 파일 트리, 한 줄 소개를 모두 포함. npm/빌드 명령 미언급.
    Commit: `docs(phase-01): document run methods and file structure (DEL-03)`
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser ↔ `localStorage` | 사용자 DevTools 또는 브라우저 익스텐션이 저장값을 변조할 수 있음. 유일한 신뢰 경계. |
| Static origin | 네트워크 외부 입력 없음 (백엔드/API 0건). 동일 출처에서 정적 파일만 로드. |

(Phase 1엔 사용자 입력 처리, 인증, 세션, 외부 fetch 모두 없음 — ASVS L1 항목 대부분 N/A.)

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-01-01 | Tampering / DoS | `js/storage.js` `load()` (변조된 localStorage → 앱 크래시) | mitigate | try/catch 흡수 + `schemaVersion !== 1` 폴백 + `todosByDate` 타입 검증 → 모두 `defaultState()` 반환 (Task 2) |
| T-01-02 | Tampering / DoS | `js/storage.js` `save()` (Quota / Private Mode → throw → UI 멈춤) | mitigate | try/catch로 boolean 반환 (실패 UX 노출은 Phase 4 PERS-04로 transfer) |
| T-01-03 | Tampering (XSS via 사용자 todo 텍스트) | 향후 view 모듈 | accept (Phase 1 범위 밖) | Phase 1엔 DOM 렌더 0건. 사후 보호로 verification에 `grep "innerHTML\s*="` 포함; 본격 mitigation은 Phase 2 (STYL-02, `textContent` only) |
| T-01-04 | Repudiation / Confusion | 사용자가 `file://` 더블클릭 → 모듈 차단 → 데이터 미저장 (저장된 줄 알지만 앱 자체가 안 뜸) | mitigate | README가 `python3 -m http.server` 단독 권장 + file:// 미지원 한 줄 경고 (Task 5) |
| T-01-05 | Information Disclosure | 비밀/PII 저장 | accept | 비밀·PII 저장 없음. todo 텍스트는 사용자 본인 입력, 같은 origin에 머묾. 저값 자산. |
| T-01-06 | Tampering (미래 스키마 변경 시 마이그레이션 불가) | `js/storage.js` defaultState | mitigate | 첫 출하 데이터에 `schemaVersion: 1` 강제 (Task 2). 마이그레이션 로직은 v2까지 deferred — 폴백만 Phase 1에서 보장. |
</threat_model>

<verification>
## Phase 1 Verification Checklist

CONTEXT.md `<decisions>`의 6단계 + RESEARCH.md `Validation Architecture`의 추가 권장 2개를 합친 8단계를 phase 게이트로 사용한다.

1. **로드 무에러:** `python3 -m http.server 8000`로 서빙 → `http://localhost:8000` 접속 → DevTools Console 에러 **0건**, Network 탭에서 `index.html` / `css/styles.css` / `js/app.js` / `js/dateKey.js` / `js/storage.js` 모두 **200**.

2. **dateKey UTC 드리프트 검증:** Console에서 `window.dateKey(new Date(2026,4,3,23,55))` → 정확히 `'2026-05-03'` (한국 KST에서 23:55라도 UTC date가 아닌 로컬 date).

3. **저장 라운드트립:** Console에서
   ```js
   window.save(window.defaultState()); window.load()
   ```
   → `{ schemaVersion: 1, todosByDate: {} }` 그대로 반환.

4. **localStorage 키 확인:** DevTools Application → Local Storage → `http://localhost:8000`에 키 `hansung-todo:v1` 존재, 값은 `{"schemaVersion":1,"todosByDate":{}}`.

5. **`toISOString` 부재:**
   ```bash
   grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/   # → 0건
   ```

6. **`innerHTML` 부재 (Phase 2 사후 보호):**
   ```bash
   grep -rE "innerHTML\s*=" js/   # → 0건
   ```

7. **Storage 추상화 경계 유지 (RESEARCH 추가 권장):**
   ```bash
   grep -rE "localStorage\." js/ | grep -v "js/storage.js"   # → 0건
   ```

8. **손상/첫실행 복구 (RESEARCH 추가 권장):** Console에서
   ```js
   localStorage.setItem('hansung-todo:v1', '{not json'); window.load()
   ```
   → `{ schemaVersion: 1, todosByDate: {} }` 반환 (throw 없음). 이어서
   ```js
   localStorage.removeItem('hansung-todo:v1'); window.load()
   ```
   → 동일하게 `defaultState()` 반환.

8단계 모두 통과해야 Phase 1 종료.
</verification>

<success_criteria>
ROADMAP.md Phase 1의 5개 Success Criteria가 모두 충족되어야 한다:

1. ✅ README의 명령(`python3 -m http.server`)으로 페이지 로드 시 콘솔 에러 0건. (Verification 1)
2. ✅ 리포는 `index.html` + `css/` + `js/` 정적 자산만 — 빌드 단계, 번들러, 프레임워크 0건, GitHub Pages 호환. (Tasks 1–4 + 외부 CDN 링크 0건)
3. ✅ Console에서 storage 헬퍼가 `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": [...] } }` 블롭을 키 `hansung-todo:v1`에 라운드트립. (Verification 3, 4)
4. ✅ `dateKey()`가 임의의 `Date`(23:55 로컬 포함)에 대해 로컬 시간 `YYYY-MM-DD`를 반환하고 `toISOString`은 코드베이스에 부재. (Verification 2, 5)
5. ✅ README가 로컬 실행과 GitHub Pages 배포를 모두 문서화. (Task 5)

## Coverage Mapping (REQ → Tasks)

| Requirement | Tasks | 검증 항목 |
|-------------|-------|-----------|
| DEL-01 (no build/bundler/framework) | Task 4 (정적 셸), 모든 task (CDN/빌드 0건) | Verification 1 (200 응답), 외부 의존성 0건 |
| DEL-02 (`index.html` + `css/` + `js/`, GH Pages 호환) | Task 4 | 디렉터리 구조 + Verification 1 |
| DEL-03 (실행 방법 README 문서화) | Task 5 | README grep (Task 5 verify) |
| PERS-01 (`hansung-todo:v1` 단일 키 + JSON) | Task 2 | Verification 3, 4 |
| PERS-02 (`{ schemaVersion: 1, todosByDate: {...} }` 스키마) | Task 2 | Verification 3, 8 |
| PERS-05 (로컬 시간 `YYYY-MM-DD`, `toISOString` 금지) | Task 1 | Verification 2, 5 |

(PERS-03 새로고침 후 데이터 유지 → Phase 2; PERS-04 실패 UX → Phase 4. 둘 다 Phase 1 범위 밖이지만 Phase 1의 `save`/`load` 인터페이스가 그 토대를 마련한다.)
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md` per the summary template.

다음 단계 안내:
- Phase 2 (`/gsd-discuss-phase 02` → `/gsd-research-phase 02` → `/gsd-plan-phase 02`)에서 todo CRUD를 구현하면서 `app.js`의 `window.*` dev 노출을 정리(또는 `window.App = {...}`로 압축)할지 재검토한다.
</output>
