const { sql, getPool } = require('../config/database');
const alumniRepository = require('../repositories/alumni.repository');
const { createAuditLog } = require('../helpers/audit');
const { NotFoundError, ConflictError } = require('../middleware/errorHandler');

function computeOffset(page, limit) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  return { page, limit, offset: (page - 1) * limit };
}

async function getAlumni({ page, limit, search, department, batch, status }) {
  const p = computeOffset(page, limit);
  return alumniRepository.findAll({ page: p.page, limit: p.limit, offset: p.offset, search, department, batch, status });
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

  const updated = await alumniRepository.update(alumniId, data);

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'ALUMNI_UPDATED',
    target: `Alumni#${alumniId}`,
    description: `Updated alumni ${alumni.name} (${alumni.register_no})`
  });

  return updated;
}

async function submitProfessionalInfo(alumniId, info, currentUser) {
  const alumni = await alumniRepository.findById(alumniId);
  if (!alumni) {
    throw new NotFoundError('Alumni');
  }

  const professionalInfo = await alumniRepository.createProfessionalInfo({
    ...info,
    alumni_id: alumniId,
    updated_by: currentUser.userId
  });

  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'PROFESSIONAL_INFO_SUBMITTED',
    target: `Alumni#${alumniId}`,
    description: `Professional info submitted for ${alumni.name} (${alumni.register_no})`
  });

  return professionalInfo;
}

async function getMyAssignments(userId, role, { page, limit, onlyMe }) {
  const p = computeOffset(page, limit);
  if (role === 'LEADER' && !onlyMe) {
    return alumniRepository.getAssignmentsByLeader(userId, { page: p.page, limit: p.limit, offset: p.offset });
  }
  return alumniRepository.getAssignmentsByMember(userId, { page: p.page, limit: p.limit, offset: p.offset });
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

  await alumniRepository.update(alumniId, data);

  const pool = await getPool();
  const assignmentResult = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .input('memberId', sql.Int, currentUser.userId)
    .query(`
      SELECT assignment_id FROM AlumniAssignments
      WHERE alumni_id = @alumniId AND member_id = @memberId
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
      SELECT assignment_id FROM AlumniAssignments
      WHERE alumni_id = @alumniId AND member_id = @memberId
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

module.exports = {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  submitProfessionalInfo,
  getMyAssignments,
  updateAssignmentStatus,
  getStats,
  saveDraft,
  submitAndComplete
};