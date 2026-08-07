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

      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'WorkspaceMessages' AND COLUMN_NAME = 'recipient_id'
      )
      BEGIN
        ALTER TABLE dbo.WorkspaceMessages ADD recipient_id INT NULL;
      END

      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'last_seen'
      )
      BEGIN
        ALTER TABLE dbo.Users ADD last_seen DATETIME NULL;
      END
    `);
    _columnChecked = true;
  } catch (e) {
    console.error('Error ensuring database columns for chat:', e.message);
  }
}

const _lastSeenMap = new Map();

async function updateLastSeen(pool, userId) {
  if (!userId) return;
  const now = Date.now();
  const lastUpdated = _lastSeenMap.get(userId) || 0;
  if (now - lastUpdated < 15000) return;

  _lastSeenMap.set(userId, now);
  try {
    const req = pool.request();
    req.input('userId', sql.Int, userId);
    await req.query(`UPDATE dbo.Users SET last_seen = GETUTCDATE() WHERE user_id = @userId`);
  } catch (e) {
    console.error('Error updating last_seen:', e.message);
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

async function getMentionUsers({ reqUser, channelType = 'global', teamId }) {
  if (!reqUser || !reqUser.userId) return [];
  const pool = await getPool();
  await ensureChannelColumn(pool);
  await updateLastSeen(pool, reqUser.userId);

  const req = pool.request();
  req.input('currentUserId', sql.Int, reqUser.userId);

  if (channelType === 'team') {
    const teamIds = await getUserTeamIds(pool, reqUser.userId);
    if (!teamIds || teamIds.length === 0) return [];

    let teamCondition = '';
    const parsedTeamId = teamId ? parseInt(teamId, 10) : null;
    if (parsedTeamId && teamIds.includes(parsedTeamId)) {
      req.input('targetTeamId', sql.Int, parsedTeamId);
      teamCondition = `t.team_id = @targetTeamId`;
    } else {
      const teamIdInputs = teamIds.map((id, idx) => {
        const paramName = `tId_${idx}`;
        req.input(paramName, sql.Int, id);
        return `@${paramName}`;
      }).join(',');
      teamCondition = `t.team_id IN (${teamIdInputs})`;
    }

    const query = `
      SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.email, u.department,
             r.role_name, u.last_seen,
             CASE WHEN DATEDIFF(MINUTE, u.last_seen, GETUTCDATE()) <= 5 THEN 1 ELSE 0 END AS is_online
      FROM dbo.Users u
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      LEFT JOIN dbo.TeamMembers tm ON u.user_id = tm.user_id
      LEFT JOIN dbo.Teams t ON (t.team_id = tm.team_id OR t.leader_id = u.user_id)
      WHERE u.user_id <> @currentUserId
        AND u.is_active = 1
        AND (${teamCondition})
      ORDER BY u.first_name, u.last_name
    `;
    const res = await req.query(query);
    return res.recordset;
  }

  // Global channel: return all active users except the current logged-in user
  const query = `
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.department,
           r.role_name, u.last_seen,
           CASE WHEN DATEDIFF(MINUTE, u.last_seen, GETUTCDATE()) <= 5 THEN 1 ELSE 0 END AS is_online
    FROM dbo.Users u
    LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
    WHERE u.user_id <> @currentUserId
      AND u.is_active = 1
    ORDER BY u.first_name, u.last_name
  `;
  const res = await req.query(query);
  return res.recordset;
}

async function getContacts({ reqUser }) {
  if (!reqUser || !reqUser.userId) return [];
  const pool = await getPool();
  await ensureChannelColumn(pool);
  await updateLastSeen(pool, reqUser.userId);

  const req = pool.request();
  req.input('currentUserId', sql.Int, reqUser.userId);

  const query = `
    SELECT u.user_id, u.first_name, u.last_name, u.email, u.department,
           r.role_name, u.last_seen,
           CASE WHEN DATEDIFF(MINUTE, u.last_seen, GETUTCDATE()) <= 5 THEN 1 ELSE 0 END AS is_online
    FROM dbo.Users u
    LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
    WHERE u.user_id <> @currentUserId
      AND u.is_active = 1
    ORDER BY is_online DESC, u.first_name, u.last_name
  `;
  const res = await req.query(query);
  return res.recordset;
}

async function getMessages({ reqUser, limit = 50, sinceId, channelType = 'global', teamId, recipientId }) {
  const pool = await getPool();
  await ensureChannelColumn(pool);
  if (reqUser && reqUser.userId) {
    await updateLastSeen(pool, reqUser.userId);
  }
  const request = pool.request();

  const channel = channelType;
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  const isAdmin = userRole.includes('ADMIN');

  if (channel === 'private') {
    if (!reqUser || !reqUser.userId || !recipientId) return [];
    const targetId = parseInt(recipientId, 10);
    if (!targetId || isNaN(targetId)) return [];

    request.input('myUserId', sql.Int, reqUser.userId);
    request.input('targetUserId', sql.Int, targetId);

    let query = `
      SELECT TOP (${parseInt(limit, 10) || 50})
             m.message_id, m.user_id, m.recipient_id, m.message_text, m.attachment_url, m.created_at,
             'private' AS channel_type, m.team_id,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             u.email AS sender_email,
             r.role_name AS sender_role, u.department AS sender_department,
             CASE WHEN rec.last_seen IS NOT NULL AND rec.last_seen >= m.created_at THEN 1 ELSE 0 END AS is_read
      FROM dbo.WorkspaceMessages m
      JOIN dbo.Users u ON m.user_id = u.user_id
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      LEFT JOIN dbo.Users rec ON (CASE WHEN m.user_id = @myUserId THEN m.recipient_id ELSE m.user_id END) = rec.user_id
      WHERE ISNULL(m.channel_type, 'global') = 'private'
        AND ((m.user_id = @myUserId AND m.recipient_id = @targetUserId)
          OR (m.user_id = @targetUserId AND m.recipient_id = @myUserId))
    `;

    if (sinceId && !isNaN(parseInt(sinceId, 10))) {
      query += ` AND m.message_id > @sinceId`;
      request.input('sinceId', sql.Int, parseInt(sinceId, 10));
    }

    query += ` ORDER BY m.message_id DESC`;
    const res = await request.query(query);
    return res.recordset.reverse();
  }

  if (channel === 'team') {
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
             m.message_id, m.user_id, m.recipient_id, m.message_text, m.attachment_url, m.created_at,
             ISNULL(m.channel_type, 'global') AS channel_type, m.team_id,
             (u.first_name + ' ' + u.last_name) AS sender_name,
             u.email AS sender_email,
             r.role_name AS sender_role, u.department AS sender_department,
             t.team_name AS sender_team_name,
             CASE WHEN EXISTS (SELECT 1 FROM dbo.Users ru WHERE ru.user_id <> m.user_id AND ru.last_seen >= m.created_at) THEN 1 ELSE 0 END AS is_read
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
           m.message_id, m.user_id, m.recipient_id, m.message_text, m.attachment_url, m.created_at,
           ISNULL(m.channel_type, 'global') AS channel_type, m.team_id,
           (u.first_name + ' ' + u.last_name) AS sender_name,
           u.email AS sender_email,
           r.role_name AS sender_role, u.department AS sender_department,
           NULL AS sender_team_name,
           CASE WHEN EXISTS (SELECT 1 FROM dbo.Users ru WHERE ru.user_id <> m.user_id AND ru.last_seen >= m.created_at) THEN 1 ELSE 0 END AS is_read
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

async function sendMessage({ reqUser, userId, messageText, attachmentUrl, channelType = 'global', teamId, recipientId }) {
  if (!messageText || !messageText.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const pool = await getPool();
  await ensureChannelColumn(pool);
  await updateLastSeen(pool, userId);

  const channel = channelType;
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  const isAdmin = userRole.includes('ADMIN');

  let assignedTeamId = null;
  let targetRecipientId = null;

  if (channel === 'private') {
    if (!recipientId) {
      throw new Error('Recipient is required for private message');
    }
    targetRecipientId = parseInt(recipientId, 10);
  } else if (channel === 'team') {
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
    .input('recipientId', sql.Int, targetRecipientId)
    .query(`
      INSERT INTO dbo.WorkspaceMessages (user_id, message_text, attachment_url, channel_type, team_id, recipient_id, created_at)
      OUTPUT INSERTED.message_id, INSERTED.created_at
      VALUES (@userId, @messageText, @attachmentUrl, @channelType, @teamId, @recipientId, GETUTCDATE());
    `);

  const newId = insertRes.recordset[0].message_id;

  const detailRes = await pool.request()
    .input('messageId', sql.Int, newId)
    .query(`
      SELECT m.message_id, m.user_id, m.recipient_id, m.message_text, m.attachment_url, m.created_at,
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
    await pool.request()
      .input('channelType', sql.NVarChar(50), channelType)
      .query(`
        UPDATE dbo.Notifications
        SET source_message_id = NULL
        WHERE source_message_id IN (
          SELECT message_id FROM dbo.WorkspaceMessages WHERE channel_type = @channelType
        )
      `);
    await pool.request()
      .input('channelType', sql.NVarChar(50), channelType)
      .query(`DELETE FROM dbo.WorkspaceMessages WHERE channel_type = @channelType`);
  } else {
    await pool.request().query(`
      UPDATE dbo.Notifications SET source_message_id = NULL
      WHERE source_message_id IS NOT NULL
    `);
    await pool.request().query(`DELETE FROM dbo.WorkspaceMessages`);
  }
  return true;
}

async function heartbeat(userId) {
  if (!userId) return false;
  const pool = await getPool();
  await ensureChannelColumn(pool);
  await updateLastSeen(pool, userId);
  return true;
}

async function editMessage({ reqUser, messageId, messageText }) {
  if (!reqUser || !reqUser.userId) throw new Error('Authentication required');
  if (!messageId) throw new Error('Message ID is required');
  if (!messageText || !messageText.trim()) throw new Error('Message text cannot be empty');

  const pool = await getPool();
  await ensureChannelColumn(pool);

  const checkReq = pool.request();
  checkReq.input('messageId', sql.Int, parseInt(messageId, 10));
  const checkRes = await checkReq.query(`SELECT user_id FROM dbo.WorkspaceMessages WHERE message_id = @messageId`);
  if (!checkRes.recordset || checkRes.recordset.length === 0) {
    throw new Error('Message not found');
  }

  const msgAuthorId = checkRes.recordset[0].user_id;
  if (parseInt(msgAuthorId, 10) !== parseInt(reqUser.userId, 10)) {
    throw new Error('Unauthorized: You can only edit your own messages');
  }

  const updateReq = pool.request();
  updateReq.input('messageId', sql.Int, parseInt(messageId, 10));
  updateReq.input('messageText', sql.NVarChar(sql.MAX), messageText.trim());
  await updateReq.query(`UPDATE dbo.WorkspaceMessages SET message_text = @messageText WHERE message_id = @messageId`);

  return { message_id: parseInt(messageId, 10), message_text: messageText.trim() };
}

async function deleteSingleMessage({ reqUser, messageId }) {
  if (!reqUser || !reqUser.userId) throw new Error('Authentication required');
  if (!messageId) throw new Error('Message ID is required');

  const pool = await getPool();
  await ensureChannelColumn(pool);

  const checkReq = pool.request();
  checkReq.input('messageId', sql.Int, parseInt(messageId, 10));
  const checkRes = await checkReq.query(`SELECT user_id FROM dbo.WorkspaceMessages WHERE message_id = @messageId`);
  if (!checkRes.recordset || checkRes.recordset.length === 0) {
    throw new Error('Message not found');
  }

  const msgAuthorId = checkRes.recordset[0].user_id;
  const userRole = (reqUser && reqUser.role) ? String(reqUser.role).toUpperCase() : '';
  const isAdmin = userRole.includes('ADMIN');

  if (parseInt(msgAuthorId, 10) !== parseInt(reqUser.userId, 10) && !isAdmin) {
    throw new Error('Unauthorized: You can only delete your own messages');
  }

  const delNotifReq = pool.request();
  delNotifReq.input('messageId', sql.Int, parseInt(messageId, 10));
  await delNotifReq.query(`UPDATE dbo.Notifications SET source_message_id = NULL WHERE source_message_id = @messageId`);

  const delReq = pool.request();
  delReq.input('messageId', sql.Int, parseInt(messageId, 10));
  await delReq.query(`DELETE FROM dbo.WorkspaceMessages WHERE message_id = @messageId`);

  return true;
}

module.exports = {
  getMessages,
  sendMessage,
  clearMessages,
  getMentionUsers,
  getContacts,
  heartbeat,
  editMessage,
  deleteSingleMessage
};


