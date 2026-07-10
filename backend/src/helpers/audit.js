const { sql, getPool } = require('../config/database');

async function createAuditLog({
  userId = null,
  username = null,
  roleName = null,
  action,
  target = null,
  description = null,
  ipAddress = null,
  userAgent = null,
  status = 'Success'
}) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('username', sql.NVarChar(100), username)
      .input('roleName', sql.NVarChar(30), roleName)
      .input('action', sql.NVarChar(100), action)
      .input('target', sql.NVarChar(255), target)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('ipAddress', sql.NVarChar(50), ipAddress)
      .input('userAgent', sql.NVarChar(500), userAgent)
      .input('status', sql.NVarChar(30), status)
      .query(`
        INSERT INTO AuditLogs (user_id, username, role_name, action, target, description, ip_address, user_agent, status)
        VALUES (@userId, @username, @roleName, @action, @target, @description, @ipAddress, @userAgent, @status)
      `);
  } catch (err) {
    const { logger } = require('../utils/logger');
    logger.error('Failed to create audit log', { error: err.message });
  }
}

async function createActivityLog(userId, activityType, description, metadata = null) {
  try {
    const pool = await getPool();
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('activityType', sql.NVarChar(100), activityType)
      .input('description', sql.NVarChar(sql.MAX), description)
      .input('metadata', sql.NVarChar(sql.MAX), metadata ? JSON.stringify(metadata) : null)
      .query(`
        INSERT INTO ActivityLogs (user_id, activity_type, description, metadata)
        VALUES (@userId, @activityType, @description, @metadata)
      `);
  } catch (err) {
    const { logger } = require('../utils/logger');
    logger.error('Failed to create activity log', { error: err.message });
  }
}

module.exports = { createAuditLog, createActivityLog };