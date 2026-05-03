# Phase 4: Modern Polish & Failure UX — Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 4 (3 modified, 1 banner block to add)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `css/styles.css` (MODIFY) | styles / design-tokens | n/a (static) | `css/styles.css` Phase 3 블록 | self (append-only 확장) |
| `js/storage.js` (MODIFY) | adapter / persistence | I/O wrap + throw | `js/storage.js` 현재 `save()` boolean 버전 | self (boolean → throw 전환) |
| `js/app.js` (MODIFY) | bootstrap / controller | event-driven + render fan-out | `js/app.js` 기존 `commit()` + 위임 click | self (commit try/catch 확장 + 위임 case 2개 추가) |
| `index.html` (MODIFY) | static shell | n/a | `index.html` 현재 `<main id="app">` | self (banner 노드 1개 추가) |

> 이 phase는 신규 파일 0건. 4개 파일 모두 자기 자신이 가장 가까운 analog (self-precedent). Phase 1~3에서 잠긴 패턴을 그대로 확장한다.

---

## Pattern Assignments

### `css/styles.css` (MODIFY — design tokens + polish + banner styles)

**Analog:** `css/styles.css` Phase 1~3 블록 (self).

**Append-only 패턴 (Phase 1/2/3 일관)** — Phase 1(L1–4) → Phase 2(L6–16) → Phase 3(L18–80) 순서로 누적되어 있고, 각 블록은 `/* Phase N: ... 본격 폴리시는 Phase 4 (STYL-01). */` 헤더로 마킹됨. Phase 4는 이 패턴을 따르되 **두 가지 예외**가 있다:

1. `:root` 블록(L2–4) **교체** — placeholder 주석 자리에 실제 design tokens 채움. 이는 Phase 1 SUMMARY의 명시적 위임("`:root` 블록을 파일 최상단에 두고 그 아래에 컴포넌트별 룰" — `01-01-SUMMARY.md` + Phase 1 plan 주석 "Phase 4에서 채움")에 따라 허용된 유일한 비-append 변경.
2. 기존 하드코딩 색·간격 값을 토큰 참조(`var(--accent)` 등)로 **치환** — 시각 회귀 0 보장 (CONTEXT decision A: "기존 하드코딩 값과 일치하도록 매핑").

**기존 하드코딩 → 토큰 매핑** (회귀 0):

| 현재 (L번호) | 값 | 매핑 토큰 |
|---|---|---|
| `.todo-list .done .todo-text` color (L9) | `#999` | `var(--text-muted)` (CONTEXT은 `#6b7280`을 제안 — `#999`와 다름. **회귀 0을 우선**: `--text-muted: #999`로 두거나, CONTEXT 값을 채택하고 시각 변화 1단계 수용. Plan에서 결정 명시 필요) |
| `.empty` color (L12) | `#999` | 동상 |
| `.cal-weekday` color (L37) | `#666` | `var(--text-muted)` 또는 별도 `--text-weekday` |
| `.cal-cell` border (L42) | `1px solid #ddd` | `1px solid var(--border)` (`--border: #e5e7eb` ≈ `#ddd` — 미세 변화) |
| `.cal-cell-adjacent` border / color (L51–52) | `#eee` / `#ccc` | `var(--border)` 옅은 변형 / `var(--text-muted)` |
| `.cal-cell.is-today` border + color (L56–57) | `#2563eb` | `var(--accent)` ✓ exact |
| `.cal-cell.is-selected` background (L61) | `#2563eb` | `var(--accent)` ✓ exact |
| `.cal-cell.is-today.is-selected` border (L67) | `#1e40af` | `var(--accent-strong)` ✓ exact |

**도입할 토큰 블록 (`:root` 교체용)** — CONTEXT decision A에서 그대로:

```css
:root {
  /* Phase 4 (STYL-01): design tokens. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
  --transition: 150ms ease-out;

  --text-sm: 13px;
  --text-base: 15px;
  --text-lg: 18px;

  --accent: #2563eb;
  --accent-strong: #1e40af;
  --bg: #ffffff;
  --bg-muted: #f3f4f6;
  --text: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --danger: #dc2626;
  --danger-bg: #fef2f2;

  font-family:
    -apple-system, BlinkMacSystemFont,
    'Apple SD Gothic Neo',
    'Pretendard Variable', 'Pretendard',
    'Malgun Gothic',
    'Segoe UI', system-ui,
    sans-serif;
  color: var(--text);
  background: var(--bg);
  font-size: var(--text-base);
  line-height: 1.5;
}
```

**Phase 4 블록 헤더 패턴** (Phase 1/2/3 일관 — `02-04-SUMMARY.md` patterns-established 참조):

```css
/* Phase 4 (STYL-01): design tokens 적용 + subtle shadow + 150ms transition. */
/* Phase 4 (PERS-04): storage failure banner. */
```

**색맹 안전 패턴 (Phase 3 잠금 — `03-03-SUMMARY.md` patterns-established)** — banner에도 적용:
- color-only 금지. banner는 **3중 신호**: `--danger-bg` 배경 + `--danger` 좌측 4px 막대(`border-left: 4px solid var(--danger)`) + 텍스트.

**Phase 4 추가 룰 (banner)** — CONTEXT decision C에서:

```css
.banner {
  display: block;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
  border-radius: 4px;
  box-shadow: var(--shadow-1);
  transition: opacity var(--transition);
}
.banner[hidden] { display: none; }
.banner--danger {
  background: var(--danger-bg);
  color: var(--text);
  border-left: 4px solid var(--danger);
}
.banner__actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
```

**transition 적용 위치 (CONTEXT A.3)** — 기존 셀렉터에 `transition: ...` 추가만, 시각 자체는 변화 없음:
- `.cal-cell` (hover/selected 변경)
- `button` (hover)
- `.todo-checkbox` (toggle)
- `.banner` (등장/퇴장)

**Phase 1~3 회귀 가드** — `02-04-SUMMARY.md`/`03-03-SUMMARY.md` 검증 게이트가 보존됨을 입증:
- `.todo-list .done .todo-text { text-decoration: line-through; ... }` — 셀렉터·`text-decoration` 보존, color만 토큰화.
- `.empty`, `.editing .todo-text` — 토큰화만.
- `.cal-grid` `repeat(7, 1fr)` — 보존.
- `.cal-cell-adjacent` `pointer-events: none` — 보존.
- `.is-today` / `.is-selected` / `.cal-cell.is-today.is-selected` — 신호 종류(border vs filled bg) 유지.

---

### `js/storage.js` (MODIFY — `save()` boolean → throw)

**Analog:** `js/storage.js` 현재 (self).

**현재 패턴 (L28–35):**

```javascript
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
```

**Phase 4 패턴 (CONTEXT decision D — 실패 신호를 throw로):**

```javascript
export function save(state) {
  // Phase 4 (PERS-04): 실패 시 silent false 대신 throw — commit()에서 catch하여 banner 노출.
  // localStorage.* 노출은 여전히 이 모듈 내부에 갇혀 있다 (storage 경계 유지).
  localStorage.setItem(KEY, JSON.stringify(state));
}
```

**경계 패턴 보존 (Phase 1 lock — `01-01-SUMMARY.md` patterns-established "Storage 경계 패턴")**:
- `localStorage.*` 호출은 여전히 `js/storage.js` 내부에만 존재.
- 외부 모듈(`app.js`)은 `save()`를 호출하고 throw를 catch할 뿐, `localStorage`를 import하지 않는다.
- grep gate `localStorage\.` outside `js/storage.js` → 0 (Phase 2/3 게이트와 동일 — 회귀 방지).

**`load()`는 변경 없음** — `load()`의 try/catch는 손상 JSON 폴백용이며 PERS-04 범위 밖. CONTEXT decision D는 `save()` 한정.

---

### `js/app.js` (MODIFY — `commit()` try/catch + `storageError` 모듈 변수 + banner 위임)

**Analog:** `js/app.js` 현재 (self).

**Imports 패턴 보존** — 기존 import 블록(L1–2, L16–22) 변경 없음.

**모듈 변수 패턴 (L23–26)** — 기존 4개 옆에 `storageError` 추가:

```javascript
let state = load();
let viewYM = todayYM();
let selectedKey = dateKey();
let editingId = null;
let storageError = null;  // Phase 4 (PERS-04): save() 실패 시 Error 캡처, 성공/닫기 시 null.
```

**`commit()` 현재 패턴 (L69–75):**

```javascript
function commit(nextState) {
  state = nextState;
  if (!save(state)) {
    console.warn('[hansung-todo] save failed; mutation kept in memory');
  }
  render();
}
```

**Phase 4 `commit()` 패턴 (CONTEXT decision D 의사코드 그대로):**

```javascript
function commit(nextState) {
  state = nextState;                  // ① 메모리는 항상 적용 (UI 즉시 반영, rollback 안 함)
  try {
    save(state);                      // ② persist 시도 (실패 시 throw)
    storageError = null;              // ③ 성공 → 에러 클리어 (이전 실패 banner도 자동 사라짐)
  } catch (err) {
    storageError = err;               // ④ 에러 캡처 — render()가 banner 토글
    console.warn('[hansung-todo] save failed; kept in memory', err);
  }
  render();                           // ⑤ banner 노출/숨김 결정은 render에서 storageError로
}
```

**`render()` 확장** — 기존 `render()`(L77–82)에 banner 토글 한 줄 추가:

```javascript
function render() {
  renderCalendar(calendarSection, viewYM, selectedKey, state.todosByDate);
  dateHeader.textContent = formatHeader(selectedKey);
  const todos = getTodosForDate(state, selectedKey);
  renderTodoList(listContainer, todos, editingId);
  // Phase 4 (PERS-04): storageError 존재 시 banner 노출, 아니면 숨김.
  banner.hidden = storageError == null;
}
```

여기서 `banner`는 `index.html`의 `#storage-banner`를 `getElementById`로 한 번 캡처한 모듈 상수 (root 캡처 패턴 L65 동일):

```javascript
const banner = document.getElementById('storage-banner');
if (!banner) throw new Error('[hansung-todo] #storage-banner 마운트 노드가 없습니다.');
```

**위임 이벤트 패턴 (Phase 2 lock — `02-04-SUMMARY.md` "위임 이벤트 1회 등록")** — banner 버튼 click도 단일 위임 listener로:

기존 `calendarSection.addEventListener('click', ...)` (L86–110) / `listContainer` 위임들과 동일한 패턴:

```javascript
// Phase 4: banner [재시도][닫기] 위임 — 마크업/위임 1회 등록 패턴 (Phase 2/3과 동일).
banner.addEventListener('click', (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const action = t.closest('[data-action]')?.dataset.action;
  if (action === 'retry') {
    // 현재 in-memory state를 그대로 재저장 — commit이 try/catch + render까지 처리.
    commit(state);
  } else if (action === 'dismiss') {
    storageError = null;
    render();
  }
});
```

**위임 cell-pattern 참고** — `calendarSection` listener (L86–110)가 `data-action`/`data-key` 둘로 분기하는 패턴을 그대로 차용. `data-action` 값만 prev/next/today → retry/dismiss로 바뀜.

**dev hooks (L6–10)** — 02-04 SUMMARY가 정리 후보로 표시. Phase 4 범위 밖이지만 `storageError`를 노출하지 않는 정책 유지(콘솔 디버깅은 `console.warn`으로 충분).

---

### `index.html` (MODIFY — banner 노드 1개 추가)

**Analog:** `index.html` 현재 (self).

**현재 패턴 (L9–11):**

```html
<body>
  <main id="app"><!-- Phase 3: js/app.js mounts ... --></main>
  <script type="module" src="./js/app.js"></script>
</body>
```

**Phase 4 패턴 (CONTEXT decision C, F + carried_forward "textContent-only"):**

```html
<body>
  <!-- Phase 4 (PERS-04): 저장 실패 알림. 평소 hidden, 실패 시 app.js가 hidden 제거. -->
  <aside id="storage-banner" class="banner banner--danger" hidden role="alert">
    <p>저장에 실패했습니다. 시크릿 모드이거나 저장 공간이 부족할 수 있습니다.</p>
    <div class="banner__actions">
      <button type="button" data-action="retry">다시 시도</button>
      <button type="button" data-action="dismiss">닫기</button>
    </div>
  </aside>
  <main id="app"><!-- Phase 3: js/app.js mounts calendar + 날짜 헤더 + todo form/list --></main>
  <script type="module" src="./js/app.js"></script>
</body>
```

**위치 패턴** — `<main id="app">` **위쪽**에 배치 (CONTEXT C 명시). 페이지 상단 고정으로 사용자가 즉시 인지.

**meta 추가 (CONTEXT 보조 검토 — 무비용)** — `<head>` 내부:

```html
<meta name="color-scheme" content="light">
```

다크 모드 v2 도입 전이라도 색 스키마 명시 — 브라우저가 폼 컨트롤·스크롤바를 light로 그리도록 보장.

**XSS 가드 (Phase 2 lock — STYL-02 grep gate `innerHTML` 0)** — 본 변경은 정적 HTML 텍스트만 추가. `js/`에는 `innerHTML` 0건 유지.

---

## Shared Patterns

### Storage 경계 (Phase 1 lock)
**Source:** `js/storage.js` 전체.
**Apply to:** Phase 4의 `save()` 변경.

```javascript
// js/storage.js 외부에서 raw localStorage.* 호출 금지.
// 실패 신호는 save()가 throw — 외부는 try/catch만, localStorage는 모름.
```

grep gate (Phase 2 게이트 #3 — 본 phase에서도 보존):
```bash
grep -rE "localStorage\." js/ | grep -v "js/storage.js"   # → 0
```

### XSS 가드 (Phase 2 lock — STYL-02)
**Source:** `js/todos.js` L73, L104 (textContent only).
**Apply to:** banner 버튼 라벨, 메시지 — 모두 정적 HTML이므로 자동 충족. JS에서 banner 메시지를 동적으로 갈아끼울 일은 없음(CONTEXT D: 단일 메시지 잠금).

grep gate (Phase 2 게이트 #1):
```bash
grep -rE "innerHTML|outerHTML|insertAdjacentHTML" js/   # → 0
```

### 위임 이벤트 1회 등록 (Phase 2 lock)
**Source:** `js/app.js` L86, L122, L131, L144, L153 (calendarSection / listContainer).
**Apply to:** banner click 위임 — `data-action`으로 retry/dismiss 분기.

```javascript
container.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === '...') { /* ... */ }
});
```

### 색맹 안전 dual/triple signal (Phase 3 lock)
**Source:** `css/styles.css` L55–68 (today=border-weight+color, selected=filled bg).
**Apply to:** banner — `--danger-bg` 배경 + `--danger` 좌측 막대 + 텍스트(아이콘은 deferred). color-only 절대 금지.

### Append-only CSS + Phase 헤더 (Phase 1/2/3 lock)
**Source:** `css/styles.css` 각 phase 블록 헤더 (`/* Phase N: ... */`).
**Apply to:** Phase 4 신규 룰은 파일 말미에 append, `:root` 토큰 채움은 예외(L2–4 placeholder 교체).

### `commit()` 단일 mutation 진입점 (Phase 2 lock)
**Source:** `js/app.js` L69–75.
**Apply to:** retry 동작도 별도 함수가 아니라 `commit(state)` 호출로 통일 — try/catch + render 사이클 1번에 흡수.

---

## No Analog Found

해당 없음. Phase 4의 모든 변경은 Phase 1~3에서 잠긴 패턴의 자연스러운 확장이며, 코드베이스 자체가 가장 가까운 analog.

---

## Metadata

**Analog search scope:** `js/`, `css/`, `index.html`, `.planning/phases/01-foundation/`, `.planning/phases/02-todo-crud/`, `.planning/phases/03-calendar-integration/`.
**Files scanned:** 8 (CONTEXT.md, 3 phase SUMMARY.md, css/styles.css, js/storage.js, js/app.js, js/todos.js, index.html).
**Pattern extraction date:** 2026-05-03.
