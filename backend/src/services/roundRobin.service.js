const { sql, getPool } = require('../config/database');
const { createAuditLog } = require('../helpers/audit');
const { NotFoundError, AppError } = require('../middleware/errorHandler');
const { sendAssignmentNotificationEmail } = require('../helpers/email');

/**
 * Admin assigns alumni of a specific department and batch to a Team Leader.
 */
async function adminAssign(currentUser, { department, batch, leaderId, count }) {
  if (!department || !batch || !leaderId) {
    throw new AppError('Department, Batch, and Leader ID are required.', 400);
  }

  const assignCount = parseInt(count, 10);
  if (isNaN(assignCount) || assignCount <= 0) {
    throw new AppError('Assign count must be a positive integer greater than zero.', 400);
  }

  const pool = await getPool();

  // Validate Team Leader exists and is active
  const leaderResult = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query(`
      SELECT u.user_id, u.first_name, u.last_name, u.is_active, r.role_name, u.email
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      WHERE u.user_id = @leaderId AND u.deleted_at IS NULL
    `);

  if (leaderResult.recordset.length === 0) {
    throw new NotFoundError('Team Leader not found.');
  }

  const leader = leaderResult.recordset[0];
  if (!leader.is_active) {
    throw new AppError(`Team Leader ${leader.first_name} ${leader.last_name} is inactive.`, 400);
  }
  if (leader.role_name !== 'LEADER') {
    throw new AppError('Selected user is not a Team Leader.', 400);
  }

  // Validate Team exists for this leader
  const teamResult = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query('SELECT team_id, team_name FROM Teams WHERE leader_id = @leaderId AND is_active = 1');

  if (teamResult.recordset.length === 0) {
    throw new AppError('No active team found for the selected Team Leader.', 400);
  }
  const team = teamResult.recordset[0];

  // Fetch AVAILABLE alumni matching department and batch (ordered by register_no ascending)
  const alumniResult = await pool.request()
    .input('department', sql.NVarChar(50), department)
    .input('batch', sql.NVarChar(10), batch)
    .input('limit', sql.Int, assignCount)
    .query(`
      SELECT TOP (@limit) a.alumni_id, a.name
      FROM Alumni a
      WHERE a.department = @department AND a.batch = @batch
      AND a.alumni_id NOT IN (SELECT alumni_id FROM AlumniAssignments)
      ORDER BY a.register_no ASC
    `);

  const availableAlumni = alumniResult.recordset;
  if (availableAlumni.length === 0) {
    throw new AppError('No available alumni found for this department and batch.', 404);
  }
  if (availableAlumni.length < assignCount) {
    throw new AppError(`Requested ${assignCount} assignments, but only ${availableAlumni.length} alumni are available.`, 400);
  }

  // Transactional insert
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    for (const alumni of availableAlumni) {
      await transaction.request()
        .input('alumniId', sql.Int, alumni.alumni_id)
        .input('teamId', sql.Int, team.team_id)
        .input('assignedBy', sql.Int, currentUser.userId)
        .query(`
          INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date, assigned_by, assignment_type)
          VALUES (@alumniId, @teamId, NULL, 'ASSIGNED_TO_LEADER', GETUTCDATE(), @assignedBy, 'ADMIN_TO_LEADER')
        `);
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new AppError('Failed to execute assignment transaction: ' + err.message, 500);
  }

  // Record Audit Log
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ADMIN_ASSIGN',
    target: `Team#${team.team_id}`,
    description: `Assigned ${availableAlumni.length} alumni (Dept: ${department}, Batch: ${batch}) to Leader ${leader.first_name} ${leader.last_name}`
  });

  // Non-blocking Email Notification
  try {
    if (leader.email) {
      sendAssignmentNotificationEmail(
        leader.email,
        `${leader.first_name} ${leader.last_name}`,
        availableAlumni.length,
        `${currentUser.firstName} ${currentUser.lastName}`
      ).catch(() => {});
    }
  } catch (e) {}

  return {
    success: true,
    message: `Successfully assigned ${availableAlumni.length} alumni to ${leader.first_name} ${leader.last_name}.`,
    count: availableAlumni.length,
    leaderName: `${leader.first_name} ${leader.last_name}`
  };
}

/**
 * Generate preview of Leader distribution.
 */
async function leaderPreview(currentUser, { teamId, method, batch, allocations, selectedMemberIds }) {
  if (!teamId || !method) {
    throw new AppError('Team ID and Method are required.', 400);
  }

  const pool = await getPool();

  // Validate team ownership
  const teamResult = await pool.request()
    .input('teamId', sql.Int, teamId)
    .input('leaderId', sql.Int, currentUser.userId)
    .query('SELECT * FROM Teams WHERE team_id = @teamId AND leader_id = @leaderId AND is_active = 1');

  if (teamResult.recordset.length === 0) {
    throw new AppError('Active team not found or you are not the leader of this team.', 403);
  }

  // Get undistributed alumni assigned to this leader
  let undistributedQuery = `
    SELECT a.alumni_id, a.name, a.register_no, a.batch, a.department
    FROM AlumniAssignments aa
    INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
    WHERE aa.team_id = @teamId AND aa.status = 'ASSIGNED_TO_LEADER'
  `;
  const undistReq = pool.request().input('teamId', sql.Int, teamId);

  if (method === 'BatchWise') {
    if (!batch) {
      throw new AppError('Batch is required for BatchWise distribution.', 400);
    }
    undistributedQuery += " AND a.batch = @batch";
    undistReq.input('batch', sql.NVarChar(10), batch);
  }

  const undistResult = await undistReq.query(undistributedQuery);
  const poolAlumni = undistResult.recordset;

  if (poolAlumni.length === 0) {
    throw new AppError('No undistributed alumni found matching the criteria.', 404);
  }

  const preview = [];

  if (method === 'BatchWise') {
    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      throw new AppError('Allocations array is required for BatchWise distribution.', 400);
    }

    let sum = 0;
    const userIds = [];
    for (const alloc of allocations) {
      if (alloc.count < 0) throw new AppError('Allocation count cannot be negative.', 400);
      sum += parseInt(alloc.count, 10);
      userIds.push(alloc.userId);
    }

    if (sum !== poolAlumni.length) {
      throw new AppError(`Total allocated count (${sum}) must match the number of selected batch alumni (${poolAlumni.length}).`, 400);
    }

    // Validate users are active team members or the leader
    const usersResult = await pool.request()
      .input('teamId', sql.Int, teamId)
      .query(`
        SELECT u.user_id, u.first_name + ' ' + u.last_name AS name
        FROM Users u
        WHERE u.user_id IN (
          SELECT user_id FROM TeamMembers WHERE team_id = @teamId
          UNION
          SELECT leader_id FROM Teams WHERE team_id = @teamId
        ) AND u.is_active = 1
      `);

    const activeUsers = usersResult.recordset;
    const activeUserMap = {};
    activeUsers.forEach(u => { activeUserMap[u.user_id] = u.name; });

    for (const alloc of allocations) {
      if (!activeUserMap[alloc.userId]) {
        throw new AppError(`User ID ${alloc.userId} is not an active member/leader of this team.`, 400);
      }
    }

    let alumniIdx = 0;
    for (const alloc of allocations) {
      const count = parseInt(alloc.count, 10);
      const memberAlumni = [];
      for (let i = 0; i < count; i++) {
        if (alumniIdx < poolAlumni.length) {
          memberAlumni.push(poolAlumni[alumniIdx++]);
        }
      }
      preview.push({
        userId: alloc.userId,
        userName: activeUserMap[alloc.userId],
        count: memberAlumni.length,
        alumniList: memberAlumni
      });
    }

  } else if (method === 'RoundRobin') {
    if (!selectedMemberIds || !Array.isArray(selectedMemberIds) || selectedMemberIds.length === 0) {
      throw new AppError('Selected members array is required for RoundRobin distribution.', 400);
    }

    // Validate users are active team members or the leader
    const usersResult = await pool.request()
      .input('teamId', sql.Int, teamId)
      .query(`
        SELECT u.user_id, u.first_name + ' ' + u.last_name AS name
        FROM Users u
        WHERE u.user_id IN (
          SELECT user_id FROM TeamMembers WHERE team_id = @teamId
          UNION
          SELECT leader_id FROM Teams WHERE team_id = @teamId
        ) AND u.is_active = 1
      `);

    const activeUsers = usersResult.recordset;
    const activeUserMap = {};
    activeUsers.forEach(u => { activeUserMap[u.user_id] = u.name; });

    for (const uid of selectedMemberIds) {
      if (!activeUserMap[uid]) {
        throw new AppError(`User ID ${uid} is not an active member/leader of this team.`, 400);
      }
    }

    const membersQueue = [...selectedMemberIds];
    const allocationsMap = {};
    membersQueue.forEach(uid => {
      allocationsMap[uid] = {
        userId: uid,
        userName: activeUserMap[uid],
        count: 0,
        alumniList: []
      };
    });

    let qIdx = 0;
    for (const alumni of poolAlumni) {
      const targetUid = membersQueue[qIdx];
      allocationsMap[targetUid].count++;
      allocationsMap[targetUid].alumniList.push(alumni);
      qIdx = (qIdx + 1) % membersQueue.length;
    }

    selectedMemberIds.forEach(uid => {
      preview.push(allocationsMap[uid]);
    });

  } else if (method === 'FacultyWise') {
    // Get active members of the team
    const usersResult = await pool.request()
      .input('teamId', sql.Int, teamId)
      .query(`
        SELECT u.user_id, u.first_name + ' ' + u.last_name AS name
        FROM Users u
        WHERE u.user_id IN (
          SELECT user_id FROM TeamMembers WHERE team_id = @teamId
          UNION
          SELECT leader_id FROM Teams WHERE team_id = @teamId
        ) AND u.is_active = 1
      `);

    const activeUsers = usersResult.recordset;
    const activeUserMap = {};
    activeUsers.forEach(u => { activeUserMap[u.user_id] = u.name; });

    // Build a map: normalized member name -> user_id
    const memberNameToId = {};
    activeUsers.forEach(u => {
      memberNameToId[u.name.trim().toLowerCase()] = u.user_id;
    });

    const matchedGroups = {};
    const unmatched = [];

    for (const alumni of poolAlumni) {
      const faculty = (alumni.faculty_assigned || '').trim().toLowerCase();
      let matchedId = null;
      if (faculty) {
        // Try exact match first, then partial match
        if (memberNameToId[faculty]) {
          matchedId = memberNameToId[faculty];
        } else {
          // partial: faculty string contains member name or member name contains faculty string
          for (const [mname, mid] of Object.entries(memberNameToId)) {
            if (mname.includes(faculty) || faculty.includes(mname)) {
              matchedId = mid;
              break;
            }
          }
        }
      }

      if (matchedId) {
        if (!matchedGroups[matchedId]) {
          matchedGroups[matchedId] = {
            userId: matchedId,
            userName: activeUserMap[matchedId],
            count: 0,
            alumniList: []
          };
        }
        matchedGroups[matchedId].alumniList.push(alumni);
        matchedGroups[matchedId].count++;
      } else {
        unmatched.push({ ...alumni, originalFaculty: alumni.faculty_assigned });
      }
    }

    // Add matched groups to preview
    Object.values(matchedGroups).forEach(g => preview.push(g));

    // Add unmatched group with userId = -1 sentinel so caller knows to show manual assignment
    if (unmatched.length > 0) {
      preview.push({
        userId: -1,
        userName: 'Unmatched (Manual Assignment Required)',
        count: unmatched.length,
        alumniList: unmatched,
        isUnmatched: true
      });
    }

  } else {
    throw new AppError(`Unknown distribution method: ${method}`, 400);
  }

  return preview;
}

/**
 * Confirm and save Leader distribution.
 */
async function leaderDistribute(currentUser, params) {
  const pool = await getPool();
  const preview = await leaderPreview(currentUser, params);
  const manualAssignments = params.manualAssignments || [];

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    let totalUpdated = 0;

    for (const group of preview) {
      if (group.userId === -1) continue; // skip unmatched sentinel
      for (const alumni of group.alumniList) {
        await transaction.request()
          .input('alumniId', sql.Int, alumni.alumni_id)
          .input('memberId', sql.Int, group.userId)
          .query(`
            UPDATE AlumniAssignments
            SET member_id = @memberId, status = 'Pending', assignment_type = 'LEADER_DISTRIBUTION'
            WHERE alumni_id = @alumniId AND status = 'ASSIGNED_TO_LEADER'
          `);
        totalUpdated++;
      }
    }

    for (const ma of manualAssignments) {
      if (!ma.alumniId || !ma.memberId) continue;
      await transaction.request()
        .input('alumniId', sql.Int, ma.alumniId)
        .input('memberId', sql.Int, ma.memberId)
        .query(`
          UPDATE AlumniAssignments
          SET member_id = @memberId, status = 'Pending', assignment_type = 'LEADER_DISTRIBUTION'
          WHERE alumni_id = @alumniId AND status = 'ASSIGNED_TO_LEADER'
        `);
      totalUpdated++;
    }

    await transaction.commit();

    await createAuditLog({
      userId: currentUser.userId,
      username: `${currentUser.firstName} ${currentUser.lastName}`,
      roleName: currentUser.role,
      action: 'LEADER_DISTRIBUTION',
      target: `Team#${params.teamId}`,
      description: `Distributed ${totalUpdated} alumni using ${params.method} method`
    });

    return {
      success: true,
      message: `Successfully distributed ${totalUpdated} alumni to team members.`,
      distributed: totalUpdated
    };

  } catch (err) {
    await transaction.rollback();
    throw new AppError('Failed to execute distribution transaction: ' + err.message, 500);
  }
}

/**
 * Reopen a completed alumni record.
 */
async function reopenAssignment(currentUser, alumniId, { reason }) {
  if (!alumniId) {
    throw new AppError('Alumni ID is required.', 400);
  }

  const pool = await getPool();

  const assignResult = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .query('SELECT aa.*, a.name, a.register_no FROM AlumniAssignments aa INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id WHERE aa.alumni_id = @alumniId');

  if (assignResult.recordset.length === 0) {
    throw new NotFoundError('Assignment record for this alumni not found.');
  }

  const assignment = assignResult.recordset[0];
  if (assignment.status !== 'Completed') {
    throw new AppError('Only completed records can be reopened.', 400);
  }

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    // Delete the assignment record (making it Available again)
    await transaction.request()
      .input('alumniId', sql.Int, alumniId)
      .query('DELETE FROM AlumniAssignments WHERE alumni_id = @alumniId');

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw new AppError('Failed to reopen completed record: ' + err.message, 500);
  }

  // Audit log
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'REOPEN_ASSIGNMENT',
    target: `Alumni#${alumniId}`,
    description: `Reopened completed alumni record for ${assignment.name} (${assignment.register_no}). Reason: ${reason || 'Not specified'}`
  });

  return {
    success: true,
    message: `Alumni record ${assignment.name} reopened successfully and is now Available.`
  };
}

/**
 * Get undistributed alumni assigned to the team leader.
 */
async function getUndistributedAlumni(leaderId, { page, limit, offset, search, batch }) {
  const pool = await getPool();
  const request = pool.request()
    .input('leaderId', sql.Int, leaderId)
    .input('search', sql.NVarChar(200), search ? `%${search}%` : null)
    .input('batch', sql.NVarChar(10), batch || null)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit);

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM AlumniAssignments aa
    INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
    INNER JOIN Teams t ON aa.team_id = t.team_id
    WHERE t.leader_id = @leaderId AND aa.status = 'ASSIGNED_TO_LEADER'
      AND (@search IS NULL OR a.name LIKE @search OR a.register_no LIKE @search)
      AND (@batch IS NULL OR a.batch = @batch)
  `;

  const countResult = await request.query(countQuery);
  const total = countResult.recordset[0].total;

  const dataQuery = `
    SELECT a.alumni_id, a.name, a.register_no, a.department, a.batch, aa.assigned_date, aa.status
    FROM AlumniAssignments aa
    INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
    INNER JOIN Teams t ON aa.team_id = t.team_id
    WHERE t.leader_id = @leaderId AND aa.status = 'ASSIGNED_TO_LEADER'
      AND (@search IS NULL OR a.name LIKE @search OR a.register_no LIKE @search)
      AND (@batch IS NULL OR a.batch = @batch)
    ORDER BY aa.assigned_date DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `;

  const dataResult = await request.query(dataQuery);
  return { total, rows: dataResult.recordset };
}

async function getAvailableAlumniCount({ department, batch }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('department', sql.NVarChar(50), department)
    .input('batch', sql.NVarChar(10), batch)
    .query(`
      SELECT COUNT(*) AS count
      FROM Alumni
      WHERE department = @department AND batch = @batch
      AND alumni_id NOT IN (SELECT alumni_id FROM AlumniAssignments)
    `);
  return result.recordset[0].count;
}

async function getUndistributedCount(leaderId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query(`
      SELECT COUNT(*) AS count
      FROM AlumniAssignments aa
      INNER JOIN Teams t ON aa.team_id = t.team_id
      WHERE t.leader_id = @leaderId AND aa.status = 'ASSIGNED_TO_LEADER'
    `);
  return result.recordset[0].count;
}

module.exports = {
  adminAssign,
  leaderPreview,
  leaderDistribute,
  reopenAssignment,
  getUndistributedAlumni,
  getAvailableAlumniCount,
  getUndistributedCount
};