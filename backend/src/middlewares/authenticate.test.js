process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_authenticate';
}

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const jsonwebtoken = require('jsonwebtoken');
const express = require('express');

const authenticate = require('./authenticate');
const errorHandler = require('./errorHandler');
const ApiError = require('../utils/ApiError');
const { signAccessToken } = require('../utils/jwt');

function assertUnauthorized(calledWith) {
  assert.ok(calledWith instanceof ApiError);
  assert.equal(calledWith.statusCode, 401);
  assert.equal(calledWith.code, 'UNAUTHORIZED');
}

test('Authorization 헤더가 없으면 next(err)가 401 UNAUTHORIZED ApiError와 함께 호출된다', () => {
  const req = { headers: {} };
  let calledWith;
  const next = (err) => {
    calledWith = err;
  };
  authenticate(req, {}, next);
  assertUnauthorized(calledWith);
});

test('Authorization 헤더가 Bearer로 시작하지 않으면 401 UNAUTHORIZED ApiError가 전달된다', () => {
  const req = { headers: { authorization: 'Basic abc123' } };
  let calledWith;
  const next = (err) => {
    calledWith = err;
  };
  authenticate(req, {}, next);
  assertUnauthorized(calledWith);
});

test('Bearer 뒤에 잘못된 토큰 문자열이 오면 401 UNAUTHORIZED ApiError가 전달된다', () => {
  const req = { headers: { authorization: 'Bearer not-a-real-token' } };
  let calledWith;
  const next = (err) => {
    calledWith = err;
  };
  authenticate(req, {}, next);
  assertUnauthorized(calledWith);
});

test('만료된 access 토큰이면 401 UNAUTHORIZED ApiError가 전달된다', () => {
  const expiredToken = jsonwebtoken.sign({ sub: 'user-123' }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: '-1s',
  });
  const req = { headers: { authorization: `Bearer ${expiredToken}` } };
  let calledWith;
  const next = (err) => {
    calledWith = err;
  };
  authenticate(req, {}, next);
  assertUnauthorized(calledWith);
});

test('시크릿이 다른(위조된) 토큰이면 401 UNAUTHORIZED ApiError가 전달된다', () => {
  const tamperedToken = jsonwebtoken.sign({ sub: 'user-123' }, 'wrong-secret', {
    expiresIn: '15m',
  });
  const req = { headers: { authorization: `Bearer ${tamperedToken}` } };
  let calledWith;
  const next = (err) => {
    calledWith = err;
  };
  authenticate(req, {}, next);
  assertUnauthorized(calledWith);
});

test('유효한 access 토큰이면 req.user가 설정되고 next()가 인자 없이 호출된다', () => {
  const token = signAccessToken({ sub: 'user-123' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let calledArgs = null;
  const next = (...args) => {
    calledArgs = args;
  };
  authenticate(req, {}, next);
  assert.deepEqual(calledArgs, []);
  assert.deepEqual(req.user, { id: 'user-123' });
});

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

test('통합: 토큰 없이 요청하면 401을 응답하고, 유효한 토큰으로 요청하면 200과 userId를 응답한다', async () => {
  const app = express();
  app.get('/protected', authenticate, (req, res) => res.json({ userId: req.user.id }));
  app.use(errorHandler);

  const server = await listen(http.createServer(app));
  try {
    const unauthorizedRes = await fetch(`${baseUrl(server)}/protected`);
    const unauthorizedBody = await unauthorizedRes.json();
    assert.equal(unauthorizedRes.status, 401);
    assert.equal(unauthorizedBody.code, 'UNAUTHORIZED');

    const token = signAccessToken({ sub: 'user-123' });
    const authorizedRes = await fetch(`${baseUrl(server)}/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const authorizedBody = await authorizedRes.json();
    assert.equal(authorizedRes.status, 200);
    assert.deepEqual(authorizedBody, { userId: 'user-123' });
  } finally {
    await close(server);
  }
});
