const { Router } = require('express');
const alumniAnalysisController = require('../controllers/alumniAnalysis.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ROLES } = require('../constants');

const router = Router();
router.use(authenticate);

// Read-only analysis endpoints accessible to ADMIN and LEADER
router.get('/', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisAlumni);
router.get('/companies', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisCompanies);
router.get('/locations', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisLocations);
router.get('/role-categories', authorize(ROLES.ADMIN, ROLES.LEADER), alumniAnalysisController.getAnalysisRoleCategories);

// Master Data endpoints accessible to all authenticated roles for update modals & filtering
router.get('/master/taxonomies', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getTaxonomies);
router.get('/master/countries', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getCountries);
router.get('/master/states', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getStates);
router.get('/master/districts', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getDistricts);
router.get('/master/cities', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getCities);
router.get('/master/universities', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getUniversities);

// Governance Auto-Learning Queue endpoints (ADMIN exclusive)
router.get('/master/pending', authorize(ROLES.ADMIN), alumniAnalysisController.getPendingMasterItems);
router.post('/master/approve', authorize(ROLES.ADMIN), alumniAnalysisController.approveMasterItem);
router.post('/master/reject', authorize(ROLES.ADMIN), alumniAnalysisController.rejectMasterItem);

// Autocomplete suggestions endpoint accessible to all authenticated roles for update modals
router.get('/suggestions', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.getSuggestions);
router.post('/add-suggestion', authorize(ROLES.ADMIN, ROLES.LEADER, ROLES.MEMBER), alumniAnalysisController.addSuggestion);

module.exports = router;
