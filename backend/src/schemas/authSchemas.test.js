const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { validateSignup, validateLogin, validateLogout, validateRefresh } = require('./authSchemas');

function assertValidationError(fn) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
}

test('validateSignup은 유효한 입력에 대해 예외 없이 통과한다', () => {
  assert.doesNotThrow(() => validateSignup({ email: 'a@b.com', password: 'password1', name: '홍길동' }));
});

test('validateSignup은 email이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ password: 'password1', name: '홍길동' }));
});

test('validateSignup은 email 형식이 올바르지 않으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'not-an-email', password: 'password1', name: '홍길동' }));
});

test('validateSignup은 password가 8자 미만이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: 'pw1', name: '홍길동' }));
});

test('validateSignup은 password에 숫자가 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: 'passwordonly', name: '홍길동' }));
});

test('validateSignup은 password에 영문이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: '12345678', name: '홍길동' }));
});

test('validateSignup은 password가 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', name: '홍길동' }));
});

test('validateSignup은 name이 빈 문자열이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: 'password1', name: '' }));
});

test('validateSignup은 name이 31자이면 VALIDATION_ERROR를 던진다', () => {
  const longName = 'a'.repeat(31);
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: 'password1', name: longName }));
});

test('validateSignup은 name이 30자이면 통과한다(경계값)', () => {
  const name30 = 'a'.repeat(30);
  assert.doesNotThrow(() => validateSignup({ email: 'a@b.com', password: 'password1', name: name30 }));
});

test('validateSignup은 name이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateSignup({ email: 'a@b.com', password: 'password1' }));
});

test('validateLogin은 유효한 입력에 대해 예외 없이 통과한다', () => {
  assert.doesNotThrow(() => validateLogin({ email: 'a@b.com', password: 'password1' }));
});

test('validateLogin은 email이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateLogin({ password: 'password1' }));
});

test('validateLogin은 password가 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateLogin({ email: 'a@b.com' }));
});

test('validateLogout은 유효한 refreshToken에 대해 예외 없이 통과한다', () => {
  assert.doesNotThrow(() => validateLogout({ refreshToken: 'some.jwt.token' }));
});

test('validateLogout은 refreshToken이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateLogout({}));
});

test('validateRefresh는 유효한 refreshToken에 대해 예외 없이 통과한다', () => {
  assert.doesNotThrow(() => validateRefresh({ refreshToken: 'some.jwt.token' }));
});

test('validateRefresh는 refreshToken이 없으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateRefresh({}));
});
