const { sql, getPool } = require('../config/database');

async function findAll({ page, limit, offset, search }) {
  const pool = await getPool();
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  let whereClause = '';
  if (search) {
    whereClause = 'WHERE t.team_name LIKE @search';
    request.input('search', sql.NVarChar(100), `%${search}%`);
  }

  const countResult = await pool.request()
    .input('search', sql.NVarChar(100), search ? `%${search}%` : null)
    .query(`
      SELECT COUNT(*) AS total
      FROM Teams t
      ${search ? 'WHERE t.team_name LIKE @search' : ''}
    `);
  const total = countResult.recordset[0].total;

  const result = await request.query(`
    SELECT
      t.team_id, t.team_name, t.leader_id, t.is_active,
      t.distribution_locked, t.created_at, t.updated_at,
      RTRIM(CONCAT(u.first_name, ' ', u.last_name)) AS leader_name,
      (SELECT COUNT(*) FROM TeamMembers tm WHERE tm.team_id = t.team_id) AS member_count
    FROM Teams t
    INNER JOIN Users u ON t.leader_id = u.user_id
    ${whereClause}
    ORDER BY t.created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  return { teams: result.recordset, total };
}

async function findById(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT
        t.team_id, t.team_name, t.leader_id, t.is_active,
        t.distribution_locked, t.created_at, t.updated_at,
        RTRIM(CONCAT(u.first_name, ' ', u.last_name)) AS leader_name
      FROM Teams t
      INNER JOIN Users u ON t.leader_id = u.user_id
      WHERE t.team_id = @teamId
    `);
  return result.recordset[0];
}

async function create({ teamName, leaderId }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamName', sql.NVarChar(100), teamName)
    .input('leaderId', sql.Int, leaderId)
    .query(`
      INSERT INTO Teams (team_name, leader_id)
      OUTPUT INSERTED.*
      VALUES (@teamName, @leaderId)
    `);
  return result.recordset[0];
}

async function update(teamId, fields) {
  const pool = await getPool();
  const request = pool.request().input('teamId', sql.Int, teamId);

  const setClauses = [];
  const fieldMap = {
    teamName: 'team_name',
    team_name: 'team_name',
    leaderId: 'leader_id',
    leader_id: 'leader_id'
  };

  for (const [key, value] of Object.entries(fields)) {
    if (fieldMap[key] && value !== undefined) {
      let sqlType = sql.NVarChar(100);
      if (key === 'leaderId' || key === 'leader_id') sqlType = sql.Int;

      request.input(key, sqlType, value);
      setClauses.push(`${fieldMap[key]} = @${key}`);
    }
  }

  if (setClauses.length === 0) return null;

  await request.query(`
    UPDATE Teams
    SET ${setClauses.join(', ')}, updated_at = GETUTCDATE()
    WHERE team_id = @teamId
  `);
}

async function softDelete(teamId) {
  const pool = await getPool();
  await pool.request()
    .input('teamId', sql.Int, teamId)
    .query('UPDATE Teams SET is_active = 0, updated_at = GETUTCDATE() WHERE team_id = @teamId');
}

async function getMembers(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT
        tm.team_member_id, tm.team_id, tm.user_id, tm.assigned_at,
        u.first_name, u.last_name, u.email
      FROM TeamMembers tm
      INNER JOIN Users u ON tm.user_id = u.user_id
      WHERE tm.team_id = @teamId
      ORDER BY u.first_name, u.last_name
    `);
  return result.recordset;
}

async function addMember(teamId, userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .input('userId', sql.Int, userId)
    .query(`
      INSERT INTO TeamMembers (team_id, user_id)
      OUTPUT INSERTED.*
      VALUES (@teamId, @userId)
    `);
  return result.recordset[0];
}

async function removeMember(teamMemberId) {
  const pool = await getPool();
  await pool.request()
    .input('teamMemberId', sql.Int, teamMemberId)
    .query('DELETE FROM TeamMembers WHERE team_member_id = @teamMemberId');
}

async function getTeamAlumniCount(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT COUNT(*) AS count
      FROM AlumniAssignments aa
      INNER JOIN TeamMembers tm ON aa.member_id = tm.user_id
      WHERE tm.team_id = @teamId
    `);
  return result.recordset[0].count;
}

async function lockDistribution(teamId) {
  const pool = await getPool();
  await pool.request()
    .input('teamId', sql.Int, teamId)
    .query('UPDATE Teams SET distribution_locked = 1, updated_at = GETUTCDATE() WHERE team_id = @teamId');
}

async function unlockDistribution(teamId) {
  const pool = await getPool();
  await pool.request()
    .input('teamId', sql.Int, teamId)
    .query('UPDATE Teams SET distribution_locked = 0, updated_at = GETUTCDATE() WHERE team_id = @teamId');
}

async function getLeaderTeams(leaderId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query(`
      SELECT
        t.team_id, t.team_name, t.leader_id, t.is_active,
        t.distribution_locked, t.created_at, t.updated_at,
        (SELECT COUNT(*) FROM TeamMembers tm WHERE tm.team_id = t.team_id) AS member_count
      FROM Teams t
      WHERE t.leader_id = @leaderId
      ORDER BY t.created_at DESC
    `);
  return result.recordset;
}

async function findMemberById(teamMemberId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamMemberId', sql.Int, teamMemberId)
    .query(`
      SELECT
        tm.team_member_id, tm.team_id, tm.user_id, tm.assigned_at,
        t.leader_id
      FROM TeamMembers tm
      INNER JOIN Teams t ON tm.team_id = t.team_id
      WHERE tm.team_member_id = @teamMemberId
    `);
  return result.recordset[0];
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  softDelete,
  getMembers,
  addMember,
  removeMember,
  getTeamAlumniCount,
  lockDistribution,
  unlockDistribution,
  getLeaderTeams,
  findMemberById
};