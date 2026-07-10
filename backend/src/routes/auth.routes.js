const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { loginRules, changePasswordRules, refreshTokenRules } = require('../validators/auth.validator');

const router = Router();

router.post('/login', loginRules, validate, authController.login);
router.post('/refresh-token', refreshTokenRules, validate, authController.refreshToken);
router.post('/change-password', authenticate, changePasswordRules, validate, authController.changePassword);

module.exports = router;