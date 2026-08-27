const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { validateCreateCategory, validateUpdateCategory } = require('./categorySchemas');

function assertValidationError(fn) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
}

for (const [label, validate] of [
  ['validateCreateCategory', validateCreateCategory],
  ['validateUpdateCategory', validateUpdateCategory],
]) {
  test(`${label}는 name이 1자이면 통과한다(경계값)`, () => {
    assert.doesNotThrow(() => validate({ name: 'a' }));
  });

  test(`${label}는 name이 20자이면 통과한다(경계값)`, () => {
    assert.doesNotThrow(() => validate({ name: 'a'.repeat(20) }));
  });

  test(`${label}는 name이 빈 문자열이면 VALIDATION_ERROR를 던진다`, () => {
    assertValidationError(() => validate({ name: '' }));
  });

  test(`${label}는 name이 21자이면 VALIDATION_ERROR를 던진다`, () => {
    assertValidationError(() => validate({ name: 'a'.repeat(21) }));
  });

  test(`${label}는 name이 없으면 VALIDATION_ERROR를 던진다`, () => {
    assertValidationError(() => validate({}));
  });

  test(`${label}는 name이 문자열이 아니면 VALIDATION_ERROR를 던진다`, () => {
    assertValidationError(() => validate({ name: 123 }));
  });
}
