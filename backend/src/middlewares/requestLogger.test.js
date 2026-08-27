const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { EventEmitter } = require('node:events');

const requestLogger = require('./requestLogger');

function buildMockRes() {
  const res = new EventEmitter();
  res.statusCode = 200;
  return res;
}

test('requestLogger는 next를 인자 없이 즉시 호출한다', () => {
  const req = { method: 'GET', originalUrl: '/test' };
  const res = buildMockRes();
  let called = false;
  let calledArgs = null;
  const next = (...args) => {
    called = true;
    calledArgs = args;
  };
  requestLogger(req, res, next);
  assert.equal(called, true);
  assert.deepEqual(calledArgs, []);
});

test("res.emit('finish')를 트리거하면 console.log가 1회 호출되고 method/originalUrl/statusCode가 로그에 포함된다", () => {
  const req = { method: 'GET', originalUrl: '/test' };
  const res = buildMockRes();
  res.statusCode = 200;
  const originalConsoleLog = console.log;
  let callCount = 0;
  let loggedArgs = [];
  console.log = (...args) => {
    callCount += 1;
    loggedArgs = args;
  };
  try {
    requestLogger(req, res, () => {});
    res.emit('finish');
    assert.equal(callCount, 1);
    const logged = loggedArgs.join(' ');
    assert.ok(logged.includes('GET'));
    assert.ok(logged.includes('/test'));
    assert.ok(logged.includes('200'));
  } finally {
    console.log = originalConsoleLog;
  }
});

test('실제 app.js에 대한 404 요청 시 console.log 로그에 404가 포함된다 (통합)', async () => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_requestlogger';
  }
  if (!process.env.JWT_ACCESS_SECRET) {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  }
  // eslint-disable-next-line global-require
  const app = require('../app');

  const originalConsoleLog = console.log;
  let loggedLines = [];
  console.log = (...args) => {
    loggedLines.push(args.join(' '));
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/__nonexistent`);
    assert.equal(res.status, 404);
    assert.ok(loggedLines.some((line) => line.includes('404')));
  } finally {
    console.log = originalConsoleLog;
    await new Promise((resolve) => server.close(resolve));
  }
});
