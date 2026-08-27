const ApiError = require('../utils/ApiError');

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ code: err.code, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: '서버 오류가 발생했습니다.' });
};
