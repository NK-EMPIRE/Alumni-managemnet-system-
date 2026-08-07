const { sql, getPool } = require('../config/database');
const { createAuditLog } = require('../helpers/audit');
const { sendEmail } = require('../helpers/email');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get aggregate database health summary for Admin.
 */
async function getDbSummary() {
  const pool = await getPool();

  // 1. Total alumni records
  const totalRes = await pool.request().query('SELECT COUNT(*) AS total FROM Alumni');
  const totalAlumni = totalRes.recordset[0].total;

  // 2. Duplicate count by register_no
  const dupRes = await pool.request().query(`
    SELECT SUM(cnt - 1) AS dup_count
    FROM (
      SELECT register_no, COUNT(*) AS cnt
      FROM Alumni
      WHERE register_no IS NOT NULL AND RTRIM(register_no) <> ''
      GROUP BY register_no
      HAVING COUNT(*) > 1
    ) sub
  `);
  const duplicates = dupRes.recordset[0].dup_count || 0;

  // 3. Missing fields breakdown
  const fields = [
    'father_name', 'email', 'phone', 'company', 'designation',
    'address', 'city', 'state', 'date_of_birth',
    'linkedin_profile', 'working_details'
  ];

  const missingQueries = fields.map(f => `SUM(CASE WHEN ${f} IS NULL OR RTRIM(CAST(${f} AS NVARCHAR(MAX))) = '' THEN 1 ELSE 0 END) AS missing_${f}`);
  const missingRes = await pool.request().query(`SELECT ${missingQueries.join(', ')} FROM Alumni`);
  const missingRow = missingRes.recordset[0] || {};

  const missingFields = {};
  fields.forEach(f => {
    missingFields[f] = missingRow[`missing_${f}`] || 0;
  });

  // 4. Completion breakdown & Unassigned count
  const assignRes = await pool.request().query(`
    SELECT
      SUM(CASE WHEN status IN ('Pending', 'Draft', 'ASSIGNED_TO_LEADER') THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed
    FROM AlumniAssignments
  `);
  const pending = assignRes.recordset[0].pending || 0;
  const completed = assignRes.recordset[0].completed || 0;

  const unassignedRes = await pool.request().query(`
    SELECT COUNT(*) AS unassigned
    FROM Alumni
    WHERE alumni_id NOT IN (SELECT alumni_id FROM AlumniAssignments)
  `);
  const unassigned = unassignedRes.recordset[0].unassigned || 0;

  return {
    totalAlumni,
    duplicates,
    missingFields,
    assignments: {
      pending,
      completed,
      unassigned
    }
  };
}

/**
 * Get paginated list of records matching a specific DB health issue filter.
 */
async function getDbDetail({ type }) {
  const pool = await getPool();

  let whereClause = '1=1';
  if (type === 'duplicates') {
    whereClause = `a.register_no IN (
      SELECT register_no FROM Alumni WHERE register_no IS NOT NULL AND RTRIM(register_no) <> '' GROUP BY register_no HAVING COUNT(*) > 1
    )`;
  } else if (type.startsWith('missing_')) {
    const field = type.replace('missing_', '');
    const allowedFields = [
      'father_name', 'email', 'phone', 'company', 'designation',
      'address', 'city', 'state', 'date_of_birth',
      'linkedin_profile', 'working_details'
    ];
    if (allowedFields.includes(field)) {
      whereClause = `(a.${field} IS NULL OR RTRIM(CAST(a.${field} AS NVARCHAR(MAX))) = '')`;
    }
  } else if (type === 'pending') {
    whereClause = `(aa.status IN ('Pending', 'Draft', 'ASSIGNED_TO_LEADER'))`;
  } else if (type === 'completed') {
    whereClause = `aa.status = 'Completed'`;
  } else if (type === 'unassigned') {
    whereClause = `aa.assignment_id IS NULL`;
  }

  const dataRes = await pool.request().query(`
    SELECT DISTINCT
      a.alumni_id, a.register_no, a.name, a.department, a.batch,
      a.email, a.phone, a.company, a.designation,
      aa.status AS assignment_status, aa.member_id, aa.team_id,
      RTRIM(CONCAT(u.first_name, ' ', u.last_name)) AS assigned_person_name,
      u.email AS assigned_person_email
    FROM Alumni a
    LEFT JOIN AlumniAssignments aa ON a.alumni_id = aa.alumni_id
    LEFT JOIN Users u ON aa.member_id = u.user_id
    WHERE ${whereClause}
    ORDER BY a.name ASC
  `);

  return { rows: dataRes.recordset, total: dataRes.recordset.length };
}

/**
 * Notify assigned leader/member to complete missing information or assign orphaned alumni.
 */
async function notifyAssignee(currentUser, { alumniIds, assignLeaderId, message }) {
  if (!Array.isArray(alumniIds) || alumniIds.length === 0) {
    throw new AppError('alumniIds array is required.', 400);
  }

  const pool = await getPool();
  const idList = alumniIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));

  // If assignLeaderId provided, assign orphaned records to leader first
  if (assignLeaderId) {
    const leaderRes = await pool.request()
      .input('leaderId', sql.Int, assignLeaderId)
      .query(`
        SELECT u.user_id, u.email, u.first_name, u.last_name, t.team_id
        FROM Users u
        INNER JOIN Teams t ON t.leader_id = u.user_id
        WHERE u.user_id = @leaderId AND u.is_active = 1
      `);
    if (leaderRes.recordset.length === 0) {
      throw new AppError('Active Team Leader not found.', 404);
    }
    const leader = leaderRes.recordset[0];

    for (const aid of idList) {
      await pool.request()
        .input('alumniId', sql.Int, aid)
        .input('teamId', sql.Int, leader.team_id)
        .input('assignedBy', sql.Int, currentUser.userId)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM AlumniAssignments WHERE alumni_id = @alumniId)
          BEGIN
            INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date, assigned_by, assignment_type)
            VALUES (@alumniId, @teamId, NULL, 'ASSIGNED_TO_LEADER', GETUTCDATE(), @assignedBy, 'ADMIN_TO_LEADER');
          END
        `);
    }
  }

  // Fetch recipients (either assigned member or team leader)
  const recipientsRes = await pool.request().query(`
    SELECT DISTINCT
      a.alumni_id, a.name AS alumni_name, a.register_no,
      COALESCE(u_mem.email, u_lead.email) AS recipient_email,
      COALESCE(RTRIM(CONCAT(u_mem.first_name, ' ', u_mem.last_name)), RTRIM(CONCAT(u_lead.first_name, ' ', u_lead.last_name))) AS recipient_name
    FROM Alumni a
    INNER JOIN AlumniAssignments aa ON a.alumni_id = aa.alumni_id
    LEFT JOIN Users u_mem ON aa.member_id = u_mem.user_id
    LEFT JOIN Teams t ON aa.team_id = t.team_id
    LEFT JOIN Users u_lead ON t.leader_id = u_lead.user_id
    WHERE a.alumni_id IN (${idList.join(',')})
  `);

  const recipients = recipientsRes.recordset;
  let notifiedCount = 0;

  for (const r of recipients) {
    if (r.recipient_email) {
      try {
        await sendEmail({
          to: r.recipient_email,
          subject: 'AlumniMS - Attention Required: Complete Alumni Record',
          html: `<p>Hello ${r.recipient_name},</p><p>${message || 'Please review and complete missing details for the assigned alumni record.'}</p><p><strong>Alumni:</strong> ${r.alumni_name} (${r.register_no})</p>`
        });
        notifiedCount++;
      } catch (e) {}
    }
  }

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
    roleName: currentUser.role,
    action: 'HEALTH_NOTIFY',
    target: `AlumniCount#${idList.length}`,
    description: `Sent completion notifications to assignees for ${idList.length} alumni records.`
  });

  return { notified: notifiedCount, total: idList.length };
}

module.exports = { getDbSummary, getDbDetail, notifyAssignee };
