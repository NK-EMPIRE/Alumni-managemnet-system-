const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const { getPool, sql } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const router = Router();

router.get('/my-tasks', authenticate, asyncHandler(async (req, res) => {
  const pool = await getPool();
  const userId = req.user.userId;
  const role = req.user.role;

  // Get user's assigned alumni count & status breakdown
  let pendingCount = 0;
  let draftCount = 0;
  let reopenedCount = 0;
  let completedCount = 0;

  if (role === 'MEMBER') {
    const resCount = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN status = 'Reopened' THEN 1 ELSE 0 END) AS reopened,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
        FROM AlumniAssignments
        WHERE member_id = @userId
      `);
    const r = resCount.recordset[0] || {};
    pendingCount = r.pending || 0;
    draftCount = r.draft || 0;
    reopenedCount = r.reopened || 0;
    completedCount = r.completed || 0;
  } else if (role === 'LEADER') {
    const resCount = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          SUM(CASE WHEN aa.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN aa.status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN aa.status = 'Reopened' THEN 1 ELSE 0 END) AS reopened,
          SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed
        FROM AlumniAssignments aa
        INNER JOIN Teams t ON aa.team_id = t.team_id
        WHERE t.leader_id = @userId
      `);
    const r = resCount.recordset[0] || {};
    pendingCount = r.pending || 0;
    draftCount = r.draft || 0;
    reopenedCount = r.reopened || 0;
    completedCount = r.completed || 0;
  } else {
    const resCount = await pool.request()
      .query(`
        SELECT 
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
          SUM(CASE WHEN status = 'Reopened' THEN 1 ELSE 0 END) AS reopened,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
        FROM AlumniAssignments
      `);
    const r = resCount.recordset[0] || {};
    pendingCount = r.pending || 0;
    draftCount = r.draft || 0;
    reopenedCount = r.reopened || 0;
    completedCount = r.completed || 0;
  }

  const tasks = [];

  if (reopenedCount > 0) {
    tasks.push({
      id: 'task-reopened',
      title: `Update ${reopenedCount} Reopened record(s)`,
      desc: 'Admin has returned these record(s) for update.',
      count: reopenedCount,
      completed: false,
      priority: 'high'
    });
  }

  if (draftCount > 0) {
    tasks.push({
      id: 'task-drafts',
      title: `Finalize and submit ${draftCount} Draft record(s)`,
      desc: 'Review saved drafts and submit final professional information.',
      count: draftCount,
      completed: false,
      priority: 'medium'
    });
  }

  if (pendingCount > 0) {
    tasks.push({
      id: 'task-pending',
      title: `Verify & update ${pendingCount} Pending assignment(s)`,
      desc: 'Fill in missing details (father name, email, phone, company, LinkedIn).',
      count: pendingCount,
      completed: false,
      priority: 'normal'
    });
  }

  if (tasks.length === 0 && completedCount > 0) {
    tasks.push({
      id: 'task-all-done',
      title: `All assigned alumni records completed! 🎉`,
      desc: `Great job! You have successfully completed all ${completedCount} assigned record(s).`,
      count: 0,
      completed: true,
      priority: 'low'
    });
  }

  const contextText = tasks.length > 0 && !tasks[0].completed
    ? `You have ${reopenedCount + pendingCount + draftCount} active records requiring attention. Focus on ${tasks[0].title} first.`
    : `Excellent work! All assigned tasks are currently up-to-date. Have a productive day! 🚀`;

  success(res, {
    contextText,
    summary: { pending: pendingCount, draft: draftCount, reopened: reopenedCount, completed: completedCount },
    tasks
  }, 'Work tasks retrieved successfully');
}));

module.exports = router;
