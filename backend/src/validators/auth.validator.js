const { body, param, query } = require('express-validator');

const loginRules = [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
];

const changePasswordRules = [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character')
];

const refreshTokenRules = [
  body('refreshToken').notEmpty()
];

module.exports = { loginRules, changePasswordRules, refreshTokenRules };
