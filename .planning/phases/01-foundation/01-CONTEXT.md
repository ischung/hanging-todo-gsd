# Phase 1: Foundation — CONTEXT

**Created:** 2026-05-03
**Phase goal:** A no-build static site loads in the browser, exposes safe date + storage primitives, and is runnable per a documented method.
**Requirements covered:** DEL-01, DEL-02, DEL-03, PERS-01, PERS-02, PERS-05

<domain>
정적 셸(`index.html` + `css/` + `js/`) + 날짜 키 헬퍼 + `localStorage` 입출력 원시 함수 + README 실행 안내. **UI/CRUD는 Phase 2 이후이며, 이 페이즈는 화면을 그리지 않는다.** 콘솔에서 헬퍼 호출이 라운드트립으로 동작하는 것까지가 종착점.
</domain>

<canonical_refs>
다운스트림(researcher / planner / executor)이 반드시 읽어야 할 문서:

- `.planning/PROJECT.md` — 하드 제약(무빌드/무프레임워크/localStorage/단일 진입점)
- `.planning/REQUIREMENTS.md` — DEL-01/02/03, PERS-01/02/05 잠금 사양
- `.planning/ROADMAP.md` — Phase 1 Success Criteria 5개 (이 파일에서 직접 인용 금지, 현장 참조)
- `.planning/research/PITFALLS.md` — Pitfall 1 (UTC drift), Pitfall 3 (localStorage 실패), Pitfall 4 (file:// 모듈)
- `.planning/research/STACK.md` — 채택 스택과 거부 스택 근거
- `CLAUDE.md` (project) — 권장 모듈 구조와 ES2023 모듈 호환성 표
</canonical_refs>

<spec_lock>
**REQUIREMENTS.md에서 잠긴 사양 (재논의 금지):**

- 저장 키: `hansung-todo:v1` (PERS-01)
- 저장 스키마: `{ schemaVersion: 1, todosByDate: { "YYYY-MM-DD": Todo[] } }` (PERS-02)
- Todo 필드 셋: `{ id, text, done, createdAt }` (TODO-02 — Phase 2지만 Phase 1의 모델/스키마와 직결)
- `dateKey()`는 로컬 시간 기준 `YYYY-MM-DD`, `toISOString()` 사용 금지 (PERS-05)
- 빌드 도구·번들러·프레임워크 금지 (DEL-01)
- 정적 자산 구조 `index.html` + `css/` + `js/`, GitHub Pages 호환 (DEL-02)
- 실행 방법 README 문서화 (DEL-03)
</spec_lock>

<decisions>

### 모듈 로딩 전략
**`<script type="module" src="js/app.js"></script>` + ESM `import`/`export` 사용.**
- README에 실행 방법 두 가지를 모두 명시: ① `python3 -m http.server` 후 `http://localhost:8000` ② GitHub Pages 배포.
- **`file://` 더블클릭은 지원하지 않는다**고 README에 명시 (Chrome 등 모던 브라우저가 module을 CORS로 막음 — Pitfall 4).
- DEL-03 계약은 "double-click 또는 http.server 둘 중 하나"이므로 http.server 단독 안내로 충분.

### todo id 생성
**`crypto.randomUUID()` 사용.**
- 2026 baseline 모든 모던 브라우저 지원, 충돌 무시 가능.
- 모델 정의(빈 헬퍼 함수라도)는 Phase 1 범위 밖 — Phase 2의 CRUD 구현에서 함께 다룬다. Phase 1에서는 스키마 문서화까지만.

### `createdAt` 저장 포맷
**epoch milliseconds (Number).** `Date.now()` 그대로 저장.
- 정렬은 Number 비교로 안정적 (TODO-06).
- JSON 직렬화/역직렬화에서 Date 객체로 변환되지 않는다(Pitfall: "Date 객체 JSON 저장 금지" 회피).
- 표시용 포맷팅이 필요하면 `new Date(createdAt)`으로 일회성 변환.

### `js/` 파일 분할 (Phase 1에서 만드는 것)
**최소 3개 모듈만:**
```
js/
  dateKey.js   — export function dateKey(d = new Date())
  storage.js   — export const KEY, defaultState(), load(), save()
  app.js       — bootstrap: import 확인 + 콘솔에서 헬퍼 사용 가능하게 window 노출 (개발 편의)
```
- `calendar.js`, `todos.js`, `dom.js`는 **Phase 1에서 만들지 않는다.** 후속 페이즈가 필요할 때 추가.
- `app.js`는 Phase 1에서 거의 비어있어도 된다 — 모듈 로딩이 끊기지 않는지 검증하는 진입점.

### `storage.js` 책임 (Phase 1 read-side만 견고하게)
- `load()`는 try/catch로 `null` / 손상된 JSON / `SecurityError`를 모두 흡수해 `defaultState()` 반환 (Pitfall 3 일부).
- `save()`는 try/catch로 `boolean` 반환 (성공/실패). **실패 UX 노출은 Phase 4(PERS-04)** 에서 다루므로, Phase 1은 인터페이스만 정의하고 호출처가 없어도 OK.
- `defaultState()`는 `{ schemaVersion: 1, todosByDate: {} }` 반환.
- 스키마 버전 검사: `load()`가 `schemaVersion !== 1`이면 `defaultState()` 반환 (안전 폴백, 마이그레이션 로직은 v2에서).

### `dateKey.js` 책임
- `export function dateKey(d = new Date())`만 export.
- 내부 구현은 PITFALLS.md Pitfall 1의 reference 코드와 동일: `getFullYear` / `getMonth+1` / `getDate` + `padStart`.
- `Date` 문자열 파싱(`new Date('2026-05-03')`) 사용 금지 — 단위 테스트나 데모에서 날짜를 만들 때는 `new Date(y, m-1, d)` 사용.

### README 범위
- 프로젝트 한 줄 소개.
- 실행 방법: `python3 -m http.server` 명령과 접속 URL.
- GitHub Pages 배포 한 줄 안내.
- 파일 구조 트리 (3개 모듈 명시).
- "double-click은 지원하지 않음" 한 줄 경고.

### CSS는 Phase 1 범위?
- `css/styles.css`를 빈 파일(또는 `:root` 토큰만 있는 골격)로 생성해 정적 자산 구조 `index.html` + `css/` + `js/`(DEL-02) 계약을 만족시킨다. **본격 스타일은 Phase 4(STYL-01).**

### Phase 1 검증 방법 (executor가 따를 체크리스트)
1. `python3 -m http.server`로 서빙 후 `index.html` 접속 → 콘솔 에러 0건.
2. DevTools 콘솔에서 `window.dateKey(new Date(2026,4,3,23,55))` 호출 → `'2026-05-03'` 반환 (UTC 드리프트 검증).
3. DevTools 콘솔에서 `window.save(window.defaultState()); window.load()` 라운드트립 → `{ schemaVersion: 1, todosByDate: {} }` 반환.
4. `localStorage` Application 탭에서 키 `hansung-todo:v1` 확인.
5. `grep -r "toISOString" js/` → 결과 없음.
6. `grep -rE "innerHTML\s*=" js/` → 결과 없음 (Phase 1엔 어차피 DOM 코드가 거의 없으므로 사후 보호).

</decisions>

<deferred_ideas>
다음 페이즈/마일스톤으로 미룸:

- **Storage 실패 토스트 UI** → Phase 4 (PERS-04).
- **모델 헬퍼 `newTodo(text)`** → Phase 2 (CRUD 도입과 함께).
- **JSON export/import 백업** → v2 (POL-01).
- **다국어 월/요일 이름 라이브러리(day.js 등)** → 현재 `Intl.DateTimeFormat('ko-KR')`로 충분, v2에서 재평가.
- **ARIA grid / 키보드 네비게이션** → v2 (POL-03/04).
- **schemaVersion 마이그레이션 로직** → 스키마가 실제로 바뀔 때 추가, Phase 1은 폴백만.
</deferred_ideas>

<code_context>
**아직 코드가 없다 (첫 페이즈).** 새로 생성할 것:
- `index.html` (단일 진입점)
- `css/styles.css` (빈 또는 토큰 스켈레톤)
- `js/dateKey.js`, `js/storage.js`, `js/app.js`
- `README.md` (실행 안내)

기존 파일에서 참고할 패턴 없음. PITFALLS.md의 reference 코드를 그대로 차용 가능.
</code_context>

---
*Phase 1 context captured: 2026-05-03*
