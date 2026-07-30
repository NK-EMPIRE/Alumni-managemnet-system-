'use strict';

const notificationService = require('../services/notification.service');
const { success, error } = require('../utils/response');

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getNotifications(userId);
    return success(res, notifications, 'Notifications fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function confirmNotification(req, res, next) {
  try {
    const userId = req.user.userId;
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) return error(res, 'Invalid notification ID', 400);
    const result = await notificationService.confirmNotification(notifId, userId);
    return success(res, result, 'LinkedIn profile confirmed and saved to your account');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
}

async function dismissNotification(req, res, next) {
  try {
    const userId = req.user.userId;
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) return error(res, 'Invalid notification ID', 400);
    const result = await notificationService.dismissNotification(notifId, userId);
    return success(res, result, 'Notification dismissed');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    const userId = req.user.userId;
    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) return error(res, 'Invalid notification ID', 400);
    const rows = await notificationService.markRead(notifId, userId);
    if (!rows) return error(res, 'Notification not found', 404);
    return success(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, confirmNotification, dismissNotification, markRead };
