const router = require('express').Router();

router.use(require('./health'));
router.use(require('./authRoutes'));
router.use(require('./userRoutes'));
router.use(require('./categoryRoutes'));
router.use(require('./todoRoutes'));

module.exports = router;
