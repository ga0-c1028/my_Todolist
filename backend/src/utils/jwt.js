const jwt = require('jsonwebtoken');
const { getEnv } = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, getEnv().jwtAccessSecret, { expiresIn: getEnv().jwtAccessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, getEnv().jwtRefreshSecret, { expiresIn: getEnv().jwtRefreshExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getEnv().jwtAccessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, getEnv().jwtRefreshSecret);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
