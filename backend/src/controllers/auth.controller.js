const authService = require('../services/auth.service');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifySsoToken } = require('../utils/sso');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip;
  const userAgent = req.get('User-Agent');

  const loginId = username;
  const result = await authService.login(loginId, password, ip, userAgent);

  success(res, result, 'Login successful');
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  const result = await authService.refreshToken(token);
  success(res, result, 'Token refreshed');
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.userId;

  await authService.changePassword(userId, oldPassword, newPassword);
  success(res, null, 'Password changed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  success(res, null, 'Temporary password sent to email if account exists');
});

const resetPasswordWithTemp = asyncHandler(async (req, res) => {
  const { email, temporaryPassword, newPassword } = req.body;
  if (!email || !temporaryPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'email, temporaryPassword, and newPassword are required.' });
  }
  await authService.resetPasswordWithTemp(email, temporaryPassword, newPassword);
  success(res, null, 'Password reset successfully. You can now log in with your new password.');
});

const getResetRequests = asyncHandler(async (req, res) => {
  const result = await authService.getResetRequests();
  success(res, result, 'Reset requests retrieved successfully');
});

const updateResetRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const adminUser = req.user;
  await authService.updateResetRequestStatus(requestId, status, adminUser);
  success(res, null, `Reset request status updated to ${status}`);
});

const sso = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const result = await verifySsoToken(token);
  success(res, result, 'SSO login successful');
});

const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const me = await authService.getMe(userId);
  success(res, me, 'Profile retrieved');
});

module.exports = {
  login,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPasswordWithTemp,
  getResetRequests,
  updateResetRequestStatus,
  sso,
  getMe
};