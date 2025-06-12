const express = require('express');
const router = express.Router();

// GET /api/info - API 정보 조회
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'COZY 카페 주문 관리 시스템 API',
    version: '1.0.0',
    endpoints: {
      menu: {
        'GET /api/menu': '메뉴 목록 조회',
        'GET /api/menu/:id': '특정 메뉴 조회',
        'POST /api/menu': '새 메뉴 추가',
        'PUT /api/menu/:id': '메뉴 수정',
        'DELETE /api/menu/:id': '메뉴 삭제'
      },
      orders: {
        'GET /api/orders': '주문 목록 조회',
        'GET /api/orders/:id': '특정 주문 조회',
        'POST /api/orders': '새 주문 생성',
        'PUT /api/orders/:id/status': '주문 상태 업데이트',
        'PUT /api/orders/:id': '주문 정보 수정',
        'DELETE /api/orders/:id': '주문 취소'
      },
      stats: {
        'GET /api/stats/overview': '전체 통계 개요',
        'GET /api/stats/daily': '일별 통계',
        'GET /api/stats/menu': '메뉴별 통계',
        'GET /api/stats/hourly': '시간대별 통계'
      }
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 