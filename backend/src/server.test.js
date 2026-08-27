const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_server_load';
}

// require.main !== module(테스트 러너가 진입점)이므로 app.listen이 호출되지 않고
// 예외 없이 모듈이 로드되는지만 확인하는 최소 스모크 테스트.
test('server.js를 require해도 예외 없이 로드되고 app을 export한다', () => {
  const server = require('./server');
  assert.equal(typeof server, 'function');
});
