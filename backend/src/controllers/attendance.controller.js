const attendanceService = require('../services/attendance.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getReport = asyncHandler(async (req, res) => {
  const { page, limit, date, userId, status, role } = req.query;
  const result = await attendanceService.getReport({ page, limit, date, userId, status, role });
  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Attendance report retrieved');
});

const getSummary = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const result = await attendanceService.getSummary(date);
  success(res, result, 'Attendance summary retrieved');
});

const markAbsent = asyncHandler(async (req, res) => {
  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ success: false, message: 'date is required (YYYY-MM-DD)' });
  }
  const result = await attendanceService.markAbsentees(date);
  success(res, result, `Marked ${result.markedAbsent} users as absent for ${date}`);
});

const updateRecord = asyncHandler(async (req, res) => {
  const { attendanceId } = req.params;
  const { status, notes } = req.body;
  if (!status || !['Present', 'Late', 'Absent'].includes(status)) {
    return res.status(400).json({ success: false, message: 'status must be Present, Late, or Absent' });
  }
  const result = await attendanceService.updateRecord(parseInt(attendanceId, 10), { status, notes });
  success(res, result, 'Attendance record updated');
});

const getAvailableDates = asyncHandler(async (req, res) => {
  const result = await attendanceService.getAvailableDates();
  success(res, result, 'Available attendance dates retrieved');
});

const getMyAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page, limit } = req.query;
  const result = await attendanceService.getMyAttendance(userId, { page, limit });
  paginated(res, result.data, result.totalCount, result.page, result.limit, 'My attendance retrieved');
});

module.exports = {
  getReport,
  getSummary,
  markAbsent,
  updateRecord,
  getAvailableDates,
  getMyAttendance
};
