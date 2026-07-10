const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get(
  '/admin',
  authorize(ROLES.ADMIN),
  dashboardController.getAdminDashboard
);

router.get(
  '/leader',
  authorize(ROLES.LEADER),
  dashboardController.getLeaderDashboard
);

router.get(
  '/member',
  authorize(ROLES.MEMBER),
  dashboardController.getMemberDashboard
);

router.get(
  '/stats',
  authorize(ROLES.ADMIN),
  dashboardController.getAdminStats
);

router.get(
  '/department-progress',
  authorize(ROLES.ADMIN),
  dashboardController.getDepartmentProgress
);

router.get(
  '/batch-progress',
  authorize(ROLES.ADMIN),
  dashboardController.getBatchProgress
);

router.get(
  '/leader-rankings',
  authorize(ROLES.ADMIN),
  dashboardController.getLeaderRankings
);

router.get(
  '/recent-activities',
  authorize(ROLES.ADMIN),
  dashboardController.getRecentActivities
);

router.get(
  '/assignment-trend',
  authorize(ROLES.ADMIN),
  dashboardController.getAssignmentTrend
);

router.get(
  '/my-stats',
  authorize(ROLES.LEADER, ROLES.MEMBER),
  dashboardController.getMyStats
);

module.exports = router;