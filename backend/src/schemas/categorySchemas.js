const ApiError = require('../utils/ApiError');

function validateName(name) {
  if (typeof name !== 'string' || name.length < 1 || name.length > 20) {
    throw new ApiError(400, 'VALIDATION_ERROR', '카테고리 이름은 1자 이상 20자 이하여야 합니다.');
  }
}

function validateCreateCategory(body) {
  validateName(body.name);
}

function validateUpdateCategory(body) {
  validateName(body.name);
}

module.exports = { validateCreateCategory, validateUpdateCategory };
