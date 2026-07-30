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
      ORDER BY ROUND(
        CAST(SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS FLOAT) /
        NULLIF(COUNT(aa.assignment_id), 0) * 100,
        2
      ) DESC
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
        SUM(CASE WHEN aa.status = 'ASSIGNED_TO_LEADER' THEN 1 ELSE 0 END) AS undistributed_count,
        SUM(CASE WHEN aa.status NOT IN ('ASSIGNED_TO_LEADER') THEN 1 ELSE 0 END) AS distributed_count,
        (SELECT COUNT(*) FROM TeamMembers tm INNER JOIN Teams t2 ON tm.team_id = t2.team_id WHERE t2.leader_id = @leaderId) AS member_count
      FROM Teams t
      INNER JOIN AlumniAssignments aa ON t.team_id = aa.team_id
      WHERE t.leader_id = @leaderId
      GROUP BY t.team_id
    `);
  return result.recordset[0] || {
    total_assigned: 0,
    completed: 0,
    pending: 0,
    draft: 0,
    undistributed_count: 0,
    distributed_count: 0,
    member_count: 0
  };
}

async function getTeamMemberStats(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email,
        ISNULL(aa.total_assigned, 0) AS total_assigned,
        ISNULL(aa.completed, 0) AS completed,
        ISNULL(aa.pending, 0) AS pending,
        ISNULL(aa.draft, 0) AS draft,
        0 AS is_leader
      FROM TeamMembers tm
      INNER JOIN Users u ON tm.user_id = u.user_id
      LEFT JOIN (
        SELECT 
          member_id,
          COUNT(assignment_id) AS total_assigned,
          SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
          SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft
        FROM AlumniAssignments
        WHERE team_id = @teamId AND member_id IS NOT NULL
        GROUP BY member_id
      ) aa ON tm.user_id = aa.member_id
      WHERE tm.team_id = @teamId

      UNION ALL

      SELECT
        u.user_id, u.first_name, u.last_name, u.email,
        (SELECT COUNT(*) FROM AlumniAssignments WHERE team_id = @teamId AND member_id = t.leader_id) AS total_assigned,
        (SELECT COUNT(*) FROM AlumniAssignments WHERE team_id = @teamId AND member_id = t.leader_id AND status = 'Completed') AS completed,
        (SELECT COUNT(*) FROM AlumniAssignments WHERE team_id = @teamId AND member_id = t.leader_id AND status = 'Pending') AS pending,
        (SELECT COUNT(*) FROM AlumniAssignments WHERE team_id = @teamId AND member_id = t.leader_id AND status = 'Draft') AS draft,
        1 AS is_leader
      FROM Teams t
      INNER JOIN Users u ON t.leader_id = u.user_id
      WHERE t.team_id = @teamId
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
        SUM(CASE WHEN aa.member_id = @memberId AND (CAST(aa.completed_date AS DATE) = CAST(GETDATE() AS DATE) OR (aa.status = 'Completed' AND CAST(a.updated_date AS DATE) = CAST(GETDATE() AS DATE))) THEN 1 ELSE 0 END) AS today_updates,
        MAX(l.first_name + ' ' + l.last_name) AS leader_name
      FROM Users u
      INNER JOIN TeamMembers tm ON u.user_id = tm.user_id
      INNER JOIN Teams t ON tm.team_id = t.team_id
      INNER JOIN Users l ON t.leader_id = l.user_id
      LEFT JOIN AlumniAssignments aa ON t.team_id = aa.team_id AND aa.member_id = @memberId
      LEFT JOIN Alumni a ON aa.alumni_id = a.alumni_id
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
