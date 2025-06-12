const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'coffee_shop.db');

console.log('🧹 데이터베이스 완전 정리 시작...');

// 1. 기존 데이터베이스 파일 삭제
const deleteDatabase = () => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
        console.log('✅ 기존 데이터베이스 파일 삭제 완료');
        resolve();
      } catch (err) {
        console.error('❌ 데이터베이스 파일 삭제 실패:', err.message);
        console.log('💡 서버가 실행 중이면 종료 후 다시 시도하세요.');
        reject(err);
      }
    } else {
      console.log('ℹ️  데이터베이스 파일이 존재하지 않습니다.');
      resolve();
    }
  });
};

// 2. 새 데이터베이스 생성 및 초기화
const createFreshDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ 새 데이터베이스 생성 실패:', err);
        return reject(err);
      }
      
      console.log('✅ 새 데이터베이스 파일 생성 완료');
      
      // 테이블 생성
      const createTables = `
        -- 메뉴 아이템 테이블
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
        );

        -- 주문 테이블
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
        );

        -- 주문 아이템 테이블
        CREATE TABLE order_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id INTEGER NOT NULL,
          menu_item_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          subtotal REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders (id),
          FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
        );
      `;
      
      db.exec(createTables, (err) => {
        if (err) {
          console.error('❌ 테이블 생성 실패:', err);
          return reject(err);
        }
        
        console.log('✅ 데이터베이스 테이블 생성 완료');
        
        // 3개 메뉴만 추가
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
              db.close((err) => {
                if (err) {
                  console.error('❌ 데이터베이스 연결 종료 실패:', err);
                  return reject(err);
                }
                console.log('✅ 데이터베이스 연결 종료 완료');
                resolve();
              });
            }
          });
        });
      });
    });
  });
};

// 스크립트 실행
const main = async () => {
  try {
    await deleteDatabase();
    await createFreshDatabase();
    console.log('\n🎉 데이터베이스 완전 리셋 완료!');
    console.log('📋 3개 메뉴 아이템이 추가되었습니다:');
    console.log('   1. 아메리카노 (HOT) - 4,500원');
    console.log('   2. 아메리카노 (ICE) - 4,500원');
    console.log('   3. 카페라떼 - 5,500원');
    console.log('\n💡 이제 서버를 다시 시작하세요: npm run dev');
  } catch (err) {
    console.error('\n❌ 데이터베이스 리셋 실패:', err.message);
    console.log('💡 서버가 실행 중이면 Ctrl+C로 종료한 후 다시 시도하세요.');
    process.exit(1);
  }
};

main(); 