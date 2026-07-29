const healthService = require('../services/health.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getDbSummary = asyncHandler(async (req, res) => {
  const result = await healthService.getDbSummary();
  success(res, result, 'Database health summary retrieved successfully');
});

const getDbDetail = asyncHandler(async (req, res) => {
  const type = req.query.type || 'duplicates';
  const result = await healthService.getDbDetail({ type });
  success(res, result, 'Health detail records retrieved successfully');
});

const notifyAssignee = asyncHandler(async (req, res) => {
  const result = await healthService.notifyAssignee(req.user, req.body);
  success(res, result, `Notifications sent to ${result.notified} assignees.`);
});

module.exports = { getDbSummary, getDbDetail, notifyAssignee };
