const { db } = require('../config/database');

// 현재 데이터베이스의 메뉴 목록 확인
const checkMenu = async () => {
  return new Promise((resolve, reject) => {
    console.log('📋 현재 데이터베이스 메뉴 목록 확인 중...\n');
    
    db.all('SELECT * FROM menu_items ORDER BY id', (err, rows) => {
      if (err) {
        console.error('❌ 메뉴 조회 실패:', err);
        return reject(err);
      }
      
      console.log(`📊 총 ${rows.length}개의 메뉴가 등록되어 있습니다:\n`);
      
      rows.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}`);
        console.log(`   가격: ${item.price}원`);
        console.log(`   카테고리: ${item.category}`);
        console.log(`   이미지: ${item.image_url}`);
        console.log(`   설명: ${item.description}`);
        console.log(`   활성화: ${item.available === 1 ? 'Yes' : 'No'}`);
        console.log('');
      });
      
      resolve(rows);
    });
  });
};

// 스크립트가 직접 실행될 때
if (require.main === module) {
  checkMenu()
    .then(() => {
      console.log('✅ 메뉴 확인 완료!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 메뉴 확인 실패:', err);
      process.exit(1);
    });
}

module.exports = { checkMenu }; 