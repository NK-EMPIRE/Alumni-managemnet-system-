const { sql, getPool } = require('../config/database');
const alumniRepository = require('../repositories/alumni.repository');
const { createAuditLog } = require('../helpers/audit');
const { NotFoundError, ConflictError } = require('../middleware/errorHandler');

function computeOffset(page, limit) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  return { page, limit, offset: (page - 1) * limit };
}

async function getAlumni({ page, limit, search, department, batch, status, leaderId, memberId, dateFrom, dateTo, dateField }) {
  const p = computeOffset(page, limit);
  return alumniRepository.findAll({ page: p.page, limit: p.limit, offset: p.offset, search, department, batch, status, leaderId, memberId, dateFrom, dateTo, dateField });
}

async function getAlumniById(alumniId) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }
  return alumni;
}

async function createAlumni(data, currentUser) {
  const existing = await alumniRepository.findByRegisterNo(data.registerNo);
  if (existing) {
    throw new ConflictError('Alumni with this register number already exists');
  }

  const alumni = await alumniRepository.create(data);

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ALUMNI_CREATED',
    target: `Alumni#${alumni.alumni_id}`,
    description: `Created alumni ${alumni.name} (${alumni.register_no})`
  });

  return alumni;
}

async function updateAlumni(alumniId, data, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  const repoData = { ...data };
  if (data.current_city !== undefined && data.city === undefined) {
    repoData.city = data.current_city;
  }
  if (data.linkedin_url !== undefined && data.linkedin_profile === undefined) {
    repoData.linkedin_profile = data.linkedin_url;
  }
  if (data.dob !== undefined && data.date_of_birth === undefined) {
    repoData.date_of_birth = data.dob;
  }
  if (data.fatherName !== undefined && data.father_name === undefined) {
    repoData.father_name = data.fatherName;
  }

  // Detect which fields changed
  const changes = [];
  for (const key in repoData) {
    let dbKey = key;
    if (key === 'registerNo') dbKey = 'register_no';
    if (key === 'date_of_birth') dbKey = 'date_of_birth';
    if (key === 'linkedin_profile') dbKey = 'linkedin_profile';
    if (repoData[key] !== undefined && String(alumni[dbKey] || '').trim() !== String(repoData[key] || '').trim()) {
      changes.push(key);
    }
  }

  const updated = await alumniRepository.update(alumniId, repoData);
  const changeDesc = changes.length > 0 ? ` (Fields changed: ${changes.join(', ')})` : '';

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ALUMNI_UPDATED',
    target: `Alumni#${alumniId}`,
    description: `Updated alumni ${alumni.name} (${alumni.register_no})${changeDesc}`
  });

  return updated;
}

async function submitProfessionalInfo(alumniId, info, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  // Update Alumni table basic fields from submitted info
  const alumniUpdate = {
    company: info.company || null,
    designation: info.designation || null,
    email: info.email || null,
    phone: info.phone || null,
    working_details: info.working_details || null,
    linkedin_profile: info.linkedin_url || info.linkedin_profile || null,
    father_name: info.father_name || info.fatherName || null,
    date_of_birth: info.date_of_birth || info.dob || null,
    secondary_email: info.secondary_email || null,
    secondary_phone: info.secondary_phone || null
  };

  // Detect which fields changed
  const changes = [];
  for (const key in alumniUpdate) {
    if (alumniUpdate[key] !== undefined && alumniUpdate[key] !== null && String(alumni[key] || '').trim() !== String(alumniUpdate[key] || '').trim()) {
      changes.push(key);
    }
  }

  await alumniRepository.update(alumniId, alumniUpdate);

  const professionalInfo = await alumniRepository.createProfessionalInfo({
    ...info,
    father_name: info.father_name || info.fatherName || null,
    alumni_id: alumniId,
    updated_by: currentUser.userId
  });

  // Auto-complete assignment when submitting
  const pool = await getPool();
  const assignmentResult = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .input('memberId', sql.Int, currentUser.userId)
    .query(`
      SELECT TOP 1 assignment_id FROM AlumniAssignments
      WHERE alumni_id = @alumniId AND (member_id = @memberId OR EXISTS (
        SELECT 1 FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = @memberId AND r.role_name IN ('ADMIN', 'LEADER')
      ))
    `);

  if (assignmentResult.recordset.length > 0) {
    const assignmentId = assignmentResult.recordset[0].assignment_id;
    await alumniRepository.updateAssignmentStatus(assignmentId, 'Completed');
  }

  const changeDesc = changes.length > 0 ? ` (Fields changed: ${changes.join(', ')})` : '';

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'PROFESSIONAL_INFO_SUBMITTED',
    target: `Alumni#${alumniId}`,
    description: `Professional info submitted for ${alumni.name} (${alumni.register_no})${changeDesc}`
  });

  return professionalInfo;
}

async function getMyAssignments(userId, role, { page, limit, onlyMe, search, department, batch, status, memberId }) {
  const p = computeOffset(page, limit);
  if (role === 'LEADER' && !onlyMe) {
    return alumniRepository.getAssignmentsByLeader(userId, { page: p.page, limit: p.limit, offset: p.offset, search, department, batch, status, memberId });
  }
  return alumniRepository.getAssignmentsByMember(userId, { page: p.page, limit: p.limit, offset: p.offset, search, department, batch, status });
}

async function updateAssignmentStatus(assignmentId, status, currentUser) {
  if (status !== 'Draft' && status !== 'Completed') {
    throw new Error('Status must be either "Draft" or "Completed"');
  }

  await alumniRepository.updateAssignmentStatus(assignmentId, status);

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ASSIGNMENT_STATUS_UPDATED',
    target: `Assignment#${assignmentId}`,
    description: `Assignment ${assignmentId} status changed to ${status}`
  });
}

async function getStats() {
  return alumniRepository.getStats();
}

async function saveDraft(alumniId, data, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  // Map linkedin_url -> linkedin_profile for Alumni table update
  const repoData = { ...data };
  if (data.linkedin_url !== undefined && data.linkedin_profile === undefined) {
    repoData.linkedin_profile = data.linkedin_url;
  }
  if (data.dob !== undefined && data.date_of_birth === undefined) {
    repoData.date_of_birth = data.dob;
  }
  if (data.fatherName !== undefined && data.father_name === undefined) {
    repoData.father_name = data.fatherName;
  }

  // Update Alumni table (basic fields that exist in Alumni table)
  await alumniRepository.update(alumniId, repoData);

  // Also save professional info data to ProfessionalInformation table
  try {
    await alumniRepository.createProfessionalInfo({
      alumni_id: parseInt(alumniId),
      name: data.name !== undefined ? data.name : alumni.name,
      department: data.department !== undefined ? data.department : alumni.department,
      batch: data.batch !== undefined ? data.batch : alumni.batch,
      company: data.company !== undefined ? data.company : alumni.company,
      designation: data.designation !== undefined ? data.designation : alumni.designation,
      current_city: data.current_city !== undefined ? data.current_city : (data.city !== undefined ? data.city : alumni.city),
      state: data.state !== undefined ? data.state : alumni.state,
      country: data.country !== undefined ? data.country : alumni.country,
      email: data.email !== undefined ? data.email : alumni.email,
      phone: data.phone !== undefined ? data.phone : alumni.phone,
      linkedin_url: data.linkedin_url || data.linkedin_profile || alumni.linkedin_profile || null,
      higher_studies: data.higher_studies || null,
      is_entrepreneur: data.is_entrepreneur === true || data.is_entrepreneur === 'Yes' ? 1 : 0,
      is_government_job: data.is_government_job === true || data.is_government_job === 'Yes' ? 1 : 0,
      other_occupation: data.other_occupation || data.otherOcc || null,
      remarks: data.remarks || null,
      working_details: data.working_details || null,
      father_name: data.father_name || data.fatherName || alumni.father_name || null,
      updated_by: currentUser.userId
    });
  } catch (piErr) {
    // Don't fail the draft save if professional info fails
    console.error('Failed to save professional info on draft:', piErr.message);
  }

  const pool = await getPool();
  const assignmentResult = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .input('memberId', sql.Int, currentUser.userId)
    .query(`
      SELECT TOP 1 assignment_id FROM AlumniAssignments
      WHERE alumni_id = @alumniId AND (member_id = @memberId OR EXISTS (
        SELECT 1 FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = @memberId AND r.role_name IN ('ADMIN', 'LEADER')
      ))
    `);

  if (assignmentResult.recordset.length > 0) {
    const assignmentId = assignmentResult.recordset[0].assignment_id;
    await alumniRepository.updateAssignmentStatus(assignmentId, 'Draft');
  }

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'DRAFT_SAVED',
    target: `Alumni#${alumniId}`,
    description: `Draft saved for ${alumni.name} (${alumni.register_no})`
  });

  return { alumniId, status: 'Draft' };
}

async function submitAndComplete(alumniId, data, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  const professionalInfo = await alumniRepository.createProfessionalInfo({
    ...data,
    alumni_id: alumniId,
    updated_by: currentUser.userId
  });

  const pool = await getPool();
  const assignmentResult = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .input('memberId', sql.Int, currentUser.userId)
    .query(`
      SELECT TOP 1 assignment_id FROM AlumniAssignments
      WHERE alumni_id = @alumniId AND (member_id = @memberId OR EXISTS (
        SELECT 1 FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = @memberId AND r.role_name IN ('ADMIN', 'LEADER')
      ))
    `);

  if (assignmentResult.recordset.length > 0) {
    const assignmentId = assignmentResult.recordset[0].assignment_id;
    await alumniRepository.updateAssignmentStatus(assignmentId, 'Completed');
  }

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ALUMNI_COMPLETED',
    target: `Alumni#${alumniId}`,
    description: `Record completed for ${alumni.name} (${alumni.register_no})`
  });

  return professionalInfo;
}

async function getFilters() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT DISTINCT batch FROM Alumni WHERE batch IS NOT NULL AND batch != '' ORDER BY batch DESC;
  `);
  const result2 = await pool.request().query(`
    SELECT DISTINCT department FROM Alumni WHERE department IS NOT NULL AND department != '' ORDER BY department ASC;
  `);
  return {
    batches: result.recordset.map(r => r.batch),
    departments: result2.recordset.map(r => r.department)
  };
}

async function reopenAlumni(alumniId, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  await alumniRepository.reopenAlumniRecord(alumniId);

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'REOPEN_ASSIGNMENT',
    target: `Alumni#${alumniId}`,
    description: `Reopened record for ${alumni.name} (${alumni.register_no}) and returned to assignment`
  });

  return { alumniId, status: 'Draft' };
}

async function getAlumniHistory(alumniId) {
  return alumniRepository.getAlumniHistoryByAlumniId(alumniId);
}

module.exports = {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  submitProfessionalInfo,
  getMyAssignments,
  updateAssignmentStatus,
  getStats,
  getFilters,
  saveDraft,
  submitAndComplete,
  reopenAlumni,
  getAlumniHistory
};