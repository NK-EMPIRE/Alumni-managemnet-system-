const alumniService = require('../services/alumni.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getAlumni = asyncHandler(async (req, res) => {
  const { page, limit, search, department, batch, status, leaderId } = req.query;
  const result = await alumniService.getAlumni({ page, limit, search, department, batch, status, leaderId });
  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Alumni retrieved successfully');
});

const getAlumniById = asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const result = await alumniService.getAlumniById(alumniId);
  success(res, result, 'Alumni retrieved successfully');
});

const createAlumni = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const result = await alumniService.createAlumni(req.body, currentUser);
  success(res, result, 'Alumni created successfully', 201);
});

const updateAlumni = asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const currentUser = req.user;
  const result = await alumniService.updateAlumni(alumniId, req.body, currentUser);
  success(res, result, 'Alumni updated successfully');
});

const submitProfessionalInfo = asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const currentUser = req.user;
  const result = await alumniService.submitProfessionalInfo(alumniId, req.body, currentUser);
  success(res, result, 'Professional info submitted successfully');
});

const getMyAssignments = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const { page, limit, onlyMe } = req.query;
  const result = await alumniService.getMyAssignments(currentUser.userId, currentUser.role, { page, limit, onlyMe: onlyMe === 'true' });
  paginated(res, result.data, result.totalCount, result.page, result.limit, 'Assignments retrieved successfully');
});

const updateAssignmentStatus = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const currentUser = req.user;
  const result = await alumniService.updateAssignmentStatus(assignmentId, req.body.status, currentUser);
  success(res, result, 'Assignment status updated successfully');
});

const getStats = asyncHandler(async (req, res) => {
  const result = await alumniService.getStats();
  success(res, result, 'Alumni stats retrieved successfully');
});

const getFilters = asyncHandler(async (req, res) => {
  const result = await alumniService.getFilters();
  success(res, result, 'Alumni filters retrieved successfully');
});


const saveDraft = asyncHandler(async (req, res) => {
  const { alumniId } = req.params;
  const currentUser = req.user;
  const result = await alumniService.saveDraft(alumniId, req.body, currentUser);
  success(res, result, 'Draft saved successfully');
});

module.exports = {
  getAlumni,
  getAlumniById,
  createAlumni,
  updateAlumni,
  submitProfessionalInfo,
  getMyAssignments,
  updateAssignmentStatus,
  getStats,
  getFilters,
  saveDraft
};