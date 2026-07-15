const { sql, getPool } = require('../config/database');

async function findByLoginId(loginId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('loginId', sql.NVarChar(150), loginId)
    .query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email,
        u.phone, u.password_hash, u.is_active, u.role_id,
        r.role_name, u.leader_id
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      WHERE u.email = @loginId AND u.deleted_at IS NULL
    `);
  return result.recordset[0];
}

async function findById(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email,
        u.phone, u.password_hash, u.role_id, r.role_name, u.leader_id,
        u.is_active, u.last_login, u.created_at, u.updated_at
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      WHERE u.user_id = @userId AND u.deleted_at IS NULL
    `);
  return result.recordset[0];
}

async function updatePassword(userId, passwordHash) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .input('passwordHash', sql.VarChar(255), passwordHash)
    .query('UPDATE Users SET password_hash = @passwordHash, updated_at = GETUTCDATE() WHERE user_id = @userId');
  return result.rowsAffected[0];
}

async function updateLastLogin(userId) {
  const pool = await getPool();
  await pool.request()
    .input('userId', sql.Int, userId)
    .query('UPDATE Users SET last_login = GETUTCDATE() WHERE user_id = @userId');
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT user_id, first_name, last_name, email FROM Users WHERE email = @email AND deleted_at IS NULL');
  return result.recordset[0];
}

module.exports = {
  findByLoginId,
  findById,
  updatePassword,
  updateLastLogin,
  findByEmail
};