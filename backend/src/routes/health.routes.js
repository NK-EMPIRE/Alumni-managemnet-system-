const { Router } = require('express');
const healthController = require('../controllers/health.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

router.get('/db-summary', authorize(ROLES.ADMIN), healthController.getDbSummary);
router.get('/db-detail', authorize(ROLES.ADMIN), healthController.getDbDetail);
router.post('/notify', authorize(ROLES.ADMIN), healthController.notifyAssignee);

module.exports = router;
