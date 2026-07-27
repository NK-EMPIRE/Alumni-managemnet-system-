const { getPool, sql } = require('../config/database');
const { logger } = require('../utils/logger');
const http = require('http');
const https = require('https');

async function createCampaign({ leaderId, assignmentIds }) {
  const pool = await getPool();

  // Get leader info
  const leaderRes = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .query('SELECT user_id, team_id, role_id FROM dbo.Users WHERE user_id = @leaderId');

  if (leaderRes.recordset.length === 0) {
    throw new Error('Leader user not found');
  }

  const leader = leaderRes.recordset[0];
  const teamId = leader.team_id;

  if (!teamId) {
    throw new Error('User is not assigned to any team');
  }

  // Fetch recipients
  let queryStr = `
    SELECT aa.assignment_id, aa.alumni_id, a.name, a.email
    FROM dbo.AlumniAssignments aa
    JOIN dbo.Alumni a ON aa.alumni_id = a.alumni_id
    WHERE (
      aa.member_id IN (
        SELECT user_id FROM dbo.Users WHERE team_id = @teamId
      )
      OR aa.team_id = @teamId
    )
    AND a.email IS NOT NULL AND LTRIM(RTRIM(a.email)) <> ''
  `;

  const request = pool.request().input('teamId', sql.Int, teamId);

  if (Array.isArray(assignmentIds) && assignmentIds.length > 0) {
    queryStr += ` AND aa.assignment_id IN (${assignmentIds.map((_, i) => `@aId${i}`).join(',')})`;
    assignmentIds.forEach((id, i) => {
      request.input(`aId${i}`, sql.Int, id);
    });
  }

  const recipientsRes = await request.query(queryStr);
  const recipients = recipientsRes.recordset;

  if (recipients.length === 0) {
    throw new Error('No valid alumni recipients with non-null emails found for this campaign');
  }

  // Check if campaign currently in progress
  const activeCheck = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query("SELECT campaign_id FROM dbo.EmailCampaigns WHERE team_id = @teamId AND status = 'InProgress'");

  if (activeCheck.recordset.length > 0) {
    const err = new Error('A campaign is currently InProgress for your team. Please wait for it to complete.');
    err.statusCode = 409;
    throw err;
  }

  // Create EmailCampaigns row
  const campaignRes = await pool.request()
    .input('leaderId', sql.Int, leaderId)
    .input('teamId', sql.Int, teamId)
    .input('totalRecipients', sql.Int, recipients.length)
    .query(`
      INSERT INTO dbo.EmailCampaigns (leader_id, team_id, total_recipients, status)
      OUTPUT INSERTED.campaign_id
      VALUES (@leaderId, @teamId, @totalRecipients, 'InProgress')
    `);

  const campaignId = campaignRes.recordset[0].campaign_id;

  // Insert EmailCampaignRecipients rows
  const recipientPayloads = [];
  for (const r of recipients) {
    const recRes = await pool.request()
      .input('campaignId', sql.Int, campaignId)
      .input('assignmentId', sql.Int, r.assignment_id)
      .input('alumniId', sql.Int, r.alumni_id)
      .input('email', sql.NVarChar(255), r.email)
      .query(`
        INSERT INTO dbo.EmailCampaignRecipients (campaign_id, assignment_id, alumni_id, email, status)
        OUTPUT INSERTED.recipient_id
        VALUES (@campaignId, @assignmentId, @alumniId, @email, 'Pending')
      `);
    recipientPayloads.push({
      recipientId: recRes.recordset[0].recipient_id,
      assignmentId: r.assignment_id,
      alumniId: r.alumni_id,
      name: r.name,
      email: r.email
    });
  }

  // Fire n8n webhook asynchronously if configured
  const n8nWebhookUrl = process.env.N8N_CAMPAIGN_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_SHARED_SECRET;

  if (n8nWebhookUrl) {
    try {
      const payload = JSON.stringify({
        campaignId,
        recipients: recipientPayloads
      });

      const urlObj = new URL(n8nWebhookUrl);
      const reqLib = urlObj.protocol === 'https:' ? https : http;

      const req = reqLib.request(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Automation-Secret': sharedSecret
        }
      });

      req.on('error', (e) => {
        logger.error('Failed to dispatch webhook to n8n:', e);
      });

      req.write(payload);
      req.end();
    } catch (e) {
      logger.error('Invalid N8N_CAMPAIGN_WEBHOOK_URL:', e);
    }
  } else {
    logger.warn('N8N_CAMPAIGN_WEBHOOK_URL not configured. Campaign created in database but n8n trigger skipped.');
  }

  return { campaignId, totalRecipients: recipients.length, status: 'InProgress' };
}

async function getCampaignStatus(campaignId, userId, role) {
  const pool = await getPool();
  const res = await pool.request()
    .input('campaignId', sql.Int, campaignId)
    .query('SELECT * FROM dbo.EmailCampaigns WHERE campaign_id = @campaignId');

  if (res.recordset.length === 0) {
    const err = new Error('Campaign not found');
    err.statusCode = 404;
    throw err;
  }

  const campaign = res.recordset[0];
  const userRole = (role || '').toUpperCase();

  if (userRole !== 'ADMIN' && campaign.leader_id !== userId) {
    const err = new Error('Unauthorized to view this campaign status');
    err.statusCode = 403;
    throw err;
  }

  return campaign;
}

async function logRecipientResult({ campaignId, recipientId, status, messageId }) {
  const pool = await getPool();

  const recipientRes = await pool.request()
    .input('recipientId', sql.Int, recipientId)
    .input('campaignId', sql.Int, campaignId)
    .input('status', sql.NVarChar(30), status)
    .input('messageId', sql.NVarChar(255), messageId || null)
    .query(`
      UPDATE dbo.EmailCampaignRecipients
      SET status = @status, message_id = @messageId, sent_at = GETUTCDATE()
      WHERE recipient_id = @recipientId AND campaign_id = @campaignId
    `);

  if (status === 'Sent') {
    await pool.request()
      .input('campaignId', sql.Int, campaignId)
      .query('UPDATE dbo.EmailCampaigns SET sent_count = sent_count + 1 WHERE campaign_id = @campaignId');
  } else {
    await pool.request()
      .input('campaignId', sql.Int, campaignId)
      .query('UPDATE dbo.EmailCampaigns SET failed_count = failed_count + 1 WHERE campaign_id = @campaignId');
  }

  const campaignRes = await pool.request()
    .input('campaignId', sql.Int, campaignId)
    .query('SELECT total_recipients, sent_count, failed_count FROM dbo.EmailCampaigns WHERE campaign_id = @campaignId');

  if (campaignRes.recordset.length > 0) {
    const { total_recipients, sent_count, failed_count } = campaignRes.recordset[0];
    if (sent_count + failed_count >= total_recipients) {
      const finalStatus = failed_count === total_recipients ? 'Failed' : 'Completed';
      await pool.request()
        .input('campaignId', sql.Int, campaignId)
        .input('finalStatus', sql.NVarChar(30), finalStatus)
        .query('UPDATE dbo.EmailCampaigns SET status = @finalStatus, completed_at = GETUTCDATE() WHERE campaign_id = @campaignId');
    }
  }

  return { success: true };
}

async function ingestReply({ assignmentId, rawReplyText, receivedAt }) {
  const pool = await getPool();

  const assignRes = await pool.request()
    .input('assignmentId', sql.Int, assignmentId)
    .query('SELECT assignment_id, alumni_id, member_id FROM dbo.AlumniAssignments WHERE assignment_id = @assignmentId');

  if (assignRes.recordset.length === 0) {
    const err = new Error('Invalid assignmentId: assignment not found');
    err.statusCode = 400;
    throw err;
  }

  const assignment = assignRes.recordset[0];

  const insertRes = await pool.request()
    .input('assignmentId', sql.Int, assignment.assignment_id)
    .input('alumniId', sql.Int, assignment.alumni_id)
    .input('rawReplyText', sql.NVarChar(sql.MAX), rawReplyText)
    .input('receivedAt', sql.DateTime2, receivedAt ? new Date(receivedAt) : new Date())
    .query(`
      INSERT INTO dbo.AlumniReplies (assignment_id, alumni_id, raw_reply_text, received_at, review_status)
      OUTPUT INSERTED.reply_id
      VALUES (@assignmentId, @alumniId, @rawReplyText, COALESCE(@receivedAt, GETUTCDATE()), 'Pending Review')
    `);

  return { replyId: insertRes.recordset[0].reply_id, assignmentId: assignment.assignment_id };
}

async function getReplies({ userId, role }) {
  const pool = await getPool();
  let query = `
    SELECT r.reply_id, r.assignment_id, r.alumni_id, r.raw_reply_text, r.received_at, r.review_status,
           a.name AS alumni_name, a.email AS alumni_email, (u.first_name + ' ' + u.last_name) AS assigned_member_name
    FROM dbo.AlumniReplies r
    JOIN dbo.AlumniAssignments aa ON r.assignment_id = aa.assignment_id
    JOIN dbo.Alumni a ON r.alumni_id = a.alumni_id
    LEFT JOIN dbo.Users u ON aa.member_id = u.user_id
  `;

  const request = pool.request();
  const userRole = (role || '').toUpperCase();

  if (userRole === 'MEMBER') {
    query += ' WHERE aa.member_id = @userId';
    request.input('userId', sql.Int, userId);
  } else if (userRole === 'LEADER') {
    query += ` WHERE (
      aa.member_id IN (SELECT user_id FROM dbo.Users WHERE team_id = (SELECT team_id FROM dbo.Users WHERE user_id = @userId))
      OR aa.team_id = (SELECT team_id FROM dbo.Users WHERE user_id = @userId)
    )`;
    request.input('userId', sql.Int, userId);
  }

  query += ' ORDER BY r.received_at DESC';

  const res = await request.query(query);
  return res.recordset;
}

async function reviewReply({ replyId, userId }) {
  const pool = await getPool();

  const updateRes = await pool.request()
    .input('replyId', sql.Int, replyId)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.AlumniReplies
      SET review_status = 'Reviewed', reviewed_by = @userId, reviewed_at = GETUTCDATE()
      WHERE reply_id = @replyId
    `);

  return { success: true };
}

module.exports = {
  createCampaign,
  getCampaignStatus,
  logRecipientResult,
  ingestReply,
  getReplies,
  reviewReply
};
