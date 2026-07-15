const { sql, getPool } = require('../config/database');

async function createImportLog({ fileName, originalName, totalRows, imported, merged, skipped, duplicates, errors, errorDetails, importedBy, status }) {
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
    .query(`
      INSERT INTO ImportHistory (file_name, original_name, total_rows, imported, merged, skipped, duplicates, errors, error_details, imported_by, status)
      OUTPUT INSERTED.*
      VALUES (@fileName, @originalName, @totalRows, @imported, @merged, @skipped, @duplicates, @errors, @errorDetails, @importedBy, @status)
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
  await ensureColumn(pool, 'father_name', 'VARCHAR(150)');

  // Also ensure father_name is in ProfessionalInformation table
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT * FROM sys.columns 
      WHERE object_id = OBJECT_ID('dbo.ProfessionalInformation') AND name = 'father_name'
    )
    BEGIN
      ALTER TABLE dbo.ProfessionalInformation ADD father_name VARCHAR(150) NULL;
    END
  `);

  // Create a new mssql Table object matching the Alumni table schema
  const table = new sql.Table('Alumni');
  
  // Add column structures matching the insert fields
  table.columns.add('register_no', sql.NVarChar(30), { nullable: false });
  table.columns.add('name', sql.NVarChar(150), { nullable: false });
  table.columns.add('email', sql.NVarChar(150), { nullable: true });
  table.columns.add('phone', sql.NVarChar(20), { nullable: true });
  table.columns.add('department', sql.NVarChar(50), { nullable: true });
  table.columns.add('batch', sql.NVarChar(10), { nullable: true });
  table.columns.add('gender', sql.NVarChar(10), { nullable: true });
  table.columns.add('date_of_birth', sql.NVarChar(20), { nullable: true });
  table.columns.add('working_details', sql.NVarChar(500), { nullable: true });
  table.columns.add('linkedin_profile', sql.NVarChar(255), { nullable: true });
  table.columns.add('company', sql.NVarChar(200), { nullable: true });
  table.columns.add('designation', sql.NVarChar(200), { nullable: true });
  table.columns.add('faculty_assigned', sql.NVarChar(150), { nullable: true });
  table.columns.add('father_name', sql.NVarChar(150), { nullable: true });

  const { logger } = require('../utils/logger');

  // Populate row data
  for (const record of records) {
    if (!record.registerNo || String(record.registerNo).trim() === '' || String(record.registerNo).trim().toLowerCase() === 'null') {
      logger.warn('Skipping batch insert record due to missing or invalid registerNo: ' + JSON.stringify(record));
      continue;
    }
    table.rows.add(
      record.registerNo,
      record.name,
      record.email || null,
      record.phone || null,
      record.department || null,
      record.batch || null,
      record.gender || null,
      record.dateOfBirth || null,
      record.workingDetails || null,
      record.linkedinProfile || null,
      record.company || null,
      record.designation || null,
      record.facultyAssigned || null,
      record.fatherName || record.father_name || null
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
