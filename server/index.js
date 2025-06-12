const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 데이터베이스 설정 가져오기
const { testConnection, initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// 라우터 가져오기
const apiRouter = require('./routes/api');
const { router: menuRouter } = require('./routes/menu');
const ordersRouter = require('./routes/orders');
const statsRouter = require('./routes/stats');

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우트 설정
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// API 라우터 사용
app.use('/api', apiRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/stats', statsRouter);

// 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  
  // 데이터베이스 연결 테스트 및 초기화
  await testConnection();
  await initializeDatabase();
});

module.exports = app; 