const { body, param, query } = require('express-validator');

const createTeamRules = [
  body('teamName').notEmpty().trim(),
  body('leaderId').isInt({ min: 1 })
];

const updateTeamRules = [
  body('teamName').optional().trim(),
  body('leaderId').optional().isInt()
];

const teamIdParam = [
  param('teamId').isInt({ min: 1 })
];

const addMemberRules = [
  body('userId').isInt({ min: 1 })
];

const teamMemberIdParam = [
  param('teamMemberId').isInt({ min: 1 })
];

module.exports = { createTeamRules, updateTeamRules, teamIdParam, addMemberRules, teamMemberIdParam };
