const { Router } = require('express');
const alumniAnalysisController = require('../controllers/alumniAnalysis.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// All read-only analysis endpoints accessible to ADMIN and LEADER
router.get('/', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisAlumni);
router.get('/companies', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisCompanies);
router.get('/role-categories', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisRoleCategories);

// Autocomplete suggestions endpoint accessible to all authenticated roles for update modals
router.get('/suggestions', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getSuggestions);

module.exports = router;
