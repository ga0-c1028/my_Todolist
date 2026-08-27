const ApiError = require('../utils/ApiError');

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validateUpdateUser(body) {
  const { name, password } = body || {};

  if (name === undefined && password === undefined) {
    throw new ApiError(400, 'VALIDATION_ERROR', '수정할 항목(name 또는 password)이 필요합니다.');
  }
  if (name !== undefined && (typeof name !== 'string' || name.length < 1 || name.length > 30)) {
    throw new ApiError(400, 'VALIDATION_ERROR', '이름은 1자 이상 30자 이하이어야 합니다.');
  }
  if (password !== undefined && !PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, 'VALIDATION_ERROR', '비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.');
  }
}

module.exports = { validateUpdateUser };
