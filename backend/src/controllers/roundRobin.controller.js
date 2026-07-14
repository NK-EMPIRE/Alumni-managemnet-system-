const roundRobinService = require('../services/roundRobin.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const adminAssign = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await roundRobinService.adminAssign(currentUser, req.body);
  success(res, result, 'Alumni assigned to leader successfully');
});

const leaderPreview = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await roundRobinService.leaderPreview(currentUser, req.body);
  success(res, result, 'Distribution preview generated successfully');
});

const leaderDistribute = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await roundRobinService.leaderDistribute(currentUser, req.body);
  success(res, result, 'Alumni distributed successfully');
});

const reopenAssignment = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { alumniId } = req.params;
  const result = await roundRobinService.reopenAssignment(currentUser, parseInt(alumniId, 10), req.body);
  success(res, result, 'Alumni record reopened successfully');
});

const getUndistributedAlumni = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search;
  const batch = req.query.batch;

  const result = await roundRobinService.getUndistributedAlumni(currentUser.userId, { page, limit, offset, search, batch });
  paginated(res, result.rows, result.total, page, limit, 'Undistributed alumni retrieved successfully');
});

const getAvailableCount = asyncHandler(async (req, res) => {
  const { department, batch } = req.query;
  const count = await roundRobinService.getAvailableAlumniCount({ department, batch });
  success(res, { count }, 'Available alumni count retrieved successfully');
});

const getUndistributedCount = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const count = await roundRobinService.getUndistributedCount(currentUser.userId);
  success(res, { count }, 'Undistributed alumni count retrieved successfully');
});

module.exports = {
  adminAssign,
  leaderPreview,
  leaderDistribute,
  reopenAssignment,
  getUndistributedAlumni,
  getAvailableCount,
  getUndistributedCount
};