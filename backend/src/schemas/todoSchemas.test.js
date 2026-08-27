const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { validateCreateTodo, validateUpdateTodo } = require('./todoSchemas');

function assertValidationError(fn) {
  assert.throws(fn, (err) => {
    assert.ok(err instanceof ApiError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
    return true;
  });
}

const validBody = { title: '제목', startDate: '2026-01-01', endDate: '2026-01-10' };

// ---- validateCreateTodo ----

test('validateCreateTodo는 필수값이 모두 있으면 통과한다', () => {
  assert.doesNotThrow(() => validateCreateTodo(validBody));
});

test('validateCreateTodo는 title이 1자이면 통과한다(경계값)', () => {
  assert.doesNotThrow(() => validateCreateTodo({ ...validBody, title: 'a' }));
});

test('validateCreateTodo는 title이 100자이면 통과한다(경계값)', () => {
  assert.doesNotThrow(() => validateCreateTodo({ ...validBody, title: 'a'.repeat(100) }));
});

test('validateCreateTodo는 title이 101자이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, title: 'a'.repeat(101) }));
});

test('validateCreateTodo는 title이 없으면 VALIDATION_ERROR를 던진다', () => {
  const { title, ...rest } = validBody;
  assertValidationError(() => validateCreateTodo(rest));
});

test('validateCreateTodo는 startDate가 없으면 VALIDATION_ERROR를 던진다', () => {
  const { startDate, ...rest } = validBody;
  assertValidationError(() => validateCreateTodo(rest));
});

test('validateCreateTodo는 endDate가 없으면 VALIDATION_ERROR를 던진다', () => {
  const { endDate, ...rest } = validBody;
  assertValidationError(() => validateCreateTodo(rest));
});

test('validateCreateTodo는 startDate 형식이 잘못되면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, startDate: '2026/01/01' }));
});

test('validateCreateTodo는 endDate 형식이 잘못되면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, endDate: '20260101' }));
});

test('validateCreateTodo는 endDate가 startDate보다 이전이어도 던지지 않는다(스키마 책임 아님)', () => {
  assert.doesNotThrow(() =>
    validateCreateTodo({ title: '제목', startDate: '2026-01-10', endDate: '2026-01-01' })
  );
});

test('validateCreateTodo는 description이 1000자이면 통과한다(경계값)', () => {
  assert.doesNotThrow(() => validateCreateTodo({ ...validBody, description: 'a'.repeat(1000) }));
});

test('validateCreateTodo는 description이 1001자이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, description: 'a'.repeat(1001) }));
});

test('validateCreateTodo는 description이 문자열이 아니면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, description: 123 }));
});

test('validateCreateTodo는 categoryId가 문자열이면 통과한다', () => {
  assert.doesNotThrow(() => validateCreateTodo({ ...validBody, categoryId: 'c1' }));
});

test('validateCreateTodo는 categoryId가 문자열이 아니면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateCreateTodo({ ...validBody, categoryId: 123 }));
});

// ---- validateUpdateTodo ----

test('validateUpdateTodo는 빈 객체이면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateTodo({}));
});

test('validateUpdateTodo는 title만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ title: '새 제목' }));
});

test('validateUpdateTodo는 title이 유효하지 않으면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateTodo({ title: '' }));
});

test('validateUpdateTodo는 description만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ description: '설명' }));
});

test('validateUpdateTodo는 categoryId만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ categoryId: 'c1' }));
});

test('validateUpdateTodo는 startDate만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ startDate: '2026-01-01' }));
});

test('validateUpdateTodo는 startDate 형식이 잘못되면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateTodo({ startDate: '2026/01/01' }));
});

test('validateUpdateTodo는 endDate만 있어도 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ endDate: '2026-01-01' }));
});

test('validateUpdateTodo는 isCompleted가 boolean이면 통과한다', () => {
  assert.doesNotThrow(() => validateUpdateTodo({ isCompleted: true }));
  assert.doesNotThrow(() => validateUpdateTodo({ isCompleted: false }));
});

test('validateUpdateTodo는 isCompleted가 boolean이 아니면 VALIDATION_ERROR를 던진다', () => {
  assertValidationError(() => validateUpdateTodo({ isCompleted: 'true' }));
});

test('validateUpdateTodo는 endDate가 startDate보다 이전이어도 던지지 않는다(스키마 책임 아님)', () => {
  assert.doesNotThrow(() =>
    validateUpdateTodo({ startDate: '2026-01-10', endDate: '2026-01-01' })
  );
});
