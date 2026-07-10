const roundRobinService = require('../services/roundRobin.service');
const alumniRepository = require('../repositories/alumni.repository');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const assignAlumni = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const result = await roundRobinService.assignAlumni(teamId, currentUser, req.body);
  success(res, result, 'Alumni assigned successfully');
});

const getAssignmentHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const result = await alumniRepository.getAssignmentHistory({ page, limit, offset });
  paginated(res, result.rows, result.total, page, limit, 'Assignment history retrieved successfully');
});

module.exports = { assignAlumni, getAssignmentHistory };