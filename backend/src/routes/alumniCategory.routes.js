const { Router } = require('express');
const alumniCategoryController = require('../controllers/alumniCategory.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// Get category group counts (designations, companies, cities, profession types)
router.get('/groups', authorize(ROLES.ADMIN), alumniCategoryController.getCategoryGroups);

// Get paginated alumni list by category filters
router.get('/list', authorize(ROLES.ADMIN), alumniCategoryController.getCategoryAlumni);

module.exports = router;
