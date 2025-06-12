const { db } = require('../config/database');

// 데이터베이스 상세 정보 확인
const inspectDatabase = async () => {
  return new Promise((resolve, reject) => {
    console.log('🔍 SQLite 데이터베이스 상세 분석 시작...\n');
    
    // 1. 모든 테이블 목록 확인
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ 테이블 목록 조회 실패:', err);
        return reject(err);
      }
      
      console.log('📋 데이터베이스 테이블 목록:');
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.name}`);
      });
      console.log('');
      
      // 2. 각 테이블의 스키마 확인
      let tableCount = 0;
      
      tables.forEach((table) => {
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
          if (err) {
            console.error(`❌ ${table.name} 테이블 스키마 조회 실패:`, err);
            return;
          }
          
          console.log(`🏗️  ${table.name} 테이블 스키마:`);
          columns.forEach((col) => {
            console.log(`   ${col.name}: ${col.type} ${col.pk ? '(Primary Key)' : ''} ${col.notnull ? '(NOT NULL)' : ''}`);
          });
          
          // 3. 각 테이블의 데이터 확인
          db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
            if (err) {
              console.error(`❌ ${table.name} 데이터 조회 실패:`, err);
              return;
            }
            
            console.log(`📊 ${table.name} 테이블 데이터 (${rows.length}개 레코드):`);
            
            if (rows.length === 0) {
              console.log('   (데이터 없음)');
            } else {
              rows.forEach((row, index) => {
                console.log(`   [${index + 1}]`, JSON.stringify(row, null, 4));
              });
            }
            console.log('');
            
            tableCount++;
            if (tableCount === tables.length) {
              // 4. 데이터베이스 파일 정보
              console.log('📁 데이터베이스 파일 정보:');
              const fs = require('fs');
              const path = require('path');
              const dbPath = path.join(__dirname, '..', 'data', 'coffee_shop.db');
              
              try {
                const stats = fs.statSync(dbPath);
                console.log(`   파일 경로: ${dbPath}`);
                console.log(`   파일 크기: ${stats.size} bytes`);
                console.log(`   생성 날짜: ${stats.birthtime}`);
                console.log(`   수정 날짜: ${stats.mtime}`);
              } catch (fsErr) {
                console.log(`   파일 정보 확인 실패: ${fsErr.message}`);
              }
              
              resolve();
            }
          });
        });
      });
    });
  });
};

// 스크립트가 직접 실행될 때
if (require.main === module) {
  inspectDatabase()
    .then(() => {
      console.log('\n✅ 데이터베이스 분석 완료!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ 데이터베이스 분석 실패:', err);
      process.exit(1);
    });
}

module.exports = { inspectDatabase }; 