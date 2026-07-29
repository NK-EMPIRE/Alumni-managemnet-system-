const searchParserService = require('../services/searchParser.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginated } = require('../utils/response');

const searchAlumni = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;

  let leaderId = null;
  let memberId = null;

  if (req.user.role === 'LEADER') {
    leaderId = req.user.userId;
  } else if (req.user.role === 'MEMBER') {
    memberId = req.user.userId;
  }

  const result = await searchParserService.searchAlumni({
    q,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 20,
    leaderId,
    memberId
  });

  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Universal search completed successfully');
});

module.exports = { searchAlumni };
