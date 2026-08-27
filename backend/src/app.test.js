const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_app_load';
}

const app = require('./app');

// 테스트 전용 라우트: express.json() 미들웨어 동작 검증용
app.post('/__test-echo', (req, res) => {
  res.json(req.body);
});

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

function baseUrl(server) {
  const { port } = server.address();
  return `http://127.0.0.1:${port}`;
}

test('express.json() 미들웨어가 JSON 바디를 파싱한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const res = await fetch(`${baseUrl(server)}/__test-echo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body, { hello: 'world' });
  } finally {
    await close(server);
  }
});

test('cors 미들웨어가 access-control-allow-origin 헤더를 응답에 포함한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const res = await fetch(`${baseUrl(server)}/api/__nonexistent`, {
      headers: { Origin: 'https://example.com' },
    });
    assert.ok(res.headers.has('access-control-allow-origin'));
  } finally {
    await close(server);
  }
});

test('존재하지 않는 경로 GET 요청은 404를 반환한다', async () => {
  const server = await listen(http.createServer(app));
  try {
    const res = await fetch(`${baseUrl(server)}/api/__nonexistent`);
    assert.equal(res.status, 404);
  } finally {
    await close(server);
  }
});

test('NODE_ENV이 production이 아니면 /api-docs(Swagger UI)가 마운트된다', async () => {
  delete process.env.NODE_ENV;
  delete require.cache[require.resolve('./app')];
  const devApp = require('./app');
  const server = await listen(http.createServer(devApp));
  try {
    const res = await fetch(`${baseUrl(server)}/api-docs/`);
    assert.notEqual(res.status, 404);
  } finally {
    await close(server);
  }
});

test('NODE_ENV이 production이면 /api-docs(Swagger UI)가 마운트되지 않는다', async () => {
  process.env.NODE_ENV = 'production';
  delete require.cache[require.resolve('./app')];
  try {
    const prodApp = require('./app');
    const server = await listen(http.createServer(prodApp));
    try {
      const res = await fetch(`${baseUrl(server)}/api-docs/`);
      assert.equal(res.status, 404);
    } finally {
      await close(server);
    }
  } finally {
    delete process.env.NODE_ENV;
    delete require.cache[require.resolve('./app')];
  }
});
