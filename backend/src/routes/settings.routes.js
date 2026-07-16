const { Router } = require('express');
const settingsController = require('../controllers/settings.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

router.get('/', authenticate, settingsController.getSettings);
router.post('/', authenticate, settingsController.updateSettings);

module.exports = router;
