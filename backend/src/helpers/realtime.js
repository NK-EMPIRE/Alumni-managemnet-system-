let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function notifyAssignmentsUpdated(teamId, action = 'reassign') {
  if (!ioInstance) return;
  ioInstance.to('admin').emit('assignmentsUpdated', { teamId, action });
  if (teamId) {
    ioInstance.to(`team:${teamId}`).emit('assignmentsUpdated', { teamId, action });
  }
}

module.exports = { setIO, notifyAssignmentsUpdated };
