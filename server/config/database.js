const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// SQLite 데이터베이스 파일 경로
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coffee_shop.db');

// SQLite 데이터베이스 연결
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ SQLite 데이터베이스 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite 데이터베이스 연결 성공!');
    console.log(`📁 데이터베이스 파일: ${DB_PATH}`);
  }
});

// 데이터베이스 연결 테스트
const testConnection = async () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT 1', (err) => {
      if (err) {
        console.error('❌ SQLite 데이터베이스 연결 실패:', err.message);
        reject(err);
      } else {
        console.log('✅ SQLite 데이터베이스 연결 테스트 성공!');
        resolve();
      }
    });
  });
};

// 데이터베이스 초기화 (테이블 생성)
const initializeDatabase = async () => {
  return new Promise((resolve, reject) => {
    // 외래 키 제약 조건 활성화
    db.run('PRAGMA foreign_keys = ON');
    
    // 메뉴 테이블 생성
    db.run(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image_url TEXT,
        available INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ 메뉴 테이블 생성 실패:', err.message);
        return reject(err);
      }
    });

    // 주문 테이블 생성
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        order_type TEXT DEFAULT 'pickup',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ 주문 테이블 생성 실패:', err.message);
        return reject(err);
      }
    });

    // 주문 항목 테이블 생성
    db.run(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        menu_item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
      )
    `, (err) => {
      if (err) {
        console.error('❌ 주문 항목 테이블 생성 실패:', err.message);
        return reject(err);
      } else {
        console.log('📋 데이터베이스 테이블 초기화 완료!');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  testConnection,
  initializeDatabase
}; 