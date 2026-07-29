const emailService = require('../services/email.service');
const { success, error } = require('../utils/response');

async function createCampaign(req, res, next) {
  try {
    const leaderId = req.user.userId;
    const { assignmentIds } = req.body;
    const result = await emailService.createCampaign({ leaderId, assignmentIds });
    return success(res, result, 'Email campaign created and queued successfully', 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function getCampaignStatus(req, res, next) {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const role = req.user.role;
    const result = await emailService.getCampaignStatus(campaignId, userId, role);
    return success(res, result, 'Campaign status fetched successfully');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function logRecipientResult(req, res, next) {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { recipientId, status, messageId } = req.body;

    if (!recipientId || !status) {
      return error(res, 'recipientId and status are required', 400);
    }

    const result = await emailService.logRecipientResult({ campaignId, recipientId, status, messageId });
    return success(res, result, 'Log recorded successfully');
  } catch (err) {
    next(err);
  }
}

async function ingestReply(req, res, next) {
  try {
    const { assignmentId, rawReplyText, receivedAt } = req.body;

    if (!assignmentId || !rawReplyText) {
      return error(res, 'assignmentId and rawReplyText are required', 400);
    }

    const result = await emailService.ingestReply({ assignmentId, rawReplyText, receivedAt });
    return success(res, result, 'Reply ingested successfully', 201);
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

async function getReplies(req, res, next) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const result = await emailService.getReplies({ userId, role });
    return success(res, result, 'Replies fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function reviewReply(req, res, next) {
  try {
    const replyId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const result = await emailService.reviewReply({ replyId, userId });
    return success(res, result, 'Reply marked as reviewed');
  } catch (err) {
    next(err);
  }
}

async function previewRecipients(req, res, next) {
  try {
    const leaderId = req.user.userId;
    const records = await emailService.getEligibleRecipients(leaderId);
    return success(res, { records, total: records.length }, 'Preview recipients fetched successfully');
  } catch (err) {
    if (err.statusCode) {
      return error(res, err.message, err.statusCode);
    }
    next(err);
  }
}

module.exports = {
  previewRecipients,
  createCampaign,
  getCampaignStatus,
  logRecipientResult,
  ingestReply,
  getReplies,
  reviewReply
};
