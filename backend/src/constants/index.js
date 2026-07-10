const ROLES = {
  ADMIN: 'ADMIN',
  LEADER: 'LEADER',
  MEMBER: 'MEMBER'
};

const ALUMNI_STATUS = {
  PENDING: 'Pending',
  DRAFT: 'Draft',
  UPDATED: 'Updated',
  COMPLETED: 'Completed'
};

const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  IMPORT: 'import',
  EXPORT: 'export',
  ASSIGN: 'assign',
  LOCK: 'lock',
  UNLOCK: 'unlock',
  RESET_PASSWORD: 'reset_password'
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

const UPLOAD = {
  MAX_FILE_SIZE: 50 * 1024 * 1024,
  ALLOWED_EXTENSIONS: ['.xlsx', '.xls', '.csv'],
  ALLOWED_MIMES: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
};

const REPORT_TYPES = {
  DEPARTMENT_WISE: 'department_wise',
  BATCH_WISE: 'batch_wise',
  TEAM_WISE: 'team_wise',
  INDIVIDUAL: 'individual'
};

const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
};

module.exports = {
  ROLES,
  ALUMNI_STATUS,
  AUDIT_ACTIONS,
  PAGINATION,
  UPLOAD,
  REPORT_TYPES,
  FREQUENCIES
};