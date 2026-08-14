const { sql, getPool } = require('../config/database');

const ALLOWED_UPDATE_FIELDS = [
  'name', 'gender', 'batch', 'department', 'email', 'phone',
  'company', 'designation', 'working_details', 'linkedin_profile', 'date_of_birth',
  'experience', 'salary', 'city', 'country', 'father_name',
  'address', 'state', 'secondary_phone', 'secondary_email',
  'employment_status', 'career_type', 'career_category', 'role_category',
  'district', 'university'
];

const FIELD_TYPES = {
  name: sql.NVarChar(150),
  gender: sql.NVarChar(10),
  batch: sql.NVarChar(10),
  department: sql.NVarChar(50),
  email: sql.NVarChar(150),
  phone: sql.NVarChar(50),
  company: sql.NVarChar(200),
  designation: sql.NVarChar(200),
  working_details: sql.NVarChar(500),
  linkedin_profile: sql.NVarChar(255),
  date_of_birth: sql.NVarChar(20),
  experience: sql.NVarChar(50),
  salary: sql.NVarChar(50),
  city: sql.NVarChar(100),
  country: sql.NVarChar(100),
  father_name: sql.NVarChar(150),
  address: sql.NVarChar(500),
  state: sql.NVarChar(100),
  secondary_phone: sql.NVarChar(50),
  secondary_email: sql.NVarChar(150),
  employment_status: sql.NVarChar(30),
  career_type: sql.NVarChar(100),
  career_category: sql.NVarChar(100),
  role_category: sql.NVarChar(100),
  district: sql.NVarChar(100),
  university: sql.NVarChar(200)
};

async function findAll({ page, limit, offset, search, department, batch, status, leaderId, memberId, dateFrom, dateTo, dateField }) {
  const pool = await getPool();
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .input('search', sql.NVarChar(200), search ? `%${search}%` : null)
    .input('department', sql.NVarChar(50), department || null)
    .input('batch', sql.NVarChar(10), batch || null)
    .input('status', sql.NVarChar(30), status || null)
    .input('leaderId', sql.Int, leaderId ? parseInt(leaderId, 10) : null)
    .input('memberId', sql.Int, memberId ? parseInt(memberId, 10) : null)
    .input('dateFrom', sql.NVarChar(30), dateFrom || null)
    .input('dateTo', sql.NVarChar(30), dateTo || null);

  const dateCol = dateField === 'assigned_date' ? 'aa.assigned_date' : 'a.created_at';

  const result = await request.query(`
    WITH AlumniCTE AS (
      SELECT
        a.alumni_id, a.register_no, a.name, a.father_name, a.gender, a.batch,
        a.department, a.email, a.phone,
        COALESCE(NULLIF(a.company, ''), pi.pi_company) AS company,
        COALESCE(NULLIF(a.designation, ''), pi.pi_designation) AS designation,
        COALESCE(NULLIF(a.city, ''), pi.pi_city) AS city,
        a.working_details, a.linkedin_profile, a.is_updated,
        a.updated_date, a.created_at, a.experience, a.salary, a.country,
        a.date_of_birth, a.address, a.state, a.secondary_phone, a.secondary_email,
        a.employment_status, a.career_type, a.career_category, a.role_category,
        a.district, a.university,
        aa.status AS assignment_status, aa.assigned_date, aa.completed_date,
        aa.assignment_id, aa.team_id, aa.member_id,
        ul.first_name + ' ' + ul.last_name AS leader_name,
        um.first_name + ' ' + um.last_name AS member_name
      FROM Alumni a
      OUTER APPLY (
        SELECT TOP 1 company AS pi_company, designation AS pi_designation, current_city AS pi_city
        FROM ProfessionalInformation
        WHERE alumni_id = a.alumni_id
        ORDER BY updated_at DESC
      ) pi
      LEFT JOIN (
        SELECT assignment_id, alumni_id, team_id, member_id, status,
               assigned_date, completed_date,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM AlumniAssignments
      ) aa ON a.alumni_id = aa.alumni_id AND aa.rn = 1
      LEFT JOIN Teams t ON aa.team_id = t.team_id
      LEFT JOIN Users ul ON t.leader_id = ul.user_id
      LEFT JOIN Users um ON aa.member_id = um.user_id
      WHERE
        (@search IS NULL OR a.name LIKE @search OR a.department LIKE @search OR a.company LIKE @search OR pi.pi_company LIKE @search OR a.register_no LIKE @search)
        AND (@department IS NULL OR a.department = @department)
        AND (@batch IS NULL OR a.batch = @batch)
        AND (@leaderId IS NULL OR t.leader_id = @leaderId)
        AND (
          @memberId IS NULL 
          OR aa.member_id = @memberId 
          OR (aa.member_id IS NULL AND @memberId = t.leader_id)
        )
        AND (
          @status IS NULL
          OR (@status = 'Available' AND aa.status IS NULL)
          OR (aa.status = @status)
        )
        AND (@dateFrom IS NULL OR ${dateCol} >= CAST(@dateFrom AS DATETIME2))
        AND (@dateTo IS NULL OR ${dateCol} <= CAST(@dateTo + ' 23:59:59' AS DATETIME2))
    )
    SELECT *, (SELECT COUNT(*) FROM AlumniCTE) AS total_count
    FROM AlumniCTE
    ORDER BY name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;

  return { data, totalCount, page, limit };
}

async function findById(alumniId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .query(`
      SELECT
        a.alumni_id, a.register_no, a.name, a.gender, a.batch,
        a.department, a.email, a.phone, a.company, a.designation,
        a.working_details, a.linkedin_profile, a.is_updated,
        a.updated_date, a.created_at, a.father_name,
        a.date_of_birth, a.address,
        COALESCE(NULLIF(a.state, ''), pi.state) AS state,
        COALESCE(NULLIF(a.country, ''), pi.country) AS country,
        a.secondary_phone, a.secondary_email,
        a.employment_status, a.career_type, a.career_category, a.role_category,
        a.district, a.university,
        pi.info_id, pi.company AS pi_company, pi.designation AS pi_designation,
        pi.current_city, pi.state AS pi_state, pi.country AS pi_country,
        pi.email AS pi_email, pi.phone AS pi_phone,
        pi.linkedin_url, pi.higher_studies,
        pi.is_entrepreneur, pi.is_government_job, pi.other_occupation,
        pi.remarks, pi.updated_by, pi.updated_at AS pi_updated_at, pi.father_name AS pi_father_name,
        pi.employment_status AS pi_employment_status, pi.career_type AS pi_career_type,
        pi.career_category AS pi_career_category, pi.role_category AS pi_role_category,
        pi.district AS pi_district, pi.university AS pi_university,
        aa.assignment_id, aa.team_id, aa.member_id,
        aa.status AS assignment_status,
        aa.assigned_date, aa.completed_date
      FROM Alumni a
      OUTER APPLY (
        SELECT TOP 1 *
        FROM ProfessionalInformation
        WHERE alumni_id = a.alumni_id
        ORDER BY updated_at DESC
      ) pi
      LEFT JOIN (
        SELECT assignment_id, alumni_id, team_id, member_id, status,
               assigned_date, completed_date,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM AlumniAssignments
      ) aa ON a.alumni_id = aa.alumni_id AND aa.rn = 1
      WHERE a.alumni_id = @alumniId
    `);

  return result.recordset[0];
}

async function findByRegisterNo(registerNo) {
  const pool = await getPool();
  const result = await pool.request()
    .input('registerNo', sql.NVarChar(30), registerNo)
    .query('SELECT * FROM Alumni WHERE register_no = @registerNo');

  return result.recordset[0];
}

async function create(data) {
  const pool = await getPool();
  const result = await pool.request()
    .input('registerNo', sql.NVarChar(30), data.registerNo)
    .input('name', sql.NVarChar(150), data.name)
    .input('gender', sql.NVarChar(10), data.gender)
    .input('batch', sql.NVarChar(10), data.batch)
    .input('department', sql.NVarChar(50), data.department)
    .input('email', sql.NVarChar(150), data.email)
    .input('phone', sql.NVarChar(50), data.phone)
    .query(`
      INSERT INTO Alumni (register_no, name, gender, batch, department, email, phone)
      OUTPUT INSERTED.*
      VALUES (@registerNo, @name, @gender, @batch, @department, @email, @phone)
    `);

  return result.recordset[0];
}

async function update(alumniId, fields) {
  const allowedFields = ALLOWED_UPDATE_FIELDS.filter(f => fields[f] !== undefined);
  if (allowedFields.length === 0) {
    return findById(alumniId);
  }

  const pool = await getPool();
  const request = pool.request()
    .input('alumniId', sql.Int, alumniId);

  const setClauses = allowedFields.map(f => {
    const type = FIELD_TYPES[f] || sql.NVarChar(255);
    request.input(f, type, fields[f]);
    return `${f} = @${f}`;
  });

  const query = `
    UPDATE Alumni
    SET ${setClauses.join(', ')},
        is_updated = 1,
        updated_date = GETUTCDATE()
    WHERE alumni_id = @alumniId
  `;

  await request.query(query);
  return findById(alumniId);
}

async function createProfessionalInfo(data) {
  const pool = await getPool();
  const transaction = pool.transaction();
  try {
    await transaction.begin();

    const result = await transaction.request()
      .input('alumniId', sql.Int, data.alumni_id)
      .input('company', sql.NVarChar(200), data.company || null)
      .input('designation', sql.NVarChar(200), data.designation || null)
      .input('currentCity', sql.NVarChar(100), data.current_city || data.city || null)
      .input('state', sql.NVarChar(100), data.state || null)
      .input('country', sql.NVarChar(100), data.country || null)
      .input('email', sql.NVarChar(150), data.email || null)
      .input('phone', sql.NVarChar(50), data.phone || null)
      .input('linkedinUrl', sql.NVarChar(500), data.linkedin_url || data.linkedin_profile || null)
      .input('higherStudies', sql.NVarChar(200), data.higher_studies || data.higherStudies || null)
      .input('isEntrepreneur', sql.Bit, data.is_entrepreneur ? 1 : 0)
      .input('isGovernmentJob', sql.Bit, data.is_government_job ? 1 : 0)
      .input('otherOccupation', sql.NVarChar(200), data.other_occupation || data.otherOcc || null)
      .input('remarks', sql.NVarChar(sql.MAX), data.remarks || null)
      .input('updatedBy', sql.Int, data.updated_by || null)
      .input('fatherName', sql.NVarChar(150), data.father_name || data.fatherName || null)
      .input('employmentStatus', sql.NVarChar(30), data.employment_status || null)
      .input('careerType', sql.NVarChar(100), data.career_type || null)
      .input('careerCategory', sql.NVarChar(100), data.career_category || null)
      .input('roleCategory', sql.NVarChar(100), data.role_category || null)
      .input('district', sql.NVarChar(100), data.district || null)
      .input('university', sql.NVarChar(200), data.university || null)
      .query(`
        INSERT INTO ProfessionalInformation
          (alumni_id, company, designation, current_city, state, country,
           email, phone, linkedin_url, higher_studies, is_entrepreneur,
           is_government_job, other_occupation, remarks, updated_by, father_name,
           employment_status, career_type, career_category, role_category,
           district, university)
        OUTPUT INSERTED.*
        VALUES
          (@alumniId, @company, @designation, @currentCity, @state, @country,
           @email, @phone, @linkedinUrl, @higherStudies, @isEntrepreneur,
           @isGovernmentJob, @otherOccupation, @remarks, @updatedBy, @fatherName,
           @employmentStatus, @careerType, @careerCategory, @roleCategory,
           @district, @university)
      `);

    const updateReq = transaction.request();
    updateReq.input('alumniId', sql.Int, data.alumni_id);
    updateReq.input('name', sql.NVarChar(150), data.name || null);
    updateReq.input('department', sql.NVarChar(50), data.department || null);
    updateReq.input('batch', sql.NVarChar(10), data.batch || null);
    updateReq.input('company', sql.NVarChar(200), data.company || null);
    updateReq.input('designation', sql.NVarChar(200), data.designation || null);
    updateReq.input('email', sql.NVarChar(150), data.email || null);
    updateReq.input('phone', sql.NVarChar(50), data.phone || null);
    updateReq.input('secondaryEmail', sql.NVarChar(150), data.secondary_email || null);
    updateReq.input('secondaryPhone', sql.NVarChar(50), data.secondary_phone || null);
    updateReq.input('workingDetails', sql.NVarChar(500), data.working_details || null);
    updateReq.input('linkedinProfile', sql.NVarChar(255), data.linkedin_url || data.linkedin_profile || null);
    updateReq.input('dateOfBirth', sql.NVarChar(20), data.date_of_birth || data.dob || null);
    updateReq.input('fatherName', sql.NVarChar(150), data.father_name || data.fatherName || null);
    updateReq.input('address', sql.NVarChar(500), data.address || null);
    updateReq.input('city', sql.NVarChar(100), data.current_city || data.city || null);
    updateReq.input('state', sql.NVarChar(100), data.state || null);
    updateReq.input('country', sql.NVarChar(100), data.country || null);
    updateReq.input('employmentStatus', sql.NVarChar(30), data.employment_status || null);
    updateReq.input('careerType', sql.NVarChar(100), data.career_type || null);
    updateReq.input('careerCategory', sql.NVarChar(100), data.career_category || null);
    updateReq.input('roleCategory', sql.NVarChar(100), data.role_category || null);
    updateReq.input('district', sql.NVarChar(100), data.district || null);
    updateReq.input('university', sql.NVarChar(200), data.university || null);
    await updateReq.query(`
      UPDATE Alumni
      SET name = COALESCE(@name, name),
          department = COALESCE(@department, department),
          batch = COALESCE(@batch, batch),
          company = @company,
          designation = @designation,
          email = @email,
          phone = @phone,
          secondary_email = @secondaryEmail,
          secondary_phone = @secondaryPhone,
          working_details = @workingDetails,
          linkedin_profile = @linkedinProfile,
          date_of_birth = COALESCE(@dateOfBirth, date_of_birth),
          father_name = COALESCE(@fatherName, father_name),
          address = @address,
          city = @city,
          state = @state,
          country = @country,
          employment_status = COALESCE(@employmentStatus, employment_status),
          career_type = COALESCE(@careerType, career_type),
          career_category = COALESCE(@careerCategory, career_category),
          role_category = COALESCE(@roleCategory, role_category),
          district = COALESCE(@district, district),
          university = COALESCE(@university, university),
          is_updated = 1,
          updated_date = GETUTCDATE()
      WHERE alumni_id = @alumniId
    `);

    await transaction.commit();
    return result.recordset[0];
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function getProfessionalHistory(alumniId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('alumniId', sql.Int, alumniId)
    .query(`
      SELECT
        pi.*,
        u.first_name + ' ' + u.last_name AS updated_by_name
      FROM ProfessionalInformation pi
      LEFT JOIN Users u ON pi.updated_by = u.user_id
      WHERE pi.alumni_id = @alumniId
      ORDER BY pi.updated_at DESC
    `);

  return result.recordset;
}

async function getAssignmentsByMember(memberId, { page, limit, offset, search, department, batch, status }) {
  const pool = await getPool();
  const request = pool.request()
    .input('memberId', sql.Int, memberId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .input('search', sql.NVarChar(200), (search && search !== 'undefined' && search !== 'null') ? `%${search}%` : null)
    .input('department', sql.NVarChar(50), (department && department !== 'undefined' && department !== 'null') ? department : null)
    .input('batch', sql.NVarChar(10), (batch && batch !== 'undefined' && batch !== 'null') ? batch : null)
    .input('status', sql.NVarChar(30), (status && status !== 'undefined' && status !== 'null') ? status : null);

  const result = await request.query(`
    WITH MemberAssignments AS (
      SELECT
        a.alumni_id, a.register_no, a.name, a.gender, a.batch,
        a.department, a.email, a.phone,
        COALESCE(NULLIF(a.company, ''), pi.pi_company) AS company,
        COALESCE(NULLIF(a.designation, ''), pi.pi_designation) AS designation,
        COALESCE(NULLIF(a.city, ''), pi.pi_city) AS city,
        COALESCE(NULLIF(a.city, ''), pi.pi_city) AS current_city,
        COALESCE(NULLIF(a.state, ''), pi.pi_state) AS state,
        COALESCE(NULLIF(a.country, ''), pi.pi_country) AS country,
        a.working_details, a.linkedin_profile, a.experience,
        a.address, a.secondary_email, a.secondary_phone, a.is_updated,
        a.updated_date, a.created_at, a.father_name, a.date_of_birth,
        a.employment_status, a.career_type, a.career_category, a.role_category,
        a.district, a.university,
        aa.assignment_id, aa.team_id, aa.status,
        aa.assigned_date, aa.completed_date
      FROM AlumniAssignments aa
      INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
      OUTER APPLY (
        SELECT TOP 1 company AS pi_company, designation AS pi_designation, current_city AS pi_city, state AS pi_state, country AS pi_country
        FROM ProfessionalInformation
        WHERE alumni_id = a.alumni_id
        ORDER BY updated_at DESC
      ) pi
      WHERE aa.member_id = @memberId
        AND (@search IS NULL OR a.name LIKE @search OR a.register_no LIKE @search OR a.department LIKE @search OR a.company LIKE @search OR pi.pi_company LIKE @search OR a.father_name LIKE @search)
        AND (@department IS NULL OR a.department = @department)
        AND (@batch IS NULL OR a.batch = @batch)
        AND (@status IS NULL OR aa.status = @status)
    )
    SELECT *, (SELECT COUNT(*) FROM MemberAssignments) AS total_count
    FROM MemberAssignments
    ORDER BY name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;

  return { data, totalCount, page, limit };
}

async function getAssignmentsByLeader(leaderId, { page, limit, offset, search, department, batch, status, memberId }) {
  const pool = await getPool();
  const request = pool.request()
    .input('leaderId', sql.Int, leaderId)
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .input('search', sql.NVarChar(200), (search && search !== 'undefined' && search !== 'null') ? `%${search}%` : null)
    .input('department', sql.NVarChar(50), (department && department !== 'undefined' && department !== 'null') ? department : null)
    .input('batch', sql.NVarChar(10), (batch && batch !== 'undefined' && batch !== 'null') ? batch : null)
    .input('status', sql.NVarChar(30), (status && status !== 'undefined' && status !== 'null') ? status : null)
    .input('memberId', sql.Int, (memberId && memberId !== 'undefined' && memberId !== 'null') ? parseInt(memberId) : null);

  const result = await request.query(`
    WITH TeamAssignments AS (
      SELECT
        a.alumni_id, a.register_no, a.name, a.gender, a.batch,
        a.department, a.email, a.phone,
        COALESCE(NULLIF(a.company, ''), pi.pi_company) AS company,
        COALESCE(NULLIF(a.designation, ''), pi.pi_designation) AS designation,
        COALESCE(NULLIF(a.city, ''), pi.pi_city) AS city,
        COALESCE(NULLIF(a.city, ''), pi.pi_city) AS current_city,
        COALESCE(NULLIF(a.state, ''), pi.pi_state) AS state,
        COALESCE(NULLIF(a.country, ''), pi.pi_country) AS country,
        a.address, a.secondary_email, a.secondary_phone,
        a.working_details, a.linkedin_profile, a.is_updated,
        a.updated_date, a.created_at, a.father_name, a.date_of_birth,
        a.employment_status, a.career_type, a.career_category, a.role_category,
        a.district, a.university,
        aa.assignment_id, aa.team_id, aa.member_id, aa.status,
        aa.assigned_date, aa.completed_date,
        ISNULL(u.first_name + ' ' + u.last_name, 'Unassigned') AS assigned_to
      FROM AlumniAssignments aa
      INNER JOIN Alumni a ON aa.alumni_id = a.alumni_id
      LEFT JOIN Users u ON aa.member_id = u.user_id
      INNER JOIN Teams t ON aa.team_id = t.team_id
      OUTER APPLY (
        SELECT TOP 1 company AS pi_company, designation AS pi_designation, current_city AS pi_city, state AS pi_state, country AS pi_country
        FROM ProfessionalInformation
        WHERE alumni_id = a.alumni_id
        ORDER BY updated_at DESC
      ) pi
      WHERE t.leader_id = @leaderId
        AND (@memberId IS NULL OR aa.member_id = @memberId)
        AND (@search IS NULL OR a.name LIKE @search OR a.register_no LIKE @search OR a.department LIKE @search OR a.company LIKE @search OR pi.pi_company LIKE @search)
        AND (@department IS NULL OR a.department = @department)
        AND (@batch IS NULL OR a.batch = @batch)
        AND (@status IS NULL OR aa.status = @status)
    )
    SELECT *, (SELECT COUNT(*) FROM TeamAssignments) AS total_count
    FROM TeamAssignments
    ORDER BY name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `);

  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;

  return { data, totalCount, page, limit };
}

async function updateAssignmentStatus(assignmentId, status) {
  const pool = await getPool();
  const request = pool.request()
    .input('assignmentId', sql.Int, assignmentId)
    .input('status', sql.NVarChar(30), status);

  if (status === 'Completed') {
    await request.query(`
      UPDATE AlumniAssignments
      SET status = @status, completed_date = GETUTCDATE()
      WHERE assignment_id = @assignmentId
    `);
  } else {
    await request.query(`
      UPDATE AlumniAssignments
      SET status = @status
      WHERE assignment_id = @assignmentId
    `);
  }
}

async function getStats() {
  const pool = await getPool();

  const totalResult = await pool.request()
    .query('SELECT COUNT(*) AS count FROM Alumni');
  const totalAlumni = totalResult.recordset[0].count;

  const statusResult = await pool.request()
    .query(`
      SELECT COALESCE(aa.status, 'Unassigned') AS status, COUNT(*) AS count
      FROM Alumni a
      LEFT JOIN (
        SELECT alumni_id, status,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM AlumniAssignments
      ) aa ON a.alumni_id = aa.alumni_id AND aa.rn = 1
      GROUP BY aa.status
      ORDER BY count DESC
    `);
  const statusCounts = statusResult.recordset;

  const deptResult = await pool.request()
    .query(`
      SELECT department, COUNT(*) AS count
      FROM Alumni
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
    `);
  const departmentCounts = deptResult.recordset;

  const batchResult = await pool.request()
    .query(`
      SELECT batch, COUNT(*) AS count
      FROM Alumni
      WHERE batch IS NOT NULL
      GROUP BY batch
      ORDER BY batch DESC
    `);
  const batchCounts = batchResult.recordset;

  return { totalAlumni, statusCounts, departmentCounts, batchCounts };
}

async function getPendingAssignmentsByTeam(teamId) {
  const pool = await getPool();
  const result = await pool.request()
    .input('teamId', sql.Int, teamId)
    .query(`
      SELECT assignment_id, alumni_id, member_id
      FROM AlumniAssignments
      WHERE team_id = @teamId AND status = 'Pending'
      ORDER BY assignment_id
    `);
  return result.recordset;
}

async function updateAssignmentMember(assignmentId, memberId) {
  const pool = await getPool();
  await pool.request()
    .input('assignmentId', sql.Int, assignmentId)
    .input('memberId', sql.Int, memberId)
    .query('UPDATE AlumniAssignments SET member_id = @memberId WHERE assignment_id = @assignmentId');
}

async function getAssignmentHistory({ page, limit, offset }) {
  const pool = await getPool();
  const countResult = await pool.request()
    .query(`SELECT COUNT(*) AS total FROM (SELECT team_id, COUNT(*) AS cnt FROM AlumniAssignments GROUP BY team_id) t`);
  const total = countResult.recordset[0].total;

  const result = await pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limit)
    .query(`
      SELECT
        t.team_id,
        CONCAT(RTRIM(u.first_name), ' ', RTRIM(u.last_name)) AS leader_name,
        u.department,
        COUNT(aa.assignment_id) AS total_assigned,
        SUM(CASE WHEN aa.status = 'Completed' THEN 1 ELSE 0 END) AS completed,
        MAX(aa.assigned_date) AS last_assigned
      FROM AlumniAssignments aa
      INNER JOIN Teams t ON aa.team_id = t.team_id
      INNER JOIN Users u ON t.leader_id = u.user_id
      GROUP BY t.team_id, u.first_name, u.last_name, u.department
      ORDER BY last_assigned DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
  return { total, rows: result.recordset };
}

async function reopenAlumniRecord(alumniId) {
  const pool = await getPool();
  const transaction = pool.transaction();
  try {
    await transaction.begin();
    await transaction.request()
      .input('alumniId', sql.Int, alumniId)
      .query(`
        UPDATE AlumniAssignments
        SET status = 'Draft', completed_date = NULL
        WHERE alumni_id = @alumniId;

        UPDATE Alumni
        SET is_updated = 0
        WHERE alumni_id = @alumniId;
      `);
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

async function getAlumniHistoryByAlumniId(alumniId) {
  const pool = await getPool();
  const cleanId = parseInt(alumniId, 10);
  if (!cleanId) return [];

  const req = pool.request().input('alumniId', sql.Int, cleanId);

  try {
    const result = await req.query(`
      SELECT
        aa.assignment_id,
        aa.alumni_id,
        aa.team_id,
        aa.member_id,
        CAST(ISNULL(aa.status, 'Pending') AS NVARCHAR(50)) AS status,
        aa.assigned_date AS created_at,
        aa.completed_date,
        CAST('Assignment Event' AS NVARCHAR(100)) AS action,
        CAST(ISNULL(ul.first_name + ' ' + ul.last_name, 'System') AS NVARCHAR(200)) AS leader_name,
        CAST(ISNULL(um.first_name + ' ' + um.last_name, 'Unassigned') AS NVARCHAR(200)) AS member_name
      FROM dbo.AlumniAssignments aa
      LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
      LEFT JOIN dbo.Users ul ON ul.user_id = t.leader_id
      LEFT JOIN dbo.Users um ON um.user_id = aa.member_id
      WHERE aa.alumni_id = @alumniId

      UNION ALL

      SELECT
        pi.info_id AS assignment_id,
        pi.alumni_id,
        CAST(NULL AS INT) AS team_id,
        pi.updated_by AS member_id,
        CAST('Updated' AS NVARCHAR(50)) AS status,
        pi.updated_at AS created_at,
        pi.updated_at AS completed_date,
        CAST('Professional Profile Update' AS NVARCHAR(100)) AS action,
        CAST('N/A' AS NVARCHAR(200)) AS leader_name,
        CAST(ISNULL(u.first_name + ' ' + u.last_name, 'Admin/Member') AS NVARCHAR(200)) AS member_name
      FROM dbo.ProfessionalInformation pi
      LEFT JOIN dbo.Users u ON u.user_id = pi.updated_by
      WHERE pi.alumni_id = @alumniId

      UNION ALL

      SELECT
        a.alumni_id AS assignment_id,
        a.alumni_id,
        CAST(NULL AS INT) AS team_id,
        CAST(NULL AS INT) AS member_id,
        CAST('Record Created' AS NVARCHAR(50)) AS status,
        a.created_at AS created_at,
        a.created_at AS completed_date,
        CAST('Alumni Record Created' AS NVARCHAR(100)) AS action,
        CAST('System' AS NVARCHAR(200)) AS leader_name,
        CAST('System Admin / Import' AS NVARCHAR(200)) AS member_name
      FROM dbo.Alumni a
      WHERE a.alumni_id = @alumniId

      ORDER BY created_at DESC;
    `);

    return result.recordset || [];
  } catch (err) {
    console.error('Error fetching alumni history for ID ' + cleanId + ':', err);
    return [];
  }
}

module.exports = {
  findAll,
  findById,
  findByRegisterNo,
  create,
  update,
  createProfessionalInfo,
  getProfessionalHistory,
  getAssignmentsByMember,
  getAssignmentsByLeader,
  getPendingAssignmentsByTeam,
  updateAssignmentMember,
  updateAssignmentStatus,
  reopenAlumniRecord,
  getStats,
  getAssignmentHistory,
  getAlumniHistoryByAlumniId
};
