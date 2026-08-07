const chatService = require('../services/chat.service');
const { success, error } = require('../utils/response');

async function getMessages(req, res, next) {
  try {
    const { limit, sinceId, channelType, teamId, recipientId } = req.query;
    const messages = await chatService.getMessages({ reqUser: req.user, limit, sinceId, channelType, teamId, recipientId });
    return success(res, messages, 'Workspace messages fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user.userId;
    const { messageText, attachmentUrl, channelType, teamId, recipientId } = req.body;
    const message = await chatService.sendMessage({ reqUser: req.user, userId, messageText, attachmentUrl, channelType, teamId, recipientId });
    return success(res, message, 'Message sent successfully', 201);
  } catch (err) {
    if (err.message && (
      err.message.includes('cannot be empty') ||
      err.message.includes('Admins cannot') ||
      err.message.includes('must be assigned') ||
      err.message.includes('Recipient is required')
    )) {
      return error(res, err.message, 400);
    }
    next(err);
  }
}

async function clearMessages(req, res, next) {
  try {
    const { channelType } = req.query;
    await chatService.clearMessages({ reqUser: req.user, channelType });
    return success(res, null, 'Messages cleared successfully');
  } catch (err) {
    if (err.message && err.message.includes('Only admins')) {
      return error(res, err.message, 403);
    }
    next(err);
  }
}

async function getMentionUsers(req, res, next) {
  try {
    const { channelType, teamId } = req.query;
    const users = await chatService.getMentionUsers({ reqUser: req.user, channelType, teamId });
    return success(res, users, 'Mention users fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function getContacts(req, res, next) {
  try {
    const contacts = await chatService.getContacts({ reqUser: req.user });
    return success(res, contacts, 'Chat contacts fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function heartbeat(req, res, next) {
  try {
    const userId = req.user.userId;
    await chatService.heartbeat(userId);
    return success(res, { online: true }, 'Heartbeat recorded');
  } catch (err) {
    next(err);
  }
}

async function updateMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    const { messageText } = req.body;
    const result = await chatService.editMessage({ reqUser: req.user, messageId, messageText });
    return success(res, result, 'Message updated successfully');
  } catch (err) {
    if (err.message && (err.message.includes('Unauthorized') || err.message.includes('not found') || err.message.includes('empty'))) {
      return error(res, err.message, err.message.includes('Unauthorized') ? 403 : 400);
    }
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const { messageId } = req.params;
    await chatService.deleteSingleMessage({ reqUser: req.user, messageId });
    return success(res, null, 'Message deleted successfully');
  } catch (err) {
    if (err.message && (err.message.includes('Unauthorized') || err.message.includes('not found'))) {
      return error(res, err.message, err.message.includes('Unauthorized') ? 403 : 400);
    }
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage,
  clearMessages,
  getMentionUsers,
  getContacts,
  heartbeat,
  updateMessage,
  deleteMessage
};

