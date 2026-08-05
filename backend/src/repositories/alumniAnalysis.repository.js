const { sql, getPool } = require('../config/database');
const searchParserService = require('../services/searchParser.service');

const ROLE_CATEGORIES = {
  'Software Engineer': ['software', 'developer', 'sde', 'programmer', 'full stack', 'backend', 'frontend', 'engineer', 'web', 'mobile', 'coder'],
  'Data / AI / ML': ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data analyst', 'data engineer', 'big data', 'ai'],
  'HR': ['hr', 'human resource', 'talent acquisition', 'recruiter', 'people ops', 'talent'],
  'Product / Design': ['product manager', 'ux', 'ui designer', 'product owner', 'designer', 'ui/ux'],
  'Finance / Accounting': ['finance', 'accountant', 'audit', 'chartered accountant', 'banking', 'financial'],
  'Sales / Marketing': ['sales', 'marketing', 'business development', 'growth', 'seo', 'digital marketing']
};

/**
 * Returns SQL condition snippet for a specific role category.
 */
function getRoleCategorySqlCondition(roleCategory, paramName = 'roleCategory') {
  if (!roleCategory) return '1=1';

  if (roleCategory === 'Government / Public Sector') {
    return 'pi.is_government_job = 1';
  }
  if (roleCategory === 'Higher Studies') {
    return '(pi.higher_studies IS NOT NULL AND LTRIM(RTRIM(CAST(pi.higher_studies AS NVARCHAR(MAX)))) <> \'\')';
  }
  if (roleCategory === 'Entrepreneur') {
    return 'pi.is_entrepreneur = 1';
  }
  if (roleCategory === 'Other / Unclassified') {
    const keywords = [];
    Object.values(ROLE_CATEGORIES).forEach(list => keywords.push(...list));
    const notKeywordsSql = keywords.map(kw => `LOWER(COALESCE(pi.designation, a.designation)) NOT LIKE '%${kw.toLowerCase()}%'`).join(' AND ');
    return `(
      (pi.is_government_job IS NULL OR pi.is_government_job = 0)
      AND (pi.is_entrepreneur IS NULL OR pi.is_entrepreneur = 0)
      AND (pi.higher_studies IS NULL OR LTRIM(RTRIM(CAST(pi.higher_studies AS NVARCHAR(MAX)))) = '')
      AND (${notKeywordsSql})
    )`;
  }

  const keywords = ROLE_CATEGORIES[roleCategory] || [];
  if (keywords.length === 0) {
    return '1=1';
  }

  const keywordConditions = keywords.map(kw => `LOWER(COALESCE(pi.designation, a.designation)) LIKE '%${kw.toLowerCase()}%'`).join(' OR ');
  return `(${keywordConditions})`;
}

/**
 * Main Analysis listing query with filters, role-scoping, and fuzzy city matching.
 */
async function getAnalysisAlumni({
  roleCategory, company, city, state, country, batch, department, status,
  customQuery, page = 1, limit = 20, leaderId, memberId
}) {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  const pool = await getPool();
  const request = pool.request()
    .input('offset', sql.Int, offset)
    .input('limit', sql.Int, limitNum)
    .input('company', sql.NVarChar(200), company || null)
    .input('city', sql.NVarChar(200), city ? `%${city}%` : null)
    .input('state', sql.NVarChar(100), state || null)
    .input('country', sql.NVarChar(100), country || null)
    .input('batch', sql.NVarChar(10), batch || null)
    .input('department', sql.NVarChar(50), department || null)
    .input('status', sql.NVarChar(30), status || null)
    .input('customQuery', sql.NVarChar(200), customQuery ? `%${customQuery}%` : null)
    .input('leaderId', sql.Int, leaderId || null)
    .input('memberId', sql.Int, memberId || null);

  const roleCatCondition = getRoleCategorySqlCondition(roleCategory);

  const query = `
    WITH AnalysisCTE AS (
      SELECT
        a.alumni_id, a.register_no, a.name, a.department, a.batch,
        COALESCE(pi.email, a.email) AS email,
        COALESCE(pi.phone, a.phone) AS phone,
        a.secondary_email, a.secondary_phone,
        COALESCE(pi.designation, a.designation) AS designation,
        COALESCE(pi.company, a.company) AS company,
        COALESCE(pi.current_city, a.city) AS city,
        COALESCE(pi.state, a.state) AS state,
        COALESCE(pi.country, a.country) AS country,
        COALESCE(pi.linkedin_url, a.linkedin_profile) AS linkedin_profile,
        pi.is_government_job, pi.is_entrepreneur, pi.higher_studies, pi.other_occupation,
        a.working_details, a.experience, a.is_updated,
        ISNULL(aa.status, 'Unassigned') AS assignment_status,
        ul.first_name + ' ' + ul.last_name AS leader_name,
        um.first_name + ' ' + um.last_name AS member_name,
        COUNT(*) OVER() AS total_count
      FROM dbo.Alumni a
      INNER JOIN (
        SELECT * FROM dbo.ProfessionalInformation
        WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
      ) pi ON pi.alumni_id = a.alumni_id
      LEFT JOIN (
        SELECT alumni_id, team_id, member_id, status,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM dbo.AlumniAssignments
      ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
      LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
      LEFT JOIN dbo.Users ul ON ul.user_id = t.leader_id
      LEFT JOIN dbo.Users um ON um.user_id = aa.member_id
      WHERE
        COALESCE(pi.company, a.company) IS NOT NULL
        AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> ''
        AND COALESCE(pi.designation, a.designation) IS NOT NULL
        AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> ''
        AND (@leaderId IS NULL OR t.leader_id = @leaderId)
        AND (@memberId IS NULL OR aa.member_id = @memberId)
        AND (@company IS NULL OR COALESCE(pi.company, a.company) = @company)
        AND (@city IS NULL OR COALESCE(pi.current_city, a.city) LIKE @city OR a.address LIKE @city)
        AND (@state IS NULL OR COALESCE(pi.state, a.state) = @state)
        AND (@country IS NULL OR COALESCE(pi.country, a.country) = @country)
        AND (@batch IS NULL OR a.batch = @batch)
        AND (@department IS NULL OR a.department = @department)
        AND (@status IS NULL OR (@status = 'Unassigned' AND aa.status IS NULL) OR aa.status = @status)
        AND (
          @customQuery IS NULL
          OR a.name LIKE @customQuery
          OR a.register_no LIKE @customQuery
          OR COALESCE(pi.company, a.company) LIKE @customQuery
          OR COALESCE(pi.designation, a.designation) LIKE @customQuery
          OR a.department LIKE @customQuery
          OR a.working_details LIKE @customQuery
        )
        AND (${roleCatCondition})
    )
    SELECT * FROM AnalysisCTE
    ORDER BY name ASC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `;

  const result = await request.query(query);
  const data = result.recordset;
  const totalCount = data.length > 0 ? data[0].total_count : 0;

  return { data, totalCount, page: pageNum, limit: limitNum };
}

/**
 * Returns distinct companies list for analysis filter dropdown.
 */
async function getAnalysisCompanies({ leaderId, memberId }) {
  const pool = await getPool();
  const request = pool.request()
    .input('leaderId', sql.Int, leaderId || null)
    .input('memberId', sql.Int, memberId || null);

  const result = await request.query(`
    SELECT DISTINCT LTRIM(RTRIM(COALESCE(pi.company, a.company))) AS company
    FROM dbo.Alumni a
    INNER JOIN (
      SELECT * FROM dbo.ProfessionalInformation
      WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
    ) pi ON pi.alumni_id = a.alumni_id
    LEFT JOIN (
      SELECT alumni_id, team_id, member_id,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM dbo.AlumniAssignments
    ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
    LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
    WHERE COALESCE(pi.company, a.company) IS NOT NULL
      AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> ''
      AND COALESCE(pi.designation, a.designation) IS NOT NULL
      AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> ''
      AND (@leaderId IS NULL OR t.leader_id = @leaderId)
      AND (@memberId IS NULL OR aa.member_id = @memberId)
    ORDER BY company ASC;
  `);

  return result.recordset.map(r => r.company).filter(Boolean);
}

/**
 * Returns fixed role category list with live matching counts.
 */
async function getAnalysisRoleCategories({ leaderId, memberId }) {
  const pool = await getPool();
  const categories = [
    'Software Engineer',
    'Data / AI / ML',
    'HR',
    'Product / Design',
    'Finance / Accounting',
    'Sales / Marketing',
    'Government / Public Sector',
    'Higher Studies',
    'Entrepreneur',
    'Other / Unclassified'
  ];

  const results = [];

  for (const cat of categories) {
    const request = pool.request()
      .input('leaderId', sql.Int, leaderId || null)
      .input('memberId', sql.Int, memberId || null);

    const condition = getRoleCategorySqlCondition(cat);
    const query = `
      SELECT COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a
      INNER JOIN (
        SELECT * FROM dbo.ProfessionalInformation
        WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
      ) pi ON pi.alumni_id = a.alumni_id
      LEFT JOIN (
        SELECT alumni_id, team_id, member_id,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM dbo.AlumniAssignments
      ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
      LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
      WHERE COALESCE(pi.company, a.company) IS NOT NULL
        AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> ''
        AND COALESCE(pi.designation, a.designation) IS NOT NULL
        AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> ''
        AND (@leaderId IS NULL OR t.leader_id = @leaderId)
        AND (@memberId IS NULL OR aa.member_id = @memberId)
        AND (${condition});
    `;

    const res = await request.query(query);
    const count = res.recordset[0] ? res.recordset[0].count : 0;
    results.push({ category: cat, count });
  }

  return results;
}

module.exports = {
  getAnalysisAlumni,
  getAnalysisCompanies,
  getAnalysisRoleCategories
};
