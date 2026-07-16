const uploadRepository = require('../repositories/upload.repository');
const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

function runPythonImporter(filePath, stdinData = "") {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '..', 'utils', 'excel_importer.py');
    const child = spawn(pythonPath, [scriptPath, filePath]);

    let stdoutData = '';
    let stderrData = '';

    if (stdinData) {
      child.stdin.write(stdinData);
    }
    child.stdin.end();

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python importer failed with code ${code}. Error: ${stderrData}`));
      }
      try {
        const parsed = JSON.parse(stdoutData);
        if (!parsed.success) {
          return reject(new Error(parsed.error || 'Unknown importer error'));
        }
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse Python importer output: ${err.message}. Output was: ${stdoutData}`));
      }
    });
  });
}

async function getFacultyAndAliasStdin() {
  try {
    const data = await uploadRepository.getFacultiesAndAliases();
    return JSON.stringify(data);
  } catch (err) {
    logger.warn('Failed to load faculty metadata for import engine: ' + err.message);
    return '{}';
  }
}

async function processExcelImport(filePath, originalName, currentUser) {
  const stdinData = await getFacultyAndAliasStdin();
  const importerResult = await runPythonImporter(filePath, stdinData);
  const { summary, records, errors } = importerResult;

  const totalRows = summary.totalRecords;
  const newRows = [];
  let duplicateCount = summary.duplicates;
  let mergedCount = 0;
  let skippedCount = 0;

  for (const row of records) {
    const existing = await uploadRepository.findByRegisterNo(row.registerNo);
    if (existing) {
      const fieldsToUpdate = {};
      const checkFields = ['name', 'email', 'phone', 'department', 'batch', 'gender', 'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 'designation', 'facultyAssigned', 'fatherName'];
      
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f === 'facultyAssigned' ? 'faculty_assigned' :
                        f === 'fatherName' ? 'father_name' :
                        f.replace(/([A-Z])/g, '_$1').toLowerCase();

        const incomingVal = row[f];
        const existingVal = existing[dbField];

        if (incomingVal !== null && incomingVal !== undefined && String(incomingVal).trim() !== '') {
          if (existingVal === null || existingVal === undefined || String(existingVal).trim() === '' || String(existingVal).trim() !== String(incomingVal).trim()) {
            fieldsToUpdate[dbField] = String(incomingVal).trim();
          }
        }
      });

      if (Object.keys(fieldsToUpdate).length > 0) {
        await uploadRepository.updateAlumniFields(existing.alumni_id, fieldsToUpdate);
        mergedCount++;
      } else {
        skippedCount++;
      }
      
      // Update AlumniAssignments if resolved facultyId is present
      if (row.facultyId) {
        const { getPool } = require('../config/database');
        const sql = require('mssql');
        const pool = await getPool();
        
        // Find existing assignment
        const checkAssign = await pool.request()
          .input('alumniId', sql.Int, existing.alumni_id)
          .query('SELECT assignment_id, member_id FROM AlumniAssignments WHERE alumni_id = @alumniId');
        
        if (checkAssign.recordset.length > 0) {
          const assignId = checkAssign.recordset[0].assignment_id;
          const currentMember = checkAssign.recordset[0].member_id;
          
          // Reassign directly to leader if not already assigned to someone else
          if (!currentMember) {
            await pool.request()
              .input('assignId', sql.Int, assignId)
              .input('leaderId', sql.Int, row.facultyId)
              .query('UPDATE AlumniAssignments SET member_id = NULL, status = \'ASSIGNED_TO_LEADER\' WHERE assignment_id = @assignId');
          }
        } else {
          // Find team_id for this leader
          const teamRes = await pool.request()
            .input('leaderId', sql.Int, row.facultyId)
            .query('SELECT team_id FROM Teams WHERE leader_id = @leaderId AND is_active = 1');
          
          if (teamRes.recordset.length > 0) {
            const teamId = teamRes.recordset[0].team_id;
            await pool.request()
              .input('alumniId', sql.Int, existing.alumni_id)
              .input('teamId', sql.Int, teamId)
              .input('assignedBy', sql.Int, currentUser.userId)
              .query(`
                INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date, assigned_by, assignment_type)
                VALUES (@alumniId, @teamId, NULL, 'ASSIGNED_TO_LEADER', GETUTCDATE(), @assignedBy, 'ADMIN_TO_LEADER')
              `);
          }
        }
      }
    } else {
      if (!row.name || !row.department || !row.batch) {
        errors.push({
          sheet: row.sheet,
          row: 0,
          registerNo: row.registerNo,
          errorType: "Missing Fields",
          errorDescription: `Record ${row.registerNo} is missing Name, Department, or Batch for insertion.`
        });
        continue;
      }
      newRows.push(row);
    }

    // Auto-learn alias if flagged high/medium confidence
    if (row.facultyId && row.facultyAliasToSave) {
      await uploadRepository.saveFacultyAlias(row.facultyId, row.facultyAliasToSave.toLowerCase());
    }
  }

  if (newRows.length > 0) {
    await uploadRepository.batchInsertAlumni(newRows);
    
    // Create initial assignments for newly inserted records
    const { getPool } = require('../config/database');
    const sql = require('mssql');
    const pool = await getPool();
    
    for (const record of newRows) {
      if (record.facultyId) {
        const alumniRes = await uploadRepository.findByRegisterNo(record.registerNo);
        if (alumniRes) {
          const teamRes = await pool.request()
            .input('leaderId', sql.Int, record.facultyId)
            .query('SELECT team_id FROM Teams WHERE leader_id = @leaderId AND is_active = 1');
          
          if (teamRes.recordset.length > 0) {
            const teamId = teamRes.recordset[0].team_id;
            await pool.request()
              .input('alumniId', sql.Int, alumniRes.alumni_id)
              .input('teamId', sql.Int, teamId)
              .input('assignedBy', sql.Int, currentUser.userId)
              .query(`
                INSERT INTO AlumniAssignments (alumni_id, team_id, member_id, status, assigned_date, assigned_by, assignment_type)
                VALUES (@alumniId, @teamId, NULL, 'ASSIGNED_TO_LEADER', GETUTCDATE(), @assignedBy, 'ADMIN_TO_LEADER')
              `);
          }
        }
      }
    }
  }

  const finalStatus = errors.length > 0 ? 'Partial' : 'Completed';
  
  await uploadRepository.createImportLog({
    fileName: filePath.split('\\').pop().split('/').pop(),
    originalName: originalName || null,
    totalRows,
    imported: newRows.length,
    merged: mergedCount,
    skipped: skippedCount,
    duplicates: duplicateCount,
    errors: errors.length,
    errorDetails: errors,
    importedBy: currentUser.userId,
    status: finalStatus
  });

  logger.auditLog('EXCEL_IMPORTED', {
    fileName: filePath.split('\\').pop().split('/').pop(),
    imported: newRows.length,
    merged: mergedCount,
    skipped: skippedCount,
    duplicates: duplicateCount,
    errors: errors.length,
    total: totalRows,
    userId: currentUser.userId
  });

  return {
    imported: newRows.length,
    merged: mergedCount,
    skipped: skippedCount,
    duplicates: duplicateCount,
    errors: errors.length,
    total: totalRows,
    summary,
    errorReport: errors
  };
}

async function getExcelPreview(filePath) {
  const stdinData = await getFacultyAndAliasStdin();
  const importerResult = await runPythonImporter(filePath, stdinData);
  const { records, errors } = importerResult;

  const preview = [];

  for (const err of errors) {
    preview.push({
      sheet: err.sheet,
      registerNo: err.registerNo,
      name: '-',
      department: '-',
      batch: '-',
      action: 'Skip',
      reason: err.errorDescription
    });
  }

  for (const row of records) {
    const existing = await uploadRepository.findByRegisterNo(row.registerNo);
    if (existing) {
      const fieldsToUpdate = {};
      const checkFields = ['name', 'email', 'phone', 'department', 'batch', 'gender', 'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 'designation', 'facultyAssigned'];
      
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f === 'facultyAssigned' ? 'faculty_assigned' :
                        f.replace(/([A-Z])/g, '_$1').toLowerCase();

        const incomingVal = row[f];
        const existingVal = existing[dbField];

        if (incomingVal !== null && incomingVal !== undefined && String(incomingVal).trim() !== '') {
          if (existingVal === null || existingVal === undefined || String(existingVal).trim() === '' || String(existingVal).trim() !== String(incomingVal).trim()) {
            fieldsToUpdate[dbField] = String(incomingVal).trim();
          }
        }
      });

      if (Object.keys(fieldsToUpdate).length > 0) {
        preview.push({
          sheet: row.sheet,
          registerNo: row.registerNo,
          name: row.name || existing.name || '-',
          department: row.department || existing.department || '-',
          batch: row.batch || existing.batch || '-',
          action: 'Update',
          reason: 'Updates: ' + Object.keys(fieldsToUpdate).join(', ')
        });
      } else {
        preview.push({
          sheet: row.sheet,
          registerNo: row.registerNo,
          name: row.name || existing.name || '-',
          department: row.department || existing.department || '-',
          batch: row.batch || existing.batch || '-',
          action: 'Skip',
          reason: 'No new or different values'
        });
      }
    } else {
      if (!row.name || !row.department || !row.batch) {
        preview.push({
          sheet: row.sheet,
          registerNo: row.registerNo,
          name: row.name || '-',
          department: row.department || '-',
          batch: row.batch || '-',
          action: 'Skip',
          reason: 'Missing Name/Dept/Batch for new record'
        });
      } else {
        preview.push({
          sheet: row.sheet,
          registerNo: row.registerNo,
          name: row.name,
          department: row.department,
          batch: row.batch,
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