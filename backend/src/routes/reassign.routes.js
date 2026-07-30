const { Router } = require('express');
const reassignController = require('../controllers/reassign.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

// GET /api/v1/assignments/reassign/team-load?leaderId=X (leaderId for Admin; omit for Leader)
router.get(
  '/team-load',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  reassignController.getTeamLoad
);

// GET /api/v1/assignments/reassign/source-departments?sourceMemberId=X&leaderId=Y
router.get(
  '/source-departments',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  reassignController.getSourceMemberDepartments
);

// POST /api/v1/assignments/reassign/preview
router.post(
  '/preview',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  reassignController.previewReassign
);

// POST /api/v1/assignments/reassign/commit
router.post(
  '/commit',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  reassignController.commitReassign
);

module.exports = router;
