const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/jwt');

module.exports = function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', '인증이 필요합니다.'));
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    console.log('[auth] 인증 성공:', payload.sub);
    next();
  } catch (err) {
    next(new ApiError(401, 'UNAUTHORIZED', '인증이 필요합니다.'));
  }
};
