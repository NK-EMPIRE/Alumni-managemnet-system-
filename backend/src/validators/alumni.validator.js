const { body, param, query } = require('express-validator');

const createAlumniRules = [
  body('registerNo').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('department').notEmpty().trim(),
  body('batch').notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail()
];

const updateAlumniRules = [
  body('name').optional().trim(),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('department').optional().trim(),
  body('batch').optional().trim(),
  body('email').optional().isEmail().normalizeEmail()
];

const alumniIdParam = [
  param('alumniId').isInt({ min: 1 })
];

const submitProfessionalInfoRules = [
  body('company').notEmpty().trim(),
  body('designation').notEmpty().trim(),
  body('currentCity').optional().trim(),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('linkedinUrl').optional().trim(),
  body('higherStudies').optional().trim(),
  body('isEntrepreneur').optional().isBoolean(),
  body('isGovernmentJob').optional().isBoolean(),
  body('otherOccupation').optional().trim(),
  body('remarks').optional().trim()
];

const updateAssignmentStatusRules = [
  body('status').isIn(['Draft', 'Completed'])
];

const assignmentIdParam = [
  param('assignmentId').isInt({ min: 1 })
];

module.exports = {
  createAlumniRules,
  updateAlumniRules,
  alumniIdParam,
  submitProfessionalInfoRules,
  updateAssignmentStatusRules,
  assignmentIdParam
};
