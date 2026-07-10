const { Router } = require('express');
const teamController = require('../controllers/team.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.getTeams
);

router.get(
  '/:teamId',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.getTeamById
);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  teamController.createTeam
);

router.put(
  '/:teamId',
  authorize(ROLES.ADMIN),
  teamController.updateTeam
);

router.delete(
  '/:teamId',
  authorize(ROLES.ADMIN),
  teamController.deleteTeam
);

router.post(
  '/:teamId/members',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.addMember
);

router.delete(
  '/members/:teamMemberId',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.removeMember
);

router.patch(
  '/:teamId/lock',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.lockDistribution
);

router.patch(
  '/:teamId/unlock',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.unlockDistribution
);

router.post(
  '/:teamId/redistribute',
  authorize(ROLES.ADMIN, ROLES.LEADER),
  teamController.redistributeAssignments
);

module.exports = router;