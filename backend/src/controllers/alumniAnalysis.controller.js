const alumniAnalysisRepo = require('../repositories/alumniAnalysis.repository');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getAnalysisAlumni = asyncHandler(async (req, res) => {
  const {
    roleCategory, company, city, state, country, batch, department, status,
    customQuery, page, limit
  } = req.query;

  let leaderId = null;
  let memberId = null;

  if (req.user.role === 'LEADER') {
    leaderId = req.user.userId;
  } else if (req.user.role === 'MEMBER') {
    memberId = req.user.userId;
  }

  const result = await alumniAnalysisRepo.getAnalysisAlumni({
    roleCategory, company, city, state, country, batch, department, status,
    customQuery, page, limit, leaderId, memberId
  });

  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Alumni analysis records retrieved successfully');
});

const getAnalysisCompanies = asyncHandler(async (req, res) => {
  let leaderId = null;
  let memberId = null;

  if (req.user.role === 'LEADER') {
    leaderId = req.user.userId;
  } else if (req.user.role === 'MEMBER') {
    memberId = req.user.userId;
  }

  const companies = await alumniAnalysisRepo.getAnalysisCompanies({ leaderId, memberId });
  success(res, companies, 'Analysis companies retrieved successfully');
});

const getAnalysisRoleCategories = asyncHandler(async (req, res) => {
  let leaderId = null;
  let memberId = null;

  if (req.user.role === 'LEADER') {
    leaderId = req.user.userId;
  } else if (req.user.role === 'MEMBER') {
    memberId = req.user.userId;
  }

  const categories = await alumniAnalysisRepo.getAnalysisRoleCategories({ leaderId, memberId });
  success(res, categories, 'Analysis role categories retrieved successfully');
});

const getAnalysisLocations = asyncHandler(async (req, res) => {
  let leaderId = null;
  let memberId = null;

  if (req.user.role === 'LEADER') {
    leaderId = req.user.userId;
  } else if (req.user.role === 'MEMBER') {
    memberId = req.user.userId;
  }

  const locations = await alumniAnalysisRepo.getAnalysisLocations({ leaderId, memberId });
  success(res, locations, 'Analysis locations retrieved successfully');
});

const getSuggestions = asyncHandler(async (req, res) => {
  const { field, query } = req.query;
  const suggestions = await alumniAnalysisRepo.getSuggestions({ field, query });
  success(res, suggestions, 'Autocomplete suggestions retrieved successfully');
});

const addSuggestion = asyncHandler(async (req, res) => {
  const { category, value } = req.body;
  if (!category || !value || !value.trim()) {
    return res.status(400).json({ success: false, message: 'Category and value are required' });
  }
  const addedVal = await alumniAnalysisRepo.addSuggestion({ category, value });
  success(res, { value: addedVal }, 'Suggestion added successfully');
});

const masterDataService = require('../services/masterData.service');

const getTaxonomies = asyncHandler(async (req, res) => {
  const data = masterDataService.getCareerTaxonomies();
  success(res, data, 'Taxonomies retrieved successfully');
});

const getCountries = asyncHandler(async (req, res) => {
  const data = await masterDataService.getCountries();
  success(res, data, 'Countries retrieved successfully');
});

const getStates = asyncHandler(async (req, res) => {
  const { countryId } = req.query;
  const data = await masterDataService.getStates(countryId);
  success(res, data, 'States retrieved successfully');
});

const getDistricts = asyncHandler(async (req, res) => {
  const { stateId } = req.query;
  const data = await masterDataService.getDistricts(stateId);
  success(res, data, 'Districts retrieved successfully');
});

const getCities = asyncHandler(async (req, res) => {
  const { districtId, stateId } = req.query;
  const data = await masterDataService.getCities(districtId, stateId);
  success(res, data, 'Cities retrieved successfully');
});

module.exports = {
  getAnalysisAlumni,
  getAnalysisCompanies,
  getAnalysisLocations,
  getAnalysisRoleCategories,
  getSuggestions,
  addSuggestion,
  getTaxonomies,
  getCountries,
  getStates,
  getDistricts,
  getCities
};
