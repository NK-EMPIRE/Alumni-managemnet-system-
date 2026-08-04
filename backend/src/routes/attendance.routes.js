const { Router } = require('express');
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// Admin: full report
router.get('/report', authorize(ROLES.ADMIN), attendanceController.getReport);

// Admin: summary per date
router.get('/summary', authorize(ROLES.ADMIN), attendanceController.getSummary);

// Admin: available dates
router.get('/dates', authorize(ROLES.ADMIN), attendanceController.getAvailableDates);

// Admin: trigger absent marking
router.post('/mark-absent', authorize(ROLES.ADMIN), attendanceController.markAbsent);

// Admin: override a record
router.patch('/:attendanceId', authorize(ROLES.ADMIN), attendanceController.updateRecord);

// Leader/Member: own attendance history
router.get('/my', authorize(ROLES.LEADER, ROLES.MEMBER), attendanceController.getMyAttendance);

module.exports = router;
