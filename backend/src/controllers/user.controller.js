const userService = require('../services/user.service');
const { asyncHandler } = require('../middleware/errorHandler');
const { success, paginated } = require('../utils/response');

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, search, role, isActive } = req.query;
  const result = await userService.getUsers({ page, limit, search, role, isActive });
  paginated(res, result.data, result.total, result.page, result.limit, 'Users retrieved successfully');
});

const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const result = await userService.getUserById(userId);
  success(res, result, 'User retrieved successfully');
});

const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, password, roleId, leaderId, department } = req.body;
  const currentUser = req.user;
  const result = await userService.createUser({ firstName, lastName, email, phone, password, roleId, leaderId, department }, currentUser);
  success(res, result, 'User created successfully', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;
  const result = await userService.updateUser(userId, req.body, currentUser);
  success(res, result, 'User updated successfully');
});

const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;
  await userService.deleteUser(userId, currentUser);
  success(res, null, 'User deleted successfully');
});

const activateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUser = req.user;
  const result = await userService.activateUser(userId, currentUser);
  success(res, result, 'User activated successfully');
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser
};