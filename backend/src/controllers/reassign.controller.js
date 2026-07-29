const reassignService = require('../services/reassign.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const getTeamLoad = asyncHandler(async (req, res) => {
  const result = await reassignService.getTeamLoad(req.user, {
    leaderId: req.query.leaderId
  });
  success(res, result, 'Team workload retrieved successfully');
});

const previewReassign = asyncHandler(async (req, res) => {
  const result = await reassignService.previewReassign(req.user, req.body);
  success(res, result, 'Reassign preview generated successfully');
});

const commitReassign = asyncHandler(async (req, res) => {
  const result = await reassignService.commitReassign(req.user, req.body);
  success(res, result, `${result.moved} alumni reassigned successfully`);
});

module.exports = { getTeamLoad, previewReassign, commitReassign };
