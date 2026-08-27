const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_categoryRepository';
}

const {
  createDefaultCategory,
  findAllByUser,
  findById,
  findByUserAndName,
  findDefaultByUser,
  create,
  updateName,
  deleteById,
  reassignTodos,
} = require('./categoryRepository');

test('createDefaultCategory는 db.query를 userId로 호출하고 생성된 카테고리 row를 반환한다', async () => {
  const fakeCategory = { id: 'c1', user_id: 'u1', name: '기본', is_default: true };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeCategory] };
    },
  };
  const result = await createDefaultCategory('u1', db);
  assert.equal(result, fakeCategory);
  assert.ok(calledWith.sql.includes('INSERT INTO categories'));
  assert.ok(calledWith.sql.includes('is_default'));
  assert.deepEqual(calledWith.params, ['u1']);
});

test('findAllByUser는 db.query를 userId로 호출하고 rows 배열을 반환한다', async () => {
  const fakeRows = [{ id: 'c1', user_id: 'u1', name: '기본', is_default: true }];
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: fakeRows };
    },
  };
  const result = await findAllByUser('u1', db);
  assert.equal(result, fakeRows);
  assert.ok(calledWith.sql.includes('FROM categories'));
  assert.ok(calledWith.sql.includes('WHERE user_id = $1'));
  assert.deepEqual(calledWith.params, ['u1']);
});

test('findById는 db.query를 id로 호출하고 rows[0]을 반환한다', async () => {
  const fakeCategory = { id: 'c1', user_id: 'u1', name: '기본', is_default: true };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeCategory] };
    },
  };
  const result = await findById('c1', db);
  assert.equal(result, fakeCategory);
  assert.ok(calledWith.sql.includes('WHERE id = $1'));
  assert.deepEqual(calledWith.params, ['c1']);
});

test('findById는 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await findById('none', db);
  assert.equal(result, undefined);
});

test('findByUserAndName은 db.query를 userId/name으로 호출하고 rows[0]을 반환한다', async () => {
  const fakeCategory = { id: 'c1', user_id: 'u1', name: '업무', is_default: false };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeCategory] };
    },
  };
  const result = await findByUserAndName('u1', '업무', db);
  assert.equal(result, fakeCategory);
  assert.ok(calledWith.sql.includes('WHERE user_id = $1 AND name = $2'));
  assert.deepEqual(calledWith.params, ['u1', '업무']);
});

test('findByUserAndName은 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await findByUserAndName('u1', '없는이름', db);
  assert.equal(result, undefined);
});

test('findDefaultByUser는 db.query를 userId와 is_default=true 조건으로 호출하고 rows[0]을 반환한다', async () => {
  const fakeCategory = { id: 'c1', user_id: 'u1', name: '기본', is_default: true };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeCategory] };
    },
  };
  const result = await findDefaultByUser('u1', db);
  assert.equal(result, fakeCategory);
  assert.ok(calledWith.sql.includes('is_default = true'));
  assert.deepEqual(calledWith.params, ['u1']);
});

test('create는 db.query를 INSERT 문으로 호출하고 생성된 row를 반환한다', async () => {
  const createdCategory = { id: 'c2', user_id: 'u1', name: '업무', is_default: false };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [createdCategory] };
    },
  };
  const result = await create('u1', '업무', db);
  assert.equal(result, createdCategory);
  assert.ok(calledWith.sql.includes('INSERT INTO categories'));
  assert.deepEqual(calledWith.params, ['u1', '업무']);
});

test('updateName은 db.query를 UPDATE 문으로 호출하고 갱신된 row를 반환한다', async () => {
  const updatedCategory = { id: 'c2', user_id: 'u1', name: '새이름', is_default: false };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [updatedCategory] };
    },
  };
  const result = await updateName('c2', '새이름', db);
  assert.equal(result, updatedCategory);
  assert.ok(calledWith.sql.includes('UPDATE categories'));
  assert.deepEqual(calledWith.params, ['새이름', 'c2']);
});

test('deleteById는 db.query를 DELETE 문으로 id와 함께 호출한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [] };
    },
  };
  await deleteById('c2', db);
  assert.ok(calledWith.sql.includes('DELETE FROM categories'));
  assert.deepEqual(calledWith.params, ['c2']);
});

test('reassignTodos는 db.query를 UPDATE 문으로 category_id를 이관한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [] };
    },
  };
  await reassignTodos('c2', 'c1', db);
  assert.ok(calledWith.sql.includes('UPDATE todos'));
  assert.deepEqual(calledWith.params, ['c1', 'c2']);
});
