const { body, param, query } = require('express-validator');

const createUserRules = [
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').optional(),
  body('roleId').isInt({ min: 1 }),
  body('leaderId').optional().isInt()
];

const updateUserRules = [
  body('firstName').optional().trim(),
  body('lastName').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('roleId').optional().isInt(),
  body('leaderId').optional().isInt()
];

const userIdParam = [
  param('userId').isInt({ min: 1 })
];

module.exports = { createUserRules, updateUserRules, userIdParam };
