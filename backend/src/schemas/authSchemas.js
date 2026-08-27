const ApiError = require('../utils/ApiError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function validateSignup(body) {
  const { email, password, name } = body || {};

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'VALIDATION_ERROR', '올바른 이메일 형식이 아닙니다.');
  }
  if (!password || !PASSWORD_REGEX.test(password)) {
    throw new ApiError(400, 'VALIDATION_ERROR', '비밀번호는 최소 8자 이상, 영문과 숫자를 포함해야 합니다.');
  }
  if (!name || name.length < 1 || name.length > 30) {
    throw new ApiError(400, 'VALIDATION_ERROR', '이름은 1자 이상 30자 이하이어야 합니다.');
  }
}

function validateLogin(body) {
  const { email, password } = body || {};

  if (!email) {
    throw new ApiError(400, 'VALIDATION_ERROR', '이메일을 입력해주세요.');
  }
  if (!password) {
    throw new ApiError(400, 'VALIDATION_ERROR', '비밀번호를 입력해주세요.');
  }
}

function validateLogout(body) {
  const { refreshToken } = body || {};

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'refreshToken이 필요합니다.');
  }
}

function validateRefresh(body) {
  const { refreshToken } = body || {};

  if (!refreshToken || typeof refreshToken !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'refreshToken이 필요합니다.');
  }
}

module.exports = { validateSignup, validateLogin, validateLogout, validateRefresh };
