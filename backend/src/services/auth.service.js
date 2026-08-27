const authRepo = require('../repositories/auth.repository');
const { hashPassword, comparePassword, generateTemporaryPassword } = require('../utils/password');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { AuthenticationError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const { getPool, sql } = require('../config/database');
const attendanceService = require('./attendance.service');

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

  // Auto attendance: fire-and-forget (never blocks login)
  attendanceService.recordLoginAttendance(user.user_id, user.role_name).catch(function (err) {
    logger.warn('[Attendance] Failed to record login attendance: ' + err.message);
  });

  return {
    token: accessToken,
    refreshToken,
    mustChangePassword: !!user.must_change_password,
    user: {
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role_name,
      mustChangePassword: !!user.must_change_password
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
    logger.auditLog('Password reset request ignored for unknown account', { email });
    return;
  }

  const pool = await getPool();
  
  // Check duplicate pending request
  const checkReq = await pool.request()
    .input('email', sql.VarChar, email)
    .query(`SELECT * FROM ResetRequests WHERE email = @email AND status = 'Pending'`);
    
  if (checkReq.recordset.length > 0) {
    return;
  }

  const name = (user.first_name + ' ' + (user.last_name || '')).trim();
  const roleName = user.role_name || 'USER';

  await pool.request()
    .input('email', sql.VarChar, email)
    .input('name', sql.NVarChar, name)
    .input('role', sql.VarChar, roleName)
    .query(`
      INSERT INTO ResetRequests (email, name, role, status, created_at, updated_at)
      VALUES (@email, @name, @role, 'Pending', SYSUTCDATETIME(), SYSUTCDATETIME())
    `);

  logger.auditLog('Password reset request submitted to admin', { email });
}

async function resetPasswordWithTemp(email, temporaryPassword, newPassword) {
  const user = await authRepo.findByEmail(email);
  if (!user) {
    throw new AuthenticationError('Invalid email or temporary password.');
  }
  
  // Validate the temp password against current hash (which was set by forgotPassword)
  const match = await comparePassword(temporaryPassword, user.password_hash);
  if (!match) {
    throw new AuthenticationError('Temporary password is incorrect. Please check your email.');
  }

  const hashed = await hashPassword(newPassword);
  await authRepo.updatePassword(user.user_id, hashed);
  logger.auditLog('Password reset with temporary password', { userId: user.user_id });
}

async function getResetRequests() {
  const pool = await getPool();
  const res = await pool.request().query(`
    SELECT request_id, email, name, role, status, created_at
    FROM ResetRequests
    WHERE status = 'Pending'
    ORDER BY created_at DESC
  `);
  return res.recordset;
}

async function updateResetRequestStatus(requestId, status, adminUser) {
  const pool = await getPool();
  
  // Find request
  const requestRes = await pool.request()
    .input('requestId', sql.Int, requestId)
    .query(`SELECT * FROM ResetRequests WHERE request_id = @requestId`);
  
  if (requestRes.recordset.length === 0) {
    throw new Error('Reset request not found');
  }
  
  const req = requestRes.recordset[0];
  
  if (status === 'Accepted') {
    const temporaryPassword = generateTemporaryPassword();
    const hashed = await hashPassword(temporaryPassword);
    
    // Find user by email
    const user = await authRepo.findByEmail(req.email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Update password
    await authRepo.updatePassword(user.user_id, hashed, true);
    
    // Update request status
    await pool.request()
      .input('requestId', sql.Int, requestId)
      .query(`UPDATE ResetRequests SET status = 'Accepted', updated_at = SYSUTCDATETIME() WHERE request_id = @requestId`);
      
    logger.auditLog('Password reset request accepted by admin', { email: req.email, adminId: adminUser.userId });

    // Send Mount Zion College Password Reset Approved Email
    try {
      const { sendPasswordResetApprovedEmail } = require('../helpers/email');
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      await sendPasswordResetApprovedEmail({ email: req.email, name: fullName, tempPassword: temporaryPassword });
    } catch (err) {
      logger.error('Failed to send password reset approved email', { email: req.email, error: err.message });
    }
  } else {
    // Update request status to Declined
    await pool.request()
      .input('requestId', sql.Int, requestId)
      .query(`UPDATE ResetRequests SET status = 'Declined', updated_at = SYSUTCDATETIME() WHERE request_id = @requestId`);
      
    logger.auditLog('Password reset request declined by admin', { email: req.email, adminId: adminUser.userId });
  }
}

async function getMe(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, u.department,
             r.role_name AS role
      FROM dbo.Users u
      LEFT JOIN dbo.Roles r ON u.role_id = r.role_id
      WHERE u.user_id = @userId
    `);
  return result.recordset[0] || null;
}

module.exports = {
  login,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPasswordWithTemp,
  getResetRequests,
  updateResetRequestStatus,
  getMe
};