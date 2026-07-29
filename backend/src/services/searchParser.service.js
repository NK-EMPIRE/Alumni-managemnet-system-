const { sql, getPool } = require('../config/database');
const alumniRepository = require('../repositories/alumni.repository');

const TRIGGERS = {
  company: ['worked at', 'working at', 'company', 'employed at', 'works at', 'worked on'],
  linkedin_profile: ['linkedin', 'linkedin link', 'linkedin profile'],
  batch: ['batch', 'year', 'passed out', 'graduated'],
  department: ['department', 'dept', 'branch'],
  city: ['city', 'location', 'lives in', 'living in', 'based in']
};

const DEPT_CODES = ['cse', 'ece', 'mech', 'eee', 'it', 'aids', 'mba', 'civil', 'me', 'ce'];
const NEGATION_WORDS = ['not having', 'without', 'missing', 'no', 'null'];

/**
 * Universal Search parser without external AI/LLM API calls.
 */
async function searchAlumni({ q, page = 1, limit = 20, leaderId, memberId }) {
  const queryStr = (q || '').trim().toLowerCase();
  const offset = (page - 1) * limit;

  if (!queryStr) {
    return alumniRepository.findAll({ page, limit, offset, leaderId, memberId });
  }

  const pool = await getPool();
  let whereConditions = [];
  const parameters = [];

  // Check for negation keywords
  const isNegated = NEGATION_WORDS.some(word => queryStr.includes(word));

  // 1. Department match
  for (const code of DEPT_CODES) {
    if (new RegExp(`\\b${code}\\b`, 'i').test(queryStr)) {
      whereConditions.push(`LOWER(a.department) = @deptParam`);
      parameters.push({ name: 'deptParam', type: sql.NVarChar(50), value: code.toUpperCase() });
      break;
    }
  }

  // 2. Batch year match (4-digit year like 2020 or range 2018-2020)
  const batchMatch = queryStr.match(/\b(20\d{2})\b/);
  if (batchMatch) {
    whereConditions.push(`a.batch = @batchParam`);
    parameters.push({ name: 'batchParam', type: sql.NVarChar(10), value: batchMatch[1] });
  }

  // 3. Trigger extraction (Company, LinkedIn, City)
  if (queryStr.includes('linkedin')) {
    if (isNegated) {
      whereConditions.push(`(a.linkedin_profile IS NULL OR RTRIM(CAST(a.linkedin_profile AS NVARCHAR(MAX))) = '')`);
    } else {
      whereConditions.push(`(a.linkedin_profile IS NOT NULL AND RTRIM(CAST(a.linkedin_profile AS NVARCHAR(MAX))) <> '')`);
    }
  }

  TRIGGERS.company.forEach(trig => {
    if (queryStr.includes(trig)) {
      const parts = queryStr.split(trig);
      if (parts[1]) {
        const val = parts[1].trim().split(' ')[0];
        if (val && !whereConditions.some(c => c.includes('company'))) {
          whereConditions.push(`a.company LIKE @companyParam`);
          parameters.push({ name: 'companyParam', type: sql.NVarChar(200), value: `%${val}%` });
        }
      }
    }
  });

  // 4. Fallback search if no rules triggered
  if (whereConditions.length === 0) {
    whereConditions.push(`(a.name LIKE @fallbackParam OR a.register_no LIKE @fallbackParam OR a.company LIKE @fallbackParam OR a.department LIKE @fallbackParam)`);
    parameters.push({ name: 'fallbackParam', type: sql.NVarChar(200), value: `%${queryStr}%` });
  }

  // Construct parameterized SQL query
  let sqlWhere = whereConditions.join(' AND ');

  let roleFilter = '';
  if (leaderId) {
    roleFilter = ' AND t.leader_id = @leaderIdParam';
    parameters.push({ name: 'leaderIdParam', type: sql.Int, value: leaderId });
  }
  if (memberId) {
    roleFilter = ' AND (aa.member_id = @memberIdParam OR (aa.member_id IS NULL AND @memberIdParam = t.leader_id))';
    parameters.push({ name: 'memberIdParam', type: sql.Int, value: memberId });
  }

  const countReq = pool.request();
  const dataReq = pool.request();

  parameters.forEach(p => {
    countReq.input(p.name, p.type, p.value);
    dataReq.input(p.name, p.type, p.value);
  });

  countReq.input('offset', sql.Int, offset);
  countReq.input('limit', sql.Int, limit);
  dataReq.input('offset', sql.Int, offset);
  dataReq.input('limit', sql.Int, limit);

  const queryBody = `
    FROM Alumni a
    LEFT JOIN (
      SELECT assignment_id, alumni_id, team_id, member_id, status, assigned_date,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM AlumniAssignments
    ) aa ON a.alumni_id = aa.alumni_id AND aa.rn = 1
    LEFT JOIN Teams t ON aa.team_id = t.team_id
    WHERE ${sqlWhere} ${roleFilter}
  `;

  const countRes = await countReq.query(`SELECT COUNT(DISTINCT a.alumni_id) AS total ${queryBody}`);
  const total = countRes.recordset[0].total;

  const dataRes = await dataReq.query(`
    SELECT DISTINCT
      a.alumni_id, a.register_no, a.name, a.gender, a.batch,
      a.department, a.email, a.phone, a.company, a.designation,
      a.working_details, a.linkedin_profile, a.created_at,
      aa.status AS assignment_status, aa.assigned_date
    ${queryBody}
    ORDER BY a.name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return { data: dataRes.recordset, totalCount: total, page, limit };
}

module.exports = { searchAlumni };
