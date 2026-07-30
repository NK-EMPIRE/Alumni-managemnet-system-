const { getPool, sql } = require('../config/database');
const notificationService = require('./notification.service');

let _columnChecked = false;
async function ensureChannelColumn(pool) {
  if (_columnChecked) return;
  try {
    await pool.request().query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'WorkspaceMessages' AND COLUMN_NAME = 'channel_type'
      )
      BEGIN
        ALTER TABLE dbo.WorkspaceMessages ADD channel_type NVARCHAR(50) DEFAULT 'global';
      END
    `);
    _columnChecked = true;
  } catch (e) {
    console.error('Error ensuring channel_type column:', e.message);
  }
}

async function getMessages({ limit = 50, sinceId, channelType = 'global' }) {
  const pool = await getPool();
  await ensureChannelColumn(pool);
  const request = pool.request();

  const channel = (channelType === 'team') ? 'team' : 'global';
  request.input('channelType', sql.NVarChar(50), channel);

  let query = `
    SELECT TOP (${parseInt(limit, 10) || 50})
           m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
           ISNULL(m.channel_type, 'global') AS channel_type,
           (u.first_name + ' ' + u.last_name) AS sender_name,
           r.role_name AS sender_role, u.department AS sender_department
    FROM dbo.WorkspaceMessages m
    JOIN dbo.Users u ON m.user_id = u.user_id
    LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
    WHERE ISNULL(m.channel_type, 'global') = @channelType
  `;

  if (sinceId && !isNaN(parseInt(sinceId, 10))) {
    query += ` AND m.message_id > @sinceId`;
    request.input('sinceId', sql.Int, parseInt(sinceId, 10));
  }

  query += ` ORDER BY m.message_id DESC`;

  const res = await request.query(query);
  return res.recordset.reverse();
}

async function sendMessage({ userId, messageText, attachmentUrl, channelType = 'global' }) {
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const pool = await getPool();
  await ensureChannelColumn(pool);

  const channel = (channelType === 'team') ? 'team' : 'global';

  const insertRes = await pool.request()
    .input('userId', sql.Int, userId)
    .input('messageText', sql.NVarChar(sql.MAX), messageText.trim())
    .input('attachmentUrl', sql.VarChar(500), attachmentUrl || null)
    .input('channelType', sql.NVarChar(50), channel)
    .query(`
      INSERT INTO dbo.WorkspaceMessages (user_id, message_text, attachment_url, channel_type, created_at)
      OUTPUT INSERTED.message_id, INSERTED.created_at
      VALUES (@userId, @messageText, @attachmentUrl, @channelType, GETUTCDATE());
    `);

  const newId = insertRes.recordset[0].message_id;

  const detailRes = await pool.request()
    .input('messageId', sql.Int, newId)
    .query(`
      SELECT m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
             ISNULL(m.channel_type, 'global') AS channel_type,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             r.role_name AS sender_role, u.department AS sender_department
      FROM dbo.WorkspaceMessages m
      JOIN dbo.Users u ON m.user_id = u.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      WHERE m.message_id = @messageId
    `);

  const savedMessage = detailRes.recordset[0];

  // Fire-and-forget: detect LinkedIn URLs in global messages and create notifications.
  // Never awaited — a detection error must never break the send response.
  if (channel === 'global') {
    notificationService.detectAndNotify(messageText.trim(), userId, newId);
  }

  return savedMessage;
}

module.exports = {
  getMessages,
  sendMessage
};

