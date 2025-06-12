const express = require('express');
const { db } = require('../config/database');
const router = express.Router();

// GET /api/orders - 주문 목록 조회
router.get('/', (req, res) => {
  const { status, limit } = req.query;
  
  let query = 'SELECT * FROM orders';
  let params = [];
  
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('주문 목록 조회 오류:', err);
      return res.status(500).json({
        success: false,
        error: '주문 목록을 불러오는데 실패했습니다.'
      });
    }
    
    console.log(`주문 목록 조회 성공: ${rows.length}개 주문`);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// GET /api/orders/:id - 특정 주문 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('주문 조회 오류:', err);
      return res.status(500).json({
        success: false,
        error: '주문을 조회하는데 실패했습니다.'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: '주문을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: row
    });
  });
});

// POST /api/orders - 새 주문 생성
router.post('/', (req, res) => {
  const { items, customer_name, customer_phone, notes } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: '주문 항목이 필요합니다.'
    });
  }
  
  // 총 금액 계산
  const total = items.reduce((sum, item) => {
    const itemTotal = (item.totalPrice || item.price) * item.quantity;
    return sum + itemTotal;
  }, 0);
  
  // 트랜잭션 시작
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 주문 생성
    db.run(
      `INSERT INTO orders (customer_name, customer_phone, total_amount, notes) 
       VALUES (?, ?, ?, ?)`,
      [customer_name || '고객', customer_phone || '', total, notes || ''],
      function(err) {
        if (err) {
          console.error('주문 생성 오류:', err);
          db.run('ROLLBACK');
          return res.status(500).json({
            success: false,
            error: '주문 생성에 실패했습니다.'
          });
        }
        
        const orderId = this.lastID;
        
        // 주문 항목들 추가
        let completedItems = 0;
        let hasError = false;
        
        items.forEach(item => {
          db.run(
            `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal) 
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.id, item.quantity, item.price, (item.totalPrice || item.price) * item.quantity],
            function(itemErr) {
              if (itemErr && !hasError) {
                hasError = true;
                console.error('주문 항목 추가 오류:', itemErr);
                db.run('ROLLBACK');
                return res.status(500).json({
                  success: false,
                  error: '주문 항목 추가에 실패했습니다.'
                });
              }
              
              completedItems++;
              
              if (completedItems === items.length && !hasError) {
                // 모든 항목이 성공적으로 추가됨
                db.run('COMMIT');
                
                // 생성된 주문 정보 조회
                db.get(
                  `SELECT * FROM orders WHERE id = ?`,
                  [orderId],
                  (selectErr, order) => {
                    if (selectErr) {
                      console.error('주문 조회 오류:', selectErr);
                      return res.status(500).json({
                        success: false,
                        error: '주문은 생성되었지만 조회에 실패했습니다.'
                      });
                    }
                    
                    console.log(`새 주문 생성 완료: ID ${orderId}, 총액 ${total}원`);
                    
                    res.status(201).json({
                      success: true,
                      message: '주문이 생성되었습니다.',
                      data: {
                        id: order.id,
                        total: order.total_amount,
                        status: order.status,
                        createdAt: order.created_at,
                        items: items
                      }
                    });
                  }
                );
              }
            }
          );
        });
      }
    );
  });
});

// PUT /api/orders/:id/status - 주문 상태 업데이트
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['pending', 'preparing', 'completed', 'cancelled'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: '유효하지 않은 상태입니다. (pending, preparing, completed, cancelled)'
    });
  }
  
  const orderIndex = orders.findIndex(order => order.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '주문을 찾을 수 없습니다.'
    });
  }
  
  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  // 완료 시간 설정
  if (status === 'completed') {
    orders[orderIndex].completedAt = new Date().toISOString();
  }
  
  res.json({
    success: true,
    message: '주문 상태가 업데이트되었습니다.',
    data: orders[orderIndex]
  });
});

// PUT /api/orders/:id - 주문 정보 전체 업데이트
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { items, status } = req.body;
  
  const orderIndex = orders.findIndex(order => order.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '주문을 찾을 수 없습니다.'
    });
  }
  
  // 주문 항목 업데이트
  if (items) {
    const newTotal = items.reduce((sum, item) => {
      return sum + ((item.totalPrice || item.price) * item.quantity);
    }, 0);
    
    orders[orderIndex].items = items;
    orders[orderIndex].total = newTotal;
  }
  
  // 상태 업데이트
  if (status) {
    orders[orderIndex].status = status;
  }
  
  orders[orderIndex].updatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: '주문이 업데이트되었습니다.',
    data: orders[orderIndex]
  });
});

// DELETE /api/orders/:id - 주문 취소
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(order => order.id === parseInt(id));
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      error: '주문을 찾을 수 없습니다.'
    });
  }
  
  // 이미 준비중이거나 완료된 주문은 취소할 수 없음
  if (['preparing', 'completed'].includes(orders[orderIndex].status)) {
    return res.status(400).json({
      success: false,
      error: '준비중이거나 완료된 주문은 취소할 수 없습니다.'
    });
  }
  
  // 주문 취소 시 재고량 복원 (대기중 상태일 때만)
  if (orders[orderIndex].status === 'pending') {
    orders[orderIndex].items.forEach(item => {
      restoreStock(item.id, item.quantity);
    });
  }
  
  orders[orderIndex].status = 'cancelled';
  orders[orderIndex].updatedAt = new Date().toISOString();
  orders[orderIndex].cancelledAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: '주문이 취소되었습니다. 재고가 복원되었습니다.',
    data: orders[orderIndex]
  });
});

module.exports = router; 