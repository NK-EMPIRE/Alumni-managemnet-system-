const { sql, getPool } = require('../config/database');

async function findAll({ page, limit, offset, action, role, dateFrom, dateTo, target }) {
  const pool = await getPool();
  let countQuery = 'SELECT COUNT(*) AS total FROM AuditLogs WHERE 1=1';
  let dataQuery = `
    SELECT
      log_id AS audit_id, user_id, username, role_name, action, target,
      description, ip_address, user_agent, status, created_at
    FROM AuditLogs WHERE 1=1`;
  const inputs = [];

  if (action && action !== 'all') {
    countQuery += ' AND action = @action';
    dataQuery += ' AND action = @action';
    inputs.push({ name: 'action', type: sql.NVarChar(100), value: action });
  }
  if (role && role !== 'all') {
    countQuery += ' AND role_name = @role';
    dataQuery += ' AND role_name = @role';
    inputs.push({ name: 'role', type: sql.NVarChar(30), value: role });
  }
  if (target) {
    countQuery += ' AND target = @target';
    dataQuery += ' AND target = @target';
    inputs.push({ name: 'target', type: sql.NVarChar(255), value: target });
  }
  if (dateFrom) {
    countQuery += ' AND created_at >= @dateFrom';
    dataQuery += ' AND created_at >= @dateFrom';
    inputs.push({ name: 'dateFrom', type: sql.DateTime2, value: new Date(dateFrom) });
  }
  if (dateTo) {
    countQuery += ' AND created_at <= @dateTo';
    dataQuery += ' AND created_at <= @dateTo';
    inputs.push({ name: 'dateTo', type: sql.DateTime2, value: new Date(dateTo + 'T23:59:59.999Z') });
  }

  dataQuery += ' ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';

  const countReq = pool.request();
  const dataReq = pool.request();
  inputs.forEach(inp => {
    countReq.input(inp.name, inp.type, inp.value);
    dataReq.input(inp.name, inp.type, inp.value);
  });
  countReq.input('offset', sql.Int, offset);
  countReq.input('limit', sql.Int, limit);
  dataReq.input('offset', sql.Int, offset);
  dataReq.input('limit', sql.Int, limit);

  const [countResult, dataResult] = await Promise.all([
    countReq.query(countQuery),
    dataReq.query(dataQuery)
  ]);

  return { total: countResult.recordset[0].total, rows: dataResult.recordset };
}

module.exports = { findAll };
