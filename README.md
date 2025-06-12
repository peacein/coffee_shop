# ☕ Coffee Shop App

React + Express.js로 만든 커피 주문 앱입니다.

## 🚀 기능

- **메뉴 조회**: 3가지 커피 메뉴 (아메리카노 HOT/ICE, 카페라떼)
- **주문 시스템**: 장바구니 기능과 실시간 주문 처리
- **관리자 뷰**: 주문 현황 확인 및 관리
- **SQLite 데이터베이스**: 메뉴와 주문 데이터 저장

## 🛠️ 기술 스택

### Frontend
- React 18
- Vite
- CSS3

### Backend
- Node.js
- Express.js
- SQLite3
- CORS

## 📦 로컬 개발 환경 설정

### 1. 저장소 클론
```bash
git clone <repository-url>
cd coffee-shop-app
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```

- 프론트엔드: http://localhost:5179
- 백엔드 API: http://localhost:5000

## 🌐 배포

이 앱은 Render.com에 배포되어 있습니다.

### 배포 URL
- 프론트엔드: [배포 후 URL 업데이트]
- 백엔드 API: [배포 후 URL 업데이트]

### 배포 과정
1. GitHub에 코드 푸시
2. Render.com에서 자동 배포
3. `render.yaml` 설정에 따라 백엔드/프론트엔드 동시 배포

## 📁 프로젝트 구조

```
coffee-shop-app/
├── server/                 # 백엔드 (Express.js)
│   ├── config/            # 데이터베이스 설정
│   ├── data/              # SQLite 데이터베이스 파일
│   ├── routes/            # API 라우트
│   ├── scripts/           # 데이터베이스 관리 스크립트
│   └── index.js           # 서버 진입점
├── ui/                    # 프론트엔드 (React)
│   ├── public/            # 정적 파일 (이미지 등)
│   ├── src/               # React 소스 코드
│   └── dist/              # 빌드 결과물
├── render.yaml            # Render.com 배포 설정
└── package.json           # 루트 패키지 설정
```

## 🔧 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 데이터베이스 확인
npm run server:inspect-db

# 데이터베이스 리셋 (3개 메뉴로)
npm run server:clean-reset

# 프론트엔드 빌드
cd ui && npm run build

# 백엔드만 실행
npm run server:dev

# 프론트엔드만 실행
npm run ui:dev
```

## 📝 API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `GET /api/menu` - 메뉴 목록 조회
- `POST /api/orders` - 주문 생성
- `GET /api/orders` - 주문 목록 조회

## 🎯 메뉴

1. **아메리카노 (HOT)** - 4,500원
2. **아메리카노 (ICE)** - 4,500원
3. **카페라떼** - 5,500원

## 📄 라이선스

MIT License 