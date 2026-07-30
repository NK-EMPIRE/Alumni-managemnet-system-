const reassignService = require('../services/reassign.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const getTeamLoad = asyncHandler(async (req, res) => {
  const result = await reassignService.getTeamLoad(req.user, {
    leaderId: req.query.leaderId,
    department: req.query.department
  });
  success(res, result, 'Team workload retrieved successfully');
});

const getSourceMemberDepartments = asyncHandler(async (req, res) => {
  const result = await reassignService.getSourceMemberDepartments(req.user, {
    leaderId: req.query.leaderId,
    sourceMemberId: parseInt(req.query.sourceMemberId, 10)
  });
  success(res, result, 'Source member departments retrieved successfully');
});

const previewReassign = asyncHandler(async (req, res) => {
  const result = await reassignService.previewReassign(req.user, req.body);
  success(res, result, 'Reassign preview generated successfully');
});

const commitReassign = asyncHandler(async (req, res) => {
  const result = await reassignService.commitReassign(req.user, req.body);
  success(res, result, `${result.moved} alumni reassigned successfully`);
});

module.exports = { getTeamLoad, getSourceMemberDepartments, previewReassign, commitReassign };
