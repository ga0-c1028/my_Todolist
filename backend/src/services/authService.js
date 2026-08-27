const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const { getEnv } = require('../config/env');
const { pool } = require('../config/db');
const userRepository = require('../repositories/userRepository');
const categoryRepository = require('../repositories/categoryRepository');
const refreshTokenRepository = require('../repositories/refreshTokenRepository');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashToken } = require('../utils/hashToken');

const defaultDeps = {
  userRepository,
  categoryRepository,
  refreshTokenRepository,
  pool,
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
};

async function signup({ email, password, name }, deps = defaultDeps) {
  const existing = await deps.userRepository.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'EMAIL_ALREADY_EXISTS', '이미 가입된 이메일입니다.');
  }

  const passwordHash = await deps.hashPassword(password);

  const client = await deps.pool.connect();
  try {
    await client.query('BEGIN');
    const user = await deps.userRepository.create({ email, passwordHash, name }, client);
    await deps.categoryRepository.createDefaultCategory(user.id, client);
    await client.query('COMMIT');
    console.log('[auth] signup 성공:', email);
    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

const DURATION_UNIT_MS = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

function refreshTokenExpiresAt() {
  const raw = getEnv().jwtRefreshExpiresIn;
  const match = /^(\d+)([smhd])$/.exec(raw);
  const ms = match ? Number(match[1]) * DURATION_UNIT_MS[match[2]] : Number(raw) * 1000;
  return new Date(Date.now() + ms);
}

async function login({ email, password }, deps = defaultDeps) {
  const user = await deps.userRepository.findByEmail(email);
  if (!user || !(await deps.verifyPassword(password, user.password_hash))) {
    console.log('[auth] login 실패:', email);
    throw new ApiError(401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  const accessToken = deps.signAccessToken({ sub: user.id });
  const refreshToken = deps.signRefreshToken({ sub: user.id, jti: crypto.randomUUID() });

  const expiresAt = refreshTokenExpiresAt();

  await deps.refreshTokenRepository.create({
    userId: user.id,
    tokenHash: deps.hashToken(refreshToken),
    expiresAt,
  });

  console.log('[auth] login 성공:', email);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    accessToken,
    refreshToken,
  };
}

async function logout({ refreshToken }, deps = defaultDeps) {
  await deps.refreshTokenRepository.deleteByTokenHash(deps.hashToken(refreshToken));
  console.log('[auth] logout 처리 완료');
}

async function refresh({ refreshToken }, deps = defaultDeps) {
  let payload;
  try {
    payload = deps.verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않거나 만료된 토큰입니다.');
  }

  const row = await deps.refreshTokenRepository.findByTokenHash(deps.hashToken(refreshToken));
  if (!row) {
    throw new ApiError(401, 'INVALID_REFRESH_TOKEN', '유효하지 않거나 만료된 토큰입니다.');
  }

  const accessToken = deps.signAccessToken({ sub: payload.sub });
  console.log('[auth] access token 재발급:', payload.sub);

  return { accessToken };
}

module.exports = { signup, login, logout, refresh };
