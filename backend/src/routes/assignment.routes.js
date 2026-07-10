const { Router } = require('express');
const roundRobinController = require('../controllers/roundRobin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get(
  '/history',
  authorize(ROLES.ADMIN),
  roundRobinController.getAssignmentHistory
);

router.post(
  '/:teamId/assign',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  roundRobinController.assignAlumni
);

module.exports = router;