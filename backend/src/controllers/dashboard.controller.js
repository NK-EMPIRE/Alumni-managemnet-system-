const dashboardService = require('../services/dashboard.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success } = require('../utils/response');

const getAdminStats = asyncHandler(async (req, res) => {
  const result = await dashboardService.getAdminStats();
  success(res, result, 'Admin stats retrieved successfully');
});

const getAdminDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getAdminDashboard();
  success(res, result, 'Admin dashboard data retrieved successfully');
});

const getLeaderDashboard = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await dashboardService.getLeaderDashboard(currentUser.userId);
  success(res, result, 'Leader dashboard data retrieved successfully');
});

const getMemberDashboard = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await dashboardService.getMemberDashboard(currentUser.userId);
  success(res, result, 'Member dashboard data retrieved successfully');
});

const getDepartmentProgress = asyncHandler(async (req, res) => {
  const result = await dashboardService.getDepartmentProgress();
  success(res, result, 'Department progress retrieved successfully');
});

const getBatchProgress = asyncHandler(async (req, res) => {
  const result = await dashboardService.getBatchProgress();
  success(res, result, 'Batch progress retrieved successfully');
});

const getLeaderRankings = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const result = await dashboardService.getLeaderRankings(limit);
  success(res, result, 'Leader rankings retrieved successfully');
});

const getRecentActivities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const result = await dashboardService.getRecentActivities(limit);
  success(res, result, 'Recent activities retrieved successfully');
});

const getAssignmentTrend = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days, 10) || 30;
  const result = await dashboardService.getAssignmentTrend(days);
  success(res, result, 'Assignment trend retrieved successfully');
});

const getLeaderStats = asyncHandler(async (req, res) => {
  const { leaderId } = req.params;
  const result = await dashboardService.getLeaderStats(leaderId);
  success(res, result, 'Leader stats retrieved successfully');
});

const getMemberStats = asyncHandler(async (req, res) => {
  const { memberId } = req.params;
  const result = await dashboardService.getMemberStats(memberId);
  success(res, result, 'Member stats retrieved successfully');
});

const getMyStats = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  if (currentUser.role === 'LEADER') {
    const result = await dashboardService.getLeaderStats(currentUser.userId);
    return success(res, result, 'My stats retrieved successfully');
  }
  const result = await dashboardService.getMemberStats(currentUser.userId);
  success(res, result, 'My stats retrieved successfully');
});

module.exports = {
  getAdminStats,
  getAdminDashboard,
  getLeaderDashboard,
  getMemberDashboard,
  getDepartmentProgress,
  getBatchProgress,
  getLeaderRankings,
  getRecentActivities,
  getAssignmentTrend,
  getLeaderStats,
  getMemberStats,
  getMyStats
};