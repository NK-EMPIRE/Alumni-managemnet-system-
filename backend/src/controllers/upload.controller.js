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

const downloadTemplate = asyncHandler(async (req, res) => {
  const XLSX = require('xlsx');
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Register No', 'Name', 'Email', 'Phone', 'Department', 'Batch', 'Gender', 'Date of Birth', 'Company', 'Designation', 'Working Details', 'LinkedIn Profile'],
    ['CS2024001', 'John Doe', 'john@example.com', '9876543210', 'CSE', '2024', 'Male', '15-05-2002', 'Google', 'Software Engineer', 'Working at Google as SDE', 'https://linkedin.com/in/johndoe'],
    ['CS2024002', 'Jane Smith', 'jane@example.com', '9876543211', 'ECE', '2024', 'Female', '20-08-2001', '', '', '', '']
  ]);
  ws['!cols'] = [
    { wch: 18 }, { wch: 20 }, { wch: 25 }, { wch: 14 },
    { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 16 },
    { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Alumni');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="alumni_import_template.xlsx"');
  res.send(buf);
});

module.exports = {
  uploadExcel,
  getImportHistory,
  downloadTemplate
};