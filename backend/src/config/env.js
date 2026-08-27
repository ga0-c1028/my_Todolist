require('dotenv').config();

function getEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  if (!jwtAccessSecret) {
    throw new Error('Missing required environment variable: JWT_ACCESS_SECRET');
  }

  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error('Missing required environment variable: JWT_REFRESH_SECRET');
  }

  return {
    databaseUrl,
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtAccessSecret,
    jwtRefreshSecret,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '30m',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '14d',
  };
}

module.exports = { getEnv };
