const teamRepository = require('../repositories/team.repository');
const userRepository = require('../repositories/user.repository');
const alumniRepository = require('../repositories/alumni.repository');
const { createAuditLog } = require('../helpers/audit');
const { AppError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

async function getTeams({ page, limit, search }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const offset = (page - 1) * limit;
  const result = await teamRepository.findAll({ page, limit, offset, search });
  return { ...result, page, limit };
}

async function getTeamById(teamId) {
  const team = await teamRepository.findById(teamId);
  if (!team) {
    throw new NotFoundError('Team');
  }
  const members = await teamRepository.getMembers(teamId);
  return { ...team, members };
}

async function createTeam(data, currentUser) {
  const leader = await userRepository.findById(data.leaderId);
  if (!leader) {
    throw new NotFoundError('Leader not found');
  }
  const team = await teamRepository.create(data);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'TEAM_CREATED',
    target: `Team: ${team.team_id}`,
    description: `Created team "${team.team_name}"`
  });
  return team;
}

async function updateTeam(teamId, data, currentUser) {
  const team = await teamRepository.findById(teamId);
  if (!team) {
    throw new NotFoundError('Team');
  }
  if (data.leaderId) {
    const leader = await userRepository.findById(data.leaderId);
    if (!leader) {
      throw new NotFoundError('Leader not found');
    }
  }
  await teamRepository.update(teamId, data);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'TEAM_UPDATED',
    target: `Team: ${teamId}`,
    description: `Updated team "${team.team_name}"`
  });
}

async function deleteTeam(teamId, currentUser) {
  const team = await teamRepository.findById(teamId);
  if (!team) {
    throw new NotFoundError('Team');
  }
  const members = await teamRepository.getMembers(teamId);
  if (members.length > 0) {
    throw new ConflictError('Cannot delete team with active members');
  }
  await teamRepository.softDelete(teamId);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'TEAM_DELETED',
    target: `Team: ${teamId}`,
    description: `Deleted team "${team.team_name}"`
  });
}

async function addMember(teamId, userId, currentUser) {
  const team = await teamRepository.findById(teamId);
  if (!team) {
    throw new NotFoundError('Team');
  }
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  const member = await teamRepository.addMember(teamId, userId);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'TEAM_MEMBER_ADDED',
    target: `Team: ${teamId}`,
    description: `Added user ${user.first_name} ${user.last_name} to team "${team.team_name}"`
  });
  return member;
}

async function removeMember(teamMemberId, currentUser) {
  await teamRepository.removeMember(teamMemberId);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'TEAM_MEMBER_REMOVED',
    target: `TeamMember: ${teamMemberId}`,
    description: `Removed team member ${teamMemberId}`
  });
}

async function lockDistribution(teamId, currentUser) {
  await teamRepository.lockDistribution(teamId);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'DISTRIBUTION_LOCKED',
    target: `Team: ${teamId}`,
    description: `Locked distribution for team ${teamId}`
  });
}

async function redistributeAssignments(teamId, currentUser, allocations) {
  if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
    throw new AppError('Allocations array is required', 400);
  }
  const team = await teamRepository.findById(teamId);
  if (!team) throw new NotFoundError('Team');
  if (team.distribution_locked) throw new AppError('Distribution is locked for this team', 400);

  const pending = await alumniRepository.getPendingAssignmentsByTeam(teamId);
  var totalNeeded = allocations.reduce(function (sum, a) { return sum + (a.count || 0); }, 0);
  if (totalNeeded > pending.length) {
    throw new AppError('Not enough pending assignments. Only ' + pending.length + ' available, requested ' + totalNeeded, 400);
  }

  var idx = 0;
  for (var i = 0; i < allocations.length; i++) {
    var alloc = allocations[i];
    for (var j = 0; j < alloc.count; j++) {
      await alumniRepository.updateAssignmentMember(pending[idx].assignment_id, alloc.userId);
      idx++;
    }
  }

  await createAuditLog({
    userId: currentUser.userId,
    username: currentUser.firstName + ' ' + currentUser.lastName,
    roleName: currentUser.role,
    action: 'ASSIGNMENTS_REDISTRIBUTED',
    target: 'Team#' + teamId,
    description: 'Redistributed ' + totalNeeded + ' pending assignments in team "' + team.team_name + '"'
  });

  return { redistributed: totalNeeded, teamId: teamId };
}

async function unlockDistribution(teamId, currentUser) {
  await teamRepository.unlockDistribution(teamId);
  await createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'DISTRIBUTION_UNLOCKED',
    target: `Team: ${teamId}`,
    description: `Unlocked distribution for team ${teamId}`
  });
}

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
