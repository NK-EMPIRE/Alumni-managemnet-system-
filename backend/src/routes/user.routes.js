const { Router } = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../constants');

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMIN),
  userController.getUsers
);

router.get(
  '/:userId',
  authorize(ROLES.ADMIN),
  userController.getUserById
);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  userController.createUser
);

router.put(
  '/:userId',
  authorize(ROLES.ADMIN),
  userController.updateUser
);

router.delete(
  '/:userId',
  authorize(ROLES.ADMIN),
  userController.deleteUser
);

router.patch(
  '/:userId/activate',
  authorize(ROLES.ADMIN),
  userController.activateUser
);

module.exports = router;