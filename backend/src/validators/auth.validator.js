const { body, param, query } = require('express-validator');

const loginRules = [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
];

const changePasswordRules = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const refreshTokenRules = [
  body('refreshToken').notEmpty()
];

module.exports = { loginRules, changePasswordRules, refreshTokenRules };
