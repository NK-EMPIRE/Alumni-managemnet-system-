const { sql, getPool } = require('../config/database');

async function findAll({ page, limit, offset, search, role, isActive }) {
  const pool = await getPool();

  const conditions = ['u.deleted_at IS NULL'];

  if (search) {
    conditions.push(`(u.first_name LIKE @search OR u.last_name LIKE @search OR u.email LIKE @search)`);
  }

  if (role !== undefined && role !== null) {
    const isNumeric = /^\d+$/.test(String(role));
    if (isNumeric) {
      conditions.push('u.role_id = @role');
    } else {
      conditions.push('r.role_name = @roleName');
    }
  }

  if (isActive !== undefined && isActive !== null) {
    conditions.push('u.is_active = @isActive');
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRequest = pool.request();

  if (search) {
    countRequest.input('search', sql.NVarChar(200), `%${search}%`);
  }
  if (role !== undefined && role !== null) {
    const isNumeric = /^\d+$/.test(String(role));
    if (isNumeric) {
      countRequest.input('role', sql.Int, parseInt(role, 10));
    } else {
      countRequest.input('roleName', sql.NVarChar(100), role);
    }
  }
  if (isActive !== undefined && isActive !== null) {
    countRequest.input('isActive', sql.Bit, isActive === true || isActive === 'true' || isActive === 1 ? 1 : 0);
  }

  const countResult = await countRequest.query(`
    SELECT COUNT(*) AS total
    FROM Users u
    INNER JOIN Roles r ON u.role_id = r.role_id
    ${whereClause}
  `);

  const total = countResult.recordset[0].total;

  offset = offset !== undefined ? offset : (page - 1) * limit;

  const dataRequest = pool.request();

  if (search) {
    dataRequest.input('search', sql.NVarChar(200), `%${search}%`);
  }
  if (role !== undefined && role !== null) {
    const isNumeric = /^\d+$/.test(String(role));
    if (isNumeric) {
      dataRequest.input('role', sql.Int, parseInt(role, 10));
    } else {
      dataRequest.input('roleName', sql.NVarChar(100), role);
    }
  }
  if (isActive !== undefined && isActive !== null) {
    dataRequest.input('isActive', sql.Bit, isActive === true || isActive === 'true' || isActive === 1 ? 1 : 0);
  }

  const dataResult = await dataRequest.query(`
    SELECT
      u.user_id, u.role_id, r.role_name, u.leader_id, u.department,
      u.first_name, u.last_name, u.email, u.phone,
      u.is_active, u.last_login, u.created_at, u.updated_at,
      (SELECT COUNT(*) FROM TeamMembers tm INNER JOIN Teams t ON tm.team_id = t.team_id WHERE t.leader_id = u.user_id) AS member_count,
      (SELECT COUNT(*) FROM AlumniAssignments aa INNER JOIN Teams t ON aa.team_id = t.team_id WHERE t.leader_id = u.user_id) AS assigned_count,
      (SELECT RTRIM(CONCAT(ul.first_name, ' ', ul.last_name)) FROM Teams t INNER JOIN Users ul ON t.leader_id = ul.user_id INNER JOIN TeamMembers tm ON tm.team_id = t.team_id WHERE tm.user_id = u.user_id) AS team_leader_name
    FROM Users u
    INNER JOIN Roles r ON u.role_id = r.role_id
    ${whereClause}
    ORDER BY u.first_name ASC, u.last_name ASC
    OFFSET ${offset} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `);

  return { users: dataResult.recordset, total };
}

async function findById(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT
        u.user_id, u.role_id, r.role_name, u.leader_id, u.department,
        u.first_name, u.last_name, u.email, u.phone,
        u.is_active, u.last_login, u.created_at, u.updated_at
      FROM Users u
      INNER JOIN Roles r ON u.role_id = r.role_id
      WHERE u.user_id = @userId AND u.deleted_at IS NULL
    `);
  return result.recordset[0];
}

async function findByEmail(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('email', sql.NVarChar(150), email)
    .query('SELECT user_id, email FROM Users WHERE email = @email');
  return result.recordset[0];
}

async function create({ firstName, lastName, email, phone, passwordHash, roleId, leaderId, department }) {
  const pool = await getPool();
  const request = pool.request()
    .input('firstName', sql.NVarChar(100), firstName)
    .input('lastName', sql.NVarChar(100), lastName)
    .input('email', sql.NVarChar(150), email)
    .input('phone', sql.NVarChar(20), phone || null)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('roleId', sql.Int, roleId)
    .input('leaderId', sql.Int, leaderId || null)
    .input('isActive', sql.Bit, 1)
    .input('department', sql.NVarChar(100), department || null);

  const result = await request.query(`
    INSERT INTO Users (first_name, last_name, email, phone, password_hash, role_id, leader_id, is_active, department)
    OUTPUT INSERTED.*
    VALUES (@firstName, @lastName, @email, @phone, @passwordHash, @roleId, @leaderId, @isActive, @department)
  `);

  return result.recordset[0];
}

async function update(userId, fields) {
  const pool = await getPool();
  const request = pool.request().input('userId', sql.Int, userId);

  const setClauses = [];
  const fieldMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    roleId: 'role_id',
    leaderId: 'leader_id',
    isActive: 'is_active',
    department: 'department'
  };

  for (const [key, value] of Object.entries(fields)) {
    if (fieldMap[key] && value !== undefined) {
      let sqlType = sql.NVarChar(255);

      if (key === 'roleId' || key === 'leaderId') sqlType = sql.Int;
      else if (key === 'isActive') sqlType = sql.Bit;
      else if (key === 'email') sqlType = sql.NVarChar(150);
      else if (key === 'phone') sqlType = sql.NVarChar(20);
      else if (key === 'firstName' || key === 'lastName' || key === 'department') sqlType = sql.NVarChar(100);

      request.input(key, sqlType, value);
      setClauses.push(`${fieldMap[key]} = @${key}`);
    }
  }

  setClauses.push('updated_at = GETUTCDATE()');

  const query = `UPDATE Users SET ${setClauses.join(', ')} WHERE user_id = @userId`;

  const result = await request.query(query);
  return result.rowsAffected[0] > 0;
}

async function softDelete(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE Users
      SET deleted_at = GETUTCDATE(), is_active = 0, updated_at = GETUTCDATE()
      WHERE user_id = @userId
    `);
  return result.rowsAffected[0] > 0;
}

async function activate(userId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE Users
      SET is_active = 1, deleted_at = NULL, updated_at = GETUTCDATE()
      WHERE user_id = @userId
    `);
  return result.rowsAffected[0] > 0;
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  create,
  update,
  softDelete,
  activate
};