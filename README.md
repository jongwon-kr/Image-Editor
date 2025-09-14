# Graphic Cast
#### Node v LTS
---
### 📂 구조
- ES Module(import, export) ES6
#### 주요 파일
- `index.ts` : 엔트리 파일 (앱 초기화 및 모듈 로딩) ImageEditor 클래스 생성
- `core.js` : 프로젝트의 초기 설정 및 환경 구성 파일 ImageEditor 클래스 export

#### 폴더 설명
- `app/assets/` : 이미지, SVG, 아이콘 등 리소스
- `app/api/` : 외부 API 호출 관련 폴더
- `app/styles/` : CSS 파일
- `app/drawing-tools/` : 그림 그리기 관련 모듈 (Line, Path, Text 등)
- `app/ui/` : UI 컴포넌트 및 화면 관련 모듈
- `app/utils/` : 유틸리티 및 헬퍼 함수 (저장, 복사 붙여넣기, 확대/축소 설정 등)
- `vendor/` : 외부 라이브러리 (예: jQuery, Fabric.js 등)
- `public/` : 웹팩 빌드 시 이미지나 json 등 요청파일

---

### 📦 Vendor Dependencies

- **jQuery v3.5.1**: DOM 조작 및 이벤트 처리
- **jQuery spectrum-colorpicker2**: 색상 선택기
- **Fabric.js v6.6.1**: HTML5 캔버스 작업을 위한 그래픽 라이브러리
- **grapick v0.1.7**:  그라데이션 색 선택기 (그리기 기능에 유용한 라이브러리)
- **undo-redo-stack**: 작업 취소 및 다시 실행을 위한 스택 관리 라이브러리

---

### 📜 사용법
git clone -> npm install -> npm run start : 웹팩을 통해 서버 실행
git clone -> npm install -> npm run build : 웹팩을 통해 빌드

#### 빌드 모드
npm run build -> default
npm run build:simple -> simple
npm run build:pro -> pro
