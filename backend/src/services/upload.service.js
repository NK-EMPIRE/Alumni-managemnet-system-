const uploadRepository = require('../repositories/upload.repository');
const XLSX = require('xlsx');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

function normalizeHeaders(row) {
  var map = {};
  Object.keys(row).forEach(function (key) {
    var k = key.trim().toLowerCase().replace(/[\s_-]+/g, '_').replace(/[^a-z0-9_]/g, '');
    map[k] = row[key];
  });
  return map;
}

async function processExcelImport(filePath, currentUser) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  const totalRows = rawRows.length;
  const validRows = [];
  const invalidRows = [];

  for (const raw of rawRows) {
    const row = normalizeHeaders(raw);

    var registerNo = row.register_no || row.reg_no || row.regno || row.registerno || row.registration_number || row.registrationnumber || row.roll_no || row.rollno || row.roll_number || row.enrollmentno || row.enrollment_no || null;
    var name = row.name || row.student_name || row.studentname || row.full_name || row.fullname || row.first_name || row.firstname || null;
    var email = row.email || row.mail || row.mail_id || row.mailid || row.e_mail || row.email_id || row.emailid || null;
    var phone = row.phone || row.mobile || row.mobile_no || row.mobileno || row.contact || row.contact_no || row.contactnumber || null;
    var department = row.department || row.dept || row.depart || row.branch || row.stream || row.course || null;
    var batch = row.batch || row.year || row.batch_year || row.batchyear || row.passing_year || row.passingyear || null;

    // Skip only if no register number
    if (!registerNo || String(registerNo).trim() === '' || String(registerNo).trim().toLowerCase() === 'null') {
      invalidRows.push({ row: raw, reason: 'Row ' + (invalidRows.length + validRows.length + 1) + ': Missing Reg.No. Columns found: ' + Object.keys(raw).join('|') });
      continue;
    }

    var lastName = row.last_name || row.lastname || row.surname || null;
    var fullName = name ? (lastName ? (name + ' ' + lastName).trim() : String(name).trim()) : null;

    var dateOfBirth = row.date_of_birth || row.dob || row.birth_date || row.birthdate || row.dateofbirth || null;
    var workingDetails = row.working_detail || row.working_details || row.work_detail || row.workdetails || null;
    var linkedinProfile = row.linkedin_profile || row.linkedin_url || row.linkedin || row.linkedinurl || row.linkedinfacebook || row.linkedin_facebook || row.facebook || null;
    var company = row.company || row.organization || row.org || row.employer || null;
    var designation = row.designation || row.role || row.position || row.job_title || row.jobtitle || null;
    var gender = row.gender || row.sex || null;

    validRows.push({
      registerNo: String(registerNo).trim(),
      name: fullName,
      email: email ? String(email).trim() : null,
      phone: phone ? String(phone).trim() : null,
      department: department ? String(department).trim() : null,
      batch: batch ? String(batch).trim() : null,
      gender: gender,
      dateOfBirth: dateOfBirth ? String(dateOfBirth).trim() : null,
      workingDetails: workingDetails ? String(workingDetails).trim() : null,
      linkedinProfile: linkedinProfile ? String(linkedinProfile).trim() : null,
      company: company ? String(company).trim() : null,
      designation: designation ? String(designation).trim() : null
    });
  }

  const newRows = [];
  let duplicateCount = 0;
  let mergedCount = 0;

  for (const row of validRows) {
    const existing = await uploadRepository.findByRegisterNo(row.registerNo);
    if (existing) {
      // Merge: update any non-null incoming field into the existing record
      const fieldsToUpdate = {};
      const checkFields = ['name', 'email', 'phone', 'department', 'batch', 'gender', 'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 'designation'];
      
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f.replace(/([A-Z])/g, '_$1').toLowerCase();

        const incomingVal = row[f];
        const existingVal = existing[dbField];

        // Update if incoming has value and is different from existing (or existing is null)
        if (incomingVal !== null && incomingVal !== undefined && String(incomingVal).trim() !== '') {
          if (existingVal === null || existingVal === undefined || String(existingVal).trim() === '' || String(existingVal).trim() !== String(incomingVal).trim()) {
            fieldsToUpdate[dbField] = String(incomingVal).trim();
          }
        }
      });

      if (Object.keys(fieldsToUpdate).length > 0) {
        await uploadRepository.updateAlumniFields(existing.alumni_id, fieldsToUpdate);
        mergedCount++;
      }
      duplicateCount++;
    } else {
      // For new inserts, require name, department, batch
      if (!row.name || !row.department || !row.batch) {
        invalidRows.push({ row: { register_no: row.registerNo }, reason: 'New record ' + row.registerNo + ': Missing required fields (Name/Dept/Batch) for insert.' });
        continue;
      }
      newRows.push(row);
    }
  }

  if (newRows.length > 0) {
    await uploadRepository.batchInsertAlumni(newRows);
  }

  var errorSummary = invalidRows.length > 0 ? invalidRows.map(function (r) { return r.reason; }).join('\n') : null;

  await uploadRepository.createImportLog({
    fileName: filePath.split('\\').pop().split('/').pop(),
    totalRows,
    imported: newRows.length,
    duplicates: duplicateCount,
    errors: invalidRows.length,
    errorDetails: errorSummary,
    importedBy: currentUser.userId,
    status: invalidRows.length > 0 ? 'Partial' : 'Completed'
  });

  logger.auditLog('EXCEL_IMPORTED', {
    fileName: filePath.split('\\').pop().split('/').pop(),
    imported: newRows.length,
    duplicates: duplicateCount,
    errors: invalidRows.length,
    total: totalRows,
    userId: currentUser.userId
  });

  return {
    imported: newRows.length,
    duplicates: duplicateCount,
    errors: invalidRows.length,
    total: totalRows
  };
}

async function getExcelPreview(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  const preview = [];

  for (const raw of rawRows) {
    const row = normalizeHeaders(raw);

    var registerNo = row.register_no || row.reg_no || row.regno || row.registerno || row.registration_number || row.registrationnumber || row.roll_no || row.rollno || row.roll_number || row.enrollmentno || row.enrollment_no || null;
    var name = row.name || row.student_name || row.studentname || row.full_name || row.fullname || row.first_name || row.firstname || null;
    var department = row.department || row.dept || row.depart || row.branch || row.stream || row.course || null;
    var batch = row.batch || row.year || row.batch_year || row.batchyear || row.passing_year || row.passingyear || null;

    if (!registerNo || String(registerNo).trim() === '' || String(registerNo).trim().toLowerCase() === 'null') {
      preview.push({
        registerNo: '-',
        name: name || '-',
        department: department || '-',
        batch: batch || '-',
        action: 'Skip',
        reason: 'Missing Register Number'
      });
      continue;
    }

    var lastName = row.last_name || row.lastname || row.surname || null;
    var fullName = name ? (lastName ? (name + ' ' + lastName).trim() : String(name).trim()) : null;

    var dateOfBirth = row.date_of_birth || row.dob || row.birth_date || row.birthdate || row.dateofbirth || null;
    var workingDetails = row.working_detail || row.working_details || row.work_detail || row.workdetails || null;
    var linkedinProfile = row.linkedin_profile || row.linkedin_url || row.linkedin || row.linkedinurl || row.linkedinfacebook || row.linkedin_facebook || row.facebook || null;
    var company = row.company || row.organization || row.org || row.employer || null;
    var designation = row.designation || row.role || row.position || row.job_title || row.jobtitle || null;
    var gender = row.gender || row.sex || null;

    const parsedRow = {
      registerNo: String(registerNo).trim(),
      name: fullName,
      email: row.email ? String(row.email).trim() : null,
      phone: row.phone ? String(row.phone).trim() : null,
      department: department ? String(department).trim() : null,
      batch: batch ? String(batch).trim() : null,
      gender: gender,
      dateOfBirth: dateOfBirth ? String(dateOfBirth).trim() : null,
      workingDetails: workingDetails ? String(workingDetails).trim() : null,
      linkedinProfile: linkedinProfile ? String(linkedinProfile).trim() : null,
      company: company ? String(company).trim() : null,
      designation: designation ? String(designation).trim() : null
    };

    const existing = await uploadRepository.findByRegisterNo(parsedRow.registerNo);
    if (existing) {
      const fieldsToUpdate = {};
      const checkFields = ['name', 'email', 'phone', 'department', 'batch', 'gender', 'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 'designation'];
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f.replace(/([A-Z])/g, '_$1').toLowerCase();
        const incomingVal = parsedRow[f];
        const existingVal = existing[dbField];
        if (incomingVal !== null && incomingVal !== undefined && String(incomingVal).trim() !== '') {
          if (existingVal === null || existingVal === undefined || String(existingVal).trim() === '' || String(existingVal).trim() !== String(incomingVal).trim()) {
            fieldsToUpdate[dbField] = String(incomingVal).trim();
          }
        }
      });

      if (Object.keys(fieldsToUpdate).length > 0) {
        preview.push({
          registerNo: parsedRow.registerNo,
          name: parsedRow.name || existing.name || '-',
          department: parsedRow.department || existing.department || '-',
          batch: parsedRow.batch || existing.batch || '-',
          action: 'Update',
          reason: 'Updates: ' + Object.keys(fieldsToUpdate).join(', ')
        });
      } else {
        preview.push({
          registerNo: parsedRow.registerNo,
          name: parsedRow.name || existing.name || '-',
          department: parsedRow.department || existing.department || '-',
          batch: parsedRow.batch || existing.batch || '-',
          action: 'Skip',
          reason: 'No new or different values'
        });
      }
    } else {
      if (!parsedRow.name || !parsedRow.department || !parsedRow.batch) {
        preview.push({
          registerNo: parsedRow.registerNo,
          name: parsedRow.name || '-',
          department: parsedRow.department || '-',
          batch: parsedRow.batch || '-',
          action: 'Skip',
          reason: 'Missing Name/Dept/Batch for new record'
        });
      } else {
        preview.push({
          registerNo: parsedRow.registerNo,
          name: parsedRow.name,
          department: parsedRow.department,
          batch: parsedRow.batch,
          action: 'Insert',
          reason: 'New alumni record'
        });
      }
    }
  }

  return preview;
}

async function getImportHistory({ page, limit }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const offset = (page - 1) * limit;
  const result = await uploadRepository.getImportHistory({ page, limit, offset });
  return { ...result, page, limit };
}

module.exports = {
  processExcelImport,
  getExcelPreview,
  getImportHistory
};