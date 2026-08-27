const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('./ApiError');

test('생성자에 넘긴 statusCode/code/message가 인스턴스 프로퍼티에 정확히 반영된다', () => {
  const err = new ApiError(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다.');
  assert.equal(err.statusCode, 404);
  assert.equal(err.code, 'NOT_FOUND');
  assert.equal(err.message, '리소스를 찾을 수 없습니다.');
});

test('ApiError 인스턴스는 instanceof ApiError이면서 동시에 instanceof Error이다', () => {
  const err = new ApiError(400, 'VALIDATION_ERROR', '잘못된 요청입니다.');
  assert.ok(err instanceof ApiError);
  assert.ok(err instanceof Error);
});
