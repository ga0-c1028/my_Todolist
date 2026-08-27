const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { list, create, update, remove } = require('./categoryService');

function buildFakeClient() {
  const calls = [];
  return {
    calls,
    query: async (sql) => {
      calls.push(sql);
      return { rows: [] };
    },
    release: () => {
      calls.push('RELEASE');
    },
  };
}

function buildBaseDeps(overrides = {}) {
  return {
    categoryRepository: {
      findAllByUser: async () => [],
      findByUserAndName: async () => undefined,
      findById: async () => undefined,
      findDefaultByUser: async () => ({ id: 'default1', user_id: 'u1', name: '기본', is_default: true }),
      create: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      updateName: async () => ({ id: 'c1', user_id: 'u1', name: '새이름', is_default: false }),
      deleteById: async () => {},
      reassignTodos: async () => {},
    },
    pool: {
      connect: async () => buildFakeClient(),
    },
    ...overrides,
  };
}

// ---- list ----

test('list는 findAllByUser의 결과를 camelCase로 변환하여 반환한다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findAllByUser: async () => [
        { id: 'c1', user_id: 'u1', name: '기본', is_default: true },
        { id: 'c2', user_id: 'u1', name: '업무', is_default: false },
      ],
    },
  });

  const result = await list('u1', deps);

  assert.deepEqual(result, [
    { id: 'c1', userId: 'u1', name: '기본', isDefault: true },
    { id: 'c2', userId: 'u1', name: '업무', isDefault: false },
  ]);
});

// ---- create ----

test('create는 같은 이름의 카테고리가 이미 있으면 ApiError(409, CATEGORY_NAME_ALREADY_EXISTS)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findByUserAndName: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      create: async () => {
        throw new Error('create가 호출되면 안 됨');
      },
    },
  });

  await assert.rejects(
    () => create('u1', '업무', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'CATEGORY_NAME_ALREADY_EXISTS');
      return true;
    }
  );
});

test('create는 중복이 없으면 categoryRepository.create를 호출하고 camelCase 결과를 반환한다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findByUserAndName: async () => undefined,
      create: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
    },
  });

  const result = await create('u1', '업무', deps);

  assert.deepEqual(result, { id: 'c1', userId: 'u1', name: '업무', isDefault: false });
});

// ---- update ----

test('update는 카테고리가 없으면 ApiError(404, NOT_FOUND)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: { findById: async () => undefined },
  });

  await assert.rejects(
    () => update('u1', 'c1', '새이름', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('update는 다른 유저 소유 카테고리이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'other-user', name: '업무', is_default: false }),
    },
  });

  await assert.rejects(
    () => update('u1', 'c1', '새이름', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('update는 기본 카테고리이면 ApiError(400, DEFAULT_CATEGORY_IMMUTABLE)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '기본', is_default: true }),
    },
  });

  await assert.rejects(
    () => update('u1', 'c1', '새이름', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'DEFAULT_CATEGORY_IMMUTABLE');
      return true;
    }
  );
});

test('update는 이름을 변경한 대상과 다른 카테고리가 그 이름을 이미 쓰고 있으면 ApiError(409, CATEGORY_NAME_ALREADY_EXISTS)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      findByUserAndName: async () => ({ id: 'c2', user_id: 'u1', name: '새이름', is_default: false }),
    },
  });

  await assert.rejects(
    () => update('u1', 'c1', '새이름', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'CATEGORY_NAME_ALREADY_EXISTS');
      return true;
    }
  );
});

test('update는 자기 자신의 현재 이름으로 변경(동일 id)하면 중복 에러 없이 통과한다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      findByUserAndName: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      updateName: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
    },
  });

  const result = await update('u1', 'c1', '업무', deps);

  assert.deepEqual(result, { id: 'c1', userId: 'u1', name: '업무', isDefault: false });
});

test('update 성공 시 categoryRepository.updateName을 호출하고 camelCase 결과를 반환한다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      findByUserAndName: async () => undefined,
      updateName: async () => ({ id: 'c1', user_id: 'u1', name: '새이름', is_default: false }),
    },
  });

  const result = await update('u1', 'c1', '새이름', deps);

  assert.deepEqual(result, { id: 'c1', userId: 'u1', name: '새이름', isDefault: false });
});

// ---- remove ----

test('remove는 카테고리가 없으면 ApiError(404, NOT_FOUND)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: { findById: async () => undefined },
  });

  await assert.rejects(
    () => remove('u1', 'c1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 404);
      assert.equal(err.code, 'NOT_FOUND');
      return true;
    }
  );
});

test('remove는 다른 유저 소유 카테고리이면 ApiError(403, FORBIDDEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'other-user', name: '업무', is_default: false }),
    },
  });

  await assert.rejects(
    () => remove('u1', 'c1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 403);
      assert.equal(err.code, 'FORBIDDEN');
      return true;
    }
  );
});

test('remove는 기본 카테고리이면 ApiError(400, DEFAULT_CATEGORY_IMMUTABLE)를 던진다', async () => {
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '기본', is_default: true }),
    },
  });

  await assert.rejects(
    () => remove('u1', 'c1', deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 400);
      assert.equal(err.code, 'DEFAULT_CATEGORY_IMMUTABLE');
      return true;
    }
  );
});

test('remove 성공 시 트랜잭션(BEGIN/COMMIT)을 실행하고 기본 카테고리로 할일을 이관한 뒤 삭제하며 client.release()를 호출한다', async () => {
  let fakeClient;
  const reassignCalls = [];
  const deleteCalls = [];
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      findDefaultByUser: async () => ({ id: 'default1', user_id: 'u1', name: '기본', is_default: true }),
      reassignTodos: async (fromCategoryId, toCategoryId) => {
        reassignCalls.push({ fromCategoryId, toCategoryId });
      },
      deleteById: async (id) => {
        deleteCalls.push(id);
      },
    },
    pool: {
      connect: async () => {
        fakeClient = buildFakeClient();
        return fakeClient;
      },
    },
  });

  await remove('u1', 'c1', deps);

  assert.deepEqual(reassignCalls, [{ fromCategoryId: 'c1', toCategoryId: 'default1' }]);
  assert.deepEqual(deleteCalls, ['c1']);
  assert.ok(fakeClient.calls.includes('BEGIN'));
  assert.ok(fakeClient.calls.includes('COMMIT'));
  assert.ok(!fakeClient.calls.includes('ROLLBACK'));
  assert.ok(fakeClient.calls.includes('RELEASE'));
});

test('remove 중 에러 발생 시 ROLLBACK을 실행하고 client.release() 후 에러를 다시 던진다', async () => {
  let fakeClient;
  const boom = new Error('할일 이관 실패');
  const deps = buildBaseDeps({
    categoryRepository: {
      findById: async () => ({ id: 'c1', user_id: 'u1', name: '업무', is_default: false }),
      findDefaultByUser: async () => ({ id: 'default1', user_id: 'u1', name: '기본', is_default: true }),
      reassignTodos: async () => {
        throw boom;
      },
    },
    pool: {
      connect: async () => {
        fakeClient = buildFakeClient();
        return fakeClient;
      },
    },
  });

  await assert.rejects(
    () => remove('u1', 'c1', deps),
    (err) => {
      assert.equal(err, boom);
      return true;
    }
  );

  assert.ok(fakeClient.calls.includes('BEGIN'));
  assert.ok(fakeClient.calls.includes('ROLLBACK'));
  assert.ok(!fakeClient.calls.includes('COMMIT'));
  assert.ok(fakeClient.calls.includes('RELEASE'));
});
