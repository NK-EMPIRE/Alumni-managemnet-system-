const { Router } = require('express');
const setupController = require('../controllers/setup.controller');

const router = Router();

router.post('/setup', setupController.runSetup);

module.exports = router;
