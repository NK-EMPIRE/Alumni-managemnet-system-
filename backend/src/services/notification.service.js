'use strict';
/**
 * notification.service.js
 *
 * Handles:
 *  - LinkedIn URL detection in Global chat messages
 *  - Fuzzy name matching (zero extra npm deps — pure-JS Jaro-Winkler)
 *  - CRUD for the Notifications table
 *  - Real-time push via Socket.io when a notification is created
 */

const { getPool, sql } = require('../config/database');
const realtime = require('../helpers/realtime');

// ─── LinkedIn regex ────────────────────────────────────────────────────────────
const LINKEDIN_REGEX = /https?:\/\/(www\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]+)\/?/gi;

/** Extract all LinkedIn slugs from a string */
function extractLinkedInSlugs(text) {
  const results = [];
  let match;
  const re = new RegExp(LINKEDIN_REGEX.source, 'gi');
  while ((match = re.exec(text)) !== null) {
    results.push({ fullUrl: match[0], slug: match[2] });
  }
  return results;
}

/** Convert a LinkedIn slug to a best-guess human name
 *  e.g. "john-smith-123abc" → "john smith"
 */
function slugToName(slug) {
  return slug
    .replace(/_/g, '-')
    .split('-')
    .filter(p => !/^\d+$/.test(p))     // strip trailing numeric IDs
    .join(' ')
    .toLowerCase()
    .trim();
}

// ─── Jaro-Winkler similarity (no dependencies) ────────────────────────────────
function jaroWinkler(s1, s2) {
  if (s1 === s2) return 1;
  const l1 = s1.length, l2 = s2.length;
  if (!l1 || !l2) return 0;

  const matchDist = Math.max(Math.floor(Math.max(l1, l2) / 2) - 1, 0);
  const s1Matches = new Array(l1).fill(false);
  const s2Matches = new Array(l2).fill(false);

  let matches = 0, transpositions = 0;

  for (let i = 0; i < l1; i++) {
    const start = Math.max(0, i - matchDist);
    const end   = Math.min(i + matchDist + 1, l2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;

  let k = 0;
  for (let i = 0; i < l1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / l1 + matches / l2 + (matches - transpositions / 2) / matches) / 3;

  // Winkler prefix bonus (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(l1, l2)); i++) {
    if (s1[i] === s2[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

const SIMILARITY_THRESHOLD = 0.82;

// ─── Core: detect LinkedIn URLs in a message and create notifications ─────────
async function detectAndNotify(messageText, senderUserId, messageId) {
  try {
    const slugs = extractLinkedInSlugs(messageText);
    if (!slugs.length) return;

    const pool = await getPool();

    // Fetch all active users for matching
    const usersRes = await pool.request().query(`
      SELECT user_id, LOWER(first_name + ' ' + last_name) AS full_name
      FROM dbo.Users
      WHERE is_active = 1 AND deleted_at IS NULL
    `);
    const users = usersRes.recordset;

    // Get sender's display name
    const senderRes = await pool.request()
      .input('uid', sql.Int, senderUserId)
      .query(`SELECT first_name + ' ' + last_name AS name FROM dbo.Users WHERE user_id = @uid`);
    const senderName = senderRes.recordset[0] ? senderRes.recordset[0].name : 'Someone';

    for (const { fullUrl, slug } of slugs) {
      const nameGuess = slugToName(slug);
      if (!nameGuess) continue;

      let bestMatch = null, bestScore = 0;
      for (const user of users) {
        const score = jaroWinkler(nameGuess, user.full_name);
        if (score > bestScore) { bestScore = score; bestMatch = user; }
      }

      if (bestScore >= SIMILARITY_THRESHOLD && bestMatch) {
        // Don't notify the sender about themselves
        if (bestMatch.user_id === senderUserId) continue;

        // Avoid duplicate pending notification for same URL + recipient
        const dupCheck = await pool.request()
          .input('recipientId', sql.Int, bestMatch.user_id)
          .input('url', sql.VarChar(255), fullUrl)
          .query(`
            SELECT 1 FROM dbo.Notifications
            WHERE recipient_user_id = @recipientId
              AND detected_url = @url
              AND status = 'pending'
          `);
        if (dupCheck.recordset.length > 0) continue;

        const msgText = `${senderName} shared a LinkedIn profile that might be yours in the Global chat.`;

        await pool.request()
          .input('recipientId',  sql.Int,        bestMatch.user_id)
          .input('senderId',     sql.Int,        senderUserId)
          .input('msgText',      sql.VarChar(500), msgText)
          .input('url',          sql.VarChar(255), fullUrl)
          .input('sourceId',     sql.Int,        messageId || null)
          .query(`
            INSERT INTO dbo.Notifications
              (recipient_user_id, sender_user_id, type, message_text, detected_url, source_message_id, is_read, status, created_at)
            VALUES
              (@recipientId, @senderId, 'linkedin_match', @msgText, @url, @sourceId, 0, 'pending', GETUTCDATE())
          `);

        // Real-time push to recipient's socket room
        realtime.notifyUser(bestMatch.user_id, 'new_notification', {
          type: 'linkedin_match',
          message: msgText
        });
      }
    }
  } catch (err) {
    // Fire-and-forget: log but never crash the chat flow
    console.error('[notification.service] detectAndNotify error:', err.message);
  }
}

// ─── Get all notifications for a user ────────────────────────────────────────
async function getNotifications(userId) {
  const pool = await getPool();
  const res = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        n.notification_id, n.type, n.message_text, n.detected_url,
        n.is_read, n.status, n.created_at,
        (s.first_name + ' ' + s.last_name) AS sender_name,
        n.source_message_id
      FROM dbo.Notifications n
      LEFT JOIN dbo.Users s ON n.sender_user_id = s.user_id
      WHERE n.recipient_user_id = @userId
      ORDER BY n.created_at DESC
    `);
  return res.recordset;
}

// ─── Mark a notification as read ──────────────────────────────────────────────
async function markRead(notificationId, userId) {
  const pool = await getPool();
  const res = await pool.request()
    .input('id',     sql.Int, notificationId)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.Notifications
      SET is_read = 1
      WHERE notification_id = @id AND recipient_user_id = @userId
    `);
  return res.rowsAffected[0];
}

// ─── Confirm: write linkedin_url to user profile ──────────────────────────────
async function confirmNotification(notificationId, userId) {
  const pool = await getPool();

  // Fetch the notification (must belong to this user and be pending)
  const notifRes = await pool.request()
    .input('id',     sql.Int, notificationId)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT notification_id, detected_url, status
      FROM dbo.Notifications
      WHERE notification_id = @id AND recipient_user_id = @userId
    `);

  if (!notifRes.recordset.length) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
  const notif = notifRes.recordset[0];
  if (notif.status !== 'pending') {
    throw Object.assign(new Error('Notification already actioned'), { statusCode: 409 });
  }
  if (!notif.detected_url) {
    throw Object.assign(new Error('No LinkedIn URL associated with this notification'), { statusCode: 400 });
  }

  // Update user's linkedin_url + linkedin_verified
  await pool.request()
    .input('url',    sql.VarChar(255), notif.detected_url)
    .input('userId', sql.Int,          userId)
    .query(`
      UPDATE dbo.Users
      SET linkedin_url = @url, linkedin_verified = 1, updated_at = GETUTCDATE()
      WHERE user_id = @userId
    `);

  // Mark notification confirmed + read
  await pool.request()
    .input('id',     sql.Int, notificationId)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.Notifications
      SET status = 'confirmed', is_read = 1
      WHERE notification_id = @id AND recipient_user_id = @userId
    `);

  return { linkedinUrl: notif.detected_url };
}

// ─── Dismiss: just mark dismissed, no profile change ─────────────────────────
async function dismissNotification(notificationId, userId) {
  const pool = await getPool();

  const notifRes = await pool.request()
    .input('id',     sql.Int, notificationId)
    .input('userId', sql.Int, userId)
    .query(`
      SELECT notification_id, status
      FROM dbo.Notifications
      WHERE notification_id = @id AND recipient_user_id = @userId
    `);

  if (!notifRes.recordset.length) {
    throw Object.assign(new Error('Notification not found'), { statusCode: 404 });
  }
  if (notifRes.recordset[0].status !== 'pending') {
    throw Object.assign(new Error('Notification already actioned'), { statusCode: 409 });
  }

  await pool.request()
    .input('id',     sql.Int, notificationId)
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE dbo.Notifications
      SET status = 'dismissed', is_read = 1
      WHERE notification_id = @id AND recipient_user_id = @userId
    `);

  return { dismissed: true };
}

module.exports = {
  detectAndNotify,
  getNotifications,
  markRead,
  confirmNotification,
  dismissNotification
};
