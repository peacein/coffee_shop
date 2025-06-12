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

// 메뉴 데이터 초기화 및 3개 메뉴 추가
const resetMenu = async () => {
  return new Promise((resolve, reject) => {
    console.log('🗑️  기존 메뉴 데이터 삭제 중...');
    
    // 트랜잭션 시작
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 기존 메뉴 데이터 모두 삭제
      db.run('DELETE FROM menu_items', (err) => {
        if (err) {
          console.error('❌ 기존 메뉴 삭제 실패:', err);
          db.run('ROLLBACK');
          return reject(err);
        }
        
        console.log('✅ 기존 메뉴 데이터 삭제 완료');
        console.log('🌱 새로운 메뉴 데이터 추가 중...');
        
        // 새로운 메뉴 데이터 삽입
        const stmt = db.prepare(`
          INSERT INTO menu_items (name, description, price, category, image_url) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        let insertedCount = 0;
        let hasError = false;
        
        basicMenuItems.forEach((item, index) => {
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
                console.log(`🎉 메뉴 초기화 완료! ${basicMenuItems.length}개의 메뉴가 추가되었습니다.`);
                console.log('\n📋 추가된 메뉴:');
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
};

// 스크립트가 직접 실행될 때
if (require.main === module) {
  resetMenu()
    .then(() => {
      console.log('\n🎊 메뉴 초기화가 성공적으로 완료되었습니다!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 메뉴 초기화 실패:', err);
      process.exit(1);
    });
}

module.exports = { resetMenu }; 