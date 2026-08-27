const fs = require('fs/promises');
const uploadService = require('../services/upload.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

async function removeTempFile(file) {
  if (!file || !file.path) return;
  try {
    await fs.unlink(file.path);
  } catch (_) {
    // The file may already have been removed by an upstream failure handler.
  }
}

function parseSheetsParam(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  if (typeof param === 'string') {
    try {
      const parsed = JSON.parse(param);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      return param.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const uploadExcel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'An Excel file is required' });
  const currentUser = req.user;
  const selectedSheets = parseSheetsParam(req.body.sheets);
  try {
    const result = await uploadService.processExcelImport(req.file.path, req.file.originalname, currentUser, selectedSheets);
    success(res, result, 'File uploaded and processed successfully', 201);
  } finally {
    await removeTempFile(req.file);
  }
});

const previewExcel = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'An Excel file is required' });
  const selectedSheets = parseSheetsParam(req.body.sheets || req.query.sheets);
  try {
    const result = await uploadService.getExcelPreview(req.file.path, selectedSheets);
    success(res, result, 'Excel preview generated successfully', 200);
  } finally {
    await removeTempFile(req.file);
  }
});

const inspectSheets = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'An Excel file is required' });
  try {
    const result = await uploadService.getExcelSheets(req.file.path);
    success(res, result, 'Excel sheets inspected successfully', 200);
  } finally {
    await removeTempFile(req.file);
  }
});

const getImportHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const currentUser = req.user;
  const result = await uploadService.getImportHistory({ page, limit });
  paginated(res, result.rows, result.total, result.page, result.limit, 'Import history retrieved successfully');
});

const downloadTemplate = asyncHandler(async (req, res) => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Alumni');
  worksheet.addRows([
    ['Register No', 'Name', 'Email', 'Phone', 'Department', 'Batch', 'Gender', 'Date of Birth', 'Company', 'Designation', 'Working Details', 'LinkedIn Profile'],
    ['CS2024001', 'John Doe', 'john@example.com', '9876543210', 'CSE', '2024', 'Male', '15-05-2002', 'Google', 'Software Engineer', 'Working at Google as SDE', 'https://linkedin.com/in/johndoe'],
    ['CS2024002', 'Jane Smith', 'jane@example.com', '9876543211', 'ECE', '2024', 'Female', '20-08-2001', '', '', '', '']
  ]);
  worksheet.columns = [
    { width: 18 }, { width: 20 }, { width: 25 }, { width: 14 },
    { width: 15 }, { width: 10 }, { width: 10 }, { width: 16 },
    { width: 20 }, { width: 20 }, { width: 30 }, { width: 35 }
  ];
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  const buf = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="alumni_import_template.xlsx"');
  res.send(buf);
});

const confirmAliases = asyncHandler(async (req, res) => {
  const { pairs } = req.body;
  if (!pairs || !Array.isArray(pairs)) {
    return res.status(400).json({ success: false, message: 'Invalid payload: pairs array required.' });
  }

  for (const pair of pairs) {
    if (pair.excelName && pair.leaderId) {
      await uploadService.confirmAlias(pair.leaderId, pair.excelName);
    }
  }

  success(res, null, 'Faculty aliases confirmed and saved successfully', 200);
});

const rollbackImport = asyncHandler(async (req, res) => {
  const { importId } = req.params;
  const currentUser = req.user;
  const result = await uploadService.rollbackImport(parseInt(importId, 10), currentUser);
  success(res, result, `Excel import rolled back successfully. Removed ${result.deletedCount} records.`);
});

module.exports = {
  uploadExcel,
  previewExcel,
  inspectSheets,
  getImportHistory,
  downloadTemplate,
  confirmAliases,
  rollbackImport
};