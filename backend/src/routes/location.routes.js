const { Router } = require('express');
const locationController = require('../controllers/location.controller');
const authenticate = require('../middleware/authenticate');

const router = Router();

// Allow authenticated users to fetch location cascading data
router.use(authenticate);

router.get('/countries', locationController.getCountries);
router.get('/states', locationController.getStates);
router.get('/cities', locationController.getCities);

module.exports = router;
