const teamService = require('../services/team.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getTeams = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await teamService.getTeams({ page, limit, search });
  paginated(res, result.teams, result.total, result.page, result.limit, 'Teams retrieved successfully');
});

const getTeamById = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const result = await teamService.getTeamById(teamId);
  success(res, result, 'Team retrieved successfully');
});

const createTeam = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await teamService.createTeam(req.body, currentUser);
  success(res, result, 'Team created successfully', 201);
});

const updateTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const result = await teamService.updateTeam(teamId, req.body, currentUser);
  success(res, result, 'Team updated successfully');
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  await teamService.deleteTeam(teamId, currentUser);
  success(res, null, 'Team deleted successfully');
});

const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  const currentUser = req.user;
  const result = await teamService.addMember(teamId, userId, currentUser);
  success(res, result, 'Member added successfully');
});

const removeMember = asyncHandler(async (req, res) => {
  const { teamMemberId } = req.params;
  const currentUser = req.user;
  await teamService.removeMember(teamMemberId, currentUser);
  success(res, null, 'Member removed successfully');
});

const redistributeAssignments = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const { allocations } = req.body;
  const result = await teamService.redistributeAssignments(teamId, currentUser, allocations);
  success(res, result, 'Assignments redistributed successfully');
});

const lockDistribution = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const result = await teamService.lockDistribution(teamId, currentUser);
  success(res, result, 'Distribution locked successfully');
});

const unlockDistribution = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const currentUser = req.user;
  const result = await teamService.unlockDistribution(teamId, currentUser);
  success(res, result, 'Distribution unlocked successfully');
});

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  lockDistribution,
  unlockDistribution,
  redistributeAssignments
};