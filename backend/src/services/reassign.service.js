const { sql, getPool } = require('../config/database');
const { createAuditLog } = require('../helpers/audit');
const { notifyAssignmentsUpdated } = require('../helpers/realtime');
const { AppError, NotFoundError } = require('../middleware/errorHandler');

/**
 * Get team workload: assigned/completed/pending counts per member + leader.
 * Admin: pass leaderId query param.
 * Leader: uses req.user automatically.
 */
async function getTeamLoad(currentUser, { leaderId }) {
  const pool = await getPool();

  let resolvedLeaderId;
  if (currentUser.role === 'LEADER') {
    resolvedLeaderId = currentUser.userId;
  } else if (currentUser.role === 'ADMIN') {
    if (!leaderId) throw new AppError('leaderId is required for Admin.', 400);
    resolvedLeaderId = parseInt(leaderId, 10);
  } else {
    throw new AppError('Access denied.', 403);
  }

  // Get team for this leader
  const teamRes = await pool.request()
    .input('leaderId', sql.Int, resolvedLeaderId)
    .query(`SELECT team_id, team_name FROM Teams WHERE leader_id = @leaderId AND is_active = 1`);

  if (teamRes.recordset.length === 0) {
    throw new AppError('No active team found for this leader.', 404);
  }
  const team = teamRes.recordset[0];

  // Get all active members + leader of this team with counts
  const loadRes = await pool.request()
    .input('teamId', sql.Int, team.team_id)
    .query(`
      SELECT
        u.user_id,
        u.first_name + ' ' + u.last_name AS name,
        r.role_name AS role,
        COUNT(aa.assignment_id) AS assigned_count,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN aa.status = 'Pending' THEN 1 ELSE 0 END) AS pending_count
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      LEFT JOIN AlumniAssignments aa ON aa.member_id = u.user_id AND aa.team_id = @teamId
      WHERE u.user_id IN (
        SELECT user_id FROM TeamMembers WHERE team_id = @teamId
        UNION
        SELECT leader_id FROM Teams WHERE team_id = @teamId
      )
      AND u.is_active = 1
      GROUP BY u.user_id, u.first_name, u.last_name, r.role_name
      ORDER BY pending_count DESC
    `);

  return { team, members: loadRes.recordset };
}

/**
 * Preview: which Pending alumni records will move from source → targets.
 * Does NOT write anything to the DB.
 */
async function previewReassign(currentUser, { leaderId, sourceMemberId, targetMemberIds, count, allocations }) {
  const pool = await getPool();

  const { team } = await getTeamLoad(currentUser, { leaderId });

  // Validate sourceMemberId is in the team
  const memberCheck = await pool.request()
    .input('teamId', sql.Int, team.team_id)
    .input('userId', sql.Int, sourceMemberId)
    .query(`
      SELECT u.user_id, u.first_name + ' ' + u.last_name AS name
      FROM Users u
      WHERE u.user_id = @userId AND u.is_active = 1
        AND u.user_id IN (
          SELECT user_id FROM TeamMembers WHERE team_id = @teamId
          UNION SELECT leader_id FROM Teams WHERE team_id = @teamId
        )
    `);
  if (memberCheck.recordset.length === 0) {
    throw new AppError('Source member not found in this team.', 400);
  }
  const sourceName = memberCheck.recordset[0].name;

  // Validate all targetMemberIds are in the team
  const targetIds = Array.isArray(targetMemberIds) ? targetMemberIds : [];
  if (targetIds.length === 0) throw new AppError('At least one target member is required.', 400);

  const targetCheck = await pool.request()
    .input('teamId', sql.Int, team.team_id)
    .query(`
      SELECT u.user_id, u.first_name + ' ' + u.last_name AS name
      FROM Users u
      WHERE u.is_active = 1
        AND u.user_id IN (
          SELECT user_id FROM TeamMembers WHERE team_id = @teamId
          UNION SELECT leader_id FROM Teams WHERE team_id = @teamId
        )
    `);
  const validMemberMap = {};
  targetCheck.recordset.forEach(m => { validMemberMap[m.user_id] = m.name; });

  for (const tid of targetIds) {
    if (!validMemberMap[tid]) {
      throw new AppError(`Target member ID ${tid} is not an active member of this team.`, 400);
    }
    if (parseInt(tid, 10) === parseInt(sourceMemberId, 10)) {
      throw new AppError('Source and target member cannot be the same person.', 400);
    }
  }

  // Fetch pending alumni for source member — take `count` rows, or all if count not specified
  const fetchLimit = count ? parseInt(count, 10) : 10000;
  const pendingRes = await pool.request()
    .input('sourceMemberId', sql.Int, sourceMemberId)
    .input('teamId', sql.Int, team.team_id)
    .input('limit', sql.Int, fetchLimit)
    .query(`
      SELECT TOP (@limit)
        aa.assignment_id, aa.alumni_id, a.name, a.register_no, aa.status AS current_status
      FROM AlumniAssignments aa
      INNER JOIN Alumni a ON a.alumni_id = aa.alumni_id
      WHERE aa.member_id = @sourceMemberId
        AND aa.team_id = @teamId
        AND aa.status = 'Pending'
      ORDER BY aa.assigned_date ASC
    `);

  const pendingAlumni = pendingRes.recordset;
  if (pendingAlumni.length === 0) {
    throw new AppError('No Pending alumni found for this source member.', 404);
  }

  // Build allocations: custom map takes priority, otherwise even split
  let allocationMap = {}; // { userId: count }
  if (allocations && typeof allocations === 'object' && !Array.isArray(allocations)) {
    // caller provided custom split e.g. { "5": 6, "7": 4 }
    let totalAlloc = 0;
    for (const uid of targetIds) {
      const c = parseInt(allocations[uid] || 0, 10);
      allocationMap[uid] = c;
      totalAlloc += c;
    }
    if (totalAlloc !== pendingAlumni.length) {
      throw new AppError(`Custom allocation total (${totalAlloc}) must equal pending count (${pendingAlumni.length}).`, 400);
    }
  } else {
    // Even split
    const base = Math.floor(pendingAlumni.length / targetIds.length);
    const extra = pendingAlumni.length % targetIds.length;
    targetIds.forEach((uid, i) => {
      allocationMap[uid] = base + (i < extra ? 1 : 0);
    });
  }

  // Build preview groups
  let idx = 0;
  const preview = targetIds.map(uid => {
    const slice = pendingAlumni.slice(idx, idx + allocationMap[uid]);
    idx += allocationMap[uid];
    return {
      targetMemberId: uid,
      targetName: validMemberMap[uid],
      count: slice.length,
      alumni: slice
    };
  });

  return {
    team,
    sourceMemberId,
    sourceName,
    totalMoving: pendingAlumni.length,
    preview
  };
}

/**
 * Commit: execute the reassignment using exact assignment_ids from caller.
 * allocations: { "targetMemberId": [assignment_id, ...], ... }
 */
async function commitReassign(currentUser, { leaderId, sourceMemberId, allocations }) {
  if (!allocations || typeof allocations !== 'object') {
    throw new AppError('allocations map is required.', 400);
  }

  const pool = await getPool();
  const { team } = await getTeamLoad(currentUser, { leaderId });

  // Collect all assignment IDs to be moved; verify they are all Pending + belong to source + team
  const allAssignmentIds = [];
  for (const targetId of Object.keys(allocations)) {
    const ids = allocations[targetId];
    if (Array.isArray(ids)) allAssignmentIds.push(...ids);
  }

  if (allAssignmentIds.length === 0) {
    throw new AppError('No assignment IDs provided in allocations.', 400);
  }

  // Verify all provided assignment IDs are actually Pending for the given source + team
  const idList = allAssignmentIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
  const verifyRes = await pool.request()
    .input('sourceMemberId', sql.Int, sourceMemberId)
    .input('teamId', sql.Int, team.team_id)
    .query(`
      SELECT assignment_id, alumni_id, status FROM AlumniAssignments
      WHERE assignment_id IN (${idList.join(',')})
        AND member_id = @sourceMemberId
        AND team_id = @teamId
        AND status = 'Pending'
    `);

  if (verifyRes.recordset.length !== idList.length) {
    throw new AppError(
      `Mismatch: ${idList.length} IDs provided but only ${verifyRes.recordset.length} are valid Pending records for this source member.`,
      400
    );
  }

  // Execute in a transaction
  const transaction = pool.transaction();
  await transaction.begin();

  let totalMoved = 0;
  try {
    for (const targetId of Object.keys(allocations)) {
      const assignIds = (allocations[targetId] || []).map(id => parseInt(id, 10)).filter(n => !isNaN(n));
      if (assignIds.length === 0) continue;

      for (const assignId of assignIds) {
        // Insert audit log before mutating member_id
        await transaction.request()
          .input('assignId', sql.Int, assignId)
          .input('targetMemberId', sql.Int, parseInt(targetId, 10))
          .input('leaderUserId', sql.Int, leaderUserId)
          .query(`
            INSERT INTO dbo.AssignmentAuditLog (alumni_id, old_member_id, new_member_id, changed_by)
            SELECT alumni_id, member_id, @targetMemberId, @leaderUserId
            FROM dbo.AlumniAssignments
            WHERE assignment_id = @assignId;

            UPDATE AlumniAssignments
            SET member_id = @targetMemberId
            WHERE assignment_id = @assignId AND status = 'Pending';
          `);
        totalMoved++;
      }
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new AppError('Transaction failed: ' + err.message, 500);
  }

  // Audit each move (batched description per target to save log rows)
  const actorName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
  for (const targetId of Object.keys(allocations)) {
    const assignIds = (allocations[targetId] || []).map(id => parseInt(id, 10)).filter(n => !isNaN(n));
    if (assignIds.length === 0) continue;

    await createAuditLog({
      userId: currentUser.userId,
      username: actorName,
      roleName: currentUser.role,
      action: 'REASSIGN',
      target: `Team#${team.team_id}`,
      description: `Moved ${assignIds.length} Pending alumni (IDs: ${assignIds.join(',')}) from member_id=${sourceMemberId} to member_id=${targetId}`
    });
  }

  // Trigger real-time sync across connected clients
  try {
    notifyAssignmentsUpdated(team.team_id, 'reassign');
  } catch (e) {}

  return { moved: totalMoved, teamId: team.team_id };
}

module.exports = { getTeamLoad, previewReassign, commitReassign };
