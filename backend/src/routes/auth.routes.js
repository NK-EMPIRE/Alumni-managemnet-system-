const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { loginRules, changePasswordRules, refreshTokenRules } = require('../validators/auth.validator');

const router = Router();

router.post('/login', loginRules, validate, authController.login);
router.post('/sso', authController.sso);
router.post('/refresh-token', refreshTokenRules, validate, authController.refreshToken);
router.post('/change-password', authenticate, changePasswordRules, validate, authController.changePassword);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, authController.forgotPassword);
router.post('/reset-password-with-temp', [
  body('email').isEmail().normalizeEmail(),
  body('temporaryPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validate, authController.resetPasswordWithTemp);

router.get('/reset-password-requests', authenticate, authorize('ADMIN'), authController.getResetRequests);
router.patch('/reset-password-requests/:requestId', authenticate, authorize('ADMIN'), authController.updateResetRequestStatus);

module.exports = router;