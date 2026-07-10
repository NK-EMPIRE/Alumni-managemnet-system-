const uploadService = require('../services/upload.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const uploadExcel = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await uploadService.processExcelImport(req.file.path, currentUser);
  success(res, result, 'File uploaded and processed successfully', 201);
});

const getImportHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const currentUser = req.user;
  const result = await uploadService.getImportHistory({ page, limit });
  paginated(res, result.rows, result.total, result.page, result.limit, 'Import history retrieved successfully');
});

module.exports = {
  uploadExcel,
  getImportHistory
};