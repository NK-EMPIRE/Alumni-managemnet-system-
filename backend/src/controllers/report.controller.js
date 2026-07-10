const reportService = require('../services/report.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getReports = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await reportService.getReports({ page, limit });
  paginated(res, result.rows, result.total, result.page, result.limit, 'Reports retrieved successfully');
});

const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const result = await reportService.getReportById(reportId);
  success(res, result, 'Report retrieved successfully');
});

const generateReport = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await reportService.generateReport(req.body, currentUser);
  success(res, result, 'Report generated successfully', 201);
});

const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const currentUser = req.user;
  await reportService.deleteReport(reportId, currentUser);
  success(res, null, 'Report deleted successfully');
});

const getSchedules = asyncHandler(async (req, res) => {
  const result = await reportService.getSchedules();
  success(res, result, 'Schedules retrieved successfully');
});

const createSchedule = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await reportService.createSchedule(req.body, currentUser);
  success(res, result, 'Schedule created successfully', 201);
});

const downloadReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const currentUser = req.user;
  const report = await reportService.downloadReport(reportId, currentUser);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="report-' + reportId + '.json"');
  res.json(report);
});

const deleteSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const currentUser = req.user;
  await reportService.deleteSchedule(scheduleId, currentUser);
  success(res, null, 'Schedule deleted successfully');
});

module.exports = {
  getReports,
  getReportById,
  generateReport,
  deleteReport,
  getSchedules,
  createSchedule,
  downloadReport,
  deleteSchedule
};