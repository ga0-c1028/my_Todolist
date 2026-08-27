process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_jwt';
}

const test = require('node:test');
const assert = require('node:assert/strict');
const jsonwebtoken = require('jsonwebtoken');

const { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } = require('./jwt');

test('signAccessToken/verifyAccessToken 왕복 시 payload가 보존된다', () => {
  const token = signAccessToken({ userId: 'u1' });
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.userId, 'u1');
});

test('signRefreshToken/verifyRefreshToken 왕복 시 payload가 보존된다', () => {
  const token = signRefreshToken({ userId: 'u1' });
  const decoded = verifyRefreshToken(token);
  assert.equal(decoded.userId, 'u1');
});

test('위조된 토큰을 verifyAccessToken에 넣으면 예외가 던져진다', () => {
  const token = signAccessToken({ userId: 'u1' });
  const parts = token.split('.');
  const tamperedSignature = parts[2].split('').reverse().join('') || 'x';
  const tampered = `${parts[0]}.${parts[1]}.${tamperedSignature !== parts[2] ? tamperedSignature : 'tampered'}`;
  assert.throws(() => verifyAccessToken(tampered));
});

test('만료된 토큰을 verifyAccessToken에 넣으면 예외가 던져진다', () => {
  const expiredToken = jsonwebtoken.sign({ userId: 'u1' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '-1s' });
  assert.throws(() => verifyAccessToken(expiredToken));
});

test('access 토큰을 verifyRefreshToken으로 검증하면 예외가 던져진다(시크릿 불일치)', () => {
  const accessToken = signAccessToken({ userId: 'u1' });
  assert.throws(() => verifyRefreshToken(accessToken));
});
