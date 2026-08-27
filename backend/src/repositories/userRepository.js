const { pool } = require('../config/db');

async function findByEmail(email, db = pool) {
  const result = await db.query(
    'SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function create({ email, passwordHash, name }, db = pool) {
  const result = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1,$2,$3) RETURNING id, email, name, created_at, updated_at',
    [email, passwordHash, name]
  );
  return result.rows[0];
}

async function findById(id, db = pool) {
  const result = await db.query(
    'SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function updateById(id, { name, passwordHash }, db = pool) {
  const result = await db.query(
    `UPDATE users SET name = COALESCE($1::varchar, name), password_hash = COALESCE($2::varchar, password_hash), updated_at = now()
     WHERE id = $3 RETURNING id, email, name, created_at, updated_at`,
    [name ?? null, passwordHash ?? null, id]
  );
  return result.rows[0];
}

module.exports = { findByEmail, create, findById, updateById };
