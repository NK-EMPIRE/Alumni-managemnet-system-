const reportRepository = require('../repositories/report.repository');
const { NotFoundError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

async function getReports({ page, limit }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const offset = (page - 1) * limit;
  const result = await reportRepository.findAll({ page, limit, offset });
  return { ...result, page, limit };
}

async function getReportById(reportId) {
  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report');
  }
  return report;
}

async function generateReport(data, currentUser) {
  const report = await reportRepository.create({
    reportName: data.reportName,
    reportType: data.reportType,
    parameters: data.parameters,
    format: data.format,
    generatedBy: currentUser.userId,
    filePath: null,
    status: 'Pending'
  });

  logger.auditLog('REPORT_GENERATED', {
    reportId: report.report_id,
    reportName: data.reportName,
    userId: currentUser.userId
  });

  return report;
}

async function deleteReport(reportId, currentUser) {
  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report');
  }

  await reportRepository.removeReport(reportId);

  logger.auditLog('REPORT_DELETED', {
    reportId,
    reportName: report.report_name,
    userId: currentUser.userId
  });
}

async function getSchedules() {
  return reportRepository.findSchedules();
}

async function createSchedule(data, currentUser) {
  const schedule = await reportRepository.createSchedule({
    reportName: data.reportName,
    reportType: data.reportType,
    frequency: data.frequency,
    parameters: data.parameters,
    nextRun: data.nextRun,
    createdBy: currentUser.userId
  });

  logger.auditLog('SCHEDULE_CREATED', {
    scheduleId: schedule.schedule_id,
    reportName: data.reportName,
    userId: currentUser.userId
  });

  return schedule;
}

async function downloadReport(reportId, currentUser) {
  const report = await reportRepository.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report');
  }
  logger.auditLog('REPORT_DOWNLOADED', {
    reportId,
    reportName: report.report_name,
    userId: currentUser.userId
  });
  return report;
}

async function deleteSchedule(scheduleId, currentUser) {
  await reportRepository.deleteSchedule(scheduleId);

  logger.auditLog('SCHEDULE_DELETED', {
    scheduleId,
    userId: currentUser.userId
  });
}

module.exports = {
  getReports,
  getReportById,
  generateReport,
  deleteReport,
  downloadReport,
  getSchedules,
  createSchedule,
  deleteSchedule
};