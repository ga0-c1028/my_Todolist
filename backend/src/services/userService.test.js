const test = require('node:test');
const assert = require('node:assert/strict');

const { updateMe, deleteMe } = require('./userService');

function buildBaseDeps(overrides = {}) {
  return {
    userRepository: {
      updateById: async (id, { name, passwordHash }) => ({
        id,
        email: 'a@b.com',
        name: name ?? '기존이름',
        password_hash: passwordHash ?? 'old-hash',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      }),
    },
    hashPassword: async (raw) => `hashed:${raw}`,
    ...overrides,
  };
}

test('updateMe는 password가 있으면 hashPassword로 해시하여 updateById의 passwordHash로 전달한다', async () => {
  let receivedArgs = null;
  const deps = buildBaseDeps({
    userRepository: {
      updateById: async (id, dto) => {
        receivedArgs = { id, dto };
        return {
          id,
          email: 'a@b.com',
          name: '홍길동',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        };
      },
    },
  });

  await updateMe('u1', { name: '홍길동', password: 'password1' }, deps);

  assert.equal(receivedArgs.id, 'u1');
  assert.equal(receivedArgs.dto.name, '홍길동');
  assert.equal(receivedArgs.dto.passwordHash, 'hashed:password1');
});

test('updateMe는 password가 없으면 hashPassword를 호출하지 않고 passwordHash는 undefined로 전달한다', async () => {
  let receivedArgs = null;
  let hashPasswordCalled = false;
  const deps = buildBaseDeps({
    userRepository: {
      updateById: async (id, dto) => {
        receivedArgs = { id, dto };
        return {
          id,
          email: 'a@b.com',
          name: '홍길동',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-02T00:00:00.000Z',
        };
      },
    },
    hashPassword: async () => {
      hashPasswordCalled = true;
      return 'should-not-be-called';
    },
  });

  await updateMe('u1', { name: '홍길동' }, deps);

  assert.equal(hashPasswordCalled, false);
  assert.equal(receivedArgs.dto.passwordHash, undefined);
});

test('updateMe는 카멜케이스 결과를 반환하며 password 관련 필드를 포함하지 않는다', async () => {
  const deps = buildBaseDeps();

  const result = await updateMe('u1', { name: '홍길동' }, deps);

  assert.deepEqual(result, {
    id: 'u1',
    email: 'a@b.com',
    name: '홍길동',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  });
  assert.ok(!('password' in result));
  assert.ok(!('password_hash' in result));
  assert.ok(!('passwordHash' in result));
});

test('updateMe는 name 없이 password만 있어도 동작하며 기존 repository 반환값의 name을 그대로 담는다', async () => {
  const deps = buildBaseDeps();

  const result = await updateMe('u1', { password: 'password1' }, deps);

  assert.equal(result.name, '기존이름');
  assert.ok(!('password' in result));
  assert.ok(!('password_hash' in result));
});

test('deleteMe는 userRepository.deleteById를 해당 userId로 호출한다', async () => {
  let receivedId = null;
  const deps = {
    userRepository: {
      deleteById: async (id) => {
        receivedId = id;
      },
    },
  };

  await deleteMe('u1', deps);

  assert.equal(receivedId, 'u1');
});
