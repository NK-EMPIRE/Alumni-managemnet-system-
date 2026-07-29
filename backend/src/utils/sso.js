const jwt = require('jsonwebtoken');
const authRepo = require('../repositories/auth.repository');
const { AuthenticationError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

function getSsoIdentifier(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return payload.email || payload.username || payload.userName || payload.userEmail || null;
}

function getDashboardRedirectPath(role) {
  const normalizedRole = String(role || '').toUpperCase();
  const map = {
    ADMIN: 'admin.html',
    LEADER: 'teamleader.html',
    MEMBER: 'teammember.html',
    'TEAM LEADER': 'teamleader.html',
    'TEAM MEMBER': 'teammember.html'
  };

  return map[normalizedRole] || 'admin.html';
}

async function verifySsoToken(token) {
  if (!token) {
    throw new AuthenticationError('SSO token is required');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new AuthenticationError('Invalid or expired SSO token');
  }

  const identifier = getSsoIdentifier(payload);
  if (!identifier) {
    throw new AuthenticationError('SSO token does not contain a valid user identifier');
  }

  const user = await authRepo.findByLoginId(identifier);
  if (!user || !user.is_active) {
    logger.auditLog('SSO login failed - user not found or inactive', { identifier });
    throw new AuthenticationError('User from SSO token is not recognized in this system');
  }

  await authRepo.updateLastLogin(user.user_id);

  logger.auditLog('SSO login successful', { userId: user.user_id, role: user.role_name, identifier });

  return {
    token: jwt.sign(
      {
        userId: user.user_id,
        role: user.role_name,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    ),
    user: {
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role_name
    },
    redirectPath: getDashboardRedirectPath(user.role_name)
  };
}

module.exports = {
  getSsoIdentifier,
  getDashboardRedirectPath,
  verifySsoToken
};
