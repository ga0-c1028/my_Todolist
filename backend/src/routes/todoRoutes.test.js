const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_todoRoutes';
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

async function request(server, method, path, { body, headers = {} } = {}) {
  const res = await fetch(`${baseUrl(server)}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { res, body: await res.json() };
}

const TODO_ID = '11111111-1111-1111-1111-111111111111';

const endpoints = [
  { method: 'GET', path: '/api/todos' },
  { method: 'POST', path: '/api/todos' },
  { method: 'GET', path: `/api/todos/${TODO_ID}` },
  { method: 'PATCH', path: `/api/todos/${TODO_ID}` },
  { method: 'DELETE', path: `/api/todos/${TODO_ID}` },
];

for (const { method, path } of endpoints) {
  test(`${method} ${path}에 Authorization 헤더가 없으면 401 UNAUTHORIZED를 반환한다`, async () => {
    const server = await listen(http.createServer(app));
    try {
      const { res, body } = await request(server, method, path);
      assert.equal(res.status, 401);
      assert.equal(body.code, 'UNAUTHORIZED');
    } finally {
      await close(server);
    }
  });
}

test('POST /api/todos에 유효한 토큰이지만 title이 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const token = signAccessToken({ sub: '11111111-1111-1111-1111-111111111111' });
    const { res, body } = await request(server, 'POST', '/api/todos', {
      body: { startDate: '2026-01-01', endDate: '2026-01-10' },
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('PATCH /api/todos/:id에 유효한 토큰이지만 빈 body이면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const token = signAccessToken({ sub: '11111111-1111-1111-1111-111111111111' });
    const { res, body } = await request(server, 'PATCH', `/api/todos/${TODO_ID}`, {
      body: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

// 성공/DB 의존 경로(실제 생성/조회/수정/삭제 및 권한 분기)는 실제 DB 연결이 필요하여 여기서 검증할 수 없다. todoService.test.js의 단위 테스트로 커버한다.
