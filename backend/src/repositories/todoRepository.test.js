const test = require('node:test');
const assert = require('node:assert/strict');

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb_todoRepository';
}

const { create, findAllByUser, findById, updateById, deleteById } = require('./todoRepository');

test('create는 db.query를 INSERT 문으로 호출하고 생성된 row를 반환하며 description이 없으면 null로 대체한다', async () => {
  const fakeTodo = { id: 't1', user_id: 'u1' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeTodo] };
    },
  };
  const result = await create(
    'u1',
    { categoryId: 'c1', title: '제목', startDate: '2026-01-01', endDate: '2026-01-02' },
    db
  );
  assert.equal(result, fakeTodo);
  assert.ok(calledWith.sql.includes('INSERT INTO todos'));
  assert.deepEqual(calledWith.params, ['u1', 'c1', '제목', null, '2026-01-01', '2026-01-02']);
});

test('create는 description이 있으면 그대로 사용한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [{}] };
    },
  };
  await create(
    'u1',
    {
      categoryId: 'c1',
      title: '제목',
      description: '설명',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
    },
    db
  );
  assert.deepEqual(calledWith.params, ['u1', 'c1', '제목', '설명', '2026-01-01', '2026-01-02']);
});

test('findAllByUser는 categoryId가 없으면 user_id만으로 조회한다', async () => {
  const fakeRows = [{ id: 't1' }];
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: fakeRows };
    },
  };
  const result = await findAllByUser('u1', {}, db);
  assert.equal(result, fakeRows);
  assert.ok(calledWith.sql.includes('WHERE user_id = $1'));
  assert.ok(!calledWith.sql.includes('category_id'));
  assert.deepEqual(calledWith.params, ['u1']);
});

test('findAllByUser는 categoryId가 있으면 category_id 조건을 함께 사용한다', async () => {
  const fakeRows = [{ id: 't1' }];
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: fakeRows };
    },
  };
  const result = await findAllByUser('u1', { categoryId: 'c1' }, db);
  assert.equal(result, fakeRows);
  assert.ok(calledWith.sql.includes('WHERE user_id = $1'));
  assert.ok(calledWith.sql.includes('category_id = $2'));
  assert.deepEqual(calledWith.params, ['u1', 'c1']);
});

test('findById는 user_id 조건 없이 id로만 조회하고 rows[0]을 반환한다', async () => {
  const fakeTodo = { id: 't1', user_id: 'u1' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [fakeTodo] };
    },
  };
  const result = await findById('t1', db);
  assert.equal(result, fakeTodo);
  assert.ok(calledWith.sql.includes('WHERE id = $1'));
  assert.ok(!calledWith.sql.includes('user_id'));
  assert.deepEqual(calledWith.params, ['t1']);
});

test('findById는 결과가 없으면 undefined를 반환한다', async () => {
  const db = { query: async () => ({ rows: [] }) };
  const result = await findById('none', db);
  assert.equal(result, undefined);
});

test('updateById는 COALESCE 없이 전체 컬럼을 UPDATE하고 갱신된 row를 반환한다', async () => {
  const updatedTodo = { id: 't1' };
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [updatedTodo] };
    },
  };
  const completedAt = new Date('2026-01-05T00:00:00Z');
  const result = await updateById(
    't1',
    {
      categoryId: 'c1',
      title: '제목',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      isCompleted: true,
      completedAt,
    },
    db
  );
  assert.equal(result, updatedTodo);
  assert.ok(calledWith.sql.includes('UPDATE todos'));
  assert.ok(!calledWith.sql.includes('COALESCE'));
  assert.deepEqual(calledWith.params, [
    'c1',
    '제목',
    null,
    '2026-01-01',
    '2026-01-02',
    true,
    completedAt,
    't1',
  ]);
});

test('updateById는 description이 없으면 null로 대체한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [{}] };
    },
  };
  await updateById(
    't1',
    {
      categoryId: 'c1',
      title: '제목',
      description: '설명있음',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      isCompleted: false,
      completedAt: null,
    },
    db
  );
  assert.equal(calledWith.params[2], '설명있음');
});

test('deleteById는 db.query를 DELETE 문으로 id와 함께 호출한다', async () => {
  let calledWith = null;
  const db = {
    query: async (sql, params) => {
      calledWith = { sql, params };
      return { rows: [] };
    },
  };
  await deleteById('t1', db);
  assert.ok(calledWith.sql.includes('DELETE FROM todos'));
  assert.deepEqual(calledWith.params, ['t1']);
});
