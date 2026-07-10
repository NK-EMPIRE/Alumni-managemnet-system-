const { sql, getPool } = require('../config/database');

async function getAdminStats() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Alumni) AS total_alumni,
      (SELECT COUNT(*) FROM Users u INNER JOIN Roles r ON u.role_id = r.role_id WHERE r.role_name = 'LEADER') AS total_leaders,
      (SELECT COUNT(*) FROM Users u INNER JOIN Roles r ON u.role_id = r.role_id WHERE r.role_name = 'MEMBER') AS total_members,
      (SELECT COUNT(*) FROM Teams) AS total_teams,
      (SELECT COUNT(*) FROM AlumniAssignments WHERE status = 'Pending') AS pending_assignments,
      (SELECT COUNT(*) FROM AlumniAssignments WHERE status = 'Completed') AS completed_assignments,
      (SELECT COUNT(*) FROM AlumniAssignments WHERE status = 'Draft') AS draft_assignments
  `);
  return result.recordset[0];
}

async function getDepartmentProgress() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      a.department,
      COUNT(*) AS total,
      SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed
    FROM Alumni a
    LEFT JOIN AlumniAssignments aa ON a.alumni_id = aa.alumni_id
    GROUP BY a.department
  `);
  return result.recordset;
}

async function getBatchProgress() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      a.batch,
      COUNT(*) AS total,
      SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed
    FROM Alumni a
    LEFT JOIN AlumniAssignments aa ON a.alumni_id = aa.alumni_id
    GROUP BY a.batch
  `);
  return result.recordset;
}

async function getLeaderRankings(limit) {
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        u.user_id,
        u.first_name,
        u.last_name,
        COUNT(aa.assignment_id) AS total_assigned,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        ROUND(
          CAST(SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS FLOAT) /
          NULLIF(COUNT(aa.assignment_id), 0) * 100,
          2
        ) AS completion_percentage
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      INNER JOIN Teams t ON u.user_id = t.leader_id
      INNER JOIN AlumniAssignments aa ON t.team_id = aa.team_id
      WHERE r.role_name = 'LEADER'
      GROUP BY u.user_id, u.first_name, u.last_name
      ORDER BY completion_percentage DESC
    `);
  return result.recordset;
}

async function getRecentActivities(limit) {
  const pool = await getPool();
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit) activity_id, user_id, activity_type, description, created_at
      FROM ActivityLogs
      ORDER BY created_at DESC
    `);
  return result.recordset;
}

async function getAssignmentTrend(days) {
  const pool = await getPool();
  const result = await pool.request()
    .input('days', sql.Int, days)
    .query(`
      SELECT CAST(assigned_date AS DATE) AS date, COUNT(*) AS count
      FROM AlumniAssignments
      WHERE assigned_date >= DATEADD(DAY, -@days, GETDATE())
      GROUP BY CAST(assigned_date AS DATE)
      ORDER BY date
    `);
  return result.recordset;
}

async function getLeaderStats(leaderId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query(`
      SELECT
        COUNT(aa.assignment_id) AS total_assigned,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN aa.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN aa.status = 'Draft' THEN 1 ELSE 0 END) AS draft,
        (SELECT COUNT(*) FROM TeamMembers tm INNER JOIN Teams t2 ON tm.team_id = t2.team_id WHERE t2.leader_id = @leaderId) AS member_count
      FROM Teams t
      INNER JOIN AlumniAssignments aa ON t.team_id = aa.team_id
      WHERE t.leader_id = @leaderId
    `);
  return result.recordset[0];
}

async function getTeamMemberStats(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email,
        COUNT(aa.assignment_id) AS total_assigned,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN aa.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN aa.status = 'Draft' THEN 1 ELSE 0 END) AS draft
      FROM TeamMembers tm
      INNER JOIN Users u ON tm.user_id = u.user_id
      LEFT JOIN AlumniAssignments aa ON tm.user_id = aa.member_id AND tm.team_id = aa.team_id
      WHERE tm.team_id = @teamId
      GROUP BY u.user_id, u.first_name, u.last_name, u.email
    `);
  return result.recordset;
}

async function getMemberStats(memberId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('memberId', sql.Int, memberId)
    .query(`
      SELECT
        COUNT(aa.assignment_id) AS total_assigned,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN aa.status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN aa.status = 'Draft' THEN 1 ELSE 0 END) AS draft,
        SUM(CASE WHEN CAST(aa.assigned_date AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS today_updates
      FROM Users u
      INNER JOIN TeamMembers tm ON u.user_id = tm.user_id
      INNER JOIN Teams t ON tm.team_id = t.team_id
      INNER JOIN AlumniAssignments aa ON t.team_id = aa.team_id
      WHERE u.user_id = @memberId
    `);
  return result.recordset[0];
}

module.exports = {
  getAdminStats,
  getDepartmentProgress,
  getBatchProgress,
  getLeaderRankings,
  getRecentActivities,
  getAssignmentTrend,
  getLeaderStats,
  getMemberStats,
  getTeamMemberStats
};
