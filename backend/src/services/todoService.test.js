const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { getTodoStatus } = require('../utils/todoStatus');
const { create, list, getOne, update, remove } = require('./todoService');

function buildRow(overrides = {}) {
  return {
    id: 't1',
    user_id: 'u1',
    category_id: 'c1',
    title: '제목',
    description: null,
    start_date: '2026-01-01',
    end_date: '2026-01-10',
    is_completed: false,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function buildBaseDeps(overrides = {}) {
  return {
    todoRepository: {
      create: async (userId, data) => buildRow({ category_id: data.categoryId, title: data.title }),
      findAllByUser: async () => [],
      findById: async () => undefined,
      updateById: async (id, data) => buildRow({ id, ...data }),
      deleteById: async () => {},
    },
    categoryRepository: {
      findById: async () => undefined,
      findDefaultByUser: async () => ({ id: 'default1', user_id: 'u1', name: '기본', is_default: true }),
    },
    ...overrides,
  };
}

function expectedDto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    status: getTodoStatus(row.start_date, row.end_date, row.is_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---- create ----

test('create는 categoryId가 없으면 기본 카테고리를 조회해서 사용한다', async () => {
  let usedCategoryId = null;
  const deps = buildBaseDeps({
    todoRepository: {
      create: async (userId, data) => {
        usedCategoryId = data.categoryId;
        return buildRow({ category_id: data.categoryId });
      },
    },
    categoryRepository: {
      findDefaultByUser: async () => ({ id: 'default1', user_id: 'u1', name: '기본', is_default: true }),
      findById: async () => {
        throw new Error('categoryId가 없을 때는 findById가 호출되면 안 됨');
      },
    },
  });

  const result = await create(
    'u1',
    { title: '제목', startDate: '2026-01-01', endDate: '2026-01-10' },
    deps
  );

  assert.equal(usedCategoryId, 'default1');
  assert.equal(result.categoryId, 'default1');
});

test('create는 categoryId가 다른 유저 소유이면 ApiError(403, FORBIDDEN)를 던지고 todoRepository.create를 호출하지 않는다', async () => {
  let todoCreateCalled = false;
  const deps = buildBaseDeps({
    todoRepository: {
      create: async () => {
        todoCreateCalled = true;
        return buildRow();
      },
    },
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'other-user', name: '업무', is_default: false }),
    },
  });

  await assert.rejects(
    () =>
      create(
        'u1',
        { categoryId: 'c1', title: '제목', startDate: '2026-01-01', endDate: '2026-01-10' },
        deps
      ),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
  assert.equal(todoCreateCalled, false);
});

test('create는 categoryId가 존재하지 않으면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: { findById: async () => undefined },
  });

  await assert.rejects(
    () =>
      create(
        'u1',
        { categoryId: 'none', title: '제목', startDate: '2026-01-01', endDate: '2026-01-10' },
        deps
      ),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('create는 endDate가 startDate보다 이전이면 ApiError(400, INVALID_DATE_RANGE)를 던지고 아무 것도 호출하지 않는다', async () => {
  let categoryCalled = false;
  let todoCalled = false;
  const deps = buildBaseDeps({
    todoRepository: {
      create: async () => {
        todoCalled = true;
        return buildRow();
      },
    },
    categoryRepository: {
      findDefaultByUser: async () => {
        categoryCalled = true;
        return { id: 'default1' };
      },
      findById: async () => {
        categoryCalled = true;
        return { id: 'c1', user_id: 'u1' };
      },
    },
  });

  await assert.rejects(
    () =>
      create(
        'u1',
        { title: '제목', startDate: '2026-01-10', endDate: '2026-01-01' },
        deps
      ),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_DATE_RANGE');
      return true;
    }
  );
  assert.equal(categoryCalled, false);
  assert.equal(todoCalled, false);
});

test('create는 categoryId가 본인 소유이면 그대로 사용하여 todoRepository.create를 호출하고 DTO를 반환한다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
    },
  });

  const result = await create(
    'u1',
    { categoryId: 'c1', title: '제목', startDate: '2026-01-01', endDate: '2026-01-10' },
    deps
  );

  const row = buildRow({ category_id: 'c1', title: '제목' });
  assert.deepEqual(result, expectedDto(row));
});

// ---- list ----

test('list는 findAllByUser 결과를 DTO로 변환한다', async () => {
  const rows = [buildRow({ id: 't1' }), buildRow({ id: 't2', is_completed: true, completed_at: '2026-01-02T00:00:00Z' })];
  const deps = buildBaseDeps({
    todoRepository: { findAllByUser: async () => rows },
  });

  const result = await list('u1', {}, deps);

  assert.deepEqual(result, rows.map(expectedDto));
});

test('list는 status 필터가 있으면 JS에서 필터링한다', async () => {
  const rows = [
    buildRow({ id: 't1', is_completed: true, completed_at: '2026-01-02T00:00:00Z' }),
    buildRow({ id: 't2', is_completed: false }),
  ];
  const deps = buildBaseDeps({
    todoRepository: { findAllByUser: async () => rows },
  });

  const result = await list('u1', { status: 'completed' }, deps);

  assert.deepEqual(result, [expectedDto(rows[0])]);
});

// ---- getOne ----

test('getOne은 할일이 없으면 ApiError(404, NOT_FOUND)를 던진다', async () => {
  const deps = buildBaseDeps({ todoRepository: { findById: async () => undefined } });

  await assert.rejects(
    () => getOne('u1', 't1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('getOne은 다른 유저 소유이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    todoRepository: { findById: async () => buildRow({ user_id: 'other-user' }) },
  });

  await assert.rejects(
    () => getOne('u1', 't1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('getOne은 본인 소유이면 DTO를 반환한다', async () => {
  const row = buildRow();
  const deps = buildBaseDeps({ todoRepository: { findById: async () => row } });

  const result = await getOne('u1', 't1', deps);

  assert.deepEqual(result, expectedDto(row));
});

// ---- update ----

test('update는 할일이 없으면 ApiError(404, NOT_FOUND)를 던진다', async () => {
  const deps = buildBaseDeps({ todoRepository: { findById: async () => undefined } });

  await assert.rejects(
    () => update('u1', 't1', { title: '수정' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('update는 다른 유저 소유이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    todoRepository: { findById: async () => buildRow({ user_id: 'other-user' }) },
  });

  await assert.rejects(
    () => update('u1', 't1', { title: '수정' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('update는 title만 바꾸면 dates/isCompleted/completedAt은 유지된다', async () => {
  const existing = buildRow({ is_completed: false, completed_at: null });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing, title: data.title });
      },
    },
  });

  await update('u1', 't1', { title: '새 제목' }, deps);

  assert.equal(updatePayload.title, '새 제목');
  assert.equal(updatePayload.startDate, existing.start_date);
  assert.equal(updatePayload.endDate, existing.end_date);
  assert.equal(updatePayload.isCompleted, existing.is_completed);
  assert.equal(updatePayload.completedAt, existing.completed_at);
});

test('update는 isCompleted가 false에서 true로 바뀌면 새로운 completedAt을 채운다', async () => {
  const existing = buildRow({ is_completed: false, completed_at: null });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing, is_completed: true, completed_at: data.completedAt });
      },
    },
  });

  await update('u1', 't1', { isCompleted: true }, deps);

  assert.ok(updatePayload.completedAt instanceof Date);
  assert.notEqual(updatePayload.completedAt, existing.completed_at);
});

test('update는 이미 완료된 항목이 isCompleted:true 패치를 다시 받아도 기존 completedAt을 그대로 유지한다', async () => {
  const originalCompletedAt = '2025-06-01T00:00:00Z';
  const existing = buildRow({ is_completed: true, completed_at: originalCompletedAt });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing, completed_at: data.completedAt });
      },
    },
  });

  await update('u1', 't1', { isCompleted: true }, deps);

  assert.equal(updatePayload.completedAt, originalCompletedAt);
});

test('update는 이미 완료된 항목에 isCompleted 없는 패치를 보내도 기존 completedAt을 그대로 유지한다', async () => {
  const originalCompletedAt = '2025-06-01T00:00:00Z';
  const existing = buildRow({ is_completed: true, completed_at: originalCompletedAt });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing, title: data.title });
      },
    },
  });

  await update('u1', 't1', { title: '제목만 변경' }, deps);

  assert.equal(updatePayload.completedAt, originalCompletedAt);
  assert.equal(updatePayload.isCompleted, true);
});

test('update는 isCompleted가 true에서 false로 바뀌면 completedAt을 null로 만든다', async () => {
  const existing = buildRow({ is_completed: true, completed_at: '2025-06-01T00:00:00Z' });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing, is_completed: false, completed_at: null });
      },
    },
  });

  await update('u1', 't1', { isCompleted: false }, deps);

  assert.equal(updatePayload.completedAt, null);
});

test('update는 이미 미완료 상태에서 isCompleted:false 패치를 받아도 completedAt은 null이다', async () => {
  const existing = buildRow({ is_completed: false, completed_at: null });
  let updatePayload = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => {
        updatePayload = data;
        return buildRow({ ...existing });
      },
    },
  });

  await update('u1', 't1', { isCompleted: false }, deps);

  assert.equal(updatePayload.completedAt, null);
});

test('update는 병합 후 endDate가 startDate보다 이전이면 ApiError(400, INVALID_DATE_RANGE)를 던진다', async () => {
  const existing = buildRow({ start_date: '2026-01-05', end_date: '2026-01-10' });
  const deps = buildBaseDeps({
    todoRepository: { findById: async () => existing },
  });

  await assert.rejects(
    () => update('u1', 't1', { endDate: '2026-01-01' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'INVALID_DATE_RANGE');
      return true;
    }
  );
});

test('update는 patch.categoryId가 다른 유저 소유이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const existing = buildRow();
  const deps = buildBaseDeps({
    todoRepository: { findById: async () => existing },
    categoryRepository: {
      findById: async () => ({ id: 'c2', user_id: 'other-user', name: '업무', is_default: false }),
    },
  });

  await assert.rejects(
    () => update('u1', 't1', { categoryId: 'c2' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('update는 patch.categoryId가 본인 소유이면 반영하여 DTO를 반환한다', async () => {
  const existing = buildRow();
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => existing,
      updateById: async (id, data) => buildRow({ ...existing, category_id: data.categoryId }),
    },
    categoryRepository: {
      findById: async () => ({ id: 'c2', user_id: 'u1', name: '업무', is_default: false }),
    },
  });

  const result = await update('u1', 't1', { categoryId: 'c2' }, deps);

  assert.equal(result.categoryId, 'c2');
});

// ---- remove ----

test('remove는 할일이 없으면 ApiError(404, NOT_FOUND)를 던진다', async () => {
  const deps = buildBaseDeps({ todoRepository: { findById: async () => undefined } });

  await assert.rejects(
    () => remove('u1', 't1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('remove는 다른 유저 소유이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    todoRepository: { findById: async () => buildRow({ user_id: 'other-user' }) },
  });

  await assert.rejects(
    () => remove('u1', 't1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('remove는 본인 소유이면 todoRepository.deleteById를 호출한다', async () => {
  let deletedId = null;
  const deps = buildBaseDeps({
    todoRepository: {
      findById: async () => buildRow(),
      deleteById: async (id) => {
        deletedId = id;
      },
    },
  });

  await remove('u1', 't1', deps);

  assert.equal(deletedId, 't1');
});
