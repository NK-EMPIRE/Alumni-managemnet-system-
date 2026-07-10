const roundRobinService = require('../services/roundRobin.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const assignAlumni = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const result = await roundRobinService.assignAlumni(teamId, currentUser, req.body);
  success(res, result, 'Alumni assigned successfully');
});

module.exports = { assignAlumni };