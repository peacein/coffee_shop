const { db } = require('../config/database');

// 샘플 메뉴 데이터
const sampleMenuItems = [
  {
    name: '아메리카노',
    description: '진한 에스프레소에 뜨거운 물을 넣은 클래식 커피',
    price: 4500,
    category: '커피',
    image_url: '/images/americano.jpg'
  },
  {
    name: '카페라떼',
    description: '부드러운 스팀 밀크와 에스프레소의 완벽한 조화',
    price: 5500,
    category: '커피',
    image_url: '/images/latte.jpg'
  },
  {
    name: '카푸치노',
    description: '진한 에스프레소와 거품 우유의 클래식한 조합',
    price: 5500,
    category: '커피',
    image_url: '/images/cappuccino.jpg'
  },
  {
    name: '바닐라 라떼',
    description: '달콤한 바닐라 시럽이 들어간 부드러운 라떼',
    price: 6000,
    category: '커피',
    image_url: '/images/vanilla-latte.jpg'
  },
  {
    name: '아이스 아메리카노',
    description: '시원한 얼음과 진한 에스프레소의 만남',
    price: 4500,
    category: '아이스커피',
    image_url: '/images/iced-americano.jpg'
  },
  {
    name: '아이스 카페라떼',
    description: '차가운 우유와 에스프레소의 시원한 조화',
    price: 5500,
    category: '아이스커피',
    image_url: '/images/iced-latte.jpg'
  },
  {
    name: '카라멜 마키아토',
    description: '달콤한 카라멜과 바닐라의 프리미엄 음료',
    price: 6500,
    category: '프리미엄',
    image_url: '/images/caramel-macchiato.jpg'
  },
  {
    name: '녹차 라떼',
    description: '진한 녹차와 부드러운 우유의 건강한 조합',
    price: 5500,
    category: '논커피',
    image_url: '/images/green-tea-latte.jpg'
  },
  {
    name: '핫초콜릿',
    description: '진한 초콜릿과 마시멜로가 들어간 달콤한 음료',
    price: 5000,
    category: '논커피',
    image_url: '/images/hot-chocolate.jpg'
  },
  {
    name: '크로와상',
    description: '바삭한 겉면과 부드러운 속살의 프랑스 전통 빵',
    price: 3500,
    category: '베이커리',
    image_url: '/images/croissant.jpg'
  },
  {
    name: '블루베리 머핀',
    description: '신선한 블루베리가 들어간 촉촉한 머핀',
    price: 4000,
    category: '베이커리',
    image_url: '/images/blueberry-muffin.jpg'
  },
  {
    name: '치즈케이크',
    description: '부드럽고 진한 크림치즈의 달콤한 케이크',
    price: 6000,
    category: '디저트',
    image_url: '/images/cheesecake.jpg'
  }
];

// 데이터베이스에 샘플 데이터 추가
const seedDatabase = async () => {
  return new Promise((resolve, reject) => {
    console.log('🌱 샘플 데이터 추가 시작...');
    
    // 기존 데이터 확인
    db.get('SELECT COUNT(*) as count FROM menu_items', (err, row) => {
      if (err) {
        console.error('❌ 데이터 확인 실패:', err.message);
        return reject(err);
      }
      
      if (row.count > 0) {
        console.log('⚠️  메뉴 데이터가 이미 존재합니다. 건너뜁니다.');
        return resolve();
      }
      
      // 샘플 메뉴 데이터 삽입
      const stmt = db.prepare(`
        INSERT INTO menu_items (name, description, price, category, image_url) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      let insertedCount = 0;
      let hasError = false;
      
      for (const item of sampleMenuItems) {
        stmt.run([item.name, item.description, item.price, item.category, item.image_url], (err) => {
          if (err && !hasError) {
            hasError = true;
            console.error('❌ 샘플 데이터 추가 실패:', err.message);
            stmt.finalize();
            return reject(err);
          }
          
          insertedCount++;
          if (insertedCount === sampleMenuItems.length && !hasError) {
            stmt.finalize();
            console.log(`✅ ${sampleMenuItems.length}개의 샘플 메뉴 데이터가 추가되었습니다!`);
            resolve();
          }
        });
      }
    });
  });
};

// 스크립트가 직접 실행될 때
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 데이터베이스 시딩 완료!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 데이터베이스 시딩 실패:', err);
      process.exit(1);
    });
}

module.exports = { seedDatabase }; 