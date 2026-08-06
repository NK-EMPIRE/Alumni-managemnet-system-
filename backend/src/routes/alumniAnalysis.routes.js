const { Router } = require('express');
const alumniAnalysisController = require('../controllers/alumniAnalysis.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// Read-only analysis endpoints accessible exclusively to ADMIN
router.get('/', authorize(ROLES.ADMIN), alumniAnalysisController.getAnalysisAlumni);
router.get('/companies', authorize(ROLES.ADMIN), alumniAnalysisController.getAnalysisCompanies);
router.get('/locations', authorize(ROLES.ADMIN), alumniAnalysisController.getAnalysisLocations);
router.get('/role-categories', authorize(ROLES.ADMIN), alumniAnalysisController.getAnalysisRoleCategories);

// Autocomplete suggestions endpoint accessible to all authenticated roles for update modals
router.get('/suggestions', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getSuggestions);
router.post('/add-suggestion', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.addSuggestion);

module.exports = router;
