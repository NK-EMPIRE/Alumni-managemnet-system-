const { sql, getPool } = require('../config/database');

async function createImportLog({ fileName, totalRows, imported, duplicates, errors, errorDetails, importedBy, status }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('fileName', sql.NVarChar(255), fileName)
    .input('totalRows', sql.Int, totalRows)
    .input('imported', sql.Int, imported)
    .input('duplicates', sql.Int, duplicates)
    .input('errors', sql.Int, errors)
    .input('errorDetails', sql.NVarChar(sql.MAX), errorDetails ? JSON.stringify(errorDetails) : null)
    .input('importedBy', sql.Int, importedBy)
    .input('status', sql.NVarChar(50), status)
    .query(`
      INSERT INTO ImportHistory (file_name, total_rows, imported, duplicates, errors, error_details, imported_by, status)
      OUTPUT INSERTED.*
      VALUES (@fileName, @totalRows, @imported, @duplicates, @errors, @errorDetails, @importedBy, @status)
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
        u.first_name + ' ' + u.last_name AS importer_name
      FROM ImportHistory ih
      INNER JOIN Users u ON ih.imported_by = u.user_id
      ORDER BY ih.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { total, rows: result.recordset };
}

async function ensureColumn(pool, columnName, columnDef) {
  const query = `
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID('dbo.Alumni') AND name = '${columnName}'
    )
    BEGIN
      ALTER TABLE dbo.Alumni ADD ${columnName} ${columnDef};
    END
  `;
  await pool.request().query(query);
}

async function batchInsertAlumni(records) {
  const pool = await getPool();

  await ensureColumn(pool, 'date_of_birth', 'VARCHAR(20)');
  await ensureColumn(pool, 'working_details', 'VARCHAR(500)');
  await ensureColumn(pool, 'linkedin_profile', 'VARCHAR(255)');

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    for (const record of records) {
      if (!record.registerNo || String(record.registerNo).trim() === '' || String(record.registerNo).trim().toLowerCase() === 'null') {
        const { logger } = require('../utils/logger');
        logger.warn('Skipping batch insert record due to missing or invalid registerNo: ' + JSON.stringify(record));
        continue;
      }
      await transaction.request()
        .input('registerNo', sql.NVarChar(30), record.registerNo)
        .input('name', sql.NVarChar(150), record.name)
        .input('email', sql.NVarChar(150), record.email)
        .input('phone', sql.NVarChar(20), record.phone)
        .input('department', sql.NVarChar(50), record.department)
        .input('batch', sql.NVarChar(10), record.batch)
        .input('gender', sql.NVarChar(10), record.gender)
        .input('dob', sql.NVarChar(20), record.dateOfBirth || null)
        .input('workingDetails', sql.NVarChar(500), record.workingDetails || null)
        .input('linkedinProfile', sql.NVarChar(255), record.linkedinProfile || null)
        .input('company', sql.NVarChar(200), record.company || null)
        .input('designation', sql.NVarChar(200), record.designation || null)
        .query(`
          INSERT INTO Alumni (register_no, name, email, phone, department, batch, gender, date_of_birth, working_details, linkedin_profile, company, designation)
          VALUES (@registerNo, @name, @email, @phone, @department, @batch, @gender, @dob, @workingDetails, @linkedinProfile, @company, @designation)
        `);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
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
    request.input(`val_${index}`, sql.NVarChar(sql.MAX), fields[key]);
    setClauses.push(`${key} = @val_${index}`);
  });

  const query = `UPDATE Alumni SET ${setClauses.join(', ')} WHERE alumni_id = @alumniId`;
  await request.query(query);
}

module.exports = {
  createImportLog,
  getImportHistory,
  batchInsertAlumni,
  findByRegisterNo,
  updateAlumniFields
};
