const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// SQLite 데이터베이스 파일 경로
// 프로덕션 환경에서는 메모리 데이터베이스 사용
const isProduction = process.env.NODE_ENV === 'production';
const DB_PATH = isProduction ? ':memory:' : (process.env.DB_PATH || path.join(__dirname, '..', 'data', 'coffee_shop.db'));

// SQLite 데이터베이스 연결
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ SQLite 데이터베이스 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite 데이터베이스 연결 성공!');
    console.log(`📁 데이터베이스: ${isProduction ? '메모리 데이터베이스' : DB_PATH}`);
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
        
        // 프로덕션 환경에서는 초기 메뉴 데이터 자동 추가
        if (isProduction) {
          seedInitialData().then(() => {
            resolve();
          }).catch((seedErr) => {
            console.error('❌ 초기 데이터 추가 실패:', seedErr.message);
            resolve(); // 초기 데이터 실패해도 서버는 시작
          });
        } else {
          resolve();
        }
      }
    });
  });
};

// 초기 메뉴 데이터 추가 (프로덕션용)
const seedInitialData = async () => {
  return new Promise((resolve, reject) => {
    // 기존 메뉴가 있는지 확인
    db.get('SELECT COUNT(*) as count FROM menu_items', (err, row) => {
      if (err) {
        return reject(err);
      }
      
      if (row.count > 0) {
        console.log('📋 기존 메뉴 데이터가 있습니다. 초기 데이터 추가를 건너뜁니다.');
        return resolve();
      }
      
      // 초기 메뉴 데이터
      const menuItems = [
        {
          name: '아메리카노 (HOT)',
          description: '진한 에스프레소에 뜨거운 물을 넣은 클래식 커피',
          price: 4500,
          category: '커피',
          image_url: '/images/menu/americano-hot.jpg'
        },
        {
          name: '아메리카노 (ICE)',
          description: '시원한 얼음과 진한 에스프레소의 만남',
          price: 4500,
          category: '아이스커피',
          image_url: '/images/menu/americano-ice.jpg'
        },
        {
          name: '카페라떼',
          description: '부드러운 스팀 밀크와 에스프레소의 완벽한 조화',
          price: 5500,
          category: '커피',
          image_url: '/images/menu/cafe-latte.jpg'
        }
      ];
      
      const insertMenu = db.prepare(`
        INSERT INTO menu_items (name, description, price, category, image_url) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      let insertCount = 0;
      menuItems.forEach((item, index) => {
        insertMenu.run([item.name, item.description, item.price, item.category, item.image_url], (err) => {
          if (err) {
            console.error(`❌ 메뉴 ${index + 1} 추가 실패:`, err);
            return reject(err);
          }
          
          console.log(`✅ ${item.name} 추가 완료`);
          insertCount++;
          
          if (insertCount === menuItems.length) {
            insertMenu.finalize();
            console.log('🎉 초기 메뉴 데이터 추가 완료!');
            resolve();
          }
        });
      });
    });
  });
};

module.exports = {
  db,
  testConnection,
  initializeDatabase
}; 