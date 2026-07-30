const userRepository = require('../repositories/user.repository');
const { createAuditLog } = require('../helpers/audit');
const { sendPasswordResetEmail } = require('../helpers/email');
const { hashPassword, generateTemporaryPassword } = require('../utils/password');
const { AppError, NotFoundError, ConflictError } = require('../middleware/errorHandler');

async function getUsers({ page, limit, search, role, isActive }) {
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  const offset = (page - 1) * limit;

  const result = await userRepository.findAll({ page, limit, offset, search, role, isActive });

  return {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
    data: result.users
  };
}

async function getUserById(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

async function createUser(userData, currentUser) {
  const existing = await userRepository.findByEmail(userData.email);

  if (existing) {
    throw new ConflictError('Email already in use');
  }

  const userProvidedPassword = userData.password && userData.password.trim() !== '';
  const plainPassword = userProvidedPassword ? userData.password : 'mzcet@123';
  const passwordHash = await hashPassword(plainPassword);

  const created = await userRepository.create({
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    phone: userData.phone,
    passwordHash,
    roleId: userData.roleId,
    leaderId: userData.leaderId,
    department: userData.department
  });

  createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'USER_CREATED',
    target: `User ${created.user_id}`,
    description: `Created user ${userData.firstName} ${userData.lastName}`
  });

  try {
    const { sendLeaderWelcomeEmail, sendMemberWelcomeEmail } = require('../helpers/email');
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();
    
    // Role 2 = Leader, Role 3 = Member (or string)
    const isLeader = userData.roleId == 2 || (userData.roleName && userData.roleName.toUpperCase() === 'LEADER');
    if (isLeader) {
      await sendLeaderWelcomeEmail({ name: fullName, email: userData.email, plainPassword });
    } else {
      let leaderName = null;
      if (userData.leaderId) {
        try {
          const leaderUser = await userRepository.findById(userData.leaderId);
          if (leaderUser) leaderName = `${leaderUser.first_name} ${leaderUser.last_name}`;
        } catch (e) {}
      }
      await sendMemberWelcomeEmail({ name: fullName, email: userData.email, plainPassword, leaderName });
    }
  } catch (err) {
    const { logger } = require('../utils/logger');
    logger.error('Failed to send welcome email', { email: userData.email, error: err.message });
  }

  const { password_hash, ...userWithoutPassword } = created;
  if (!userProvidedPassword) {
    userWithoutPassword.temporaryPassword = plainPassword;
  }
  return userWithoutPassword;
}

async function updateUser(userId, userData, currentUser) {
  if (currentUser.role !== 'Admin' && Number(userId) !== Number(currentUser.userId)) {
    throw new AppError('Insufficient permissions to update this profile', 403);
  }

  const existing = await userRepository.findById(userId);

  if (!existing) {
    throw new NotFoundError('User not found');
  }

  let fieldsToUpdate = { ...userData };
  if (currentUser.role !== 'Admin') {
    fieldsToUpdate = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone
    };
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });
  }

  if (fieldsToUpdate.email && fieldsToUpdate.email.toLowerCase() !== existing.email.toLowerCase()) {
    const emailConflict = await userRepository.findByEmail(fieldsToUpdate.email);
    if (emailConflict && Number(emailConflict.user_id) !== Number(userId)) {
      throw new ConflictError('Email already in use');
    }
  }

  await userRepository.update(userId, fieldsToUpdate);

  const updated = await userRepository.findById(userId);

  createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'USER_UPDATED',
    target: `User ${userId}`,
    description: `Updated user ${updated?.first_name || userId}`
  });

  return updated;
}

async function deleteUser(userId, currentUser) {
  if (Number(userId) === Number(currentUser.userId)) {
    throw new AppError('You cannot delete yourself', 400);
  }

  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await userRepository.softDelete(userId);

  createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'USER_DELETED',
    target: `User ${userId}`,
    description: `Deleted user ${user.first_name} ${user.last_name}`
  });
}

async function activateUser(userId, currentUser) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  await userRepository.activate(userId);

  createAuditLog({
    userId: currentUser.userId,
    username: `${currentUser.firstName} ${currentUser.lastName}`,
    roleName: currentUser.role,
    action: 'USER_ACTIVATED',
    target: `User ${userId}`,
    description: `Activated user ${user.first_name} ${user.last_name}`
  });
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser
};