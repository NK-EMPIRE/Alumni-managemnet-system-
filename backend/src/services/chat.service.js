const { getPool, sql } = require('../config/database');

async function getMessages({ limit = 50, sinceId }) {
  const pool = await getPool();
  const request = pool.request();

  let query = `
    SELECT TOP (${parseInt(limit, 10) || 50})
           m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
           (u.first_name + ' ' + u.last_name) AS sender_name,
           r.role_name AS sender_role, u.department AS sender_department
    FROM dbo.WorkspaceMessages m
    JOIN dbo.Users u ON m.user_id = u.user_id
    LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
  `;

  if (sinceId && !isNaN(parseInt(sinceId, 10))) {
    query += ` WHERE m.message_id > @sinceId`;
    request.input('sinceId', sql.Int, parseInt(sinceId, 10));
  }

  query += ` ORDER BY m.message_id DESC`;

  const res = await request.query(query);
  return res.recordset.reverse();
}

async function sendMessage({ userId, messageText, attachmentUrl }) {
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const pool = await getPool();
  const insertRes = await pool.request()
    .input('userId', sql.Int, userId)
    .input('messageText', sql.NVarChar(sql.MAX), messageText.trim())
    .input('attachmentUrl', sql.VarChar(500), attachmentUrl || null)
    .query(`
      INSERT INTO dbo.WorkspaceMessages (user_id, message_text, attachment_url, created_at)
      OUTPUT INSERTED.message_id, INSERTED.created_at
      VALUES (@userId, @messageText, @attachmentUrl, GETUTCDATE());
    `);

  const newId = insertRes.recordset[0].message_id;

  const detailRes = await pool.request()
    .input('messageId', sql.Int, newId)
    .query(`
      SELECT m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             r.role_name AS sender_role, u.department AS sender_department
      FROM dbo.WorkspaceMessages m
      JOIN dbo.Users u ON m.user_id = u.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      WHERE m.message_id = @messageId
    `);

  return detailRes.recordset[0];
}

module.exports = {
  getMessages,
  sendMessage
};
