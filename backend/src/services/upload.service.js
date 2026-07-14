const uploadRepository = require('../repositories/upload.repository');
const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

function runPythonImporter(filePath) {
  return new Promise((resolve, reject) => {
    const pythonPath = 'python';
    const scriptPath = path.join(__dirname, '..', 'utils', 'excel_importer.py');
    const child = spawn(pythonPath, [scriptPath, filePath]);

    let stdoutData = '';
    let stderrData = '';

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

async function processExcelImport(filePath, currentUser) {
  const importerResult = await runPythonImporter(filePath);
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
        await uploadRepository.updateAlumniFields(existing.alumni_id, fieldsToUpdate);
        mergedCount++;
      } else {
        skippedCount++;
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
  }

  if (newRows.length > 0) {
    await uploadRepository.batchInsertAlumni(newRows);
  }

  const finalStatus = errors.length > 0 ? 'Partial' : 'Completed';
  
  await uploadRepository.createImportLog({
    fileName: filePath.split('\\').pop().split('/').pop(),
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
  const importerResult = await runPythonImporter(filePath);
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