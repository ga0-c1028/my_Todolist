const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { validateUpdateUser } = require('../schemas/userSchemas');
const controller = require('../controllers/userController');

router.patch('/users/me', authenticate, validate(validateUpdateUser), controller.updateMe);

module.exports = router;
