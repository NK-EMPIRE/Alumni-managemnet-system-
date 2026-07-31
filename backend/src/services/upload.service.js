const uploadRepository = require('../repositories/upload.repository');
const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');

function runPythonImporter(filePath, stdinData = "", extraArgs = []) {
  return new Promise((resolve, reject) => {
    // Try environment python, process.env.PYTHON_PATH, or fallback list
    const pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const scriptPath = path.join(__dirname, 'import_engine', 'main.py');
    
    let child;
    try {
      child = spawn(pythonPath, [scriptPath, filePath, ...extraArgs]);
    } catch (err) {
      return reject(new AppError(`Failed to start Python process: ${err.message}. Ensure Python is installed and added to PATH.`, 500));
    }

    let stdoutData = '';
    let stderrData = '';

    // Handle spawn error explicitly so Node doesn't throw an unhandled 'error' event crash
    child.on('error', (err) => {
      logger.error('Python spawn error:', { error: err.message, path: pythonPath });
      reject(new AppError(`Python executable not found ('${pythonPath}'): ${err.message}. Please install Python 3.x on the server environment.`, 500));
    });

    if (child.stdin) {
      if (stdinData) {
        child.stdin.write(stdinData);
      }
      child.stdin.end();
    }

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });
    }

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new AppError(`Python importer failed with code ${code}. Error: ${stderrData}`, 400));
      }
      try {
        const parsed = JSON.parse(stdoutData);
        if (!parsed.success) {
          return reject(new AppError(parsed.error || 'Unknown importer error', 400));
        }
        resolve(parsed);
      } catch (err) {
        reject(new AppError(`Failed to parse Python importer output: ${err.message}`, 400));
      }
    });
  });
}

async function getFacultyAndAliasStdin(selectedSheets = []) {
  try {
    const data = await uploadRepository.getFacultiesAndAliases();
    if (selectedSheets && Array.isArray(selectedSheets) && selectedSheets.length > 0) {
      data.sheets = selectedSheets;
    }
    return JSON.stringify(data);
  } catch (err) {
    logger.warn('Failed to load faculty metadata for import engine: ' + err.message);
    return JSON.stringify({ sheets: selectedSheets });
  }
}

async function getExcelSheets(filePath) {
  const result = await runPythonImporter(filePath, "", ['--inspect-sheets']);
  return { sheets: result.sheets || [] };
}

async function processExcelImport(filePath, originalName, currentUser, selectedSheets = []) {
  const startTime = Date.now();
  const stdinData = await getFacultyAndAliasStdin(selectedSheets);
  const importerResult = await runPythonImporter(filePath, stdinData);
  const { summary, records, errors, unmappedColumns } = importerResult;

  const totalRows = summary.totalRecords;
  const newRows = [];
  let duplicateCount = summary.duplicates;
  let mergedCount = 0;
  let skippedCount = 0;

  const pendingAliasReviewMap = {}; // Use map to deduplicate by excelName

  for (const row of records) {
    const existing = await uploadRepository.findByRegisterNo(row.registerNo);
    if (existing) {
      const fieldsToUpdate = {};
      const checkFields = [
        'name', 'email', 'phone', 'department', 'batch', 'gender', 
        'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 
        'designation', 'facultyAssigned', 'fatherName', 'facultyId',
        'experience', 'salary', 'city', 'country', 'address', 'state',
        'secondaryPhone', 'secondaryEmail'
      ];
      
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f === 'facultyAssigned' ? 'faculty_assigned' :
                        f === 'fatherName' ? 'father_name' :
                        f === 'facultyId' ? 'resolved_faculty_user_id' :
                        f === 'secondaryPhone' ? 'secondary_phone' :
                        f === 'secondaryEmail' ? 'secondary_email' :
                        f.replace(/([A-Z])/g, '_$1').toLowerCase();

        const incomingVal = row[f];
        const existingVal = existing[dbField];

        if (incomingVal !== null && incomingVal !== undefined && String(incomingVal).trim() !== '') {
          if (existingVal === null || existingVal === undefined || String(existingVal).trim() === '' || String(existingVal).trim() !== String(incomingVal).trim()) {
            fieldsToUpdate[dbField] = incomingVal;
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
      if (!row.registerNo || !row.name || !row.department || !row.batch) {
        errors.push({
          sheet: row.sheet,
          row: 0,
          registerNo: row.registerNo || '-',
          errorType: "Missing Fields",
          errorDescription: `Record ${row.registerNo || '-'} is missing Name, Department, or Batch for insertion.`
        });
        continue;
      }
      newRows.push(row);
    }

    // Auto-learn alias ONLY if confidence >= 95% (facultyAliasToSave is populated)
    if (row.facultyId && row.facultyAliasToSave) {
      await uploadRepository.saveFacultyAlias(row.facultyId, row.facultyAliasToSave.toLowerCase());
    }

    // Accumulate pending reviews if confidence is 80-95%
    if (row.facultyId && row.facultyAliasPendingReview) {
      const aliasName = row.facultyAliasPendingReview.toLowerCase();
      if (!pendingAliasReviewMap[aliasName]) {
        pendingAliasReviewMap[aliasName] = {
          excelName: row.facultyAliasPendingReview,
          suggestedLeaderId: row.facultyId,
          suggestedLeaderName: row.facultyAssigned,
          confidence: row.facultyConfidence
        };
      }
    }
  }

  const finalStatus = errors.length > 0 ? 'Partial' : 'Completed';
  const durationSec = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));
  
  const pendingAliasReview = Object.values(pendingAliasReviewMap);

  const importLog = await uploadRepository.createImportLog({
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
    status: finalStatus,
    durationSec
  });

  if (newRows.length > 0) {
    await uploadRepository.batchInsertAlumni(newRows, importLog.import_id);
  }

  logger.auditLog('EXCEL_IMPORTED', {
    fileName: filePath.split('\\').pop().split('/').pop(),
    imported: newRows.length,
    merged: mergedCount,
    skipped: skippedCount,
    duplicates: duplicateCount,
    errors: errors.length
  });

  return {
    success: true,
    summary: {
      totalSheets: summary.totalSheets,
      totalRows,
      imported: newRows.length,
      merged: mergedCount,
      skipped: skippedCount,
      duplicates: duplicateCount,
      errors: errors.length,
      executionTime: summary.executionTime
    },
    errors,
    unmappedColumns: unmappedColumns || [],
    pendingAliasReview
  };
}

async function getExcelPreview(filePath, selectedSheets = []) {
  const stdinData = await getFacultyAndAliasStdin(selectedSheets);
  const importerResult = await runPythonImporter(filePath, stdinData);
  const { records, errors } = importerResult;

  const preview = [];

  for (const err of errors) {
    preview.push({
      sheet: err.sheet,
      registerNo: err.registerNo,
      name: err.name || '-',
      department: err.department || '-',
      batch: err.batch || '-',
      dateOfBirth: err.dateOfBirth || '-',
      action: 'Skip',
      reason: err.errorDescription
    });
  }

  for (const row of records) {
    const existing = await uploadRepository.findByRegisterNo(row.registerNo);
    if (existing) {
      const fieldsToUpdate = {};
      const checkFields = [
        'name', 'email', 'phone', 'department', 'batch', 'gender', 
        'dateOfBirth', 'workingDetails', 'linkedinProfile', 'company', 
        'designation', 'facultyAssigned', 'fatherName', 'facultyId',
        'experience', 'salary', 'city', 'country', 'address', 'state',
        'secondaryPhone', 'secondaryEmail'
      ];
      
      checkFields.forEach(f => {
        const dbField = f === 'dateOfBirth' ? 'date_of_birth' :
                        f === 'workingDetails' ? 'working_details' :
                        f === 'linkedinProfile' ? 'linkedin_profile' :
                        f === 'facultyAssigned' ? 'faculty_assigned' :
                        f === 'fatherName' ? 'father_name' :
                        f === 'facultyId' ? 'resolved_faculty_user_id' :
                        f === 'secondaryPhone' ? 'secondary_phone' :
                        f === 'secondaryEmail' ? 'secondary_email' :
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
          dateOfBirth: row.dateOfBirth || existing.date_of_birth || '-',
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
          dateOfBirth: row.dateOfBirth || existing.date_of_birth || '-',
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
          dateOfBirth: row.dateOfBirth || '-',
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
          dateOfBirth: row.dateOfBirth || '-',
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

async function confirmAlias(leaderId, excelName) {
  return uploadRepository.saveFacultyAlias(leaderId, excelName.toLowerCase());
}

async function rollbackImport(importId, currentUser = null) {
  const deletedCount = await uploadRepository.rollbackImportLog(importId);

  logger.info(`Excel import batch #${importId} rolled back successfully. ${deletedCount} records removed.`);

  logger.auditLog('EXCEL_IMPORT_ROLLED_BACK', {
    importId,
    deletedCount,
    rolledBackBy: currentUser ? currentUser.userId : null
  });

  return { importId, deletedCount };
}

module.exports = {
  processExcelImport,
  getExcelPreview,
  getExcelSheets,
  getImportHistory,
  confirmAlias,
  rollbackImport
};