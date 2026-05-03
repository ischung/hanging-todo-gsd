---
phase: 04-modern-polish-failure-ux
created: 2026-05-03
status: locked
mode: discuss
requirements: [STYL-01, PERS-04]
---

<domain>
v1 마무리 phase. 두 책임:

1. **시각 폴리시 (STYL-01)** — Phase 1~3에서 의도적으로 미니멀하게 미뤄둔 시각 다듬기. 그라디언트·과한 그림자 없이 "다듬어진" 느낌을 마이크로 디테일(spacing scale, 1단계 그림자, transition, type scale)로 달성.
2. **저장 실패 UX (PERS-04)** — `localStorage.setItem` 실패(quota / Safari Private Mode / 저장 비활성)를 silent fake-save 대신 사용자에게 명시적으로 알린다. 데이터 무결성보다 **사용자가 "지금 저장 안 되고 있다"는 것을 인지**하는 것이 핵심.

이 phase는 신규 기능 0건. 기존 마크업/와이어링은 보존하고, CSS·storage 에러 surface·작은 banner 컴포넌트만 추가한다.
</domain>

<canonical_refs>
- `.planning/PROJECT.md` — no build / vanilla / localStorage 하드 제약
- `.planning/REQUIREMENTS.md` — STYL-01, PERS-04, STYL-02(textContent), PERS-01/02(스토리지 키·스키마)
- `.planning/ROADMAP.md` — Phase 4 success criteria 2개
- `.planning/phases/01-foundation/01-CONTEXT.md` — storage 경계 (`js/storage.js` 외부에서 raw `localStorage.*` 금지)
- `.planning/phases/01-foundation/01-01-SUMMARY.md` — `js/storage.js` 인터페이스 (`load`, `save`)
- `.planning/phases/02-todo-crud/02-CONTEXT.md` — 단일 `commit()` mutation + 전체 재렌더 흐름; 미니멀 시각 (Phase 4가 폴리시 차례)
- `.planning/phases/02-todo-crud/02-04-SUMMARY.md` — `css/styles.css` 미니멀 3룰 (Phase 4에서 확장 baseline)
- `.planning/phases/03-calendar-integration/03-CONTEXT.md` — 색맹 안전 강조 / `render()` 단일 진입점 / 위임 이벤트
- `.planning/phases/03-calendar-integration/03-03-SUMMARY.md` — 캘린더 CSS 셀 상태 룰 (Phase 4에서 trans/그림자 확장)
- `styles.css` — 현재 전체 CSS (Phase 4의 작업면)
- `js/storage.js` — `save()` 실패 throw 위치 (Phase 4에서 에러 surface 추가)
- `js/app.js` — `commit()` (mutation 진입점, 여기서 save 실패를 catch해 banner 노출)
- `index.html` — banner 마운트 노드 추가 위치
</canonical_refs>

<carried_forward>
이전 phase에서 잠긴 결정 — Phase 4에서 그대로 적용:

| 결정 | Locked in | 적용 방식 (Phase 4) |
|---|---|---|
| 단일 `render()` 팬아웃 + `commit()` mutation 흐름 | Phase 2 | 저장 실패 banner 토글도 같은 render() 사이클로 노출/숨김 |
| `textContent`-only 렌더 (XSS 가드) | Phase 2 | banner 메시지·재시도 버튼 라벨 모두 textContent |
| Storage 경계: `js/storage.js` 외부에서 raw `localStorage.*` 금지 | Phase 1 | 실패 시그널은 `save()`에서 throw → `commit()`에서 catch (외부 모듈은 storage 모르게) |
| 색맹 안전 (색만으로 구분 금지) | Phase 3 | 폴리시 확장 시 today/selected의 두께·배경 구분 유지; banner는 색+아이콘+텍스트 |
| 위임 이벤트 1회 등록 | Phase 2 | banner의 [재시도][닫기] 버튼도 위임 click 1개로 흡수 |
| 6×7 고정 그리드 / 한국어 요일 / `<dialog>` 미사용 | Phase 3 | 폴리시는 시각만; 마크업 구조 변경 없음 |
| 의존성 0 / no build / no CDN runtime dep | Phase 1 | 시스템 폰트 스택만, CDN 폰트 금지 |
</carried_forward>

<decisions>

### A. 시각 방향성 — 현재 톤 유지 + 마이크로 디테일

기존 #2563eb accent / 흰·회색 베이스를 유지하고, "polished"는 마이크로 디테일로만 달성. 무드를 바꾸지 않는다.

추가할 4가지:

1. **Spacing scale** — `--space-1: 4px / --space-2: 8px / --space-3: 12px / --space-4: 16px / --space-6: 24px / --space-8: 32px` (CSS custom properties at `:root`). 모든 padding/margin/gap을 이 토큰으로 통일.
2. **그림자 1단계 (subtle)** — `--shadow-1: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)`. 캘린더 컨테이너 / todo list / banner에만 적용. 멀티 elevation 금지.
3. **Transition** — `--transition: 150ms ease-out`. hover(셀, 버튼, 체크박스), selected 변경, banner 등장/퇴장에 적용. `prefers-reduced-motion: reduce`는 v2(POL-05)이므로 본 phase에서는 다루지 않음.
4. **Type scale 3단계** — `--text-sm: 13px / --text-base: 15px / --text-lg: 18px`. 각각 todo 메타·기본·헤더에 매핑. line-height는 1.5 통일.

색 토큰도 같이 정리: `--accent: #2563eb`, `--accent-strong: #1e40af`, `--bg: #ffffff`, `--bg-muted: #f3f4f6`, `--text: #111827`, `--text-muted: #6b7280`, `--border: #e5e7eb`, `--danger: #dc2626`, `--danger-bg: #fef2f2`. 모두 기존 하드코딩 값과 일치하도록 매핑(시각 회귀 0).

### B. 한국어 타이포그래피 — 시스템 폰트 스택만

```css
font-family:
  -apple-system, BlinkMacSystemFont,
  'Apple SD Gothic Neo',
  'Pretendard Variable', 'Pretendard',
  'Malgun Gothic',
  'Segoe UI', system-ui,
  sans-serif;
```

- 의존성 0, 네트워크 부하 0, `file://` 더블클릭 데모 동작.
- macOS/iOS는 Apple SD Gothic Neo, Windows는 Malgun Gothic 자동.
- 사용자가 Pretendard를 OS에 깔아두면 자동 적용 (강의 시연자 환경 보호).
- `-apple-system`이 영문에서도 우선되어 자연스러운 한·영 혼용.
- CDN 폰트(Pretendard Web 등) **금지** — "no build / no CDN runtime dep" 잠금 위반.

### C. 저장 실패 알림 형식 — Persistent banner (상단 고정)

마크업: `<div id="storage-banner" class="banner banner--danger" hidden>...</div>` (또는 `<aside role="alert">`). `index.html`의 `<main id="app">` **위쪽**에 배치.

표시 내용:
- 본문: "저장에 실패했습니다. 시크릿 모드이거나 저장 공간이 부족할 수 있습니다."
- 버튼: `[다시 시도]` `[닫기]`
- 색: `--danger-bg` 배경 + `--danger` 좌측 4px 막대 + `--text` 본문 (색만으로 구분 금지 — 좌측 막대 + 텍스트로 의미 전달).

동작:
- 평소엔 `hidden` 속성으로 완전히 숨김 (DOM은 있지만 reflow 차지 0).
- save 실패 시 `hidden` 제거 + (`--transition`)으로 slide-down 등장.
- 사용자가 [닫기] 누를 때까지 유지 (auto-dismiss 없음).
- [다시 시도] 클릭 → 현재 in-memory state로 `save()` 재호출 → 성공 시 banner 자동 숨김 + 상태 클리어.

`<dialog>` / 모달 / toast 모두 거부 — 흐름 차단(모달) 또는 놓침(toast) 위험.

### D. 실패 시 데이터·재시도 정책 — 메모리 보관 + Retry 버튼

`commit(nextState)` (Phase 2 잠금) 흐름 확장:

```
commit(next) {
  state = next                    // ① 메모리는 항상 적용 (UI 즉시 반영)
  try {
    save(state)                   // ② persist 시도
    storageError = null           // ③ 성공 → 에러 클리어
  } catch (err) {
    storageError = err            // ④ 에러 캡처
  }
  render()                        // ⑤ banner 노출은 render에서 storageError로 결정
}
```

핵심 원칙:
- **UI는 즉시 반영** — 사용자가 추가/수정한 todo는 바로 보임 (rollback 안 함).
- **저장 실패는 명시적 신호** — banner가 "지금 저장 안 됨"을 알림. 새로고침 시 손실되지만 사용자가 그 위험을 인지한 상태.
- **Retry는 전체 state 재저장** — 부분 큐잉 없음 (단순). 성공 시 banner 자동 숨김.
- **auto-retry 없음** — quota / Private Mode는 재시도해도 자동 해소되지 않으므로 사용자 액션이 의미 있음. 자동 retry는 무한루프·관찰 불가 위험.

`storageError`는 `js/app.js`의 모듈 변수 (commit/render와 같은 위치). `js/storage.js`의 `save()`는 setItem을 try/catch로 감싸 throw — `localStorage.*`를 외부에 노출하지 않으면서 실패 시그널만 전달.

### E. CSS 모듈화 (보조 결정)

- 현재 `styles.css` 단일 파일 유지 (no build / 가독성).
- `:root` 블록을 파일 최상단에 두고 그 아래에 컴포넌트별 룰 (현재 구조 유지).
- 별도 `tokens.css` 파일 분리는 v2 (POL-05 다크 모드 도입 시 자연스러움).

### F. 마크업 변경 (보조 결정)

- 신규 노드 1개: 상단 banner (`#storage-banner`).
- 기존 캘린더/헤더/todo list 마크업은 손대지 않음 (시각 회귀 위험 0).
- 모든 변경은 CSS 토큰화 + banner 1개 + commit/save 에러 surface로 한정.

</decisions>

<deferred>
- **다크 모드** (`prefers-color-scheme`) — POL-05, v2.
- **`prefers-reduced-motion` 존중** — 본 phase는 transition을 도입만; reduce-motion 가드는 v2.
- **selectedDate 영속화** (reload 시 마지막 선택 복원) — Phase 3 deferred 이월; v2.
- **JSON export/import** (POL-01) — v2.
- **"완료 항목 숨기기" 토글** (POL-02) — v2.
- **캘린더 키보드 nav** (POL-03) — v2.
- **ARIA grid roles + 라벨** (POL-04) — v2 (단, banner는 `role="alert"`로 최소 a11y 확보).
- **"저장됨 ✓" 인디케이터** (POL-06) — v2.
- **별도 `tokens.css` 파일 분리** — 다크 모드 도입 시 자연 분리 (v2).
- **실패 원인 자세히 분기** (Quota vs Private vs Disabled) — 본 phase는 단일 메시지 + 가능성 2개 언급으로 충분; 분기 메시지는 v2.
</deferred>

<code_context>
- `styles.css` — Phase 1~3에서 누적된 단일 stylesheet. 현재 색·간격은 하드코딩. Phase 4에서 `:root` CSS custom properties로 토큰화하되 **렌더링 결과는 동일**하게 매핑(회귀 0).
- `js/storage.js` — `KEY`, `defaultState`, `load`, `save`. `save()` 내부 `localStorage.setItem`을 try/catch로 감싸 실패 시 throw. 외부 모듈은 여전히 `localStorage`를 모름.
- `js/app.js` — 모듈 변수 `state`, `editingId`, `selectedKey`, `viewYM` 옆에 `storageError` 추가. `commit()`이 try/catch로 storageError를 set/clear. `render()`에서 `storageError`를 읽어 banner 토글. banner의 [재시도][닫기] click은 기존 위임 listener에 case 2개 추가.
- `index.html` — `<main id="app">` 바로 위에 `<aside id="storage-banner" class="banner banner--danger" hidden role="alert">` 추가. 내부에 메시지 텍스트 + 버튼 2개.
- `js/calendar.js`, `js/todos.js`, `js/dom.js` — 변경 없음 (시각 토큰화는 selector만 보면 되고 마크업/JS는 그대로).
- `index.html` `<head>` — `<meta name="color-scheme" content="light">` 정도는 추가 검토(다크 모드는 v2이지만 명시는 무비용).
</code_context>

<scope_guardrail>
**이 phase는 다음을 하지 않는다:**
- 신규 기능 추가 (export, hide-completed, keyboard nav, dark mode, persisted selectedDate) — 모두 v2/deferred.
- 마크업 구조 변경 (calendar/header/todo 섹션 재배치, `<dialog>` 도입 등) — banner 1개만 신규.
- 저장 실패의 자동 복구 (auto-retry, IndexedDB fallback 등) — 사용자 액션 기반만.
- ARIA grid / roving tabindex / 키보드 캘린더 이동 — POL-* v2.
- 별도 빌드/번들/PostCSS 도입 — no build 잠금.
- 외부 폰트/아이콘/CSS CDN 의존 — no CDN runtime 잠금.

**phase 성공 기준 (ROADMAP 잠금) 재확인:**
1. 폴리시된 시각: refined typography(시스템 스택 폰트 적용), subtle shadows(`--shadow-1`), smooth transitions(150ms), consistent spacing(spacing scale) — 첫인상에서 "다듬어졌다" 인지 가능.
2. localStorage 저장 실패 시 크래시 0, persistent banner로 사용자에게 알림 (silent fake-save 금지).
</scope_guardrail>
