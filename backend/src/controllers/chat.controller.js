const chatService = require('../services/chat.service');
const { success, error } = require('../utils/response');

async function getMessages(req, res, next) {
  try {
    const { limit, sinceId, channelType, teamId } = req.query;
    const messages = await chatService.getMessages({ reqUser: req.user, limit, sinceId, channelType, teamId });
    return success(res, messages, 'Workspace messages fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user.userId;
    const { messageText, attachmentUrl, channelType, teamId } = req.body;
    const message = await chatService.sendMessage({ reqUser: req.user, userId, messageText, attachmentUrl, channelType, teamId });
    return success(res, message, 'Message sent successfully', 201);
  } catch (err) {
    if (err.message && (
      err.message.includes('cannot be empty') ||
      err.message.includes('Admins cannot') ||
      err.message.includes('must be assigned')
    )) {
      return error(res, err.message, 400);
    }
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage
};
