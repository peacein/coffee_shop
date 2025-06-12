const express = require('express');
const { db } = require('../config/database');
const router = express.Router();

// GET /api/menu - 메뉴 목록 조회
router.get('/', (req, res) => {
  const { category, includeUnavailable } = req.query;
  
  let query = 'SELECT * FROM menu_items';
  let params = [];
  
  if (includeUnavailable !== 'true') {
    query += ' WHERE available = 1';
  } else {
    query += ' WHERE 1=1';
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY category, name';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('메뉴 조회 오류:', err);
      return res.status(500).json({
        success: false,
        error: '메뉴를 불러오는데 실패했습니다.'
      });
    }
    
    // SQLite는 BOOLEAN이 없으므로 INTEGER를 boolean으로 변환
    const menuItems = rows.map(row => ({
      ...row,
      available: row.available === 1,
      stock: row.stock || 0,
      max_stock: row.max_stock || 50,
      soldOut: (row.stock || 0) === 0
    }));
    
    console.log(`메뉴 조회 성공: ${menuItems.length}개 항목`);
    
    // 디버깅: 재고 정보 로그
    menuItems.forEach(item => {
      console.log(`📦 ${item.name}: 재고 ${item.stock}개 (최대 ${item.max_stock}개)`);
    });
    
    res.json({
      success: true,
      data: menuItems,
      total: menuItems.length
    });
  });
});

// GET /api/menu/:id - 특정 메뉴 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const menuItem = menuItems.find(item => item.id === parseInt(id));
  
  if (!menuItem) {
    return res.status(404).json({
      success: false,
      error: '메뉴를 찾을 수 없습니다.'
    });
  }
  
  res.json({
    success: true,
    data: menuItem
  });
});

// POST /api/menu - 새 메뉴 추가
router.post('/', (req, res) => {
  const { name, price, image, category } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      error: '이름, 가격, 카테고리는 필수 항목입니다.'
    });
  }
  
  const newMenuItem = {
    id: Math.max(...menuItems.map(item => item.id)) + 1,
    name,
    price: parseInt(price),
    image: image || '/images/menu/default.jpg',
    category,
    available: true
  };
  
  menuItems.push(newMenuItem);
  
  res.status(201).json({
    success: true,
    message: '메뉴가 추가되었습니다.',
    data: newMenuItem
  });
});

// GET /api/menu/:id - 특정 메뉴 조회
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('메뉴 조회 오류:', err);
      return res.status(500).json({
        success: false,
        error: '메뉴를 조회하는데 실패했습니다.'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      data: {
        ...row,
        available: row.available === 1
      }
    });
  });
});

// PUT /api/menu/:id/stock - 재고 업데이트
router.put('/:id/stock', (req, res) => {
  const { id } = req.params;
  const { stock, operation = 'set' } = req.body;
  
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({
      success: false,
      error: '유효한 재고 수량을 입력해주세요.'
    });
  }
  
  // 현재 재고 조회
  db.get('SELECT stock, max_stock FROM menu_items WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('재고 조회 오류:', err);
      return res.status(500).json({
        success: false,
        error: '재고 조회에 실패했습니다.'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        error: '메뉴를 찾을 수 없습니다.'
      });
    }
    
    let newStock;
    switch (operation) {
      case 'set':
        newStock = stock;
        break;
      case 'add':
        newStock = (row.stock || 0) + stock;
        break;
      case 'subtract':
        newStock = Math.max(0, (row.stock || 0) - stock);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: '유효하지 않은 operation입니다. (set, add, subtract)'
        });
    }
    
    // 최대 재고 제한
    newStock = Math.min(newStock, row.max_stock || 50);
    
    // 재고 업데이트
    db.run(
      'UPDATE menu_items SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStock, id],
      function(updateErr) {
        if (updateErr) {
          console.error('재고 업데이트 오류:', updateErr);
          return res.status(500).json({
            success: false,
            error: '재고 업데이트에 실패했습니다.'
          });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            error: '메뉴를 찾을 수 없습니다.'
          });
        }
        
        res.json({
          success: true,
          message: '재고가 업데이트되었습니다.',
          data: {
            id: parseInt(id),
            previousStock: row.stock || 0,
            newStock: newStock,
            operation: operation
          }
        });
      }
    );
  });
});

// POST /api/menu/restock - 전체 재고 보충
router.post('/restock', (req, res) => {
  const { menuId, restockAmount } = req.body;
  
  if (menuId) {
    // 특정 메뉴 재고 보충
    db.run(
      'UPDATE menu_items SET stock = max_stock, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [menuId],
      function(err) {
        if (err) {
          console.error('재고 보충 오류:', err);
          return res.status(500).json({
            success: false,
            error: '재고 보충에 실패했습니다.'
          });
        }
        
        res.json({
          success: true,
          message: '재고가 보충되었습니다.',
          data: { menuId: parseInt(menuId) }
        });
      }
    );
  } else {
    // 전체 메뉴 재고 보충
    db.run(
      'UPDATE menu_items SET stock = max_stock, updated_at = CURRENT_TIMESTAMP',
      [],
      function(err) {
        if (err) {
          console.error('전체 재고 보충 오류:', err);
          return res.status(500).json({
            success: false,
            error: '전체 재고 보충에 실패했습니다.'
          });
        }
        
        res.json({
          success: true,
          message: '전체 재고가 보충되었습니다.',
          data: { updatedCount: this.changes }
        });
      }
    );
  }
});

module.exports = { router }; 