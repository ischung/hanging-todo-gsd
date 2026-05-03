---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [vanilla-js, esm, localstorage, static-site, github-pages]

requires: []
provides:
  - "로컬 시간 YYYY-MM-DD 키 헬퍼 (js/dateKey.js)"
  - "localStorage 단일 어댑터 (js/storage.js: KEY/defaultState/load/save)"
  - "ES 모듈 부트스트랩 + 콘솔 검증용 window 노출 (js/app.js)"
  - "정적 셸 (index.html + css/styles.css 골격)"
  - "실행/배포 안내 README"
affects: [phase-02-todos, phase-03-calendar, phase-04-styling]

tech-stack:
  added: []
  patterns:
    - "Native ES Modules via <script type=\"module\"> — 빌드 도구 0건"
    - "단일 storage 어댑터 경계 — js/ 외 모든 곳 raw localStorage.* 호출 금지"
    - "로컬 시간 dateKey — toISOString/toJSON/Date.UTC 금지"

key-files:
  created:
    - js/dateKey.js
    - js/storage.js
    - js/app.js
    - index.html
    - css/styles.css
  modified:
    - README.md

key-decisions:
  - "dateKey 주석에서 'toISOString/toJSON/Date.UTC' 토큰을 제거 — must_haves 진실문(`js/`에서 해당 토큰 0건)을 honor"
  - "css/styles.css는 Phase 4 (STYL-01) 책임 — Phase 1은 DEL-02 디렉터리 계약 충족용 골격만"

patterns-established:
  - "Storage 경계 패턴: 모든 localStorage I/O는 js/storage.js를 거친다"
  - "ESM 임포트 규칙: 상대경로 + .js 확장자 명시 (bare specifier 금지)"

requirements-completed: [DEL-01, DEL-02, DEL-03, PERS-01, PERS-02, PERS-05]

duration: ~10min
completed: 2026-05-03
---

# Phase 1: Foundation Summary

**빌드 도구 없이 동작하는 정적 셸 + 로컬 시간 dateKey 헬퍼 + localStorage 단일 어댑터 + 실행 안내 README**

## Performance

- **Duration:** ~10 min
- **Tasks:** 5 (+ 1 deviation fix-up commit)
- **Files modified:** 6 (5 created, 1 overwritten)

## Accomplishments
- 로컬 시간 기준 YYYY-MM-DD 변환 (UTC 드리프트 차단)
- `hansung-todo:v1` 단일 키 + `{ schemaVersion: 1, todosByDate: {} }` 스키마 잠금
- `load()` 폴백 (null / 손상 JSON / 스키마 불일치 → defaultState)
- `save()` boolean 반환 (Quota/Security 에러 흡수, UX는 Phase 4로 transfer)
- ES 모듈 부트스트랩 — 빌드 0건, GitHub Pages 호환

## Task Commits

1. **Task 1: dateKey 헬퍼** — `9a1f9e2` (feat)
2. **Task 2: storage 어댑터** — `7804f80` (feat)
3. **Task 3: app.js bootstrap** — `8bfb245` (feat)
4. **Task 4: index.html + css 골격** — `784e059` (feat)
5. **Task 5: README 실행 안내** — `bd2ac87` (docs)

**Deviation fix:** `55d1834` (fix: dateKey 주석 재작성 — must_haves no-UTC-tokens honor)

## Files Created/Modified
- `js/dateKey.js` — 로컬 시간 YYYY-MM-DD 헬퍼 (단일 named export)
- `js/storage.js` — localStorage 단일 어댑터 (KEY, defaultState, load, save)
- `js/app.js` — Phase 1 thin bootstrap, 콘솔 검증용 `window.*` 노출
- `index.html` — 단일 진입점, `<script type="module">` 1개
- `css/styles.css` — Phase 4 책임 명시 주석 + `:root` 골격
- `README.md` — 실행 명령 / file:// 경고 / GitHub Pages / 파일 트리

## Decisions Made
- dateKey 주석에서 `toISOString` 등 토큰 제거 — plan의 reference 코드 주석과 must_haves 진실문 사이에 모순이 있어 must_haves가 우선이라 판단 (verify spec과 grep 결과를 일치시킴).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - 모순 해소] dateKey.js 주석에서 금지 토큰 문자열 제거**
- **Found during:** Phase verification 5단계 grep 검사
- **Issue:** Plan이 명시한 주석 텍스트("toISOString / toJSON / Date.UTC 사용 금지")가 must_haves.truths의 "`js/` 트리에서 해당 토큰 발견 0건" 조건과 직접 충돌.
- **Fix:** 주석을 "반드시 getFullYear/getMonth/getDate만 사용 — UTC 변환 API 금지"로 재작성.
- **Files modified:** js/dateKey.js
- **Verification:** `grep -rE "toISOString|\.toJSON\(|Date\.UTC" js/` → 0건.
- **Committed in:** `55d1834`

---

**Total deviations:** 1 auto-fixed (plan-내 자체 모순)
**Impact on plan:** 기능 변경 0, 주석 표현만 조정. scope creep 없음.

## Issues Encountered
- 없음 (위 deviation은 plan-내부 모순으로 분류).

## Verification Status

| # | 항목 | 상태 |
|---|------|------|
| 1 | http.server 200 응답 (모든 자산) | ✓ 자동 검증 통과 |
| 2 | dateKey UTC 드리프트 (`new Date(2026,4,3,23,55)` → '2026-05-03') | ✓ Node ESM 검증 통과 |
| 3 | save/load 라운드트립 → `{ schemaVersion: 1, todosByDate: {} }` | ✓ Node ESM 검증 통과 |
| 4 | DevTools Application 탭에서 `hansung-todo:v1` 키 확인 | ⚠ 사용자 브라우저 확인 필요 |
| 5 | `js/`에 `toISOString`/`toJSON`/`Date.UTC` 0건 | ✓ 통과 |
| 6 | `js/`에 `innerHTML =` 0건 | ✓ 통과 |
| 7 | `js/storage.js` 외에서 raw `localStorage.` 호출 0건 | ✓ 통과 |
| 8 | 손상 JSON / removeItem → defaultState 폴백 | ⚠ 사용자 브라우저 확인 필요 (구현은 try/catch + 스키마 검증으로 보장) |

## User Setup Required

None — 외부 서비스 설정 불필요. 사용자는 다음만 수행:
```bash
python3 -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속 → DevTools Console에서 verification 2/3/4/8 수동 확인.

## Next Phase Readiness
- `dateKey()` + `KEY/defaultState/load/save` 인터페이스가 Phase 2 (todo CRUD), Phase 3 (캘린더 그리드) 모두에 준비됨.
- Phase 2 도입 시 `app.js`의 `window.*` dev 노출은 재검토 (제거 또는 `window.App = {...}`로 압축).
- 빌드/번들러 0건, GitHub Pages 즉시 배포 가능.

---
*Phase: 01-foundation*
*Completed: 2026-05-03*
