const { sql, getPool } = require('../config/database');
const searchParserService = require('../services/searchParser.service');
const { cleanRoleAndCompany, canonicalizeLocationList } = require('../services/dataCleaner.service');

/**
 * Returns distinct Cities, States, and Countries lists for dynamic analysis filter dropdowns.
 */
async function getAnalysisLocations({ leaderId, memberId }) {
  const pool = await getPool();
  const request = pool.request()
    .input('leaderId', sql.Int, leaderId || null)
    .input('memberId', sql.Int, memberId || null);

  const result = await request.query(`
    SELECT DISTINCT
      LTRIM(RTRIM(COALESCE(pi.current_city, a.city))) AS city,
      LTRIM(RTRIM(COALESCE(pi.state, a.state))) AS state,
      LTRIM(RTRIM(COALESCE(pi.country, a.country))) AS country
    FROM dbo.Alumni a
    LEFT JOIN (
      SELECT * FROM dbo.ProfessionalInformation
      WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
    ) pi ON pi.alumni_id = a.alumni_id
    LEFT JOIN (
      SELECT alumni_id, team_id, member_id,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM dbo.AlumniAssignments
    ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
    LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
    WHERE (@leaderId IS NULL OR t.leader_id = @leaderId)
      AND (@memberId IS NULL OR aa.member_id = @memberId);
  `);

  const rawCities = [];
  const rawStates = [];
  const rawCountries = [];

  result.recordset.forEach(r => {
    if (r.city) rawCities.push(r.city);
    if (r.state) rawStates.push(r.state);
    if (r.country) rawCountries.push(r.country);
  });

  return {
    cities: canonicalizeLocationList(rawCities),
    states: canonicalizeLocationList(rawStates),
    countries: canonicalizeLocationList(rawCountries)
  };
}

const ROLE_CATEGORIES = {
  'Software Engineer': ['software', 'developer', 'sde', 'programmer', 'full stack', 'backend', 'frontend', 'engineer', 'web', 'mobile', 'coder', 'system analyst', 'tech lead'],
  'Data / AI / ML': ['data scientist', 'machine learning', 'ml engineer', 'ai engineer', 'data analyst', 'data engineer', 'big data', 'ai', 'data'],
  'HR': ['hr', 'human resource', 'talent acquisition', 'recruiter', 'people ops', 'talent'],
  'Product / Design': ['product manager', 'ux', 'ui designer', 'product owner', 'designer', 'ui/ux'],
  'Finance / Accounting': ['finance', 'accountant', 'audit', 'chartered accountant', 'banking', 'financial', 'clerk', 'cashier'],
  'Sales / Marketing': ['sales', 'marketing', 'business development', 'growth', 'seo', 'digital marketing'],
  'Education / Academic': ['professor', 'assistant professor', 'associate professor', 'lecturer', 'teacher', 'hod', 'dean', 'head of dept', 'principal', 'tutor'],
  'Healthcare / Medical': ['doctor', 'nurse', 'medical rep', 'pharmacist', 'surgeon', 'healthcare'],
  'Operations / Quality / Logistics': ['quality', 'qc', 'operations', 'logistics', 'safety', 'compliance', 'manager', 'lead', 'coordinator'],
  'Trades / Business': ['own business', 'business', 'builder', 'contractor', 'shop', 'owner', 'proprietor']
};

/**
 * Returns SQL condition snippet for a specific role category.
 */
function getRoleCategorySqlCondition(roleCategory, paramName = 'roleCategory') {
  if (!roleCategory) return '1=1';

  if (roleCategory === 'Government / Public Sector') {
    return '(pi.is_government_job = 1 OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%police%\' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%govt%\' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%tnstc%\' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%military%\')';
  }
  if (roleCategory === 'Higher Studies') {
    return '(pi.higher_studies IS NOT NULL AND LTRIM(RTRIM(CAST(pi.higher_studies AS NVARCHAR(MAX)))) <> \'\' AND pi.higher_studies <> \'No\')';
  }
  if (roleCategory === 'Entrepreneur') {
    return '(pi.is_entrepreneur = 1 OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%own business%\' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE \'%owner%\')';
  }
  if (roleCategory === 'Other / Unclassified') {
    const keywords = [];
    Object.values(ROLE_CATEGORIES).forEach(list => keywords.push(...list));
    const notKeywordsSql = keywords.map(kw => `LOWER(COALESCE(pi.designation, a.designation, a.working_details)) NOT LIKE '%${kw.toLowerCase()}%'`).join(' AND ');
    return `(
      (pi.is_government_job IS NULL OR pi.is_government_job = 0)
      AND (pi.is_entrepreneur IS NULL OR pi.is_entrepreneur = 0)
      AND (pi.higher_studies IS NULL OR LTRIM(RTRIM(CAST(pi.higher_studies AS NVARCHAR(MAX)))) = '' OR pi.higher_studies = 'No')
      AND (${notKeywordsSql})
    )`;
  }

  const keywords = ROLE_CATEGORIES[roleCategory] || [];
  if (keywords.length === 0) {
    return '1=1';
  }

  const keywordConditions = keywords.map(kw => `LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%${kw.toLowerCase()}%'`).join(' OR ');
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
      LEFT JOIN (
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
        (
          (COALESCE(pi.company, a.company) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> '')
          OR (COALESCE(pi.designation, a.designation) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> '')
          OR (a.working_details IS NOT NULL AND LTRIM(RTRIM(CAST(a.working_details AS NVARCHAR(MAX)))) <> '')
        )
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
  const rawData = result.recordset;
  const totalCount = rawData.length > 0 ? rawData[0].total_count : 0;

  const data = rawData.map(row => {
    const cleaned = cleanRoleAndCompany(row.designation, row.company, row.working_details);
    return {
      ...row,
      designation: cleaned.designation || row.designation || 'Not Specified',
      company: cleaned.company || row.company || 'Not Specified'
    };
  });

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
    LEFT JOIN (
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
      AND (@leaderId IS NULL OR t.leader_id = @leaderId)
      AND (@memberId IS NULL OR aa.member_id = @memberId)
    ORDER BY company ASC;
  `);

  return result.recordset.map(r => r.company).filter(Boolean);
}

/**
 * Returns distinct Cities, States, and Countries lists for dynamic analysis filter dropdowns.
 */
async function getAnalysisLocations({ leaderId, memberId }) {
  const pool = await getPool();
  const request = pool.request()
    .input('leaderId', sql.Int, leaderId || null)
    .input('memberId', sql.Int, memberId || null);

  const result = await request.query(`
    SELECT DISTINCT
      LTRIM(RTRIM(COALESCE(pi.current_city, a.city))) AS city,
      LTRIM(RTRIM(COALESCE(pi.state, a.state))) AS state,
      LTRIM(RTRIM(COALESCE(pi.country, a.country))) AS country
    FROM dbo.Alumni a
    LEFT JOIN (
      SELECT * FROM dbo.ProfessionalInformation
      WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
    ) pi ON pi.alumni_id = a.alumni_id
    LEFT JOIN (
      SELECT alumni_id, team_id, member_id,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM dbo.AlumniAssignments
    ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
    LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
    WHERE (@leaderId IS NULL OR t.leader_id = @leaderId)
      AND (@memberId IS NULL OR aa.member_id = @memberId);
  `);

  const cities = new Set();
  const states = new Set();
  const countries = new Set();

  result.recordset.forEach(r => {
    if (r.city && r.city !== '--' && r.city.trim()) cities.add(r.city.trim());
    if (r.state && r.state !== '--' && r.state.trim()) states.add(r.state.trim());
    if (r.country && r.country !== '--' && r.country.trim()) countries.add(r.country.trim());
  });

  return {
    cities: Array.from(cities).sort(),
    states: Array.from(states).sort(),
    countries: Array.from(countries).sort()
  };
}

/**
 * Returns fixed role category list with live matching counts.
 */
async function getAnalysisRoleCategories({ leaderId, memberId }) {
  const pool = await getPool();

  // 1. Career & Employment Intelligence Metrics
  const reqOverall = pool.request()
    .input('leaderId', sql.Int, leaderId || null)
    .input('memberId', sql.Int, memberId || null);

  const overallRes = await reqOverall.query(`
    SELECT
      COUNT(DISTINCT a.alumni_id) AS totalAlumni,
      SUM(CASE WHEN (COALESCE(pi.company, a.company) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> '')
                 OR (COALESCE(pi.designation, a.designation) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> '')
                 OR (a.working_details IS NOT NULL AND LTRIM(RTRIM(CAST(a.working_details AS NVARCHAR(MAX)))) <> '')
               THEN 1 ELSE 0 END) AS workingAlumni,
      COUNT(DISTINCT CASE WHEN COALESCE(pi.company, a.company) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> '' THEN COALESCE(pi.company, a.company) END) AS uniqueCompanies,
      SUM(CASE WHEN pi.is_government_job = 1 OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%police%' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%govt%' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%tnstc%' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%military%' THEN 1 ELSE 0 END) AS govtCount,
      SUM(CASE WHEN pi.is_entrepreneur = 1 OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%own business%' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%owner%' OR LOWER(COALESCE(pi.designation, a.designation, a.working_details)) LIKE '%proprietor%' THEN 1 ELSE 0 END) AS bizCount,
      SUM(CASE WHEN pi.higher_studies IS NOT NULL AND LTRIM(RTRIM(CAST(pi.higher_studies AS NVARCHAR(MAX)))) <> '' AND pi.higher_studies <> 'No' THEN 1 ELSE 0 END) AS higherStudiesCount
    FROM dbo.Alumni a
    LEFT JOIN (
      SELECT * FROM dbo.ProfessionalInformation
      WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
    ) pi ON pi.alumni_id = a.alumni_id
    LEFT JOIN (
      SELECT alumni_id, team_id, member_id,
             ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
      FROM dbo.AlumniAssignments
    ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
    LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
    WHERE (@leaderId IS NULL OR t.leader_id = @leaderId)
      AND (@memberId IS NULL OR aa.member_id = @memberId);
  `);

  const rowStats = overallRes.recordset[0] || {};
  const totalAlumni = rowStats.totalAlumni || 0;
  const workingAlumni = rowStats.workingAlumni || 0;
  const uniqueCompanies = rowStats.uniqueCompanies || 0;
  const govtCount = rowStats.govtCount || 0;
  const bizCount = rowStats.bizCount || 0;
  const higherStudiesCount = rowStats.higherStudiesCount || 0;

  // 2. Sector Role Categories Counts
  const categories = [
    'Software Engineer',
    'Data / AI / ML',
    'HR',
    'Product / Design',
    'Finance / Accounting',
    'Sales / Marketing',
    'Education / Academic',
    'Healthcare / Medical',
    'Operations / Quality / Logistics',
    'Trades / Business',
    'Government / Public Sector',
    'Higher Studies',
    'Entrepreneur',
    'Other / Unclassified'
  ];

  const roleCategories = [];

  for (const cat of categories) {
    const request = pool.request()
      .input('leaderId', sql.Int, leaderId || null)
      .input('memberId', sql.Int, memberId || null);

    const condition = getRoleCategorySqlCondition(cat);
    const query = `
      SELECT COUNT(DISTINCT a.alumni_id) AS count
      FROM dbo.Alumni a
      LEFT JOIN (
        SELECT * FROM dbo.ProfessionalInformation
        WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
      ) pi ON pi.alumni_id = a.alumni_id
      LEFT JOIN (
        SELECT alumni_id, team_id, member_id,
               ROW_NUMBER() OVER (PARTITION BY alumni_id ORDER BY assigned_date DESC) AS rn
        FROM dbo.AlumniAssignments
      ) aa ON aa.alumni_id = a.alumni_id AND aa.rn = 1
      LEFT JOIN dbo.Teams t ON t.team_id = aa.team_id
      WHERE (
          (COALESCE(pi.company, a.company) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.company, a.company) AS NVARCHAR(MAX)))) <> '')
          OR (COALESCE(pi.designation, a.designation) IS NOT NULL AND LTRIM(RTRIM(CAST(COALESCE(pi.designation, a.designation) AS NVARCHAR(MAX)))) <> '')
          OR (a.working_details IS NOT NULL AND LTRIM(RTRIM(CAST(a.working_details AS NVARCHAR(MAX)))) <> '')
        )
        AND (@leaderId IS NULL OR t.leader_id = @leaderId)
        AND (@memberId IS NULL OR aa.member_id = @memberId)
        AND (${condition});
    `;

    const res = await request.query(query);
    const count = res.recordset[0] ? res.recordset[0].count : 0;
    roleCategories.push({ category: cat, count });
  }

  return {
    totalAlumni,
    workingAlumni,
    uniqueCompanies,
    govtCount,
    bizCount,
    higherStudiesCount,
    roleCategories
  };
}

/**
 * Live Typeahead Autocomplete suggestions query for designation, company, city, state, country.
 * Queries: 1. DB (Alumni & ProfessionalInformation), 2. Custom LookupDictionary, 3. Global Dictionary.
 */
async function getSuggestions({ field, query, limit = 100 }) {
  if (!query || !field) return [];
  const qStr = query.trim().toLowerCase();
  const pool = await getPool();

  const allowedFields = {
    designation: ['COALESCE(pi.designation, a.designation)', 'designation'],
    company: ['COALESCE(pi.company, a.company)', 'company'],
    city: ['COALESCE(pi.current_city, a.city)', 'current_city'],
    state: ['COALESCE(pi.state, a.state)', 'state'],
    country: ['COALESCE(pi.country, a.country)', 'country']
  };

  if (!allowedFields[field]) return [];

  const [colExpr, alias] = allowedFields[field];

  // 1. Fetch matches from Alumni & ProfessionalInformation tables
  const dbReq = pool.request().input('q', sql.NVarChar(200), `%${qStr}%`);
  const dbRes = await dbReq.query(`
    SELECT DISTINCT LTRIM(RTRIM(${colExpr})) AS val
    FROM dbo.Alumni a
    LEFT JOIN (
      SELECT * FROM dbo.ProfessionalInformation
      WHERE info_id IN (SELECT MAX(info_id) FROM dbo.ProfessionalInformation GROUP BY alumni_id)
    ) pi ON pi.alumni_id = a.alumni_id
    WHERE ${colExpr} IS NOT NULL
      AND LTRIM(RTRIM(CAST(${colExpr} AS NVARCHAR(MAX)))) <> ''
      AND LOWER(${colExpr}) LIKE @q
    ORDER BY val ASC
  `);
  const dbMatches = dbRes.recordset.map(r => r.val).filter(Boolean);

  // 2. Fetch matches from custom user-added LookupDictionary table
  const customReq = pool.request()
    .input('cat', sql.VarChar(50), field)
    .input('q', sql.NVarChar(200), `%${qStr}%`);
  const customRes = await customReq.query(`
    SELECT DISTINCT LTRIM(RTRIM(value)) AS val
    FROM dbo.LookupDictionary
    WHERE category = @cat
      AND LOWER(value) LIKE @q
    ORDER BY val ASC
  `);
  const customMatches = customRes.recordset.map(r => r.val).filter(Boolean);

  // 3. Predefined Global Dictionaries
  let dictionaryMatches = [];
  if (field === 'designation') {
    const { GLOBAL_ROLES } = require('../constants/globalRoles');
    dictionaryMatches = GLOBAL_ROLES.filter(r => r.toLowerCase().includes(qStr));
  }

  // Combine custom user-added values first, then DB matches, then global dictionary
  const combined = Array.from(new Set([...customMatches, ...dbMatches, ...dictionaryMatches])).slice(0, parseInt(limit, 10));
  return combined;
}

/**
 * Saves a new custom typeahead term into dbo.LookupDictionary so it appears in future typeahead searches.
 */
async function addSuggestion({ category, value }) {
  if (!category || !value || !value.trim()) return null;
  const valClean = value.trim();
  const pool = await getPool();

  const req = pool.request()
    .input('cat', sql.VarChar(50), category)
    .input('val', sql.NVarChar(255), valClean);

  await req.query(`
    IF NOT EXISTS (
      SELECT 1 FROM dbo.LookupDictionary WHERE category = @cat AND LOWER(value) = LOWER(@val)
    )
    BEGIN
      INSERT INTO dbo.LookupDictionary (category, value) VALUES (@cat, @val);
    END
  `);

  return valClean;
}

module.exports = {
  getAnalysisAlumni,
  getAnalysisCompanies,
  getAnalysisLocations,
  getAnalysisRoleCategories,
  getSuggestions,
  addSuggestion
};
