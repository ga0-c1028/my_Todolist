const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../utils/ApiError');
const { hashToken } = require('../utils/hashToken');
const { signup, login, logout, refresh } = require('./authService');

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
    userRepository: {
      findByEmail: async () => undefined,
      create: async () => ({ id: 'u1', email: 'a@b.com', name: '홍길동' }),
      findById: async () => undefined,
    },
    categoryRepository: {
      createDefaultCategory: async () => ({ id: 'c1', user_id: 'u1', name: '기본', is_default: true }),
    },
    refreshTokenRepository: {
      create: async () => {},
      findByTokenHash: async () => undefined,
      deleteByTokenHash: async () => {},
    },
    pool: {
      connect: async () => buildFakeClient(),
    },
    hashPassword: async (raw) => `hashed:${raw}`,
    verifyPassword: async () => true,
    signAccessToken: () => 'access-token',
    signRefreshToken: () => 'refresh-token',
    verifyRefreshToken: () => ({ userId: 'u1' }),
    hashToken,
    ...overrides,
  };
}

// ---- signup ----

test('signup은 이메일이 이미 존재하면 ApiError(409, EMAIL_ALREADY_EXISTS)를 던진다', async () => {
  const deps = buildBaseDeps({
    userRepository: {
      findByEmail: async () => ({ id: 'existing', email: 'a@b.com' }),
      create: async () => {
        throw new Error('create가 호출되면 안 됨');
      },
    },
  });

  await assert.rejects(
    () => signup({ email: 'a@b.com', password: 'password1', name: '홍길동' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 409);
      assert.equal(err.code, 'EMAIL_ALREADY_EXISTS');
      return true;
    }
  );
});

test('signup 성공 시 트랜잭션(BEGIN/COMMIT)을 실행하고 client.release()를 호출하며 생성된 유저를 반환한다', async () => {
  let fakeClient;
  const deps = buildBaseDeps({
    pool: {
      connect: async () => {
        fakeClient = buildFakeClient();
        return fakeClient;
      },
    },
  });

  const result = await signup({ email: 'a@b.com', password: 'password1', name: '홍길동' }, deps);

  assert.deepEqual(result, { id: 'u1', email: 'a@b.com', name: '홍길동' });
  assert.ok(fakeClient.calls.includes('BEGIN'));
  assert.ok(fakeClient.calls.includes('COMMIT'));
  assert.ok(!fakeClient.calls.includes('ROLLBACK'));
  assert.ok(fakeClient.calls.includes('RELEASE'));
});

test('signup 중 에러 발생 시 ROLLBACK을 실행하고 client.release() 후 에러를 다시 던진다', async () => {
  let fakeClient;
  const boom = new Error('category 생성 실패');
  const deps = buildBaseDeps({
    pool: {
      connect: async () => {
        fakeClient = buildFakeClient();
        return fakeClient;
      },
    },
    categoryRepository: {
      createDefaultCategory: async () => {
        throw boom;
      },
    },
  });

  await assert.rejects(
    () => signup({ email: 'a@b.com', password: 'password1', name: '홍길동' }, deps),
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

test('signup은 hashPassword로 만든 해시를 userRepository.create에 전달한다', async () => {
  let receivedDto = null;
  const deps = buildBaseDeps({
    userRepository: {
      findByEmail: async () => undefined,
      create: async (dto) => {
        receivedDto = dto;
        return { id: 'u1', email: dto.email, name: dto.name };
      },
    },
  });

  await signup({ email: 'a@b.com', password: 'password1', name: '홍길동' }, deps);

  assert.equal(receivedDto.passwordHash, 'hashed:password1');
  assert.equal(receivedDto.email, 'a@b.com');
  assert.equal(receivedDto.name, '홍길동');
});

// ---- login ----

test('login은 유저를 찾지 못하면 ApiError(401, INVALID_CREDENTIALS)를 던진다', async () => {
  const deps = buildBaseDeps({
    userRepository: { findByEmail: async () => undefined },
  });

  await assert.rejects(
    () => login({ email: 'none@b.com', password: 'password1' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_CREDENTIALS');
      return true;
    }
  );
});

test('login은 비밀번호가 틀리면 ApiError(401, INVALID_CREDENTIALS)를 던지며, 유저 미존재 시와 동일한 메시지를 사용한다(BR-11)', async () => {
  const userNotFoundDeps = buildBaseDeps({
    userRepository: { findByEmail: async () => undefined },
  });
  const wrongPasswordDeps = buildBaseDeps({
    userRepository: { findByEmail: async () => ({ id: 'u1', email: 'a@b.com', password_hash: 'hashed' }) },
    verifyPassword: async () => false,
  });

  let errorFromNotFound;
  let errorFromWrongPassword;
  try {
    await login({ email: 'none@b.com', password: 'password1' }, userNotFoundDeps);
  } catch (err) {
    errorFromNotFound = err;
  }
  try {
    await login({ email: 'a@b.com', password: 'wrongpass1' }, wrongPasswordDeps);
  } catch (err) {
    errorFromWrongPassword = err;
  }

  assert.equal(errorFromNotFound.code, errorFromWrongPassword.code);
  assert.equal(errorFromNotFound.message, errorFromWrongPassword.message);
  assert.equal(errorFromNotFound.statusCode, 401);
  assert.equal(errorFromWrongPassword.statusCode, 401);
});

test('login 성공 시 accessToken/refreshToken/user를 반환하고 password 관련 필드를 노출하지 않는다', async () => {
  const deps = buildBaseDeps({
    userRepository: {
      findByEmail: async () => ({ id: 'u1', email: 'a@b.com', password_hash: 'hashed', name: '홍길동' }),
    },
    verifyPassword: async () => true,
    signAccessToken: () => 'the-access-token',
    signRefreshToken: () => 'the-refresh-token',
  });

  const result = await login({ email: 'a@b.com', password: 'password1' }, deps);

  assert.equal(result.accessToken, 'the-access-token');
  assert.equal(result.refreshToken, 'the-refresh-token');
  assert.ok(result.user);
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('password_hash'));
  assert.ok(!('password' in result.user));
  assert.ok(!('password_hash' in result.user));
});

test('login 성공 시 refreshTokenRepository.create에 hashToken(refreshToken)으로 계산한 tokenHash를 전달한다', async () => {
  let receivedDto = null;
  const deps = buildBaseDeps({
    userRepository: {
      findByEmail: async () => ({ id: 'u1', email: 'a@b.com', password_hash: 'hashed', name: '홍길동' }),
    },
    verifyPassword: async () => true,
    signRefreshToken: () => 'the-refresh-token',
    refreshTokenRepository: {
      create: async (dto) => {
        receivedDto = dto;
      },
      findByTokenHash: async () => undefined,
      deleteByTokenHash: async () => {},
    },
  });

  await login({ email: 'a@b.com', password: 'password1' }, deps);

  assert.equal(receivedDto.tokenHash, hashToken('the-refresh-token'));
  assert.equal(receivedDto.userId, 'u1');
});

test('login은 refresh token payload에 매번 다른 jti를 부여해 같은 초(iat)에 재로그인해도 토큰이 충돌하지 않는다', async () => {
  const payloads = [];
  const deps = buildBaseDeps({
    userRepository: {
      findByEmail: async () => ({ id: 'u1', email: 'a@b.com', password_hash: 'hashed', name: '홍길동' }),
    },
    verifyPassword: async () => true,
    signRefreshToken: (payload) => {
      payloads.push(payload);
      return `token-${payloads.length}`;
    },
  });

  await login({ email: 'a@b.com', password: 'password1' }, deps);
  await login({ email: 'a@b.com', password: 'password1' }, deps);

  assert.equal(payloads.length, 2);
  assert.ok(payloads[0].jti);
  assert.ok(payloads[1].jti);
  assert.notEqual(payloads[0].jti, payloads[1].jti);
});

// ---- logout ----

test('logout은 hashToken(refreshToken)으로 refreshTokenRepository.deleteByTokenHash를 호출한다', async () => {
  let receivedHash = null;
  const deps = buildBaseDeps({
    refreshTokenRepository: {
      create: async () => {},
      findByTokenHash: async () => undefined,
      deleteByTokenHash: async (tokenHash) => {
        receivedHash = tokenHash;
      },
    },
  });

  await logout({ refreshToken: 'some-refresh-token' }, deps);

  assert.equal(receivedHash, hashToken('some-refresh-token'));
});

test('logout은 존재하지 않는 토큰이어도 에러를 던지지 않는다(멱등)', async () => {
  const deps = buildBaseDeps({
    refreshTokenRepository: {
      create: async () => {},
      findByTokenHash: async () => undefined,
      deleteByTokenHash: async () => {
        // 존재 여부와 무관하게 정상 종료
      },
    },
  });

  await assert.doesNotReject(() => logout({ refreshToken: 'unknown-token' }, deps));
});

// ---- refresh ----

test('refresh는 verifyRefreshToken이 예외를 던지면 ApiError(401, INVALID_REFRESH_TOKEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    verifyRefreshToken: () => {
      throw new Error('jwt expired');
    },
  });

  await assert.rejects(
    () => refresh({ refreshToken: 'expired-token' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_REFRESH_TOKEN');
      return true;
    }
  );
});

test('refresh는 verifyRefreshToken은 성공하지만 저장된 토큰을 찾지 못하면 ApiError(401, INVALID_REFRESH_TOKEN)를 던진다', async () => {
  const deps = buildBaseDeps({
    verifyRefreshToken: () => ({ userId: 'u1' }),
    refreshTokenRepository: {
      create: async () => {},
      findByTokenHash: async () => undefined,
      deleteByTokenHash: async () => {},
    },
  });

  await assert.rejects(
    () => refresh({ refreshToken: 'revoked-token' }, deps),
    (err) => {
      assert.ok(err instanceof ApiError);
      assert.equal(err.statusCode, 401);
      assert.equal(err.code, 'INVALID_REFRESH_TOKEN');
      return true;
    }
  );
});

test('refresh 성공 시 accessToken만 반환하고 새 refreshToken은 발급하지 않는다', async () => {
  const deps = buildBaseDeps({
    verifyRefreshToken: () => ({ userId: 'u1' }),
    refreshTokenRepository: {
      create: async () => {},
      findByTokenHash: async () => ({ id: 'rt1', user_id: 'u1', token_hash: hashToken('valid-refresh-token') }),
      deleteByTokenHash: async () => {},
    },
    signAccessToken: () => 'new-access-token',
  });

  const result = await refresh({ refreshToken: 'valid-refresh-token' }, deps);

  assert.deepEqual(result, { accessToken: 'new-access-token' });
  assert.ok(!('refreshToken' in result));
});
