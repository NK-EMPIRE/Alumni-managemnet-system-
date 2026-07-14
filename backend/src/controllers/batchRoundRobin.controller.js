const batchRoundRobinService = require('../services/batchRoundRobin.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

/**
 * Admin assigns alumni to a team using batch-wise round-robin distribution
 */
const batchWiseAssign = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { teamId, batches, allocations } = req.body;
  
  const result = await batchRoundRobinService.batchWiseRoundRobinAssign(currentUser, {
    teamId,
    batches,
    allocations
  });
  
  success(res, result, 'Alumni assigned successfully');
});

/**
 * Get distribution preview for batch-wise round-robin
 */
const getPreview = asyncHandler(async (req, res) => {
  const { teamId, batches, allocations } = req.query;
  
  const result = await batchRoundRobinService.getDistributionPreview(
    parseInt(teamId, 10),
    batches ? JSON.parse(batches) : [],
    allocations ? JSON.parse(allocations) : []
  );
  
  success(res, result, 'Distribution preview generated successfully');
});

module.exports = {
  batchWiseAssign,
  getPreview
};