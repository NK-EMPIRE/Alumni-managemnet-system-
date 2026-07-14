const { Router } = require('express');
const roundRobinController = require('../controllers/roundRobin.controller');
const batchRoundRobinController = require('../controllers/batchRoundRobin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.post(
  '/admin-assign',
  authorize(ROLES.ADMIN),
  roundRobinController.adminAssign
);

router.get(
  '/available-count',
  authorize(ROLES.ADMIN),
  roundRobinController.getAvailableCount
);

router.post(
  '/leader-preview',
  authorize(ROLES.LEADER),
  roundRobinController.leaderPreview
);

router.post(
  '/leader-distribute',
  authorize(ROLES.LEADER),
  roundRobinController.leaderDistribute
);

router.post(
  '/reopen/:alumniId',
  authorize(ROLES.ADMIN),
  roundRobinController.reopenAssignment
);

router.get(
  '/undistributed',
  authorize(ROLES.LEADER),
  roundRobinController.getUndistributedAlumni
);

router.get(
  '/undistributed-count',
  authorize(ROLES.LEADER),
  roundRobinController.getUndistributedCount
);

// Batch-wise round-robin routes
router.post(
  '/batch-assign',
  authorize(ROLES.ADMIN),
  batchRoundRobinController.batchWiseAssign
);

router.get(
  '/batch-preview',
  authorize(ROLES.ADMIN),
  batchRoundRobinController.getPreview
);

module.exports = router;