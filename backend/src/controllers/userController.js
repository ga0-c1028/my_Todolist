const userService = require('../services/userService');

async function updateMe(req, res, next) {
  try {
    const user = await userService.updateMe(req.user.id, req.body);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { updateMe };
