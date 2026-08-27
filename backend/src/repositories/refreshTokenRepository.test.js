const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_refreshTokenRepository';
}

const { create, findByTokenHash, deleteByTokenHash } = require('./refreshTokenRepository');

test('create는 db.query를 INSERT 문으로, userId/tokenHash/expiresAt 순서의 params로 호출한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [] };
    },
  };
  const expiresAt = new Date('2026-09-10T00:00:00.000Z');
  await create({ userId: 'u1', tokenHash: 'hash1', expiresAt }, db);
  assert.ok(calledWith.sql.includes('INSERT INTO refresh_tokens'));
  assert.deepEqual(calledWith.params, ['u1', 'hash1', expiresAt]);
});

test('findByTokenHash는 db.query를 tokenHash로 호출하고 rows[0]을 반환한다', async () => {
  const fakeRow = { id: 'rt1', user_id: 'u1', token_hash: 'hash1' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeRow] };
    },
  };
  const result = await findByTokenHash('hash1', db);
  assert.equal(result, fakeRow);
  assert.ok(calledWith.sql.includes('WHERE token_hash = $1'));
  assert.deepEqual(calledWith.params, ['hash1']);
});

test('findByTokenHash는 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await findByTokenHash('none', db);
  assert.equal(result, undefined);
});

test('deleteByTokenHash는 db.query를 DELETE 문으로 tokenHash와 함께 호출한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [] };
    },
  };
  await deleteByTokenHash('hash1', db);
  assert.ok(calledWith.sql.includes('DELETE FROM refresh_tokens'));
  assert.deepEqual(calledWith.params, ['hash1']);
});
