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
      soldOut: false // 재고 관리 기능은 추후 구현
    }));
    
    console.log(`메뉴 조회 성공: ${menuItems.length}개 항목`);
    
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

module.exports = { router }; 