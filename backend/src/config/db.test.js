const test = require('node:test');
const assert = require('node:assert/strict');

// db.js 모듈 로드 시 config/env의 getEnv()가 호출되어 DATABASE_URL이 필요하다.
// 테스트 프로세스 시작 전 .env 또는 실제 환경변수에 DATABASE_URL이 있어야 하므로,
// 없을 경우를 대비해 기본값을 주입한다(모듈 로드는 require 시 1회만 발생).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_module_load';
}

const { pool, createPool } = require('./db');

test('createPool이 반환한 인스턴스는 query 함수를 가진다(pg.Pool 간접 검증)', () => {
  const testPool = createPool('postgresql://user:pass@localhost:5432/testdb');
  assert.equal(typeof testPool.query, 'function');
});

test('createPool에 전달한 연결 문자열이 인스턴스의 options.connectionString에 반영된다', () => {
  const connectionString = 'postgresql://user:pass@localhost:5432/testdb';
  const testPool = createPool(connectionString);
  assert.equal(testPool.options.connectionString, connectionString);
});

test('서로 다른 연결 문자열로 두 번 호출하면 서로 다른 독립적인 인스턴스가 생성된다', () => {
  const poolA = createPool('postgresql://user:pass@localhost:5432/db_a');
  const poolB = createPool('postgresql://user:pass@localhost:5432/db_b');
  assert.notEqual(poolA, poolB);
  assert.notEqual(poolA.options.connectionString, poolB.options.connectionString);
});

test('export된 싱글턴 pool은 query 메서드를 가진 객체다', () => {
  assert.equal(typeof pool, 'object');
  assert.equal(typeof pool.query, 'function');
});
