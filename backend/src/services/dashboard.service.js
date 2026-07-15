const dashboardRepository = require('../repositories/dashboard.repository');
const teamRepository = require('../repositories/team.repository');
const { NotFoundError } = require('../middleware/errorHandler');

async function getAdminStats() {
  return dashboardRepository.getAdminStats();
}

async function getDepartmentProgress() {
  return dashboardRepository.getDepartmentProgress();
}

async function getBatchProgress() {
  return dashboardRepository.getBatchProgress();
}

async function getLeaderRankings(limit) {
  return dashboardRepository.getLeaderRankings(limit);
}

async function getRecentActivities(limit) {
  return dashboardRepository.getRecentActivities(limit);
}

async function getAssignmentTrend(days) {
  return dashboardRepository.getAssignmentTrend(days);
}

async function getLeaderStats(leaderId) {
  const stats = await dashboardRepository.getLeaderStats(leaderId);
  if (!stats || stats.total_assigned === null) {
    throw new NotFoundError('Leader stats');
  }
  
  // Also fetch team members for admin progress watch
  const teams = await teamRepository.getLeaderTeams(leaderId);
  const teamId = teams.length > 0 ? teams[0].team_id : null;
  let teamMembers = [];
  if (teamId) {
    const memberStats = await dashboardRepository.getTeamMemberStats(teamId);
    teamMembers = memberStats.map(m => {
      const assigned = m.total_assigned || 0;
      const completed = m.completed || 0;
      const pending = m.pending || 0;
      const progress = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      return {
        id: m.user_id,
        name: `${m.first_name} ${m.last_name}`,
        assigned, completed, pending, progress,
        status: progress >= 75 ? 'On Track' : progress >= 50 ? 'Behind' : 'Critical'
      };
    });
  }
  
  const totalAssigned = stats.total_assigned || 0;
  const completed = stats.completed || 0;
  return {
    totalAssigned,
    completed,
    pending: stats.pending || 0,
    draft: stats.draft || 0,
    memberCount: stats.member_count || 0,
    completionPercentage: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
    teamMembers
  };
}

async function getMemberStats(memberId) {
  const stats = await dashboardRepository.getMemberStats(memberId);
  if (!stats || stats.total_assigned === null) {
    throw new NotFoundError('Member stats');
  }
  return stats;
}

async function getAdminDashboard() {
  const [stats, deptProgress, batchProgress, rankings, activities] = await Promise.all([
    dashboardRepository.getAdminStats(),
    dashboardRepository.getDepartmentProgress(),
    dashboardRepository.getBatchProgress(),
    dashboardRepository.getLeaderRankings(10),
    dashboardRepository.getRecentActivities(20)
  ]);

  return {
    totalAlumni: stats?.total_alumni || 0,
    totalLeaders: stats?.total_leaders || 0,
    totalMembers: stats?.total_members || 0,
    totalTeams: stats?.total_teams || 0,
    pendingRecords: stats?.pending_assignments || 0,
    completedRecords: stats?.completed_assignments || 0,
    draftRecords: stats?.draft_assignments || 0,
    updatedRecords: 0,
    completionPercentage: stats?.total_alumni > 0
      ? Math.round(((stats?.completed_assignments || 0) / stats?.total_alumni) * 100)
      : 0,
    departmentWiseProgress: (deptProgress || []).map(d => ({
      department: d.department,
      total: d.total,
      completed: d.completed
    })),
    batchWiseProgress: (batchProgress || []).map(b => ({
      batch: b.batch,
      total: b.total,
      completed: b.completed
    })),
    leaderRankings: (rankings || []).map(r => ({
      name: `${r.first_name} ${r.last_name}`,
      assigned: r.total_assigned || 0,
      completed: r.completed || 0,
      completionPercentage: r.completion_percentage || 0
    })),
    recentActivity: (activities || []).map(a => ({
      user: a.description?.split(' ').slice(0, 2).join(' ') || 'System',
      action: a.description || a.activity_type || '',
      time: formatTimeAgo(a.created_at)
    }))
  };
}

async function getLeaderDashboard(leaderId) {
  const teams = await teamRepository.getLeaderTeams(leaderId);
  const teamId = teams.length > 0 ? teams[0].team_id : null;

  const [stats, rankings, activities] = await Promise.all([
    dashboardRepository.getLeaderStats(leaderId),
    dashboardRepository.getLeaderRankings(10),
    dashboardRepository.getRecentActivities(20)
  ]);

  let teamMembers = [];
  if (teamId) {
    const memberStats = await dashboardRepository.getTeamMemberStats(teamId);
    teamMembers = memberStats.map(m => {
      const assigned = m.total_assigned || 0;
      const completed = m.completed || 0;
      const pending = m.pending || 0;
      const progress = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      return {
        id: m.user_id,
        name: `${m.first_name} ${m.last_name}`,
        assigned,
        completed,
        pending,
        progress,
        status: progress >= 75 ? 'On Track' : progress >= 50 ? 'Behind' : 'Critical',
        lastActivity: '-',
        email: m.email
      };
    });
  }

  return {
    teamId,
    totalAssigned: stats?.total_assigned || 0,
    completed: stats?.completed || 0,
    pending: stats?.pending || 0,
    draft: stats?.draft || 0,
    undistributed: stats?.undistributed_count || 0,
    distributed: stats?.distributed_count || 0,
    memberCount: stats?.member_count || 0,
    completionPercentage: stats?.total_assigned > 0
      ? Math.round(((stats?.completed || 0) / stats?.total_assigned) * 100)
      : 0,
    leaderRankings: (rankings || []).map(r => ({
      name: `${r.first_name} ${r.last_name}`,
      completed: r.completed || 0,
      completionPercentage: r.completion_percentage || 0
    })),
    teamMembers,
    recentActivity: (activities || []).map(a => ({
      user: a.description?.split(' ').slice(0, 2).join(' ') || 'System',
      action: a.description || a.activity_type || '',
      time: formatTimeAgo(a.created_at)
    }))
  };
}

async function getMemberDashboard(memberId) {
  const stats = await dashboardRepository.getMemberStats(memberId);
  return {
    totalAssigned: stats?.total_assigned || 0,
    completed: stats?.completed || 0,
    pending: stats?.pending || 0,
    draft: stats?.draft || 0,
    todayUpdates: stats?.today_updates || 0,
    completionPercentage: stats?.total_assigned > 0
      ? Math.round(((stats?.completed || 0) / stats?.total_assigned) * 100)
      : 0,
    leaderName: stats?.leader_name || 'Not Assigned'
  };
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

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
  getMemberStats
};