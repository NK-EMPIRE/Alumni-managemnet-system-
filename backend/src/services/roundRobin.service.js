const { sql, getPool } = require('../config/database');
const { createAuditLog } = require('../helpers/audit');
const { NotFoundError, AppError } = require('../middleware/errorHandler');
const { sendAssignmentNotificationEmail } = require('../helpers/email');

async function assignAlumni(teamId, currentUser, filters) {
  filters = filters || {};
  const pool = await getPool();

  const teamResult = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query('SELECT * FROM Teams WHERE team_id = @teamId AND is_active = 1');

  if (teamResult.recordset.length === 0) {
    throw new NotFoundError('Team not found or inactive');
  }

  const team = teamResult.recordset[0];

  if (team.distribution_locked) {
    throw new AppError('Distribution is locked for this team', 400);
  }

  const membersResult = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT tm.user_id, u.first_name, u.last_name
      FROM TeamMembers tm
      JOIN Users u ON u.user_id = tm.user_id AND u.is_active = 1
      WHERE tm.team_id = @teamId
    `);

  const members = membersResult.recordset;

  if (members.length === 0) {
    throw new AppError('Team has no active members', 400);
  }

  let whereClauses = ['a.alumni_id NOT IN (SELECT alumni_id FROM AlumniAssignments)'];
  const request = pool.request();

  if (filters.batch) {
    whereClauses.push('a.batch = @batch');
    request.input('batch', sql.NVarChar(10), filters.batch);
  }

  if (filters.department) {
    whereClauses.push('a.department = @department');
    request.input('department', sql.NVarChar(50), filters.department);
  }

  var topClause = '';
  if (filters.count) {
    topClause = 'TOP (@count)';
    request.input('count', sql.Int, parseInt(filters.count, 10));
  }

  const alumniResult = await request
    .query(`
      SELECT ${topClause} a.alumni_id, a.name
      FROM Alumni a
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY a.alumni_id
    `);

  const unassigned = alumniResult.recordset;

  if (unassigned.length === 0) {
    throw new AppError('No unassigned alumni matching the filter', 400);
  }

  const assignments = [];
  let memberIndex = 0;

  for (const alumni of unassigned) {
    const member = members[memberIndex % members.length];
    assignments.push({
      alumniId: alumni.alumni_id,
      memberId: member.user_id,
      memberName: `${member.first_name} ${member.last_name}`
    });
    memberIndex++;
  }

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    for (const a of assignments) {
      await transaction.request()
        .input('alumniId', sql.Int, a.alumniId)
        .input('memberId', sql.Int, a.memberId)
        .input('teamId', sql.Int, teamId)
        .query(`
          INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date)
          VALUES (@alumniId, @teamId, @memberId, 'Pending', GETUTCDATE())
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new AppError('Failed to assign alumni: ' + err.message, 500);
  }

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ROUND_ROBIN_ASSIGN',
    target: `Team#${teamId}`,
    description: `Assigned ${assignments.length} alumni across ${members.length} team members` +
      (filters.batch ? ` (batch: ${filters.batch})` : '') +
      (filters.department ? ` (dept: ${filters.department})` : '')
  });

  // Send email notifications to each member (non-blocking)
  try {
    const leaderName = `${currentUser.firstName} ${currentUser.lastName}`;
    // Get member emails
    const emailReq = pool.request().input('teamId', sql.Int, teamId);
    const emailResult = await emailReq.query(`
      SELECT u.user_id, u.email, u.first_name, u.last_name
      FROM TeamMembers tm
      JOIN Users u ON u.user_id = tm.user_id
      WHERE tm.team_id = @teamId
    `);
    const memberEmailMap = {};
    emailResult.recordset.forEach(function(m) {
      memberEmailMap[m.user_id] = { email: m.email, name: m.first_name + ' ' + m.last_name, count: 0 };
    });
    assignments.forEach(function(a) {
      if (memberEmailMap[a.memberId]) memberEmailMap[a.memberId].count++;
    });
    Object.values(memberEmailMap).forEach(function(m) {
      if (m.count > 0 && m.email) {
        sendAssignmentNotificationEmail(m.email, m.name, m.count, leaderName).catch(function() {});
      }
    });
  } catch (e) { /* email errors are non-fatal */ }

  return {
    assigned: assignments.length,
    members: members.length,
    team: team.team_name,
    batch: filters.batch || null,
    details: assignments.map(a => ({
      alumniId: a.alumniId,
      memberId: a.memberId
    }))
  };
}

module.exports = { assignAlumni };