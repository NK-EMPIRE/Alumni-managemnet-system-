const { Router } = require('express');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const teamRoutes = require('./team.routes');
const alumniRoutes = require('./alumni.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const uploadRoutes = require('./upload.routes');
const assignmentRoutes = require('./assignment.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/alumni', alumniRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/upload', uploadRoutes);
router.use('/assignments', assignmentRoutes);

module.exports = router;