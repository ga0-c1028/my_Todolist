const test = require('node:test');
const assert = require('node:assert/strict');

const { hashToken } = require('./hashToken');

test('같은 입력을 hashToken하면 항상 같은 sha256 hex 다이제스트를 반환한다', () => {
  const a = hashToken('same-raw-token');
  const b = hashToken('same-raw-token');
  assert.equal(a, b);
});

test('다른 입력을 hashToken하면 다른 값을 반환한다', () => {
  const a = hashToken('token-a');
  const b = hashToken('token-b');
  assert.notEqual(a, b);
});

test('hashToken의 반환값은 64자 hex 문자열이다(sha256)', () => {
  const result = hashToken('abc');
  assert.equal(result.length, 64);
  assert.ok(/^[0-9a-f]{64}$/.test(result));
});
