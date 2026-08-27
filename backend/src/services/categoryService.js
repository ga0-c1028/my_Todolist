const ApiError = require('../utils/ApiError');
const { pool } = require('../config/db');
const categoryRepository = require('../repositories/categoryRepository');

const defaultDeps = { categoryRepository, pool };

function toResponse(row) {
  return { id: row.id, userId: row.user_id, name: row.name, isDefault: row.is_default };
}

async function list(userId, deps = defaultDeps) {
  const rows = await deps.categoryRepository.findAllByUser(userId);
  return rows.map(toResponse);
}

async function create(userId, name, deps = defaultDeps) {
  const existing = await deps.categoryRepository.findByUserAndName(userId, name);
  if (existing) {
    throw new ApiError(409, 'CATEGORY_NAME_ALREADY_EXISTS', '이미 존재하는 카테고리 이름입니다.');
  }

  const category = await deps.categoryRepository.create(userId, name);
  console.log('[category] 생성:', userId, name);
  return toResponse(category);
}

async function assertOwnedAndMutable(userId, categoryId, deps, immutableMessage) {
  const category = await deps.categoryRepository.findById(categoryId);
  if (!category) {
    throw new ApiError(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다.');
  }
  if (category.user_id !== userId) {
    throw new ApiError(403, 'FORBIDDEN', '본인 소유의 리소스만 접근할 수 있습니다.');
  }
  if (category.is_default) {
    throw new ApiError(400, 'DEFAULT_CATEGORY_IMMUTABLE', immutableMessage);
  }
  return category;
}

async function update(userId, categoryId, name, deps = defaultDeps) {
  await assertOwnedAndMutable(userId, categoryId, deps, '기본 카테고리는 수정할 수 없습니다.');

  const duplicate = await deps.categoryRepository.findByUserAndName(userId, name);
  if (duplicate && duplicate.id !== categoryId) {
    throw new ApiError(409, 'CATEGORY_NAME_ALREADY_EXISTS', '이미 존재하는 카테고리 이름입니다.');
  }

  const category = await deps.categoryRepository.updateName(categoryId, name);
  console.log('[category] 수정:', categoryId);
  return toResponse(category);
}

async function remove(userId, categoryId, deps = defaultDeps) {
  await assertOwnedAndMutable(userId, categoryId, deps, '기본 카테고리는 삭제할 수 없습니다.');

  const client = await deps.pool.connect();
  try {
    await client.query('BEGIN');
    const defaultCategory = await deps.categoryRepository.findDefaultByUser(userId, client);
    await deps.categoryRepository.reassignTodos(categoryId, defaultCategory.id, client);
    await deps.categoryRepository.deleteById(categoryId, client);
    await client.query('COMMIT');
    console.log('[category] 삭제:', categoryId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { list, create, update, remove, defaultDeps };
