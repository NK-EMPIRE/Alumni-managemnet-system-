const alumniCategoryRepo = require('../repositories/alumniCategory.repository');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getCategoryGroups = asyncHandler(async (req, res) => {
  const { department, batch, status, onlyUpdated } = req.query;
  const result = await alumniCategoryRepo.getCategoryGroups({ department, batch, status, onlyUpdated: onlyUpdated === 'true' });
  success(res, result, 'Alumni category groups retrieved');
});

const getCategoryAlumni = asyncHandler(async (req, res) => {
  const { designation, company, city, professionType, department, batch, status, search, onlyUpdated, page, limit } = req.query;
  const result = await alumniCategoryRepo.getCategoryAlumni({
    designation, company, city, professionType, department, batch, status, search,
    onlyUpdated: onlyUpdated === 'true', page, limit
  });
  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Category alumni retrieved');
});

module.exports = { getCategoryGroups, getCategoryAlumni };
