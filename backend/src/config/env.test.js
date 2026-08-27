const test = require('node:test');
const assert = require('node:assert/strict');

const ENV_KEYS = [
  'DATABASE_URL',
  'PORT',
  'CORS_ORIGIN',
  'NODE_ENV',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES_IN',
  'JWT_REFRESH_EXPIRES_IN',
];

function backupEnv() {
  const backup = {};
  for (const key of ENV_KEYS) backup[key] = process.env[key];
  return backup;
}

function restoreEnv(backup) {
  for (const key of ENV_KEYS) {
    if (backup[key] === undefined) delete process.env[key];
    else process.env[key] = backup[key];
  }
}

// 기존(BE-01) 테스트들은 JWT_ACCESS_SECRET/JWT_REFRESH_SECRET을 직접 설정하지 않으므로,
// getEnv()가 이제 이 값들도 필수로 요구하는 계약(BE-02)과 호환되도록 파일 스코프 기본값을 주입한다.
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

// env.js는 require 시 dotenv.config()를 호출하지만, module-level 부수효과 없이
// getEnv()는 매 호출마다 process.env를 다시 읽는다는 계약을 검증한다.
const { getEnv } = require('./env');

test('DATABASE_URL이 설정되면 getEnv()가 그 값을 databaseUrl로 반환한다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/mydb';
    const env = getEnv();
    assert.equal(env.databaseUrl, 'postgresql://user:pass@localhost:5432/mydb');
  } finally {
    restoreEnv(backup);
  }
});

test('DATABASE_URL이 없으면 getEnv()가 에러를 던진다', () => {
  const backup = backupEnv();
  try {
    delete process.env.DATABASE_URL;
    assert.throws(() => getEnv(), /DATABASE_URL/);
  } finally {
    restoreEnv(backup);
  }
});

test('PORT 미설정 시 기본값 3000(숫자)을 반환한다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    delete process.env.PORT;
    const env = getEnv();
    assert.equal(env.port, 3000);
    assert.equal(typeof env.port, 'number');
  } finally {
    restoreEnv(backup);
  }
});

test("PORT='4000'(문자열)이면 숫자 4000으로 변환된다", () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.PORT = '4000';
    const env = getEnv();
    assert.equal(env.port, 4000);
    assert.equal(typeof env.port, 'number');
  } finally {
    restoreEnv(backup);
  }
});

test("CORS_ORIGIN 미설정 시 기본값 '*'를 반환한다", () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    delete process.env.CORS_ORIGIN;
    const env = getEnv();
    assert.equal(env.corsOrigin, '*');
  } finally {
    restoreEnv(backup);
  }
});

test('CORS_ORIGIN 설정 시 그 값을 그대로 반환한다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.CORS_ORIGIN = 'https://example.com';
    const env = getEnv();
    assert.equal(env.corsOrigin, 'https://example.com');
  } finally {
    restoreEnv(backup);
  }
});

test("NODE_ENV 미설정 시 기본값 'development'를 반환한다", () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    delete process.env.NODE_ENV;
    const env = getEnv();
    assert.equal(env.nodeEnv, 'development');
  } finally {
    restoreEnv(backup);
  }
});

test('getEnv()는 캐싱하지 않고 매 호출마다 최신 process.env 값을 반영한다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.PORT = '5000';
    const first = getEnv();
    assert.equal(first.port, 5000);

    process.env.PORT = '6000';
    const second = getEnv();
    assert.equal(second.port, 6000);
  } finally {
    restoreEnv(backup);
  }
});

test('JWT_ACCESS_SECRET이 없으면 getEnv()가 에러를 던지고 메시지에 JWT_ACCESS_SECRET이 포함된다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    delete process.env.JWT_ACCESS_SECRET;
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    assert.throws(() => getEnv(), /JWT_ACCESS_SECRET/);
  } finally {
    restoreEnv(backup);
  }
});

test('JWT_REFRESH_SECRET이 없으면 getEnv()가 에러를 던지고 메시지에 JWT_REFRESH_SECRET이 포함된다', () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    delete process.env.JWT_REFRESH_SECRET;
    assert.throws(() => getEnv(), /JWT_REFRESH_SECRET/);
  } finally {
    restoreEnv(backup);
  }
});

test("JWT_ACCESS_EXPIRES_IN 미설정 시 기본값 '30m'을 반환한다", () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    delete process.env.JWT_ACCESS_EXPIRES_IN;
    const env = getEnv();
    assert.equal(env.jwtAccessExpiresIn, '30m');
  } finally {
    restoreEnv(backup);
  }
});

test("JWT_REFRESH_EXPIRES_IN 미설정 시 기본값 '14d'를 반환한다", () => {
  const backup = backupEnv();
  try {
    process.env.DATABASE_URL = 'postgresql://localhost/db';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    delete process.env.JWT_REFRESH_EXPIRES_IN;
    const env = getEnv();
    assert.equal(env.jwtRefreshExpiresIn, '14d');
  } finally {
    restoreEnv(backup);
  }
});
