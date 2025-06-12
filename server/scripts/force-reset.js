const { db } = require('../config/database');

// 3개의 기본 메뉴 데이터
const basicMenuItems = [
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

// 데이터베이스 완전 초기화 및 3개 메뉴만 추가
const forceReset = async () => {
  return new Promise((resolve, reject) => {
    console.log('🔥 데이터베이스 완전 초기화 시작...');
    
    // 트랜잭션 시작
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 1. 모든 테이블 삭제
      console.log('🗑️  기존 테이블 삭제 중...');
      
      db.run('DROP TABLE IF EXISTS order_items', (err) => {
        if (err) {
          console.error('❌ order_items 테이블 삭제 실패:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ order_items 테이블 삭제 완료');
      });
      
      db.run('DROP TABLE IF EXISTS orders', (err) => {
        if (err) {
          console.error('❌ orders 테이블 삭제 실패:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ orders 테이블 삭제 완료');
      });
      
      db.run('DROP TABLE IF EXISTS menu_items', (err) => {
        if (err) {
          console.error('❌ menu_items 테이블 삭제 실패:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        console.log('✅ menu_items 테이블 삭제 완료');
        
        // 2. 테이블 재생성
        console.log('🔨 테이블 재생성 중...');
        
        // 메뉴 테이블 생성
        db.run(`
          CREATE TABLE menu_items (
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
            console.error('❌ menu_items 테이블 생성 실패:', err);
            db.run('ROLLBACK');
            return reject(err);
          }
          console.log('✅ menu_items 테이블 생성 완료');
          
          // 주문 테이블 생성
          db.run(`
            CREATE TABLE orders (
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
              console.error('❌ orders 테이블 생성 실패:', err);
              db.run('ROLLBACK');
              return reject(err);
            }
            console.log('✅ orders 테이블 생성 완료');
            
            // 주문 항목 테이블 생성
            db.run(`
              CREATE TABLE order_items (
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
                console.error('❌ order_items 테이블 생성 실패:', err);
                db.run('ROLLBACK');
                return reject(err);
              }
              console.log('✅ order_items 테이블 생성 완료');
              
              // 3. 새로운 메뉴 데이터 삽입
              console.log('🌱 새로운 메뉴 데이터 추가 중...');
              
              const stmt = db.prepare(`
                INSERT INTO menu_items (name, description, price, category, image_url) 
                VALUES (?, ?, ?, ?, ?)
              `);
              
              let insertedCount = 0;
              let hasError = false;
              
              basicMenuItems.forEach((item) => {
                stmt.run([item.name, item.description, item.price, item.category, item.image_url], (err) => {
                  if (err && !hasError) {
                    hasError = true;
                    console.error('❌ 메뉴 추가 실패:', err);
                    stmt.finalize();
                    db.run('ROLLBACK');
                    return reject(err);
                  }
                  
                  if (!hasError) {
                    console.log(`✅ ${item.name} 추가 완료`);
                    insertedCount++;
                    
                    if (insertedCount === basicMenuItems.length) {
                      stmt.finalize();
                      db.run('COMMIT');
                      console.log(`\n🎉 데이터베이스 완전 초기화 완료!`);
                      console.log(`📊 ${basicMenuItems.length}개의 메뉴가 새로 추가되었습니다.\n`);
                      
                      basicMenuItems.forEach((item, idx) => {
                        console.log(`${idx + 1}. ${item.name} - ${item.price}원`);
                        console.log(`   이미지: ${item.image_url}`);
                      });
                      
                      resolve();
                    }
                  }
                });
              });
            });
          });
        });
      });
    });
  });
};

// 스크립트가 직접 실행될 때
if (require.main === module) {
  forceReset()
    .then(() => {
      console.log('\n🎊 데이터베이스 강제 초기화가 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 데이터베이스 강제 초기화 실패:', err);
      process.exit(1);
    });
}

module.exports = { forceReset }; 