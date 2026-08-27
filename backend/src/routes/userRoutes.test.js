const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_userRoutes';
}

const app = require('../app');
const { signAccessToken } = require('../utils/jwt');

function listen(server) {
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function baseUrl(server) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

async function patchJson(server, path, body, headers = {}) {
  const res = await fetch(`${baseUrl(server)}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
}

test('PATCH /api/users/me에 Authorization 헤더가 없으면 401 UNAUTHORIZED를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await patchJson(server, '/api/users/me', {});
    assert.equal(res.status, 401);
    assert.equal(body.code, 'UNAUTHORIZED');
  } finally {
    await close(server);
  }
});

test('PATCH /api/users/me에 유효한 토큰이지만 빈 바디이면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const token = signAccessToken({ sub: '11111111-1111-1111-1111-111111111111' });
    const { res, body } = await patchJson(server, '/api/users/me', {}, { Authorization: `Bearer ${token}` });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

// 성공(200) 경로는 실제 DB 연결이 필요하여 여기서 검증할 수 없다. userService.test.js의 단위 테스트로 커버한다.
