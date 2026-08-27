const authService = require('../services/authService');

async function signup(req, res, next) {
  try {
    const user = await authService.signup(req.body);
    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await authService.logout(req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refresh(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, logout, refresh };
