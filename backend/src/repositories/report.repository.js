const { sql, getPool } = require('../config/database');

async function findAll({ page, limit, offset }) {
  const pool = await getPool();
  const countResult = await pool.request()
    .query('SELECT COUNT(*) AS total FROM Reports WHERE is_active = 1');
  const total = countResult.recordset[0].total;

  const result = await pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT
        r.report_id,
        r.report_name,
        r.report_type,
        r.parameters,
        r.format,
        r.generated_by,
        r.file_path,
        r.status,
        r.created_at,
        u.first_name + ' ' + u.last_name AS generator_name
      FROM Reports r
      INNER JOIN Users u ON r.generated_by = u.user_id
      WHERE r.is_active = 1
      ORDER BY r.created_at DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { total, rows: result.recordset };
}

async function findById(reportId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('reportId', sql.Int, reportId)
    .query(`
      SELECT
        r.*,
        u.first_name + ' ' + u.last_name AS generator_name
      FROM Reports r
      INNER JOIN Users u ON r.generated_by = u.user_id
      WHERE r.report_id = @reportId AND r.is_active = 1
    `);
  return result.recordset[0];
}

async function create({ reportName, reportType, parameters, format, generatedBy, filePath, status }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('reportName', sql.NVarChar(255), reportName)
    .input('reportType', sql.NVarChar(100), reportType)
    .input('parameters', sql.NVarChar(sql.MAX), parameters ? JSON.stringify(parameters) : null)
    .input('format', sql.NVarChar(50), format)
    .input('generatedBy', sql.Int, generatedBy)
    .input('filePath', sql.NVarChar(500), filePath)
    .input('status', sql.NVarChar(50), status)
    .query(`
      INSERT INTO Reports (report_name, report_type, parameters, format, generated_by, file_path, status)
      OUTPUT INSERTED.*
      VALUES (@reportName, @reportType, @parameters, @format, @generatedBy, @filePath, @status)
    `);
  return result.recordset[0];
}

async function removeReport(reportId) {
  const pool = await getPool();
  await pool.request()
    .input('reportId', sql.Int, reportId)
    .query('UPDATE Reports SET is_active = 0, updated_at = GETUTCDATE() WHERE report_id = @reportId');
}

async function findSchedules() {
  const pool = await getPool();
  const result = await pool.request()
    .query(`
      SELECT *
      FROM ScheduledReports
      WHERE is_active = 1
      ORDER BY next_run ASC
    `);
  return result.recordset;
}

async function createSchedule({ reportName, reportType, frequency, parameters, nextRun, createdBy }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('reportName', sql.NVarChar(255), reportName)
    .input('reportType', sql.NVarChar(100), reportType)
    .input('frequency', sql.NVarChar(50), frequency)
    .input('parameters', sql.NVarChar(sql.MAX), parameters ? JSON.stringify(parameters) : null)
    .input('nextRun', sql.DateTime2, nextRun)
    .input('createdBy', sql.Int, createdBy)
    .query(`
      INSERT INTO ScheduledReports (report_name, report_type, frequency, parameters, next_run, created_by)
      OUTPUT INSERTED.*
      VALUES (@reportName, @reportType, @frequency, @parameters, @nextRun, @createdBy)
    `);
  return result.recordset[0];
}

async function deleteSchedule(scheduleId) {
  const pool = await getPool();
  await pool.request()
    .input('scheduleId', sql.Int, scheduleId)
    .query('UPDATE ScheduledReports SET is_active = 0, updated_at = GETUTCDATE() WHERE schedule_id = @scheduleId');
}

module.exports = {
  findAll,
  findById,
  create,
  removeReport,
  findSchedules,
  createSchedule,
  deleteSchedule
};
