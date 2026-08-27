const router = require('express').Router();
const validate = require('../middlewares/validate');
const { validateSignup, validateLogin, validateLogout, validateRefresh } = require('../schemas/authSchemas');
const controller = require('../controllers/authController');

router.post('/auth/signup', validate(validateSignup), controller.signup);
router.post('/auth/login', validate(validateLogin), controller.login);
router.post('/auth/logout', validate(validateLogout), controller.logout);
router.post('/auth/refresh', validate(validateRefresh), controller.refresh);

module.exports = router;
