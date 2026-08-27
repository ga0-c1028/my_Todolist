const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { validateCreateCategory, validateUpdateCategory } = require('../schemas/categorySchemas');
const controller = require('../controllers/categoryController');

router.get('/categories', authenticate, controller.list);
router.post('/categories', authenticate, validate(validateCreateCategory), controller.create);
router.patch('/categories/:id', authenticate, validate(validateUpdateCategory), controller.update);
router.delete('/categories/:id', authenticate, controller.remove);

module.exports = router;
