const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');
const { getAuditLogs } = require('../controllers/audit.controller');

const router = Router();

router.get('/', authenticate, authorize(ROLES.ADMIN), getAuditLogs);

module.exports = router;
