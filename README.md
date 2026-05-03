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
