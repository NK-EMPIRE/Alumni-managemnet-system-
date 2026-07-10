const { Router } = require('express');
const alumniController = require('../controllers/alumni.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

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
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.getAlumniById
);

router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.createAlumni
);

router.put(
  '/:alumniId',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.updateAlumni
);

router.patch(
  '/:alumniId/draft',
  authorize(ROLES.MEMBER),
  alumniController.saveDraft
);

router.patch(
  '/:alumniId/submit',
  authorize(ROLES.MEMBER, ROLES.LEADER),
  alumniController.submitProfessionalInfo
);

router.post(
  '/:alumniId/professional-info',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  alumniController.submitProfessionalInfo
);

router.patch(
  '/assignments/:assignmentId/status',
  authorize(ROLES.MEMBER),
  alumniController.updateAssignmentStatus
);

module.exports = router;