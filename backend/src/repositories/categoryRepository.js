const { pool } = require('../config/db');

async function createDefaultCategory(userId, db = pool) {
  const result = await db.query(
    "INSERT INTO categories (user_id, name, is_default) VALUES ($1, '기본', true) RETURNING id, user_id, name, is_default",
    [userId]
  );
  return result.rows[0];
}

async function findAllByUser(userId, db = pool) {
  const result = await db.query(
    'SELECT id, user_id, name, is_default FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
    [userId]
  );
  return result.rows;
}

async function findById(id, db = pool) {
  const result = await db.query(
    'SELECT id, user_id, name, is_default FROM categories WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function findByUserAndName(userId, name, db = pool) {
  const result = await db.query(
    'SELECT id, user_id, name, is_default FROM categories WHERE user_id = $1 AND name = $2',
    [userId, name]
  );
  return result.rows[0];
}

async function findDefaultByUser(userId, db = pool) {
  const result = await db.query(
    'SELECT id, user_id, name, is_default FROM categories WHERE user_id = $1 AND is_default = true',
    [userId]
  );
  return result.rows[0];
}

async function create(userId, name, db = pool) {
  const result = await db.query(
    'INSERT INTO categories (user_id, name, is_default) VALUES ($1, $2, false) RETURNING id, user_id, name, is_default',
    [userId, name]
  );
  return result.rows[0];
}

async function updateName(id, name, db = pool) {
  const result = await db.query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, user_id, name, is_default',
    [name, id]
  );
  return result.rows[0];
}

async function deleteById(id, db = pool) {
  await db.query('DELETE FROM categories WHERE id = $1', [id]);
}

async function reassignTodos(fromCategoryId, toCategoryId, db = pool) {
  await db.query('UPDATE todos SET category_id = $1 WHERE category_id = $2', [
    toCategoryId,
    fromCategoryId,
  ]);
}

module.exports = {
  createDefaultCategory,
  findAllByUser,
  findById,
  findByUserAndName,
  findDefaultByUser,
  create,
  updateName,
  deleteById,
  reassignTodos,
};
