const ApiError = require('../utils/ApiError');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function fail(message) {
  throw new ApiError(400, 'VALIDATION_ERROR', message);
}

function validateTitle(title) {
  if (typeof title !== 'string' || title.length < 1 || title.length > 100) {
    fail('제목은 1자 이상 100자 이하여야 합니다.');
  }
}

function validateDate(value, label) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) {
    fail(`${label}는 YYYY-MM-DD 형식이어야 합니다.`);
  }
}

function validateDescription(description) {
  if (typeof description !== 'string' || description.length > 1000) {
    fail('설명은 1000자 이하 문자열이어야 합니다.');
  }
}

function validateCategoryId(categoryId) {
  if (typeof categoryId !== 'string') {
    fail('categoryId는 문자열이어야 합니다.');
  }
}

function validateIsCompleted(isCompleted) {
  if (typeof isCompleted !== 'boolean') {
    fail('isCompleted는 boolean이어야 합니다.');
  }
}

function validateCreateTodo(body) {
  validateTitle(body.title);
  validateDate(body.startDate, '시작일자');
  validateDate(body.endDate, '종료일자');
  if (body.description !== undefined) validateDescription(body.description);
  if (body.categoryId !== undefined) validateCategoryId(body.categoryId);
}

function validateUpdateTodo(body) {
  const fields = ['title', 'description', 'categoryId', 'startDate', 'endDate', 'isCompleted'];
  if (!fields.some((f) => body[f] !== undefined)) {
    fail('수정할 항목을 하나 이상 입력해야 합니다.');
  }
  if (body.title !== undefined) validateTitle(body.title);
  if (body.description !== undefined) validateDescription(body.description);
  if (body.categoryId !== undefined) validateCategoryId(body.categoryId);
  if (body.startDate !== undefined) validateDate(body.startDate, '시작일자');
  if (body.endDate !== undefined) validateDate(body.endDate, '종료일자');
  if (body.isCompleted !== undefined) validateIsCompleted(body.isCompleted);
}

module.exports = { validateCreateTodo, validateUpdateTodo };
