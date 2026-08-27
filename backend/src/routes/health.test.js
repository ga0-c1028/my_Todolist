const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_health';
}

const app = require('../app');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test('GET /api/health는 DB 연결 실패 시에도 200과 status ok, db disconnected를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.db, 'disconnected');
  } finally {
    await close(server);
  }
});
