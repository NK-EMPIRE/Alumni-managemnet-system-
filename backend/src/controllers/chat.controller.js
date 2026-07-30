const chatService = require('../services/chat.service');
const { success, error } = require('../utils/response');

async function getMessages(req, res, next) {
  try {
    const { limit, sinceId, channelType } = req.query;
    const messages = await chatService.getMessages({ limit, sinceId, channelType });
    return success(res, messages, 'Workspace messages fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const userId = req.user.userId;
    const { messageText, attachmentUrl, channelType } = req.body;
    const message = await chatService.sendMessage({ userId, messageText, attachmentUrl, channelType });
    return success(res, message, 'Message sent successfully', 201);
  } catch (err) {
    if (err.message && err.message.includes('cannot be empty')) {
      return error(res, err.message, 400);
    }
    next(err);
  }
}

module.exports = {
  getMessages,
  sendMessage
};
