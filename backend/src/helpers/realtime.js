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

/**
 * Emit a real-time event to a specific user's socket room.
 * Each logged-in client joins 'user:<userId>' on connection.
 */
function notifyUser(userId, eventName, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}

module.exports = { setIO, notifyAssignmentsUpdated, notifyUser };
