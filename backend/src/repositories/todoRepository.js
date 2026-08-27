const { pool } = require('../config/db');

async function create(userId, { categoryId, title, description, startDate, endDate }, db = pool) {
  const result = await db.query(
    'INSERT INTO todos (user_id, category_id, title, description, start_date, end_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [userId, categoryId, title, description ?? null, startDate, endDate]
  );
  return result.rows[0];
}

async function findAllByUser(userId, { categoryId } = {}, db = pool) {
  if (categoryId) {
    const result = await db.query(
      'SELECT * FROM todos WHERE user_id = $1 AND category_id = $2 ORDER BY start_date ASC',
      [userId, categoryId]
    );
    return result.rows;
  }
  const result = await db.query('SELECT * FROM todos WHERE user_id = $1 ORDER BY start_date ASC', [
    userId,
  ]);
  return result.rows;
}

async function findById(id, db = pool) {
  const result = await db.query('SELECT * FROM todos WHERE id = $1', [id]);
  return result.rows[0];
}

async function updateById(
  id,
  { categoryId, title, description, startDate, endDate, isCompleted, completedAt },
  db = pool
) {
  const result = await db.query(
    `UPDATE todos SET category_id=$1, title=$2, description=$3, start_date=$4, end_date=$5, is_completed=$6, completed_at=$7, updated_at=now()
     WHERE id=$8 RETURNING *`,
    [categoryId, title, description ?? null, startDate, endDate, isCompleted, completedAt, id]
  );
  return result.rows[0];
}

async function deleteById(id, db = pool) {
  await db.query('DELETE FROM todos WHERE id = $1', [id]);
}

module.exports = { create, findAllByUser, findById, updateById, deleteById };
