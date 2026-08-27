const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_userRepository';
}

const { findByEmail, create, findById, updateById } = require('./userRepository');

test('findByEmail은 db.query를 email로 호출하고 rows[0]을 반환한다', async () => {
  const fakeUser = { id: 'u1', email: 'a@b.com', password_hash: 'hash', name: '홍길동' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeUser] };
    },
  };
  const result = await findByEmail('a@b.com', db);
  assert.equal(result, fakeUser);
  assert.ok(calledWith.sql.includes('FROM users'));
  assert.ok(calledWith.sql.includes('WHERE email = $1'));
  assert.deepEqual(calledWith.params, ['a@b.com']);
});

test('findByEmail은 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await findByEmail('none@b.com', db);
  assert.equal(result, undefined);
});

test('create는 db.query를 INSERT 문으로 호출하고 생성된 row를 반환한다', async () => {
  const createdUser = { id: 'u1', email: 'a@b.com', name: '홍길동' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [createdUser] };
    },
  };
  const result = await create({ email: 'a@b.com', passwordHash: 'hashed', name: '홍길동' }, db);
  assert.equal(result, createdUser);
  assert.ok(calledWith.sql.includes('INSERT INTO users'));
  assert.deepEqual(calledWith.params, ['a@b.com', 'hashed', '홍길동']);
});

test('findById는 db.query를 id로 호출하고 rows[0]을 반환한다', async () => {
  const fakeUser = { id: 'u1', email: 'a@b.com' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeUser] };
    },
  };
  const result = await findById('u1', db);
  assert.equal(result, fakeUser);
  assert.ok(calledWith.sql.includes('WHERE id = $1'));
  assert.deepEqual(calledWith.params, ['u1']);
});

test('updateById는 db.query를 UPDATE 문으로 호출하고 갱신된 row를 반환한다', async () => {
  const updatedUser = { id: 'u1', email: 'a@b.com', name: '새이름' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [updatedUser] };
    },
  };
  const result = await updateById('u1', { name: '새이름', passwordHash: undefined }, db);
  assert.equal(result, updatedUser);
  assert.ok(calledWith.sql.includes('UPDATE users'));
  assert.ok(calledWith.sql.includes('WHERE id = $3'));
  assert.deepEqual(calledWith.params, ['새이름', null, 'u1']);
});

test('updateById는 name/passwordHash가 없으면 null로 치환하여 COALESCE에 위임한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [{ id: 'u1' }] };
    },
  };
  await updateById('u1', {}, db);
  assert.ok(calledWith.sql.includes('COALESCE'));
  assert.deepEqual(calledWith.params, [null, null, 'u1']);
});

test('updateById는 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await updateById('nope', { name: 'x' }, db);
  assert.equal(result, undefined);
});
