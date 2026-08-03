const { sql, getPool } = require('../config/database');

async function createImportLog({ fileName, originalName, totalRows, imported, merged, skipped, duplicates, errors, errorDetails, importedBy, status, durationSec }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('fileName', sql.NVarChar(255), fileName)
    .input('originalName', sql.NVarChar(500), originalName || null)
    .input('totalRows', sql.Int, totalRows)
    .input('imported', sql.Int, imported)
    .input('merged', sql.Int, merged || 0)
    .input('skipped', sql.Int, skipped || 0)
    .input('duplicates', sql.Int, duplicates)
    .input('errors', sql.Int, errors)
    .input('errorDetails', sql.NVarChar(sql.MAX), errorDetails ? JSON.stringify(errorDetails) : null)
    .input('importedBy', sql.Int, importedBy)
    .input('status', sql.NVarChar(50), status)
    .input('durationSec', sql.Decimal(10, 2), durationSec || null)
    .query(`
      INSERT INTO ImportHistory (file_name, original_name, total_rows, imported, merged, skipped, duplicates, errors, error_details, imported_by, status, duration_sec)
      OUTPUT INSERTED.*
      VALUES (@fileName, @originalName, @totalRows, @imported, @merged, @skipped, @duplicates, @errors, @errorDetails, @importedBy, @status, @durationSec)
    `);
  return result.recordset[0];
}

async function getImportHistory({ page, limit, offset }) {
  const pool = await getPool();
  const countResult = await pool.request()
    .query('SELECT COUNT(*) AS total FROM ImportHistory');
  const total = countResult.recordset[0].total;

  const result = await pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT
        ih.*,
        ISNULL(u.first_name + ' ' + u.last_name, 'System') AS importer_name
      FROM ImportHistory ih
      LEFT JOIN Users u ON ih.imported_by = u.user_id
      ORDER BY ih.created_at ASC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { total, rows: result.recordset };
}

async function batchInsertAlumni(records, importId = null) {
  const pool = await getPool();

  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = 'import_id'
    )
    BEGIN
      ALTER TABLE dbo.Alumni ADD import_id INT NULL;
    END
  `);

  // Create a new mssql Table object matching the Alumni table schema
  const table = new sql.Table('Alumni');
  
  // Add column structures matching the insert fields
  table.columns.add('register_no', sql.NVarChar(30), { nullable: false });
  table.columns.add('name', sql.NVarChar(150), { nullable: false });
  table.columns.add('email', sql.NVarChar(150), { nullable: true });
  table.columns.add('phone', sql.NVarChar(50), { nullable: true });
  table.columns.add('department', sql.NVarChar(100), { nullable: true });
  table.columns.add('batch', sql.NVarChar(20), { nullable: true });
  table.columns.add('gender', sql.NVarChar(10), { nullable: true });
  table.columns.add('date_of_birth', sql.NVarChar(20), { nullable: true });
  table.columns.add('working_details', sql.NVarChar(500), { nullable: true });
  table.columns.add('linkedin_profile', sql.NVarChar(255), { nullable: true });
  table.columns.add('company', sql.NVarChar(200), { nullable: true });
  table.columns.add('designation', sql.NVarChar(200), { nullable: true });
  table.columns.add('experience', sql.NVarChar(50), { nullable: true });
  table.columns.add('salary', sql.NVarChar(50), { nullable: true });
  table.columns.add('city', sql.NVarChar(100), { nullable: true });
  table.columns.add('country', sql.NVarChar(100), { nullable: true });
  table.columns.add('address', sql.NVarChar(500), { nullable: true });
  table.columns.add('state', sql.NVarChar(100), { nullable: true });
  table.columns.add('secondary_phone', sql.NVarChar(50), { nullable: true });
  table.columns.add('secondary_email', sql.NVarChar(150), { nullable: true });
  table.columns.add('faculty_assigned', sql.NVarChar(150), { nullable: true });
  table.columns.add('resolved_faculty_user_id', sql.Int, { nullable: true });
  table.columns.add('father_name', sql.NVarChar(150), { nullable: true });
  table.columns.add('import_id', sql.Int, { nullable: true });

  const { logger } = require('../utils/logger');

  // Populate row data
  for (const record of records) {
    if (!record.registerNo || String(record.registerNo).trim() === '' || String(record.registerNo).trim().toLowerCase() === 'null') {
      logger.warn('Skipping batch insert record due to missing or invalid registerNo: ' + JSON.stringify(record));
      continue;
    }
    const trunc = (val, max) => val ? String(val).trim().slice(0, max) : null;

    table.rows.add(
      trunc(record.registerNo, 30),
      trunc(record.name, 150),
      trunc(record.email, 150) || null,
      trunc(record.phone, 50) || null,
      trunc(record.department, 100) || null,
      trunc(record.batch, 20) || null,
      trunc(record.gender, 10) || null,
      trunc(record.dateOfBirth, 20) || null,
      trunc(record.workingDetails, 500) || null,
      trunc(record.linkedinProfile, 255) || null,
      trunc(record.company, 200) || null,
      trunc(record.designation, 200) || null,
      trunc(record.experience, 50) || null,
      trunc(record.salary, 50) || null,
      trunc(record.city, 100) || null,
      trunc(record.country, 100) || null,
      trunc(record.address, 500) || null,
      trunc(record.state, 100) || null,
      trunc(record.secondaryPhone || record.secondary_phone, 50) || null,
      trunc(record.secondaryEmail || record.secondary_email, 150) || null,
      trunc(record.facultyAssigned, 150) || null,
      record.facultyId || null,
      trunc(record.fatherName || record.father_name, 150) || null,
      importId || null
    );
  }

  // Perform bulk insert
  const request = pool.request();
  await request.bulk(table);
}

async function findByRegisterNo(registerNo) {
  const pool = await getPool();
  const result = await pool.request()
    .input('registerNo', sql.NVarChar(30), registerNo)
    .query('SELECT * FROM Alumni WHERE register_no = @registerNo');
  return result.recordset[0];
}

async function updateAlumniFields(alumniId, fields) {
  const pool = await getPool();
  const request = pool.request();
  request.input('alumniId', sql.Int, alumniId);
  
  const setClauses = [];
  Object.keys(fields).forEach((key, index) => {
    const rawVal = fields[key];
    if (typeof rawVal === 'number' || key === 'resolved_faculty_user_id') {
      request.input(`val_${index}`, sql.Int, rawVal ? parseInt(rawVal, 10) : null);
    } else {
      request.input(`val_${index}`, sql.NVarChar(sql.MAX), rawVal !== null && rawVal !== undefined ? String(rawVal) : null);
    }
    setClauses.push(`${key} = @val_${index}`);
  });

  const query = `UPDATE Alumni SET ${setClauses.join(', ')} WHERE alumni_id = @alumniId`;
  await request.query(query);
}

async function getFacultiesAndAliases() {
  const pool = await getPool();
  const faculties = await pool.request().query(`
    SELECT u.user_id AS userId, u.first_name + ' ' + u.last_name AS name, u.department
    FROM Users u
    INNER JOIN Roles r ON u.role_id = r.role_id
    WHERE r.role_name IN ('LEADER', 'MEMBER') AND u.deleted_at IS NULL AND u.is_active = 1
  `);
  
  const aliases = await pool.request().query(`
    SELECT faculty_id, alias_name FROM FacultyAliases
  `);
  
  return {
    faculties: faculties.recordset,
    aliases: aliases.recordset
  };
}

async function saveFacultyAlias(facultyId, aliasName) {
  const pool = await getPool();
  try {
    await pool.request()
      .input('facultyId', sql.Int, facultyId)
      .input('aliasName', sql.VarChar(255), aliasName)
      .query(`
        IF NOT EXISTS (SELECT * FROM FacultyAliases WHERE alias_name = @aliasName)
        BEGIN
          INSERT INTO FacultyAliases (faculty_id, alias_name) VALUES (@facultyId, @aliasName)
        END
      `);
    return true;
  } catch (err) {
    // Ignore duplicate key violations
    return false;
  }
}

async function rollbackImportLog(importId) {
  const pool = await getPool();

  await pool.request()
    .input('importId', sql.Int, importId)
    .query(`
      DELETE FROM AlumniAssignments 
      WHERE alumni_id IN (SELECT alumni_id FROM Alumni WHERE import_id = @importId)
    `);

  const deleteRes = await pool.request()
    .input('importId', sql.Int, importId)
    .query(`DELETE FROM Alumni WHERE import_id = @importId`);

  await pool.request()
    .input('importId', sql.Int, importId)
    .query(`UPDATE ImportHistory SET status = 'ROLLED_BACK' WHERE import_id = @importId`);

  return deleteRes.rowsAffected[0] || 0;
}

module.exports = {
  createImportLog,
  getImportHistory,
  batchInsertAlumni,
  findByRegisterNo,
  updateAlumniFields,
  getFacultiesAndAliases,
  saveFacultyAlias,
  rollbackImportLog
};
