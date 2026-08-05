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

module.exports = router;
