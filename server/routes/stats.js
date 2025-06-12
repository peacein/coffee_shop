const express = require('express');
const router = express.Router();

// 다른 라우터에서 주문 데이터에 접근하기 위해 함수로 가져오기
const getOrders = () => {
  // 실제로는 데이터베이스에서 조회하거나 공통 데이터 저장소를 사용
  try {
    const ordersRouter = require('./orders');
    // orders 배열에 직접 접근할 수 없으므로 임시 데이터 생성
    return [];
  } catch (error) {
    return [];
  }
};

// 임시로 통계용 데이터 (실제로는 데이터베이스에서 조회)
let statisticsData = {
  orders: [],
  dailyStats: {},
  menuStats: {}
};

// GET /api/stats/overview - 전체 통계 개요
router.get('/overview', (req, res) => {
  const { orders } = statisticsData;
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const preparingOrders = orders.filter(order => order.status === 'preparing').length;
  const completedOrders = orders.filter(order => order.status === 'completed').length;
  const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
  
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);
  
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
  
  // 오늘 주문 통계
  const today = new Date().toDateString();
  const todayOrders = orders.filter(order => 
    new Date(order.createdAt).toDateString() === today
  );
  
  const todayRevenue = todayOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.total, 0);
  
  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      preparingOrders,
      completedOrders,
      cancelledOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue),
      today: {
        orders: todayOrders.length,
        revenue: todayRevenue,
        completed: todayOrders.filter(order => order.status === 'completed').length
      }
    }
  });
});

// GET /api/stats/daily - 일별 통계
router.get('/daily', (req, res) => {
  const { days = 7 } = req.query;
  const { orders } = statisticsData;
  
  const dailyStats = {};
  const today = new Date();
  
  // 지난 N일간의 데이터 생성
  for (let i = 0; i < parseInt(days); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const dayOrders = orders.filter(order => 
      new Date(order.createdAt).toDateString() === dateStr
    );
    
    dailyStats[dateStr] = {
      date: dateStr,
      totalOrders: dayOrders.length,
      completedOrders: dayOrders.filter(order => order.status === 'completed').length,
      revenue: dayOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total, 0),
      avgOrderValue: dayOrders.length > 0 
        ? Math.round(dayOrders.reduce((sum, order) => sum + order.total, 0) / dayOrders.length)
        : 0
    };
  }
  
  res.json({
    success: true,
    data: Object.values(dailyStats).reverse() // 오래된 날짜부터 정렬
  });
});

// GET /api/stats/menu - 메뉴별 통계
router.get('/menu', (req, res) => {
  const { orders } = statisticsData;
  
  const menuStats = {};
  
  orders.forEach(order => {
    if (order.status === 'completed') {
      order.items.forEach(item => {
        if (!menuStats[item.id]) {
          menuStats[item.id] = {
            id: item.id,
            name: item.name,
            totalOrdered: 0,
            totalRevenue: 0,
            avgPrice: item.price
          };
        }
        
        menuStats[item.id].totalOrdered += item.quantity;
        menuStats[item.id].totalRevenue += item.totalPrice * item.quantity;
      });
    }
  });
  
  // 판매량 순으로 정렬
  const sortedMenuStats = Object.values(menuStats)
    .sort((a, b) => b.totalOrdered - a.totalOrdered);
  
  res.json({
    success: true,
    data: sortedMenuStats
  });
});

// GET /api/stats/hourly - 시간대별 통계
router.get('/hourly', (req, res) => {
  const { date } = req.query;
  const { orders } = statisticsData;
  
  const targetDate = date ? new Date(date) : new Date();
  const targetDateStr = targetDate.toDateString();
  
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    timeRange: `${hour}:00-${hour + 1}:00`,
    orders: 0,
    revenue: 0
  }));
  
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt);
    if (orderDate.toDateString() === targetDateStr && order.status === 'completed') {
      const hour = orderDate.getHours();
      hourlyStats[hour].orders += 1;
      hourlyStats[hour].revenue += order.total;
    }
  });
  
  res.json({
    success: true,
    data: hourlyStats.filter(stat => stat.orders > 0) // 주문이 있는 시간대만 반환
  });
});

// POST /api/stats/update - 통계 데이터 업데이트 (내부용)
router.post('/update', (req, res) => {
  const { orders } = req.body;
  
  if (orders) {
    statisticsData.orders = orders;
  }
  
  res.json({
    success: true,
    message: '통계 데이터가 업데이트되었습니다.'
  });
});

module.exports = router; 