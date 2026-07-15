const authRepo = require('../repositories/auth.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AuthenticationError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

async function login(loginId, password, ip, userAgent) {
  const user = await authRepo.findByLoginId(loginId);

  if (!user) {
    logger.auditLog('Login failed - user not found', { loginId, ip });
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.is_active) {
    logger.auditLog('Login failed - account disabled', { loginId, ip });
    throw new AuthenticationError('Account is disabled. Contact your administrator.');
  }

  const match = await comparePassword(password, user.password_hash);

  if (!match) {
    logger.auditLog('Login failed - wrong password', { userId: user.user_id, ip });
    throw new AuthenticationError('Invalid email or password');
  }

  await authRepo.updateLastLogin(user.user_id);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  logger.auditLog('Login successful', {
    userId: user.user_id,
    role: user.role_name,
    ip
  });

  return {
    token: accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role_name
    }
  };
}

async function changePassword(userId, oldPassword, newPassword) {
  logger.info(`[changePassword] Request received for userId: ${userId}`);
  
  const user = await authRepo.findById(userId);
  if (!user) {
    logger.error(`[changePassword] User not found for userId: ${userId}`);
    throw new AuthenticationError('User not found');
  }

  logger.info(`[changePassword] Found user: ${user.email}, password_hash length: ${user.password_hash ? user.password_hash.length : 0}`);

  const match = await comparePassword(oldPassword, user.password_hash);
  logger.info(`[changePassword] Password match result: ${match}`);
  
  if (!match) {
    throw new AuthenticationError('Current password is incorrect');
  }

  const hashed = await hashPassword(newPassword);
  logger.info(`[changePassword] New password hashed successfully. Length: ${hashed.length}`);
  
  const rowsAffected = await authRepo.updatePassword(userId, hashed);
  logger.info(`[changePassword] updatePassword execute result. rowsAffected=${rowsAffected}`);

  if (rowsAffected === 0) {
    logger.error(`[changePassword] No rows updated for userId: ${userId}`);
    throw new AuthenticationError('Failed to update password. User not found.');
  }

  const updatedUser = await authRepo.findById(userId);
  const verifyMatch = await comparePassword(newPassword, updatedUser.password_hash);
  if (!verifyMatch) {
    logger.error(`[changePassword] Password verification FAILED for userId: ${userId} - hash mismatch after update`);
    throw new AuthenticationError('Password update verification failed. Please try again.');
  }
  logger.info(`[changePassword] Password verification PASSED for userId: ${userId}`);

  logger.auditLog('Password changed', { userId, rowsAffected });
}

async function refreshToken(token) {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await authRepo.findById(decoded.userId);

    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    logger.auditLog('Token refreshed', { userId: user.user_id });

    return {
      token: accessToken,
      refreshToken: newRefreshToken
    };
  } catch (err) {
    if (err instanceof AuthenticationError) throw err;
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}

async function forgotPassword(email) {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    // Return early to prevent timing attacks / email discovery, but log it
    logger.info(`Forgot password request for non-existent email: ${email}`);
    return;
  }

  const { generateTemporaryPassword } = require('../utils/password');
  const { sendPasswordResetEmail } = require('../helpers/email');
  
  const tempPass = generateTemporaryPassword();
  const hashed = await hashPassword(tempPass);
  
  await authRepo.updatePassword(user.user_id, hashed);
  await sendPasswordResetEmail(user.email, tempPass);
  logger.auditLog('Password reset requested via forgot password', { userId: user.user_id });
}

module.exports = {
  login,
  changePassword,
  refreshToken,
  forgotPassword
};