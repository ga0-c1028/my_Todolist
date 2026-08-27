const { pool } = require('../config/db');

async function create({ userId, tokenHash, expiresAt }, db = pool) {
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, tokenHash, expiresAt]
  );
}

async function findByTokenHash(tokenHash, db = pool) {
  const result = await db.query('SELECT * FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  return result.rows[0];
}

async function deleteByTokenHash(tokenHash, db = pool) {
  await db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
}

module.exports = { create, findByTokenHash, deleteByTokenHash };
