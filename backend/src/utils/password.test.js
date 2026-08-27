const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword } = require('./password');

test('hashPassword로 만든 해시를 원문으로 verifyPassword하면 true를 반환한다', async () => {
  const hash = await hashPassword('abc123');
  const result = await verifyPassword('abc123', hash);
  assert.equal(result, true);
});

test('틀린 원문으로 verifyPassword하면 false를 반환한다', async () => {
  const hash = await hashPassword('abc123');
  const result = await verifyPassword('wrong', hash);
  assert.equal(result, false);
});

test('같은 원문을 두 번 hashPassword하면 서로 다른 해시가 생성된다(솔트 랜덤)', async () => {
  const hash1 = await hashPassword('abc123');
  const hash2 = await hashPassword('abc123');
  assert.notEqual(hash1, hash2);
});

test('hashPassword의 반환값은 Promise이다', () => {
  const result = hashPassword('abc123');
  assert.ok(result instanceof Promise);
  return result;
});
