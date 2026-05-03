# Phase 1: Foundation — Research

**Researched:** 2026-05-03
**Domain:** No-build vanilla JS 정적 셸 + 날짜 키 헬퍼 + localStorage 입출력 원시 함수
**Confidence:** HIGH

## Summary

Phase 1은 화면을 그리지 않는 **기반 페이즈**다. 산출물은 (1) `<script type="module">`로 부팅되는 단일 진입점 `index.html`, (2) 빈 골격 스타일시트 `css/styles.css`, (3) 로컬 시간 기준 `dateKey()` 헬퍼, (4) `localStorage` 라운드트립을 안전하게 처리하는 `load()`/`save()`/`defaultState()` 함수, (5) `python3 -m http.server` 실행과 GitHub Pages 배포 안내가 적힌 `README.md`이다.

기술적 자유도는 0에 가깝다 — CONTEXT.md가 모듈 로딩 전략, 파일 분할, 스토리지 키/스키마, ID/createdAt 포맷, `dateKey` 구현 방식, README 범위, 검증 체크리스트까지 모두 잠가놓았다. 본 연구의 역할은 **잠긴 결정을 실행 가능한 코드 패턴으로 풀어내고**, planner가 task로 쪼갤 때 빠뜨리기 쉬운 함정(특히 Pitfall 1·3·4)에 대한 검증 단계를 명시하는 것이다.

**Primary recommendation:** PITFALLS.md의 reference 코드(Pitfall 1의 `dateKey`, Pitfall 3의 `load`/`save`)를 그대로 차용하고, CONTEXT.md `<decisions>`의 6단계 검증 체크리스트를 phase verification gate로 사용한다. 새 기술 도입 0건. ARCHITECTURE.md가 제안한 `store.js`/`models/todo.js`/`views/`는 **Phase 1 범위 밖**이므로 만들지 않는다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**모듈 로딩:**
- `<script type="module" src="js/app.js"></script>` + ESM `import`/`export` 사용
- README에 실행 방법 두 가지 명시: ① `python3 -m http.server` 후 `http://localhost:8000` ② GitHub Pages 배포
- `file://` 더블클릭은 지원하지 않음을 README에 명시 (Pitfall 4)

**파일 구성:**
- Phase 1 산출물: `index.html`, `css/styles.css` (빈 또는 토큰 스켈레톤), `js/dateKey.js`, `js/storage.js`, `js/app.js`, `README.md`
- `calendar.js`, `todos.js`, `dom.js`는 Phase 1에서 만들지 않음

**스토리지:**
- 키: `hansung-todo:v1`
- 스키마: `{ schemaVersion: 1, todosByDate: {} }`
- `defaultState()` → `{ schemaVersion: 1, todosByDate: {} }`
- `load()`는 try/catch로 null/손상 JSON/`SecurityError` 모두 흡수 → `defaultState()` 반환
- `load()`가 `schemaVersion !== 1`이면 `defaultState()` 반환 (마이그레이션은 v2)
- `save()`는 try/catch로 boolean 반환 (성공/실패). 실패 UX는 Phase 4

**날짜 키:**
- `dateKey(d=new Date())` 로컬 시간 `YYYY-MM-DD`
- `getFullYear` / `getMonth+1` / `getDate` + `padStart`
- `toISOString()`, `.toJSON()`, `Date.UTC(...)` 사용 금지
- 테스트/데모용 Date 생성 시 `new Date(y, m-1, d)` 사용 (`new Date('2026-05-03')` 금지)

**Todo 모델 (Phase 2 사용, Phase 1은 스키마 문서화만):**
- 필드: `{ id, text, done, createdAt }`
- `id` = `crypto.randomUUID()`
- `createdAt` = `Date.now()` (epoch ms, Number)

**README 범위:** 한 줄 소개 / `python3 -m http.server` 명령 + URL / GitHub Pages 한 줄 / 파일 구조 트리 / "double-click 미지원" 경고

**`app.js`:** Phase 1에서는 거의 비어 있어도 됨. 모듈 로딩 끊기지 않는지 검증 + 콘솔 사용을 위해 `window.dateKey`, `window.load`, `window.save`, `window.defaultState` 노출(개발 편의).

### Claude's Discretion

- `index.html`의 정확한 마크업 구조 (다만 Phase 2~3에서 채울 mount node를 미리 둘지 여부는 plan에서 결정)
- `css/styles.css`를 완전 빈 파일로 둘지, `:root` 디자인 토큰 스켈레톤만 둘지
- `app.js`에서 헬퍼를 `window`에 노출하는 방식 (개별 할당 vs `window.App = {...}`)
- README 내부 마크다운 구조 (헤더 레벨, 코드블록 언어 태그 등)
- 검증을 위한 옵셔널 `tests.html` 추가 여부 (CONTEXT는 명시 안 함; 콘솔 수동 검증으로 충분)

### Deferred Ideas (OUT OF SCOPE)

- Storage 실패 토스트 UI → Phase 4 (PERS-04)
- 모델 헬퍼 `newTodo(text)` → Phase 2
- JSON export/import 백업 → v2 (POL-01)
- day.js 등 날짜 라이브러리 → 현재 `Intl.DateTimeFormat('ko-KR')`로 충분, v2 재평가
- ARIA grid / 키보드 네비게이션 → v2 (POL-03/04)
- schemaVersion 마이그레이션 로직 → 실제로 스키마가 바뀔 때 추가 (Phase 1은 폴백만)
- `calendar.js`, `todos.js`, `dom.js` 모듈 → Phase 2/3
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEL-01 | 빌드 도구·번들러·프레임워크 없이 `index.html`을 통해 동작 | Native `<script type="module">` 채택 (STACK.md). npm/build 도입 0건. |
| DEL-02 | 정적 자산 `index.html` + `css/` + `js/` 구조, GitHub Pages 호환 | 디렉터리 트리 명시 (아래 "Recommended Project Structure"). Pages는 `https://`로 서빙하므로 모듈 정상 동작 (Pitfall 4 해결). |
| DEL-03 | 실행 방법(README) | `python3 -m http.server` 단독 안내. CONTEXT가 file:// 미지원을 명시. |
| PERS-01 | `localStorage` 단일 키 `hansung-todo:v1`에 JSON 저장 | `KEY = 'hansung-todo:v1'` 상수 export. `save()`가 `JSON.stringify` 후 `setItem`. |
| PERS-02 | 스키마 `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": Todo[] } }` | `defaultState()` 반환값. `load()` 스키마 버전 검증 (≠1이면 폴백). |
| PERS-05 | 날짜 키는 로컬 시간 `YYYY-MM-DD`, `toISOString` 금지 | `dateKey()` reference 구현 (PITFALLS.md Pitfall 1). 검증: `grep -r "toISOString" js/` → 0건. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| HTML 마운트 / 모듈 부트스트랩 | Browser / Static | — | 정적 진입점, 서버 없음 |
| 날짜 → 키 변환 (`dateKey`) | Browser (pure util) | — | 외부 의존성·DOM 없음. `js/dateKey.js`. |
| 영속성 read/write (`load`/`save`) | Browser (storage adapter) | localStorage (브라우저 내장) | `js/storage.js`가 단일 추상화 경계. 다른 모든 모듈은 raw `localStorage.*` 호출 금지. |
| 실행 안내 / 배포 호환 | Static / GitHub Pages | — | `README.md` + 디렉터리 구조가 곧 계약. |
| UI 렌더링 / CRUD | — | — | **Phase 1 범위 밖** (Phase 2/3) |

**Why this matters:** Phase 1은 **데이터-인접 유틸**과 **부팅 셸**만 담당한다. planner가 실수로 calendar/todo view 작업을 끼워 넣으면 안 된다 — ROADMAP.md가 Phase 2/3에 명확히 분리해 두었다.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML5 | Living standard | `index.html` 단일 진입점 + 모듈 스크립트 태그 | 빌드 0, 의존성 0 [VERIFIED: STACK.md] |
| CSS3 | Living standard | `css/styles.css` 골격 (Phase 1은 거의 빈 파일) | 토큰 정의는 Phase 4까지 미룸 [CITED: STACK.md] |
| Vanilla JS (ES2023+, ESM) | ES2023 baseline | `js/dateKey.js`, `js/storage.js`, `js/app.js` | `<script type="module">`은 Chrome ≥89, FF ≥108, Safari ≥15, Edge ≥89에서 지원 [CITED: CLAUDE.md "Version Compatibility"] |
| `localStorage` | Living standard | 영속화 | 동기 KV, ~5MB/origin [CITED: ARCHITECTURE.md] |
| Native `Date` | ES baseline | `dateKey()` 내부 구현 | Phase 1 범위에서 충분; Temporal은 Safari 미지원이라 거부 [CITED: STACK.md "Alternatives Considered"] |
| `crypto.randomUUID()` | Web Crypto | (Phase 2에서 사용) Todo `id` 생성 | 모든 2026 모던 브라우저 지원, 폴리필 불필요 [CITED: ARCHITECTURE.md] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (없음) | — | — | Phase 1은 zero runtime dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `Date` | Temporal API | Safari 미shipping(2026-05). 폴리필은 빌드 필요 → DEL-01 위반. 재평가 시점 ~2027. [CITED: STACK.md] |
| Native `Date` | day.js v1.11.20 (CDN) | Phase 1 스코프(YYYY-MM-DD)에는 과잉. 오프라인 `file://` 깨짐 위험. [CITED: STACK.md] |
| ES modules | 글로벌 `<script>` 태그 | "double-click 동작" 가능하지만 학습용으로 모듈 패턴이 더 가치 있음. CONTEXT가 모듈 채택을 lock. [CITED: PITFALLS.md Pitfall 4] |

**Installation:**
```bash
# 설치 단계 없음. 다음 명령으로 즉시 실행:
python3 -m http.server 8000
# 그리고 http://localhost:8000 접속
```

**Version verification:** N/A — 외부 패키지 0건. 브라우저 API만 사용.

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                  Browser (http://localhost)              │
│                                                          │
│   index.html                                             │
│      │                                                   │
│      └─ <script type="module" src="js/app.js">           │
│             │                                            │
│             ├─ import { dateKey } from './dateKey.js'    │
│             │       (pure: Date → "YYYY-MM-DD")          │
│             │                                            │
│             └─ import { KEY, defaultState,               │
│                          load, save } from './storage.js'│
│                       │                                  │
│                       ▼                                  │
│                  window.localStorage                     │
│                  key: "hansung-todo:v1"                  │
│                  value: JSON({schemaVersion:1,           │
│                               todosByDate:{}})           │
│                                                          │
│   (Phase 1: app.js는 헬퍼를 window에 노출만 하고 종료)    │
│                                                          │
│   DevTools Console                                       │
│      └─ window.dateKey(...) / window.load() / save()     │
│         로 라운드트립 검증                                │
└──────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
hansung-todo-gsd/
├── index.html             # 단일 진입점, <script type="module" src="js/app.js">
├── css/
│   └── styles.css         # Phase 1: 빈 파일 또는 :root 토큰 스켈레톤
├── js/
│   ├── dateKey.js         # export function dateKey(d=new Date())
│   ├── storage.js         # export const KEY; export functions defaultState/load/save
│   └── app.js             # 부트스트랩 + window에 헬퍼 노출 (개발 편의)
├── README.md              # 실행 안내 (http.server / GitHub Pages / 파일 트리 / file:// 경고)
└── .planning/             # GSD 산출물 (코드와 분리)
```

**왜 이 구조인가:**
- `js/` 서브폴더(`models/`, `views/`, `utils/`) 없음 — Phase 1에는 모듈이 3개뿐이라 평탄화가 가독성에 더 유리.
- 후속 페이즈에서 모듈 수가 늘어나면 그때 분류한다 (premature structuring 회피).
- ARCHITECTURE.md가 제안한 `store.js`/`models/`/`views/`는 Phase 2/3에서 도입.

### Pattern 1: ES Modules via `<script type="module">`

**What:** `index.html`이 정확히 한 개의 모듈 엔트리(`js/app.js`)를 로드. 나머지는 `import`/`export`.
**When to use:** 항상. CONTEXT lock.
**Example:**
```html
<!-- index.html -->
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>Hansung Todo</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main id="app"><!-- Phase 2/3에서 채움 --></main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```
Source: ARCHITECTURE.md Pattern 1, CLAUDE.md "Version Compatibility" [VERIFIED: 프로젝트 문서]

### Pattern 2: 단일 책임의 storage 어댑터 (write-through 추상화)

**What:** `js/storage.js`가 raw `localStorage.*`를 호출하는 **유일한** 모듈. 다른 모듈은 `KEY`, `defaultState`, `load`, `save`만 사용.
**When to use:** 항상. 영속화 책임을 한 곳에 모아 try/catch와 스키마 검증을 누락 없이 적용.
**Example:**
```js
// js/storage.js  (Source: PITFALLS.md Pitfall 3 reference + CONTEXT spec)
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
    return false; // QuotaExceededError / SecurityError. UX는 Phase 4.
  }
}
```

### Pattern 3: Pure date-key helper (UTC drift 차단)

**What:** 한 함수, 한 모듈, 한 가지 책임.
**Example:**
```js
// js/dateKey.js  (Source: PITFALLS.md Pitfall 1 reference, verbatim)
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

### Pattern 4: Bootstrap that does (almost) nothing

**What:** Phase 1의 `app.js`는 모듈 그래프 무결성 검증 + 콘솔 검증을 위한 window 노출만.
**Example:**
```js
// js/app.js
import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';

// 개발 편의: 콘솔에서 검증 가능하도록 노출 (Phase 2부터는 제거 검토)
window.dateKey = dateKey;
window.load = load;
window.save = save;
window.defaultState = defaultState;
window.STORAGE_KEY = KEY;

// (선택) 부팅 신호
console.log('[hansung-todo] booted. KEY =', KEY);
```

### Anti-Patterns to Avoid
- **`new Date('YYYY-MM-DD')` 사용:** 엔진별로 UTC midnight으로 파싱됨 → 로컬 날짜 어긋남. 테스트도 `new Date(y, m-1, d)`로 작성. [CITED: PITFALLS.md Pitfall 1]
- **`toISOString().slice(0,10)`:** UTC drift. CI grep으로 차단. [CITED: PITFALLS.md Pitfall 1]
- **raw `localStorage.getItem`/`setItem`을 `app.js`나 다른 모듈에서 직접 호출:** `storage.js`만 유일한 통로. [CITED: ARCHITECTURE.md Anti-Pattern 1]
- **`innerHTML = ...`:** Phase 1엔 DOM 코드가 없지만 사후 보호 grep을 verification에 포함 (Phase 2 대비). [CITED: PITFALLS.md Pitfall 2]
- **`schemaVersion` 필드 누락:** v1 데이터에 반드시 `schemaVersion: 1` 박는다. 마이그레이션 미래 비용 회피. [CITED: PITFALLS.md "Technical Debt"]
- **`<script type="module">` + `file://` 더블클릭 안내:** README가 file:// 미지원을 명시해야 함. [CITED: PITFALLS.md Pitfall 4]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID 생성 | 자체 난수 ID | `crypto.randomUUID()` | 브라우저 내장, 충돌 무시 가능 [CITED: ARCHITECTURE.md] |
| 모듈 로딩 | IIFE/글로벌 | `<script type="module">` + ESM | 네이티브 지원, CONTEXT lock |
| JSON 직렬화 | 커스텀 인코딩 | `JSON.stringify`/`JSON.parse` | 표준 |
| 날짜 산술 (Phase 1 범위) | day.js / Temporal | Native `Date` + `padStart` | Phase 1엔 month math 없음. `dateKey`만 필요. |

**Key insight:** Phase 1의 모든 요구사항은 **브라우저 표준 API**로 충족된다. 외부 패키지 도입 0건이 정답.

## Common Pitfalls

### Pitfall 1: UTC drift in date keys (HIGH 영향)

**What goes wrong:** `new Date().toISOString().slice(0,10)` 사용 → UTC 기준 날짜로 키가 생성. 한국(UTC+9)에서 자정 직전 todo가 다음/전날로 들어가는 버그.
**Why it happens:** `toISOString()`이 가장 짧은 경로처럼 보임.
**How to avoid:** PITFALLS.md Pitfall 1의 reference 코드를 그대로 사용. `getFullYear`/`getMonth+1`/`getDate` + `padStart`.
**Warning signs:**
- `toISOString` / `toJSON` / `Date.UTC` 코드 등장
- `new Date('YYYY-MM-DD')` 형태의 문자열 파싱
**Verification:**
```bash
grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/   # → 0 results
grep -rE "new Date\('[0-9]" js/                     # → 0 results
```
및 콘솔 검증: `window.dateKey(new Date(2026,4,3,23,55))` → `'2026-05-03'`.
[CITED: PITFALLS.md Pitfall 1]

### Pitfall 2: localStorage 실패 모드 무시 (MEDIUM 영향, Phase 1)

**What goes wrong:** `JSON.parse(localStorage.getItem(...))` 무방비 호출. (a) null → `JSON.parse(null) === null` → 후속 `.todosByDate` 접근 throw, (b) 손상 JSON → `SyntaxError`, (c) Safari Private Mode → `setItem` throw, (d) `window.localStorage` 자체 접근에서 `SecurityError` 가능.
**Why it happens:** "내 브라우저에선 잘 됨" 사고.
**How to avoid:** PITFALLS.md Pitfall 3의 try/catch 래퍼. `load`는 fallback 반환, `save`는 boolean 반환.
**Phase 1 범위:** 인터페이스만 견고하게. 실패 토스트는 Phase 4.
**Warning signs:** `js/` 안에서 `storage.js` 외 모듈이 raw `localStorage.*` 호출.
**Verification:**
```bash
grep -rE "localStorage\." js/ | grep -v "js/storage.js"   # → 0 results
```
DevTools에서 `localStorage.setItem('hansung-todo:v1', '{not json')` 후 `window.load()` → `defaultState()` 반환되는지 확인.
[CITED: PITFALLS.md Pitfall 3]

### Pitfall 3: ES modules over `file://` (HIGH 영향, 사용자 혼동 유발)

**What goes wrong:** README가 "open index.html"이라 적혀 있고 코드는 `<script type="module">`. 사용자 더블클릭 → Chrome 등에서 CORS로 모듈 로딩 차단 → 빈 페이지.
**Why it happens:** `file://` 스킴에 대한 모듈 CORS 정책(2018+)이 잘 알려져 있지 않음.
**How to avoid:** README에 두 가지 명시:
1. ✅ `python3 -m http.server` (권장)
2. ✅ GitHub Pages 배포
3. ❌ `file://` 더블클릭 미지원 (한 줄 경고)

**Verification:**
- README에 위 세 항목이 모두 들어 있는지 확인
- 실제로 `python3 -m http.server`로 서빙 후 `http://localhost:8000` 접속 → 콘솔 에러 0건
[CITED: PITFALLS.md Pitfall 4, CONTEXT.md `<decisions>`]

### Pitfall 4: schemaVersion 필드 누락 (MEDIUM, 미래 비용)

**What goes wrong:** 첫 출하 데이터에 `schemaVersion`이 없음 → 미래 스키마 변경 시 기존 사용자 데이터를 마이그레이션할 단서가 없음.
**How to avoid:** `defaultState()`가 항상 `{ schemaVersion: 1, todosByDate: {} }` 반환. `load()`가 `schemaVersion !== 1`이면 폴백.
**Verification:** `window.save(window.defaultState()); JSON.parse(localStorage.getItem('hansung-todo:v1')).schemaVersion === 1`.
[CITED: PITFALLS.md "Technical Debt Patterns" + CONTEXT.md spec_lock]

### Pitfall 5: 잘못된 검증 (모듈 로딩 누락)

**What goes wrong:** `app.js`가 `import` 줄만 갖고 있고 실제 사용처가 없으면 일부 번들러/IDE에서 tree-shake 인상이 들지만, 브라우저는 모듈 그래프를 끝까지 로드한다 — 다만 import 자체가 실패하면 (잘못된 경로, 대소문자 차이 등) 콘솔에 Network 404가 뜬다. macOS는 case-sensitive가 아니지만 GitHub Pages(Linux)는 case-sensitive.
**How to avoid:** 파일명/import 경로의 대소문자 일관성 유지 (`./dateKey.js`, `./storage.js`). 상대 경로에 `./` 명시 (bare specifier 금지).
**Verification:** `python3 -m http.server` 서빙 후 Network 탭에서 모든 `js/*.js` 파일이 200 응답.

## Runtime State Inventory

> 본 페이즈는 **신규 생성**(첫 페이즈)이며 rename/refactor가 아니므로 상세 inventory가 사실상 비어 있음. 그러나 한 가지 주의 사항:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — 신규 프로젝트, `localStorage` 키 `hansung-todo:v1`은 새로 생성됨 | 없음 |
| Live service config | None | 없음 |
| OS-registered state | None | 없음 |
| Secrets/env vars | None | 없음 |
| Build artifacts | None — 빌드 시스템 자체가 없음 | 없음 |

**Browser dev state to be aware of:** 개발 중 DevTools에서 수동으로 `localStorage`에 잘못된 값을 넣은 경우 `load()`가 폴백을 반환하는지 검증해야 함 (Pitfall 2 verification).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3 (`python3 -m http.server`) | DEL-03 README 안내 | (보통 macOS/Linux 기본 탑재) | 3.x | `npx serve`, `php -S`, VS Code Live Server 등 (README엔 python3만 안내) |
| 모던 브라우저 (Chrome/FF/Safari/Edge 현행) | 모든 검증 | (사용자 환경 가정) | ES2023 baseline | — |
| Git + GitHub 계정 | DEL-02 GitHub Pages 배포 | (개발자 환경 가정) | — | 로컬 http.server만으로도 페이즈 검증 가능 |

**Missing dependencies with no fallback:** 없음 — 모든 검증을 로컬에서 완수 가능.
**Missing dependencies with fallback:** Python3가 없는 환경이 있을 수 있으나 README가 단일 명령만 안내하면 충분 (CONTEXT 결정).

## Code Examples

### `index.html` (최소 골격)
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Hansung Todo</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <main id="app">
    <!-- Phase 2/3에서 캘린더와 todo 리스트가 여기에 렌더됨 -->
  </main>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

### `js/dateKey.js`
```js
// Source: PITFALLS.md Pitfall 1 reference (verbatim)
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
```

### `js/storage.js`
```js
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
```

### `js/app.js`
```js
import { dateKey } from './dateKey.js';
import { KEY, defaultState, load, save } from './storage.js';

// 개발 편의: 콘솔에서 헬퍼 사용 가능 (Phase 2 도입 시 재검토)
window.dateKey = dateKey;
window.load = load;
window.save = save;
window.defaultState = defaultState;
window.STORAGE_KEY = KEY;

console.log('[hansung-todo] booted. KEY =', KEY);
```

### `README.md` 골격
````markdown
# Hansung Todo (GSD Demo)

날짜별 todo를 관리하는 정적 웹앱. 캘린더에서 날짜를 클릭해 그 날의 todo를 추가/완료/수정/삭제하며, 데이터는 브라우저 `localStorage`에 영구 저장됩니다.

## 실행 방법

저장소를 받은 뒤 프로젝트 루트에서:

```bash
python3 -m http.server 8000
```

브라우저로 `http://localhost:8000` 접속.

> ⚠️ `index.html`을 더블클릭(file://)하면 ES 모듈이 CORS로 차단되어 동작하지 않습니다. 반드시 위 명령으로 로컬 서버를 띄우세요.

## GitHub Pages 배포

저장소 Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정하면 별도 빌드 없이 배포됩니다.

## 파일 구조

```
.
├── index.html         # 단일 진입점
├── css/styles.css     # 스타일 (현재는 골격)
├── js/
│   ├── dateKey.js     # 로컬 시간 YYYY-MM-DD 헬퍼
│   ├── storage.js     # localStorage 입출력 (load/save/defaultState)
│   └── app.js         # 부트스트랩
└── README.md
```
````

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Globals + script ordering | ESM (`<script type="module">`) | 모든 모던 브라우저(2018+) | CONTEXT lock |
| `Moment.js` / 자체 date util | Native `Date` + `Intl.DateTimeFormat` | Moment 유지보수 모드 (2020+) | 의존성 0 [CITED: STACK.md "What NOT to Use"] |
| 자체 UUID | `crypto.randomUUID()` | 모든 모던 브라우저 (2022+) | 폴리필 불필요 |

**Deprecated/outdated:**
- `Temporal` API: TC39 Stage 4 (2026-03)이지만 Safari 미shipping → Phase 1에서 사용 금지. 재평가 ~2027. [CITED: STACK.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | macOS/Linux 사용자는 `python3`이 PATH에 있다 | README 안내 | 사용자 혼동. 영향 LOW — README가 단일 명령만 안내하므로 사용자가 즉시 "command not found"를 인지 가능. |
| A2 | 강의 환경에서 GitHub Pages 사용이 허용된다 | README "GitHub Pages 배포" | LOW — 한 줄 안내일 뿐 실제 배포는 학생/강사 재량. |
| A3 | `app.js`에서 `window.*`로 헬퍼를 노출하는 것이 강의용 검증으로 적절 | Phase 1 검증 체크리스트 | LOW — Phase 2 도입 시 제거하거나 `window.App = {...}`로 정리할 수 있음. CONTEXT가 "개발 편의"라고 명시. |

(잠긴 결정은 모두 CONTEXT.md에 명시되어 있어 추가로 가정한 것이 거의 없음.)

## Open Questions (RESOLVED)

1. **`css/styles.css`를 완전히 빈 파일로 둘 것인가, 아니면 `:root` 디자인 토큰 스켈레톤만 미리 둘 것인가?**
   - What we know: CONTEXT가 "빈 파일 또는 토큰 스켈레톤"이라 양자택일을 허용.
   - What's unclear: 강의 흐름상 Phase 4(STYL-01)에서 토큰을 도입하는 게 더 자연스러운지, Phase 1에 미리 박아두는 게 더 자연스러운지는 강사 판단.
   - Recommendation: **빈 파일 + 한 줄 주석**(`/* Styles for Phase 4 (STYL-01). Intentionally empty. */`) 채택. DEL-02의 디렉터리 계약은 만족하면서 Phase 4의 책임을 명확히 한다.

2. **`app.js`의 `window.*` 노출을 Phase 2에서 어떻게 정리할 것인가?**
   - What we know: Phase 1 검증을 위해 필요.
   - What's unclear: Phase 2에서 store/handler가 들어오면 자동으로 제거할지, 별도 task로 정리할지.
   - Recommendation: Phase 1 plan에 "Phase 2 정리 항목"으로 한 줄 메모만 남긴다. Phase 1 범위에서는 그대로 둔다.

3. **(선택) `tests.html` 추가 여부?**
   - What we know: CONTEXT는 콘솔 수동 검증만 명시. 강의 환경에서는 그것으로 충분.
   - Recommendation: Phase 1에서는 **추가하지 않음**. Phase 2에서 CRUD가 들어오면 그때 도입 검토.

## Validation Architecture

> `.planning/config.json`의 `workflow.nyquist_validation`이 **`false`** 이므로 본 섹션은 생략 (config 결정 존중).

대신 CONTEXT.md `<decisions>`의 6단계 수동 검증 체크리스트를 phase verification gate로 사용한다:

1. `python3 -m http.server` 후 `http://localhost:8000` 접속 → 콘솔 에러 0건.
2. `window.dateKey(new Date(2026,4,3,23,55))` → `'2026-05-03'` (UTC 드리프트 검증).
3. `window.save(window.defaultState()); window.load()` → `{ schemaVersion: 1, todosByDate: {} }` 라운드트립.
4. DevTools Application → Local Storage 탭에 키 `hansung-todo:v1` 표시.
5. `grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/` → 0건.
6. `grep -rE "innerHTML\s*=" js/` → 0건 (Phase 2 사후 보호).

추가 권장:
7. `grep -rE "localStorage\." js/ | grep -v "js/storage.js"` → 0건 (storage 추상화 경계 유지).
8. DevTools에서 `localStorage.setItem('hansung-todo:v1', '{not json')` 후 `window.load()` → `defaultState()` 반환 (손상 복구).
9. `localStorage.removeItem('hansung-todo:v1'); window.load()` → `defaultState()` 반환 (첫 실행 경로).

## Security Domain

> `security_enforcement: true`, `security_asvs_level: 1` per `.planning/config.json`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | 인증 없음 (정적 단일 사용자 앱) |
| V3 Session Management | no | 세션 없음 |
| V4 Access Control | no | 접근 통제 없음 |
| V5 Input Validation | partial | Phase 1엔 사용자 입력 처리 없음. `load()`는 외부에서 변조될 수 있는 `localStorage` 값을 검증함 (스키마 폴백). |
| V6 Cryptography | no | 암호화 없음. `crypto.randomUUID()`는 ID 충돌 회피 용도로 Phase 2에서 사용. 비밀 보호 아님. |
| V7 Error Handling | yes | `load`/`save`의 try/catch가 예외를 흡수하고 안전한 기본값을 반환 (PERS-04는 Phase 4). |
| V12 File Handling | no | 파일 업로드 없음. |

### Known Threat Patterns for {Vanilla JS + localStorage 정적 앱, Phase 1}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| 변조된 `localStorage` 값 (사용자 DevTools, 또는 잠재적 익스텐션) → 앱 크래시 | Tampering / Denial of Service | `load()` try/catch + 스키마 검증 + `defaultState()` 폴백 (Pattern 2). |
| Phase 2부터 발생할 XSS via 사용자 todo 텍스트 | Tampering / Elevation | Phase 1 검증에 `grep "innerHTML\s*="` 포함 (사후 보호). 본격 mitigation은 Phase 2 (`textContent` only, STYL-02). |
| `file://` 사용 시 모듈 차단 → 사용자가 잘못된 실행 → 데이터 미저장 | Repudiation / Confusion | README 명시 + `python3 -m http.server` 단독 권장 (Pitfall 3 위 항목). |
| **Phase 1 자체에는 외부 입력 처리/네트워크 노출이 없음** — ASVS L1의 대부분 항목은 N/A. |

**Security gate for Phase 1:** verification 6단계 + 추가 7번(storage 경계) 통과 시 Pass.

## Sources

### Primary (HIGH confidence)
- `.planning/research/PITFALLS.md` — Pitfall 1 (UTC drift) reference 코드, Pitfall 3 (localStorage failure modes) reference 코드, Pitfall 4 (file:// modules) 결정 근거
- `.planning/research/ARCHITECTURE.md` — 컴포넌트 책임/경계, anti-patterns 1·2·3·4
- `.planning/research/STACK.md` — 채택/거부 스택, Temporal 미shipping 근거, day.js 거부 근거
- `.planning/REQUIREMENTS.md` — DEL-01/02/03, PERS-01/02/05, TODO-02 잠금 사양
- `.planning/ROADMAP.md` — Phase 1 Success Criteria 5개
- `.planning/phases/01-foundation/01-CONTEXT.md` — 모든 lock된 결정
- `CLAUDE.md` (project) — Version Compatibility 표 (모듈 지원, CSS nesting, `<dialog>`)

### Secondary (MEDIUM confidence)
- (없음 — Phase 1은 프로젝트 내부 lock된 결정만으로 충분)

### Tertiary (LOW confidence)
- (없음)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — CONTEXT lock + STACK.md verification
- Architecture: HIGH — ARCHITECTURE.md 패턴 + CONTEXT 결정의 단순 적용 (Phase 1은 view 없음)
- Pitfalls: HIGH — PITFALLS.md reference 코드를 그대로 차용

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (30일) — 외부 의존성이 없으므로 만료 위험 낮음. Temporal 또는 day.js를 도입할 결정이 발생하면 그때 재조사.

## RESEARCH COMPLETE
