const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

const ApiError = require('../utils/ApiError');
const errorHandler = require('./errorHandler');

function buildTestApp() {
  const testApp = express();
  testApp.get('/api-error', (req, res, next) => {
    next(new ApiError(400, 'VALIDATION_ERROR', '메시지'));
  });
  testApp.get('/generic-error', (req, res, next) => {
    next(new Error('내부 버그 상세정보'));
  });
  testApp.use(errorHandler);
  return testApp;
}

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

test('ApiError를 던지는 라우트는 statusCode와 { code, message }를 그대로 응답한다', async () => {
  const server = await listen(http.createServer(buildTestApp()));
  try {
    const res = await fetch(`${baseUrl(server)}/api-error`);
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.deepEqual(body, { code: 'VALIDATION_ERROR', message: '메시지' });
  } finally {
    await close(server);
  }
});

test('일반 Error를 던지는 라우트는 500과 표준화된 메시지를 반환하고 원본 에러 정보를 노출하지 않는다', async () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const server = await listen(http.createServer(buildTestApp()));
  try {
    const res = await fetch(`${baseUrl(server)}/generic-error`);
    const body = await res.json();
    assert.equal(res.status, 500);
    assert.equal(body.code, 'INTERNAL_SERVER_ERROR');
    assert.ok(!JSON.stringify(body).includes('내부 버그 상세정보'));
    assert.ok(!JSON.stringify(body).toLowerCase().includes('at '));
  } finally {
    console.error = originalConsoleError;
    await close(server);
  }
});

test('500 에러 시 console.error가 호출된다', async () => {
  const originalConsoleError = console.error;
  let callCount = 0;
  console.error = () => {
    callCount += 1;
  };
  const server = await listen(http.createServer(buildTestApp()));
  try {
    await fetch(`${baseUrl(server)}/generic-error`);
    assert.equal(callCount, 1);
  } finally {
    console.error = originalConsoleError;
    await close(server);
  }
});
