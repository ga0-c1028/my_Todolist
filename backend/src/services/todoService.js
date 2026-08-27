const ApiError = require('../utils/ApiError');
const todoRepository = require('../repositories/todoRepository');
const categoryRepository = require('../repositories/categoryRepository');
const { getTodoStatus, toDateOnly } = require('../utils/todoStatus');

const defaultDeps = { todoRepository, categoryRepository };

function toDto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    startDate: toDateOnly(row.start_date),
    endDate: toDateOnly(row.end_date),
    isCompleted: row.is_completed,
    completedAt: row.completed_at,
    status: getTodoStatus(row.start_date, row.end_date, row.is_completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function assertValidDateRange(startDate, endDate) {
  if (endDate < startDate) {
    throw new ApiError(400, 'INVALID_DATE_RANGE', '종료일자는 시작일자보다 빠를 수 없습니다.');
  }
}

async function resolveCategoryId(userId, categoryId, deps) {
  if (!categoryId) {
    const defaultCategory = await deps.categoryRepository.findDefaultByUser(userId);
    return defaultCategory.id;
  }
  const category = await deps.categoryRepository.findById(categoryId);
  if (!category || category.user_id !== userId) {
    throw new ApiError(403, 'FORBIDDEN', '본인 소유의 리소스만 접근할 수 있습니다.');
  }
  return categoryId;
}

async function create(userId, { categoryId, title, description, startDate, endDate }, deps = defaultDeps) {
  assertValidDateRange(startDate, endDate);
  const resolvedCategoryId = await resolveCategoryId(userId, categoryId, deps);
  const todo = await deps.todoRepository.create(userId, {
    categoryId: resolvedCategoryId,
    title,
    description,
    startDate,
    endDate,
  });
  console.log('[todo] 생성:', userId, todo.id);
  return toDto(todo);
}

async function list(userId, { categoryId, status }, deps = defaultDeps) {
  const rows = await deps.todoRepository.findAllByUser(userId, { categoryId });
  let dtos = rows.map(toDto);
  if (status) dtos = dtos.filter((t) => t.status === status);
  return dtos;
}

async function assertOwned(userId, todoId, deps) {
  const todo = await deps.todoRepository.findById(todoId);
  if (!todo) {
    throw new ApiError(404, 'NOT_FOUND', '리소스를 찾을 수 없습니다.');
  }
  if (todo.user_id !== userId) {
    throw new ApiError(403, 'FORBIDDEN', '본인 소유의 리소스만 접근할 수 있습니다.');
  }
  return todo;
}

async function getOne(userId, todoId, deps = defaultDeps) {
  const todo = await assertOwned(userId, todoId, deps);
  return toDto(todo);
}

async function update(userId, todoId, patch, deps = defaultDeps) {
  const existing = await assertOwned(userId, todoId, deps);

  const title = patch.title ?? existing.title;
  const description = patch.description !== undefined ? patch.description : existing.description;
  const startDate = patch.startDate ?? toDateOnly(existing.start_date);
  const endDate = patch.endDate ?? toDateOnly(existing.end_date);
  const categoryId =
    patch.categoryId !== undefined
      ? await resolveCategoryId(userId, patch.categoryId, deps)
      : existing.category_id;
  const isCompleted = patch.isCompleted !== undefined ? patch.isCompleted : existing.is_completed;

  assertValidDateRange(startDate, endDate);

  let completedAt;
  if (isCompleted && !existing.is_completed) {
    completedAt = new Date();
  } else if (isCompleted && existing.is_completed) {
    completedAt = existing.completed_at;
  } else {
    completedAt = null;
  }

  const updated = await deps.todoRepository.updateById(todoId, {
    categoryId,
    title,
    description,
    startDate,
    endDate,
    isCompleted,
    completedAt,
  });
  console.log('[todo] 수정:', todoId);
  return toDto(updated);
}

async function remove(userId, todoId, deps = defaultDeps) {
  await assertOwned(userId, todoId, deps);
  await deps.todoRepository.deleteById(todoId);
  console.log('[todo] 삭제:', todoId);
}

module.exports = { create, list, getOne, update, remove, defaultDeps };
