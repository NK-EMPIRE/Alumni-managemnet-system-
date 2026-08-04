const { Router } = require('express');
const { getPool } = require('../config/database');
const authenticate = require('../middleware/authenticate');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const teamRoutes = require('./team.routes');
const alumniRoutes = require('./alumni.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportRoutes = require('./report.routes');
const uploadRoutes = require('./upload.routes');
const assignmentRoutes = require('./assignment.routes');
const auditRoutes = require('./audit.routes');
const settingsRoutes = require('./settings.routes');
const reassignRoutes = require('./reassign.routes');
const healthRoutes = require('./health.routes');

const taskRoutes = require('./task.routes');
const emailCampaignRoutes = require('./emailCampaign.routes');
const chatRoutes = require('./chat.routes');
const notificationRoutes = require('./notification.routes');
const attendanceRoutes = require('./attendance.routes');
const alumniCategoryRoutes = require('./alumniCategory.routes');


const router = Router();

router.get('/health/db', async function (req, res) {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ success: true, message: 'Database connection is healthy' });
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database connection failed' });
  }
});

router.post('/backup', authenticate, async function (req, res) {
  res.status(501).json({ success: false, message: 'Backup feature is not yet implemented' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/alumni', alumniRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/upload', uploadRoutes);
router.use('/import', uploadRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/assignments/reassign', reassignRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/settings', settingsRoutes);
router.use('/health', healthRoutes);
router.use('/tasks', taskRoutes);
router.use('/email-campaigns', emailCampaignRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/alumni-category', alumniCategoryRoutes);

module.exports = router;