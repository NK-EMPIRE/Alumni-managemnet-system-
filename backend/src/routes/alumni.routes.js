const { Router } = require('express');
const { body, param } = require('express-validator');
const alumniController = require('../controllers/alumni.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const searchController = require('../controllers/search.controller');

const router = Router();

router.use(authenticate);

router.get(
  '/search',
  authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER),
  searchController.searchAlumni
);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.getAlumni
);

router.get(
  '/stats',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.getStats
);

router.get(
  '/filters',
  authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER),
  alumniController.getFilters
);


router.get(
  '/assigned',
  authorize(ROLES.MEMBER, ROLES.LEADER),
  alumniController.getMyAssignments
);

router.get(
  '/my-assignments',
  authorize(ROLES.MEMBER, ROLES.LEADER),
  alumniController.getMyAssignments
);

router.get(
  '/:alumniId',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.getAlumniById
);

router.post(
  '/',
  body('registerNo').trim().notEmpty().withMessage('Register number is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('batch').trim().notEmpty().withMessage('Batch is required'),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.createAlumni
);

router.put(
  '/:alumniId',
  param('alumniId').isInt().toInt(),
  body('name').optional().trim().notEmpty(),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.updateAlumni
);

router.patch(
  '/:alumniId/draft',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.MEMBER, ROLES.LEADER),
  alumniController.saveDraft
);

router.patch(
  '/:alumniId/submit',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.MEMBER, ROLES.LEADER),
  alumniController.submitProfessionalInfo
);

router.patch(
  '/:alumniId/reopen',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER),
  alumniController.reopenAlumni
);

router.get(
  '/:alumniId/history',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER),
  alumniController.getAlumniHistory
);

router.post(
  '/:alumniId/professional-info',
  param('alumniId').isInt().toInt(),
  validate,
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.submitProfessionalInfo
);

router.patch(
  '/assignments/:assignmentId/status',
  param('assignmentId').isInt().toInt(),
  body('status').trim().isIn(['Draft', 'Completed']).withMessage('Status must be Draft or Completed'),
  validate,
  authorize(ROLES.MEMBER),
  alumniController.updateAssignmentStatus
);

module.exports = router;