const router = require('express').Router();
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { validateCreateTodo, validateUpdateTodo } = require('../schemas/todoSchemas');
const controller = require('../controllers/todoController');

router.get('/todos', authenticate, controller.list);
router.post('/todos', authenticate, validate(validateCreateTodo), controller.create);
router.get('/todos/:id', authenticate, controller.getOne);
router.patch('/todos/:id', authenticate, validate(validateUpdateTodo), controller.update);
router.delete('/todos/:id', authenticate, controller.remove);

module.exports = router;
