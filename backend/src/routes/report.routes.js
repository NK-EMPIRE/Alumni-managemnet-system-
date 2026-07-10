const { Router } = require('express');
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMIN),
  reportController.getReports
);

router.get(
  '/schedules',
  authorize(ROLES.ADMIN),
  reportController.getSchedules
);

router.get(
  '/:reportId',
  authorize(ROLES.ADMIN),
  reportController.getReportById
);

router.post(
  '/generate',
  authorize(ROLES.ADMIN),
  reportController.generateReport
);

router.post(
  '/schedules',
  authorize(ROLES.ADMIN),
  reportController.createSchedule
);

router.get(
  '/:reportId/download',
  authorize(ROLES.ADMIN),
  reportController.downloadReport
);

router.delete(
  '/:reportId',
  authorize(ROLES.ADMIN),
  reportController.deleteReport
);

router.delete(
  '/schedules/:scheduleId',
  authorize(ROLES.ADMIN),
  reportController.deleteSchedule
);

module.exports = router;