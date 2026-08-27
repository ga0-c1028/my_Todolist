// 실제 DB 연결이 없는 환경이라 성공/DB 의존 경로(회원가입 성공, 로그인 성공 등)는
// 라우트 레벨에서 검증할 수 없다. 해당 로직은 authService.test.js의 단위 테스트로 커버하고,
// 여기서는 요청 바디 유효성 검증 실패(400 VALIDATION_ERROR) 경로만 통합 테스트로 검증한다.

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_authRoutes';
}

const app = require('../app');

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

async function postJson(server, path, body) {
  const res = await fetch(`${baseUrl(server)}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
}

test('POST /api/auth/signup에 필수 필드가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/signup', { email: 'a@b.com' });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('POST /api/auth/signup에 이메일 형식이 올바르지 않으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/signup', {
      email: 'not-an-email',
      password: 'password1',
      name: '홍길동',
    });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('POST /api/auth/signup에 비밀번호가 8자 미만이면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/signup', {
      email: 'a@b.com',
      password: 'pw1',
      name: '홍길동',
    });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('POST /api/auth/login에 password가 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/login', { email: 'a@b.com' });
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('POST /api/auth/logout에 refreshToken이 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/logout', {});
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});

test('POST /api/auth/refresh에 refreshToken이 없으면 400 VALIDATION_ERROR를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const { res, body } = await postJson(server, '/api/auth/refresh', {});
    assert.equal(res.status, 400);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await close(server);
  }
});
