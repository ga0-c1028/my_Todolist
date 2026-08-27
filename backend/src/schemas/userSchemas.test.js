const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { validateUpdateUser } = require('./userSchemas');

function assertValidationError(fn) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
}

test('validateUpdateUser는 name만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateUser({ name: '홍길동' }));
});

test('validateUpdateUser는 password만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateUser({ password: 'password1' }));
});

test('validateUpdateUser는 name과 password가 모두 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateUser({ name: '홍길동', password: 'password1' }));
});

test('validateUpdateUser는 name과 password가 모두 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({}));
});

test('validateUpdateUser는 name이 빈 문자열이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({ name: '' }));
});

test('validateUpdateUser는 name이 31자이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({ name: 'a'.repeat(31) }));
});

test('validateUpdateUser는 name이 30자이면 통과한다(경계값)', () => {
  assert.doesNotThrow(() => validateUpdateUser({ name: 'a'.repeat(30) }));
});

test('validateUpdateUser는 password가 7자이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({ password: 'pw12345' }));
});

test('validateUpdateUser는 password에 숫자가 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({ password: 'passwordonly' }));
});

test('validateUpdateUser는 password에 영문이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateUser({ password: '12345678' }));
});

test('validateUpdateUser는 email 필드가 있어도 유효한 name과 함께면 통과한다(email은 무시)', () => {
  assert.doesNotThrow(() => validateUpdateUser({ name: 'x', email: 'new@x.com' }));
});
