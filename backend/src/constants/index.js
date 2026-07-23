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

const ASSIGNMENT_STATUS = {
  AVAILABLE: 'Available',
  ASSIGNED_TO_LEADER: 'ASSIGNED_TO_LEADER',
  DISTRIBUTED: 'DISTRIBUTED',
  PENDING: 'Pending',
  DRAFT: 'Draft',
  COMPLETED: 'Completed',
  REOPENED: 'Reopened'
};

const ASSIGNMENT_TYPES = {
  ADMIN_TO_LEADER: 'ADMIN_TO_LEADER',
  LEADER_DISTRIBUTION: 'LEADER_DISTRIBUTION',
  BATCH_WISE: 'BATCH_WISE',
  ROUND_ROBIN: 'ROUND_ROBIN',
  MANUAL: 'MANUAL'
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
  RESET_PASSWORD: 'reset_password',
  ADMIN_ASSIGN: 'ADMIN_ASSIGN',
  LEADER_DISTRIBUTION: 'LEADER_DISTRIBUTION',
  REOPEN_ASSIGNMENT: 'REOPEN_ASSIGNMENT',
  ALUMNI_CREATED: 'ALUMNI_CREATED',
  ALUMNI_UPDATED: 'ALUMNI_UPDATED',
  ALUMNI_COMPLETED: 'ALUMNI_COMPLETED',
  PROFESSIONAL_INFO_SUBMITTED: 'PROFESSIONAL_INFO_SUBMITTED',
  DRAFT_SAVED: 'DRAFT_SAVED',
  ASSIGNMENT_STATUS_UPDATED: 'ASSIGNMENT_STATUS_UPDATED'
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
  ASSIGNMENT_STATUS,
  ASSIGNMENT_TYPES,
  AUDIT_ACTIONS,
  PAGINATION,
  UPLOAD,
  REPORT_TYPES,
  FREQUENCIES
};