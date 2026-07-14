const { sql, getPool } = require('../config/database');
const { createAuditLog } = require('../helpers/audit');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get team members (including leader) for a given team ID
 */
async function getTeamMembers(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.is_active
      FROM Users u
      WHERE u.user_id IN (
        SELECT user_id FROM TeamMembers WHERE team_id = @teamId
        UNION
        SELECT leader_id FROM Teams WHERE team_id = @teamId
      )
      AND u.is_active = 1
      ORDER BY u.first_name, u.last_name
    `);
  return result.recordset;
}

/**
 * Get alumni assigned to a team, optionally filtered by batch
 */
async function getTeamAlumni(teamId, batch = null) {
  const pool = await getPool();
  const request = pool.request()
    .input('teamId', sql.Int, teamId);
  
  let query = `
    SELECT a.alumni_id, a.register_no, a.name, a.batch, a.department, a.email, a.phone,
           aa.assignment_id, aa.status, aa.member_id, aa.assigned_date, aa.batch_wise_batch,
           u.first_name + ' ' + u.last_name AS member_name
    FROM AlumniAssignments aa
    INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
    LEFT JOIN Users u ON aa.member_id = u.user_id
    WHERE aa.team_id = @teamId
  `;
  
  request.input('teamId', sql.Int, teamId);
  
  if (batch) {
    query += ' AND a.batch = @batch';
    request.input('batch', sql.NVarChar(10), batch);
  }
  
  query += ' ORDER BY a.batch, a.register_no';
  
  const result = await request.query(query);
  return result.recordset;
}

/**
 * Get the last assigned member index for each batch to continue round-robin sequence
 */
async function getLastAssignedIndexes(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT batch_wise_batch, member_id, MAX(assigned_date) as last_assigned
      FROM AlumniAssignments
      WHERE team_id = @teamId AND batch_wise_batch IS NOT NULL
      GROUP BY batch_wise_batch, member_id
      ORDER BY last_assigned DESC
    `);
  
  // Build a map of batch -> last member_id
  const lastAssigned = {};
  result.recordset.forEach(row => {
    if (row.batch_wise_batch && row.member_id) {
      lastAssigned[row.batch_wise_batch] = row.member_id;
    }
  });
  return lastAssigned;
}

/**
 * Admin assigns alumni to a team using batch-wise round-robin distribution
 */
async function batchWiseRoundRobinAssign(currentUser, { teamId, batches, allocations }) {
  if (!teamId || !batches || !allocations) {
    throw new AppError('Team ID, Batches array, and Allocations are required.', 400);
  }

  const pool = await getPool();
  
  // Validate team ownership and existence
  const teamResult = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query('SELECT team_id, team_name, leader_id FROM Teams WHERE team_id = @teamId AND is_active = 1');
  
  if (teamResult.recordset.length === 0) {
    throw new AppError('Active team not found or you are not authorized to manage this team.', 403);
  }

  const team = teamResult.recordset[0];
  const teamMembers = await getTeamMembers(teamId);
  const teamMemberMap = {};
  teamMembers.forEach(m => { teamMemberMap[m.user_id] = m; });
  
  // Validate allocations
  for (const batchAlloc of allocations) {
    if (!batchAlloc.batch) {
      throw new AppError('Batch is required in each allocation.', 400);
    }
    if (!batchAlloc.members || !Array.isArray(batchAlloc.members) || batchAlloc.members.length === 0) {
      throw new AppError(`At least one team member must be assigned for batch ${batchAlloc.batch}.`, 400);
    }
    
    for (const member of batchAlloc.members) {
      if (!teamMemberMap[member.userId]) {
        throw new AppError(`User ID ${member.userId} is not an active member of this team.`, 400);
      }
      if (member.count < 0) {
        throw new AppError('Allocation count cannot be negative.', 400);
      }
    }
  }

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    let totalAssigned = 0;
    
    for (const batchAlloc of allocations) {
      const batch = batchAlloc.batch;
      const members = batchAlloc.members;
      
      // Get available alumni for this batch that are not yet assigned
      const alumniResult = await pool.request()
        .input('batch', sql.NVarChar(10), batch)
        .query(`
          SELECT a.alumni_id, a.register_no, a.name
          FROM Alumni a
          WHERE a.batch = @batch
          AND a.alumni_id NOT IN (
            SELECT alumni_id FROM AlumniAssignments
          )
          ORDER BY a.register_no
        `);
      
      const batchAlumni = alumniResult.recordset;
      if (batchAlumni.length === 0) {
        continue;
      }
      
      // Calculate total allocation for this batch
      let batchTotal = members.reduce((sum, m) => sum + m.count, 0);
      if (batchTotal > batchAlumni.length) {
        throw new AppError(`Cannot allocate ${batchTotal} alumni for batch ${batch} (only ${batchAlumni.length} available).`, 400);
      }
      
      // Determine starting index for round-robin based on last assignment
      const lastIndexes = await getLastAssignedIndexes(teamId);
      let startIndex = 0;
      if (lastIndexes[batch]) {
        // Find the last member in this batch and calculate starting point
        const lastMemberId = lastIndexes[batch];
        const memberIndex = members.findIndex(m => m.userId === lastMemberId);
        if (memberIndex >= 0) {
          // Start after the last assigned member
          startIndex = (memberIndex + 1) % members.length;
        }
      }
      
      // Assign alumni using round-robin
      let alumniIndex = 0;
      let currentMemberIndex = startIndex;
      
      while (alumniIndex < batchTotal && alumniIndex < batchAlumni.length) {
        const member = members[currentMemberIndex];
        const alumni = batchAlumni[alumniIndex];
        
        await transaction.request()
          .input('alumniId', sql.Int, alumni.alumni_id)
          .input('teamId', sql.Int, teamId)
          .input('memberId', sql.Int, member.userId)
          .input('batch', sql.NVarChar(10), batch)
          .query(`
            INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date, batch_wise_batch, assignment_type)
            VALUES (@alumniId, @teamId, @memberId, 'ASSIGNED_TO_LEADER', GETUTCDATE(), @batch, 'BATCH_WISE_ROUND_ROBIN')
          `);
        
        totalAssigned++;
        alumniIndex++;
        currentMemberIndex = (currentMemberIndex + 1) % members.length;
      }
    }
    
    await transaction.commit();
    
    // Audit log
    await createAuditLog({
      userId: currentUser.userId,
      username: `${currentUser.firstName} ${currentUser.lastName}`,
      roleName: currentUser.role,
      action: 'BATCH_WISE_ROUND_ROBIN_ASSIGN',
      target: `Team#${teamId}`,
      description: `Assigned ${totalAssigned} alumni using batch-wise round-robin distribution`
    });
    
    return {
      success: true,
      message: `Successfully assigned ${totalAssigned} alumni to team members using batch-wise round-robin.`,
      assigned: totalAssigned,
      teamName: team.team_name
    };
    
  } catch (err) {
    await transaction.rollback();
    throw new AppError('Failed to execute batch-wise round-robin assignment: ' + err.message, 500);
  }
}

/**
 * Get distribution preview without actually assigning
 */
async function getDistributionPreview(teamId, batches, allocations) {
  if (!teamId || !batches || !allocations) {
    throw new AppError('Team ID, Batches array, and Allocations are required.', 400);
  }

  const pool = await getPool();
  const teamMembers = await getTeamMembers(teamId);
  const teamMemberMap = {};
  teamMembers.forEach(m => { teamMemberMap[m.user_id] = m; });
  
  const preview = [];
  
  for (const batchAlloc of allocations) {
    const batch = batchAlloc.batch;
    
    // Get available alumni for this batch
    const alumniResult = await pool.request()
      .input('batch', sql.NVarChar(10), batch)
      .query(`
        SELECT a.alumni_id, a.register_no, a.name
        FROM Alumni a
        WHERE a.batch = @batch
        AND a.alumni_id NOT IN (
          SELECT alumni_id FROM AlumniAssignments
        )
        ORDER BY a.register_no
      `);
    
    const batchAlumni = alumniResult.recordset;
    if (batchAlumni.length === 0) {
      continue;
    }
    
    // Calculate total allocation
    let batchTotal = batchAlloc.members.reduce((sum, m) => sum + m.count, 0);
    batchTotal = Math.min(batchTotal, batchAlumni.length); // Don't exceed available
    
    // Determine starting index for round-robin
    const lastIndexes = await getLastAssignedIndexes(teamId);
    let startIndex = 0;
    if (lastIndexes[batch]) {
      const lastMemberId = lastIndexes[batch];
      const memberIndex = batchAlloc.members.findIndex(m => m.userId === lastMemberId);
      if (memberIndex >= 0) {
        startIndex = (memberIndex + 1) % batchAlloc.members.length;
      }
    }
    
    // Generate preview with round-robin distribution
    let alumniIndex = 0;
    let currentMemberIndex = startIndex;
    
    while (alumniIndex < batchTotal) {
      const member = batchAlloc.members[currentMemberIndex];
      const memberInfo = teamMemberMap[member.userId];
      
      // Find or create entry for this member
      let memberPreview = preview.find(p => p.userId === member.userId);
      if (!memberPreview) {
        memberPreview = {
          userId: member.userId,
          userName: `${memberInfo.first_name} ${memberInfo.last_name}`,
          batch: batch,
          count: 0,
          alumniList: []
        };
        preview.push(memberPreview);
      }
      
      memberPreview.count++;
      memberPreview.alumniList.push(batchAlumni[alumniIndex]);
      alumniIndex++;
      currentMemberIndex = (currentMemberIndex + 1) % batchAlloc.members.length;
    }
  }
  
  return {
    teamId,
    batches,
    allocations,
    preview
  };
}

module.exports = {
  batchWiseRoundRobinAssign,
  getDistributionPreview,
  getTeamMembers,
  getTeamAlumni,
  getLastAssignedIndexes
};