const auditRepository = require('../repositories/audit.repository');
const { asyncHandler } = require('../middleware/errorHandler');
const { paginated } = require('../utils/response');

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { action, role, dateFrom, dateTo, target } = req.query;

  const result = await auditRepository.findAll({ page, limit, offset, action, role, dateFrom, dateTo, target });
  paginated(res, result.rows, result.total, page, limit, 'Audit logs retrieved successfully');
});

module.exports = { getAuditLogs };
