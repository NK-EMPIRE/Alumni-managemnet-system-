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

const getSuggestions = asyncHandler(async (req, res) => {
  const { field, query } = req.query;
  const suggestions = await alumniAnalysisRepo.getSuggestions({ field, query });
  success(res, suggestions, 'Autocomplete suggestions retrieved successfully');
});

module.exports = {
  getAnalysisAlumni,
  getAnalysisCompanies,
  getAnalysisRoleCategories,
  getSuggestions
};
