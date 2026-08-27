const test = require('node:test');
const assert = require('node:assert/strict');

const validate = require('./validate');
const ApiError = require('../utils/ApiError');

test('검증을 통과하는 validatorFn을 넘기면 next()가 인자 없이 호출된다', () => {
  const middleware = validate(() => {});
  const req = { body: { email: 'a@b.com' } };
  let calledArgs = null;
  const next = (...args) => {
    calledArgs = args;
  };
  middleware(req, {}, next);
  assert.deepEqual(calledArgs, []);
});

test('ApiError를 던지는 validatorFn을 넘기면 next(err)가 그 ApiError 인스턴스와 함께 호출된다', () => {
  const apiError = new ApiError(400, 'VALIDATION_ERROR', 'email 필수');
  const middleware = validate(() => {
    throw apiError;
  });
  const req = { body: {} };
  let calledWith = null;
  const next = (err) => {
    calledWith = err;
  };
  middleware(req, {}, next);
  assert.equal(calledWith, apiError);
  assert.ok(calledWith instanceof ApiError);
});

test('일반 Error를 던지는 validatorFn을 넘기면 next(err)가 그 Error 그대로 호출된다', () => {
  const genericError = new Error('알 수 없는 오류');
  const middleware = validate(() => {
    throw genericError;
  });
  const req = { body: {} };
  let calledWith = null;
  const next = (err) => {
    calledWith = err;
  };
  middleware(req, {}, next);
  assert.equal(calledWith, genericError);
  assert.ok(!(calledWith instanceof ApiError));
});
