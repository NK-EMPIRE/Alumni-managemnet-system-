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

      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'WorkspaceMessages' AND COLUMN_NAME = 'team_id'
      )
      BEGIN
        ALTER TABLE dbo.WorkspaceMessages ADD team_id INT NULL;
      END
    `);
    _columnChecked = true;
  } catch (e) {
    console.error('Error ensuring channel_type / team_id columns:', e.message);
  }
}

async function getUserTeamIds(pool, userId) {
  const req = pool.request();
  req.input('userId', sql.Int, userId);
  const result = await req.query(`
    SELECT team_id FROM dbo.Teams WHERE leader_id = @userId AND is_active = 1
    UNION
    SELECT team_id FROM dbo.TeamMembers WHERE user_id = @userId
  `);
  return result.recordset.map(r => r.team_id);
}

async function getMessages({ reqUser, limit = 50, sinceId, channelType = 'global', teamId }) {
  const pool = await getPool();
  await ensureChannelColumn(pool);
  const request = pool.request();

  const channel = (channelType === 'team') ? 'team' : 'global';
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  const isAdmin = userRole.includes('ADMIN');

  if (channel === 'team') {
    // Admin or unauthenticated users must NOT view team chat
    if (isAdmin || !reqUser || !reqUser.userId) {
      return [];
    }

    const teamIds = await getUserTeamIds(pool, reqUser.userId);
    if (!teamIds || teamIds.length === 0) {
      return [];
    }

    let teamCondition = '';
    const parsedTeamId = teamId ? parseInt(teamId, 10) : null;
    if (parsedTeamId && teamIds.includes(parsedTeamId)) {
      request.input('targetTeamId', sql.Int, parsedTeamId);
      teamCondition = `m.team_id = @targetTeamId`;
    } else {
      const teamIdInputs = teamIds.map((id, idx) => {
        const paramName = `teamId_${idx}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
      }).join(',');
      teamCondition = `m.team_id IN (${teamIdInputs})`;
    }

    let query = `
      SELECT TOP (${parseInt(limit, 10) || 50})
             m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
             ISNULL(m.channel_type, 'global') AS channel_type, m.team_id,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             r.role_name AS sender_role, u.department AS sender_department,
             t.team_name AS sender_team_name
      FROM dbo.WorkspaceMessages m
      JOIN dbo.Users u ON m.user_id = u.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      LEFT JOIN dbo.Teams t ON m.team_id = t.team_id
      WHERE ISNULL(m.channel_type, 'global') = 'team'
        AND ${teamCondition}
    `;

    if (sinceId && !isNaN(parseInt(sinceId, 10))) {
      query += ` AND m.message_id > @sinceId`;
      request.input('sinceId', sql.Int, parseInt(sinceId, 10));
    }

    query += ` ORDER BY m.message_id DESC`;

    const res = await request.query(query);
    return res.recordset.reverse();
  }

  // Global channel messages ONLY
  let query = `
    SELECT TOP (${parseInt(limit, 10) || 50})
           m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
           ISNULL(m.channel_type, 'global') AS channel_type, m.team_id,
           (u.first_name + ' ' + u.last_name) AS sender_name,
           r.role_name AS sender_role, u.department AS sender_department,
           NULL AS sender_team_name
    FROM dbo.WorkspaceMessages m
    JOIN dbo.Users u ON m.user_id = u.user_id
    LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
    WHERE ISNULL(m.channel_type, 'global') = 'global'
  `;

  if (sinceId && !isNaN(parseInt(sinceId, 10))) {
    query += ` AND m.message_id > @sinceId`;
    request.input('sinceId', sql.Int, parseInt(sinceId, 10));
  }

  query += ` ORDER BY m.message_id DESC`;

  const res = await request.query(query);
  return res.recordset.reverse();
}

async function sendMessage({ reqUser, userId, messageText, attachmentUrl, channelType = 'global', teamId }) {
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const pool = await getPool();
  await ensureChannelColumn(pool);

  const channel = (channelType === 'team') ? 'team' : 'global';
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  const isAdmin = userRole.includes('ADMIN');

  let assignedTeamId = null;

  if (channel === 'team') {
    if (isAdmin) {
      throw new Error('Admins cannot send messages in team chat');
    }
    const teamIds = await getUserTeamIds(pool, userId);
    if (!teamIds || teamIds.length === 0) {
      throw new Error('You must be assigned to a team to send team chat messages');
    }
    const parsedTeamId = teamId ? parseInt(teamId, 10) : null;
    if (parsedTeamId && teamIds.includes(parsedTeamId)) {
      assignedTeamId = parsedTeamId;
    } else {
      assignedTeamId = teamIds[0];
    }
  }

  const insertRes = await pool.request()
    .input('userId', sql.Int, userId)
    .input('messageText', sql.NVarChar(sql.MAX), messageText.trim())
    .input('attachmentUrl', sql.VarChar(500), attachmentUrl || null)
    .input('channelType', sql.NVarChar(50), channel)
    .input('teamId', sql.Int, assignedTeamId)
    .query(`
      INSERT INTO dbo.WorkspaceMessages (user_id, message_text, attachment_url, channel_type, team_id, created_at)
      OUTPUT INSERTED.message_id, INSERTED.created_at
      VALUES (@userId, @messageText, @attachmentUrl, @channelType, @teamId, GETUTCDATE());
    `);

  const newId = insertRes.recordset[0].message_id;

  const detailRes = await pool.request()
    .input('messageId', sql.Int, newId)
    .query(`
      SELECT m.message_id, m.user_id, m.message_text, m.attachment_url, m.created_at,
             ISNULL(m.channel_type, 'global') AS channel_type, m.team_id,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             r.role_name AS sender_role, u.department AS sender_department,
             t.team_name AS sender_team_name
      FROM dbo.WorkspaceMessages m
      JOIN dbo.Users u ON m.user_id = u.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      LEFT JOIN dbo.Teams t ON m.team_id = t.team_id
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

async function clearMessages({ reqUser, channelType }) {
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  if (!userRole.includes('ADMIN')) {
    throw new Error('Only admins can clear chat messages');
  }
  const pool = await getPool();
  await ensureChannelColumn(pool);

  if (channelType && channelType !== 'all') {
    // 1. Nullify or delete Notifications that reference messages in this channel
    await pool.request()
      .input('channelType', sql.NVarChar(50), channelType)
      .query(`
        UPDATE dbo.Notifications
        SET source_message_id = NULL
        WHERE source_message_id IN (
          SELECT message_id FROM dbo.WorkspaceMessages WHERE channel_type = @channelType
        )
      `);
    // 2. Now safely delete the messages
    await pool.request()
      .input('channelType', sql.NVarChar(50), channelType)
      .query(`DELETE FROM dbo.WorkspaceMessages WHERE channel_type = @channelType`);
  } else {
    // 1. Nullify all Notifications referencing any message
    await pool.request().query(`
      UPDATE dbo.Notifications SET source_message_id = NULL
      WHERE source_message_id IS NOT NULL
    `);
    // 2. Delete all messages
    await pool.request().query(`DELETE FROM dbo.WorkspaceMessages`);
  }
  return true;
}

module.exports = {
  getMessages,
  sendMessage,
  clearMessages
};

