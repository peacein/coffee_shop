# Backend Server

Express.js를 사용한 백엔드 서버입니다.

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```env
# SQLite 데이터베이스 설정
DB_PATH=./data/coffee_shop.db

# 서버 설정
PORT=5000
NODE_ENV=development
```

### 3. 개발 서버 실행
```bash
npm run dev
```

### 4. 프로덕션 서버 실행
```bash
npm start
```

## API 엔드포인트

### 기본 엔드포인트
- `GET /` - 서버 상태 확인
- `GET /api/health` - 헬스 체크
- `GET /api/info` - API 정보 및 사용 가능한 엔드포인트 목록

### 메뉴 관리 API
- `GET /api/menu` - 메뉴 목록 조회 (쿼리: category, includeUnavailable)
- `GET /api/menu/:id` - 특정 메뉴 조회
- `POST /api/menu` - 새 메뉴 추가
- `PUT /api/menu/:id` - 메뉴 수정
- `DELETE /api/menu/:id` - 메뉴 삭제 (비활성화)
- `PUT /api/menu/:id/stock` - 재고량 업데이트 (operation: set/add/subtract)
- `POST /api/menu/restock` - 재고 보충 (전체 또는 특정 메뉴)

### 주문 관리 API
- `GET /api/orders` - 주문 목록 조회 (쿼리: status, limit)
- `GET /api/orders/:id` - 특정 주문 조회
- `POST /api/orders` - 새 주문 생성
- `PUT /api/orders/:id/status` - 주문 상태 업데이트
- `PUT /api/orders/:id` - 주문 정보 수정
- `DELETE /api/orders/:id` - 주문 취소

### 통계 API
- `GET /api/stats/overview` - 전체 통계 개요
- `GET /api/stats/daily` - 일별 통계 (쿼리: days)
- `GET /api/stats/menu` - 메뉴별 판매 통계
- `GET /api/stats/hourly` - 시간대별 통계 (쿼리: date)

## 프로젝트 구조
```
server/
├── index.js          # 메인 서버 파일
├── routes/           # 라우터 파일들
│   └── api.js        # API 라우터
├── package.json      # 프로젝트 설정
├── .gitignore        # Git 무시 파일
└── README.md         # 이 파일
```

## 데이터베이스
- **SQLite3**: 파일 기반 관계형 데이터베이스
- 별도 데이터베이스 서버 설치 불필요
- 데이터는 `data/coffee_shop.db` 파일에 저장됩니다

### 샘플 데이터 추가
```bash
npm run seed
```

## 사용된 패키지
- **express**: 웹 프레임워크
- **cors**: CORS 미들웨어
- **dotenv**: 환경 변수 관리
- **sqlite3**: SQLite 데이터베이스 클라이언트
- **nodemon**: 개발용 자동 재시작 도구 